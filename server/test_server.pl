#!/usr/bin/perl
use strict;
use warnings;
use utf8;

# サーバーの実装
{
    package MyWebServer;
    use base qw(HTTP::Server::Simple::CGI);
    use JSON;
    use Data::Dumper;
    use File::Basename;
    use File::Spec;
    use File::Copy;
    use File::Temp qw/ tempfile /;

    sub handle_request {
        my ($self, $cgi) = @_;

        my $method = $cgi->request_method();

        # ヘッダー
        print "HTTP/1.0 200 OK\n";
        print "Access-Control-Allow-Origin: *\n";
        print "Access-Control-Allow-Headers: Content-Type\n";
        print "Content-Type: application/json\n\n";

        # 汎用的な処理
        my %routes = (
            "GET" => \&get_api,
            "POST" => \&post_api
        );

        if (exists $routes{$method}) {
            my ($BBSLOG_FILEPATH, $BBSTIMELINE_FILEPATH) = ("../public/campBbsData/campBbsLog.json", "../public/campBbsData/campBbsTimeline.json");
            $routes{$method}->($cgi, $BBSLOG_FILEPATH, $BBSTIMELINE_FILEPATH);
        } else {
            print "HTTP/1.0 404 Not Found\n";
            print "Content-Type: text/plain\n\n";
            print "Not Found";
        }

        sub get_api {
            my ($cgi, $BBSLOG_FILEPATH, $BBSTIMELINE_FILEPATH) = @_;
            my ($campNo) = ($cgi->path_info()) =~ /\/camps\/(\d+)/;  # パスを分割

            my ($log, $timeline);
            my ($camp_log, $camp_timeline) = ("{}", "{}");
            # 掲示板ログ・タイムラインが両方ある場合のみ
            if (-e "$BBSLOG_FILEPATH" && -e "$BBSTIMELINE_FILEPATH") {
                my $log = read_file_with_lock($BBSLOG_FILEPATH);
                my $timeline = read_file_with_lock($BBSTIMELINE_FILEPATH);

                my $log_json = decode_json($log);
                my $timeline_json = decode_json($timeline);
                $camp_log = encode_json($log_json->{$campNo});
                $camp_timeline = encode_json($timeline_json->{$campNo});
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";
        }

        sub post_api {
            my ($cgi, $BBSLOG_FILEPATH, $BBSTIMELINE_FILEPATH) = @_;
            my ($campNo, $sub_method) = ($cgi->path_info()) =~ /\/camps\/(\d+)\/(.+)/;  # パスを分割
            my %messageHandlers = (
                "new" => \&post_newMessage,
                "reply" => \&post_newMessage,
                "edit" => \&post_editMessage,
                "pin" => \&post_editMessage,
                "delete" => \&post_deleteMessage,
            );
            my $newMessage =  $cgi->param("newMessage");
            my $newMessage_json = decode_json($newMessage);

            my ($log, $timeline);
            my ($camp_log, $camp_timeline) = ("{}", "{}");
            # 掲示板ログ・タイムラインが両方ある場合のみ
            if (-e "$BBSLOG_FILEPATH" && -e "$BBSTIMELINE_FILEPATH") {
                my $log = read_file_with_lock($BBSLOG_FILEPATH);
                my $timeline = read_file_with_lock($BBSTIMELINE_FILEPATH);

                my $bbsTable_log = decode_json($log);
                my $bbsTable_timeline = decode_json($timeline);

                my $isSuccess = $messageHandlers{$sub_method}->($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json, $cgi);

                $camp_log = encode_json($bbsTable_log->{$campNo});
                $camp_timeline = encode_json($bbsTable_timeline->{$campNo});

                write_file_with_lock("../public/campBbsData/campBbsLog.json", encode_json($bbsTable_log));
                write_file_with_lock("../public/campBbsData/campBbsTimeline.json", encode_json($bbsTable_timeline));
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";
        }

        sub post_newMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json, $cgi) = @_;
            # POST
            my @campIds = ($campNo, @{$newMessage_json->{"targetCampIds"}});
            my $imagePATH = "../public/campBbsData/image";

            # 陣営ごとに処理
            foreach my $campId (@campIds){
                my $newMessageForCamp = { %$newMessage_json };
                # log追加処理
                my $newNo = 0;
                foreach my $message (@{$bbsTable_log->{$campId}}) {
                    if ($message->{"No"} > $newNo) {
                        $newNo = $message->{"No"};
                    }
                }
                $newNo++; # 新規番号
                $newMessageForCamp->{"No"} = "$newNo";
                $newMessageForCamp->{"writenTime"} = int(time());

                # 画像ファイル処理
                my @imageFilehandles = $cgi->upload("images");
                foreach my $index (0..$#imageFilehandles) {
                    my $imageFilehandle = $imageFilehandles[$index];
                    if (defined $imageFilehandle) {
                        # 拡張子だけ取得
                        $cgi->uploadInfo($imageFilehandle)->{"Content-Disposition"} =~ /filename=".+\.(.+)"$/;
                        my $extension = $1;
                        my $randomString = join '', map { chr(int(rand(26)) + (int(rand(2)) ? 65 : 97)) } 1..12;
                        my $fileName = "${randomString}.${extension}";
                        uploadImage_regulation($imageFilehandle, $fileName);
                        push(@{$newMessageForCamp->{"images"}}, $fileName);
                    }
                    last if($index == 1); # 画像は2枚まで
                }

                # log追加
                push(@{$bbsTable_log->{$campId}}, $newMessageForCamp);

                # timeline追加処理
                my $current = $bbsTable_timeline->{$campId};
                if($newMessageForCamp->{"parentId"}){
                    # 返信は階層を辿る
                    my $treePath = timeline_Index_Recursively($current, $newMessageForCamp->{"parentId"});
                    my @pathArray = split(/,/, $treePath);
                    for (my $i = 0; $i <= $#pathArray; $i++) {
                        $current = $current->{$pathArray[$i]}; # パスをたどる
                    }
                }
                $current->{$newMessageForCamp->{"No"}} = {};
            }

            return 1;
        }

        sub post_editMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json) = @_;
            # PUT
            my $index = (grep { $bbsTable_log->{$campNo}[$_]->{"No"} eq $newMessage_json->{"No"} } 0..$#{$bbsTable_log->{$campNo}})[0] // -1;
            if($index > -1){
                # 固定メッセージの場合はメッセージ固定中でも他を固定ができるので、先に既に固定しているメッセージをfalseにする
                if($newMessage_json->{"important"}){
                    my $important_index = (grep { $bbsTable_log->{$campNo}[$_]->{"important"} } 0..$#{$bbsTable_log->{$campNo}})[0] // -1;
                    $bbsTable_log->{$campNo}[$important_index]->{"important"} = 1 == 0;
                }

                my $editMessage = $bbsTable_log->{$campNo}[$index];
                foreach my $key (keys %{$newMessage_json}) {
                    next if($key eq "No");
                    $editMessage->{$key} = $newMessage_json->{$key};
                }
                return 1;
            }
            return 0;
        }

        sub post_deleteMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json) = @_;
            # DELETE
            # log削除
            my $index = (grep { $bbsTable_log->{$campNo}[$_]->{"No"} eq $newMessage_json->{"No"} } 0..$#{$bbsTable_log->{$campNo}})[0] // -1;
            if($index > -1){
                # log削除
                my $editMessage = $bbsTable_log->{$campNo}[$index];
                my $deleteMessage = {
                    "title" => "このメッセージは削除されました",
                    "owner" => "",
                    "islandName" => "",
                    "content" => "",
                    "writenTurn" => -1,
                    "contentColor" => "",
                    "important" => 1 == 0,
                    "images" => [],
                };
                foreach my $key (keys %{$deleteMessage}) {
                    next if($key eq "No");
                    $editMessage->{$key} = $deleteMessage->{$key};
                }

                # timeline削除
                my $current = $bbsTable_timeline->{$campNo};
                my $treePath = timeline_Index_Recursively($current, $newMessage_json->{"No"});
                if($treePath ne ""){
                    my @pathArray = split(/,/, $treePath);
                    for (my $i = 0; $i < $#pathArray; $i++) { # キーを消すので最下層の1つ手前で止める
                        $current = $current->{$pathArray[$i]}; # パスをたどる
                    }
                    # 子にメッセージがなかったら削除可能
                    if(keys %{$current->{$newMessage_json->{"No"}}} == 0){
                        delete $current->{$newMessage_json->{"No"}};
                    }
                }

                return 1;
            }
            return 0;
        }

        sub timeline_Index_Recursively {
            my ($timelineNode, $parentId, $path) = @_;
            my $foundPath = "";

            foreach my $key (keys %{$timelineNode}) {
                my $newPath = $path ? "$path,$key" : $key;
                if ($key eq $parentId) {
                    # パスが見つかったので返す
                    $foundPath = $newPath;
                    last;
                }
                if (ref($timelineNode->{$key}) eq 'HASH') {
                    $foundPath = timeline_Index_Recursively($timelineNode->{$key}, $parentId, $newPath);
                    if ($foundPath ne "") {
                        # パスが見つかってるので返す
                        last;
                    }
                }
            }
            return $foundPath;
        }

        sub read_file_with_lock {
            my ($filename) = @_;
            local $/; # 入力レコード区切りを無視

            open my $fh, "<", $filename or die $!;
            flock($fh, 1); # 共有ロック

            my $content = <$fh>;

            flock($fh, 8); # ロック解除
            close $fh;
            return $content;
        }

        sub write_file_with_lock {
            my ($filename, $content) = @_;

            open my $fh, ">", $filename or die $!;
            flock($fh, 2); # 排他ロック

            print $fh $content;

            flock($fh, 8); # ロック解除
            close $fh;
        }

        sub write_file_image {
            my ($filepath, $imageFilehandle) = @_;

            open my $fh, '>', $filepath or die $!;
            flock($fh, 2); # 排他ロック
            binmode $fh;

            while (my $chunk = <$imageFilehandle>) {
                print $fh $chunk;
            }

            flock($fh, 8); # ロック解除
            close $fh;
        }

        sub uploadImage_regulation {
            my ($imageFilehandle, $upload_fileName) = @_;
            my $imagePATH = "../public/campBbsData/image";
            my $full_path = "$imagePATH/$upload_fileName";
            my $ImageMagickPATH = "/usr/local/bin/convert";
            my $MAX_SIZE_MB = 3 * 1024 * 1024; # 3MB

            my ($tmp_fh, $tmp_filename) = tempfile();
            binmode $tmp_fh;  # 一時ファイルをバイナリモードで開く

            # ファイルハンドルから一時ファイルに書き込み
            my $file_size = 0;
            while (my $chunk = read($imageFilehandle, my $buffer, 8192)) {
                $file_size += length($buffer);
                if ($file_size > $MAX_SIZE_MB) {
                    close $tmp_fh;
                    unlink $tmp_filename;
                    die "image size over\n";
                }
                print $tmp_fh $buffer;
            }
            close $tmp_fh;

            # 画像サイズの取得（画像かどうかの判別）
            unless (`"$ImageMagickPATH" identify -format "%wx%h" $tmp_filename`) {
                unlink $tmp_filename;
                die "not image\n";
            }

            # 拡張子とMIMEタイプの検証
            my $mime_type = `"$ImageMagickPATH" identify -format "%m" $tmp_filename`;
            chomp $mime_type;
            unless ($mime_type =~ /^(JPG|JPEG|PNG|GIF)$/) {
                unlink $tmp_filename;
                die "not supported mimetype: $mime_type\n";
            }

            # ImageMagickコマンドセット
            my $processed_tmp_filename = "$tmp_filename-processed";
            my $magick_cmd = "\"$ImageMagickPATH\" $tmp_filename";
            $magick_cmd .= " +repage -auto-orient +repage";  # 画像の回転を補正
            $magick_cmd .= " -colorspace sRGB";  # sRGBに変換
            $magick_cmd .= " -strip";  # メタデータを削除
            $magick_cmd .= " $mime_type:\"$processed_tmp_filename\"";  # 一時ファイルに出力

            system($magick_cmd);

            if ($? == 0) {
                move($processed_tmp_filename, $full_path) or die "Failed to move processed file: $!";
            } else {
                die "ImageMagick command failed: $!";
            }

            # 一時ファイルを削除
            unlink $tmp_filename;
        }
    }
}

# サーバーの起動
my $server = MyWebServer->new(8080);
$server->run();