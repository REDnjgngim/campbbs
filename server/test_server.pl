#!/usr/bin/perl
use strict;
use warnings;
use utf8;

# サーバーの実装
{
    package MyWebServer;
    use base qw(HTTP::Server::Simple::CGI);
    use JSON;
    use lib './lib';
    use Data::Dumper;
    use File::Basename;
    use File::Spec;
    use File::Copy;
    use File::Temp qw/ tempfile /;
    use CampBbs::Image::IntegrityValidator qw(validate_image_integrity);

    sub handle_request {
        my ($self, $cgi) = @_;

        my $method = $cgi->request_method();
        my $isFaild = 0;

        # ヘッダー
        print "HTTP/1.1 200 OK\n";
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
            print "HTTP/1.1 404 Not Found\n";
            print "Content-Type: text/plain\n\n";
            print "Not Found";
        }

        return; # 終了

        sub get_api {
            my ($cgi, $BBSLOG_FILEPATH, $BBSTIMELINE_FILEPATH) = @_;
            my ($campNo, $begin, $end) = ($cgi->path_info()) =~ /\/camps\/(\d+)\/begin\/(\d+)\/end\/(\d+)/;  # パスを分割

            is_valid_camp_id_check($campNo);

            my ($log, $timeline);
            my ($camp_log, $camp_timeline) = ("{}", "{}");
            # 掲示板ログ・タイムラインが両方ある場合のみ
            # ファイルが無い＝ログが無いなのでエラーは返さない
            if (-e "$BBSLOG_FILEPATH" && -e "$BBSTIMELINE_FILEPATH") {
                my $log = read_file_with_lock($BBSLOG_FILEPATH);
                my $timeline = read_file_with_lock($BBSTIMELINE_FILEPATH);

                my $log_json = decode_json($log);
                my $timeline_json = decode_json($timeline);

                # 指定範囲のタイムラインを抽出
                my @timeline_groups = timeline_filtered($timeline_json->{$campNo}, $begin, $end);
                $camp_timeline = encode_json(\@timeline_groups);
                # タイムラインを基準に必要なメッセージを抽出
                my @log_filtered = log_filtered($log_json->{$campNo}, \@timeline_groups);
                $camp_log = encode_json(\@log_filtered);
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";

            # 全てのキーを抽出する再帰関数
            sub extract_keys {
                my $ref = shift;
                my @keys;
                if (ref($ref) eq 'HASH') {
                    for my $key (keys %$ref) {
                        push @keys, $key;
                        push @keys, extract_keys($ref->{$key});
                    }
                }
                return @keys;
            }
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

            is_valid_camp_id_check($campNo);

            # 掲示板ログ・タイムラインが両方ある場合のみ
            # ファイルが無い＝ログが無いなのでエラーは返さない
            if (-e "$BBSLOG_FILEPATH" && -e "$BBSTIMELINE_FILEPATH") {
                my $log = read_file_with_lock($BBSLOG_FILEPATH);
                my $timeline = read_file_with_lock($BBSTIMELINE_FILEPATH);

                my $bbsTable_log = decode_json($log);
                my $bbsTable_timeline = decode_json($timeline);

                $messageHandlers{$sub_method}->($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json, $cgi);

                $camp_log = encode_json($bbsTable_log->{$campNo});
                $camp_timeline = encode_json($bbsTable_timeline->{$campNo});

                write_file_with_lock("../public/campBbsData/campBbsLog.json", encode_json($bbsTable_log), ">");
                write_file_with_lock("../public/campBbsData/campBbsTimeline.json", encode_json($bbsTable_timeline), ">");
            }
        }

        sub post_newMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json, $cgi) = @_;
            # POST
            my @campIds = ($campNo, @{$newMessage_json->{"targetCampIds"}});

            if($newMessage_json->{"parentId"}){
                # 返信時は先に返信先のメッセージがあるかだけチェック
                existing_messageNo($bbsTable_log->{$campNo}, $newMessage_json->{"parentId"});
            }

            # 外交文書を考慮して陣営ごとに処理
            foreach my $campId (@campIds){
                is_valid_camp_id_check($campId);

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
                saveImages($cgi, $newMessageForCamp, $campId);

                # log追加
                push(@{$bbsTable_log->{$campId}}, $newMessageForCamp);

                # timeline追加処理
                my $current = $bbsTable_timeline->{$campId};
                my ($treePath, $index) = ("", -1);
                if($newMessageForCamp->{"parentId"}){
                    # 階層を辿る
                    for (my $i = 0; $i <= $#{$current}; $i++) {
                        $treePath = timeline_Index_Recursively($current->[$i], $newMessageForCamp->{"parentId"});
                        if($treePath ne ""){
                            $index = $i;
                            last;
                        }
                    }
                }

                if($index > -1){
                    # 返信
                    my @pathArray = split(/,/, $treePath);
                    $current = $current->[$index]; # 最初のパス
                    for (my $i = 0; $i <= $#pathArray; $i++) {
                        $current = $current->{$pathArray[$i]}; # パスをたどる
                    }
                    $current->{$newMessageForCamp->{"No"}} = {};

                    # 返信したグループは一番新しくする
                    push(@{$bbsTable_timeline->{$campId}}, splice(@{$bbsTable_timeline->{$campId}}, $index, 1));
                }else{
                    # 新規投稿
                    push(@{$current}, {$newMessageForCamp->{"No"} => {}})
                }
            }
        }

        sub post_editMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json) = @_;
            # PUT
            my $messageIndex = existing_messageNo($bbsTable_log->{$campNo}, $newMessage_json->{"No"});

            # 固定メッセージの場合はメッセージ固定中でも他を固定ができるので、先に既に固定しているメッセージをfalseにする
            if($newMessage_json->{"important"}){
                my $important_index = (grep { $bbsTable_log->{$campNo}[$_]->{"important"} } 0..$#{$bbsTable_log->{$campNo}})[0] // -1;
                $bbsTable_log->{$campNo}[$important_index]->{"important"} = 1 == 0;
            }

            my $editMessage = $bbsTable_log->{$campNo}[$messageIndex];
            foreach my $key (keys %{$newMessage_json}) {
                next if($key eq "No");
                $editMessage->{$key} = $newMessage_json->{$key};
            }
        }

        sub post_deleteMessage{
            my ($bbsTable_log, $bbsTable_timeline, $campNo, $newMessage_json) = @_;
            # DELETE
            my $messageIndex = existing_messageNo($bbsTable_log->{$campNo}, $newMessage_json->{"No"});

            # log削除
            my $editMessage = $bbsTable_log->{$campNo}[$messageIndex];
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

            if($#{$editMessage->{'images'}} >= 0){
                # 画像削除
                foreach my $image (@{$editMessage->{'images'}}) {
                    my $imagePATH_file = "../public/campBbsData/image/$image";
                    if (-e $imagePATH_file) {
                        unlink $imagePATH_file;
                    }
                }
            }

            foreach my $key (keys %{$deleteMessage}) {
                next if($key eq "No");
                $editMessage->{$key} = $deleteMessage->{$key};
            }

            # timeline削除
            my $current = $bbsTable_timeline->{$campNo};
            my ($treePath, $index) = ("", -1);
            for (my $i = 0; $i <= $#{$current}; $i++) {
                $treePath = timeline_Index_Recursively($current->[$i], $newMessage_json->{"No"});
                if($treePath ne ""){
                    $index = $i;
                    last;
                }
            }

            my @pathArray = split(/,/, $treePath);
            $current = $current->[$index]; # 最初のパス
            for (my $i = 0; $i < $#pathArray; $i++) { # キーを消すので最下層の1つ手前で止める
                $current = $current->{$pathArray[$i]}; # パスをたどる
            }
            # 子にメッセージがなかったら削除可能
            if(keys %{$current->{$newMessage_json->{"No"}}} == 0){
                delete $current->{$newMessage_json->{"No"}};

                if(keys %{$bbsTable_timeline->{$campNo}[$index]} == 0){
                    # グループの中身が空
                    splice (@{$bbsTable_timeline->{$campNo}}, $index, 1);
                }
            }
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
            my ($filename, $content, $option) = @_;

            open my $fh, $option, $filename or die $!;
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

        sub timeline_filtered {
            my ($timeline_array, $begin, $end) = @_;
            my @timelined_filtered;
            $end = $#{$timeline_array} if($end == 0);
            my $line = scalar(@{$timeline_array});

            # 最新の書き込みから$lineまたは$endまでループして抽出
            for (my $i = -$begin; $i >= -$line; $i--) {
                push(@timelined_filtered, $timeline_array->[$i]);
                last if($i <= -$end);
            }
            return @timelined_filtered;
        }

        sub log_filtered {
            my ($log_array, $timeline_groups) = @_;
            my @groupNos;
            # タイムラインからメッセージNoだけをまとめる
            foreach my $timeline_group (@{$timeline_groups}){
                push(@groupNos, extract_keys($timeline_group));
            }
            # 検索対象のNoをキーとしたハッシュを作成
            my %search_hash = map { $_ => 1 } @groupNos;
            # 必要なメッセージだけ抽出
            my @log_filtered = grep { exists $search_hash{ $_->{"No"} } } @{$log_array};

            return @log_filtered;
        }

        sub saveImages {
            my ($cgi, $newMessageForCamp, $campId) = @_;
            my $imagePATH = "../public/campBbsData/image";
            my @imageFilehandles = $cgi->upload("images");
            my (@validImages, @imageFileNames);

            if($#imageFilehandles == -1){
                # 添付画像なし
                return;
            }

            foreach my $index (0..$#imageFilehandles) {
                my $imageFilehandle = $imageFilehandles[$index];
                if (defined $imageFilehandle) {
                    # 拡張子だけ先に抽出
                    $cgi->uploadInfo($imageFilehandle)->{"Content-Disposition"} =~ /filename=".+\.(.+)"$/;
                    my $extension = $1;
                    # ファイル名を格納
                    my $fileName = setFileName($extension);
                    push(@imageFileNames, $fileName);
                    # 画像の状態をチェック
                    my $validImage = uploadImage_regulation($imageFilehandle, $extension, $campId);
                    push(@validImages, $validImage);
                }
                last if($index == 1); # 画像は2枚まで
            }

            # 全ての画像が問題なかったら保存
            for(my $i = 0; $i <= $#validImages; $i++){
                my $fileName = $imageFileNames[$i];
                push(@{$newMessageForCamp->{"images"}}, $fileName);
                move($validImages[$i], "$imagePATH/$fileName") or handleException_exit("image_save_failed_move_fale_failed_messageCampId_$campId", $!);
            }


            sub setFileName {
                my ($extension) = @_;
                my $randomString = join '', map { chr(int(rand(26)) + (int(rand(2)) ? 65 : 97)) } 1..12;
                my $fileName = "${randomString}.${extension}";

                return $fileName;
            }
        }

        sub uploadImage_regulation {
            my ($imageFilehandle, $extension, $campId) = @_;
            my $MAX_SIZE_MB = 3 * 1024 * 1024; # 3MB

            my ($tmp_fh, $tmp_filename) = tempfile(SUFFIX => $extension);
            binmode $tmp_fh;  # 一時ファイルをバイナリモードで開く

            # ファイルハンドルから一時ファイルに書き込み
            my $file_size = 0;
            while (my $chunk = read($imageFilehandle, my $buffer, 8192)) {
                $file_size += length($buffer);
                if ($file_size > $MAX_SIZE_MB) {
                    close $tmp_fh;
                    unlink $tmp_filename;
                    handleException_exit("image_save_failed_size_over_messageCampId_$campId");
                }
                print $tmp_fh $buffer;
            }
            close $tmp_fh;

            if(my $problem = validate_image_integrity($tmp_filename)){
                unlink $tmp_filename;
                handleException_exit("image_save_failed_invalid_image_messageCampId_$campId", $problem);
            }

            my $processed_tmp_filename = "$tmp_filename-processed";
            if ( my $error_code = normalize_image($tmp_filename, $processed_tmp_filename) ) {
                handleException_exit("image_save_failed_ImageMagick_command_failed_messageCampId_$campId", $error_code);
            }

            # 一時ファイルを削除
            unlink $tmp_filename;

            return $processed_tmp_filename;

            sub normalize_image {
                my ($tmp_filename, $processed_tmp_filename) = @_;
                my $ImageMagickPATH = "/usr/local/bin/convert";

                # ImageMagickコマンドセット
                my $magick_cmd = "\"$ImageMagickPATH\" $tmp_filename";
                $magick_cmd .= " +repage -auto-orient +repage";  # 画像の回転を補正
                $magick_cmd .= " -strip";  # メタデータを削除
                $magick_cmd .= " \"$processed_tmp_filename\"";  # 一時ファイルに出力

                return system($magick_cmd);
            }
        }

        sub is_valid_camp_id_check {
            my ($campId) = @_;
            my $campIdsFile = './campIds.csv';
            my $campIdsContent = read_file_with_lock($campIdsFile);
            my @campIds = split (/,/, $campIdsContent);

            my $isValid = grep { $_ == $campId } @campIds;

            unless($isValid){
                handleException_exit("invalid_camp_id", $campId);
            }
        }

        sub existing_messageNo {
            my ($bbsTable_campLog, $message_targetNo) = @_;

            my $index = (grep { $bbsTable_campLog->[$_]{"No"} eq $message_targetNo } 0..$#{$bbsTable_campLog})[0] // -1;

            if($index == -1){
                handleException_exit("invalid_messageNo", $message_targetNo);
            }

            if($index > -1 && $bbsTable_campLog->[$index]{"writenTurn"} == -1){
                handleException_exit("deleted_messageNo", $message_targetNo);
            }

            return $index;
        }

        sub handleException_exit {
            my ($error_message, $error_log) = @_;

            my $localtime = scalar localtime;
            my $description = "[$localtime] ${error_message}: [$error_log] \n";
            write_file_with_lock("./error_log.txt", $description, ">>");
            print "Bad Request";
            die;
        }
    }
}

# サーバーの起動
my $server = MyWebServer->new(8080);
$server->run();