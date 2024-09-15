#!/usr/bin/perl
use strict;
use warnings;

# サーバーの実装
{
    package MyWebServer;
    use base qw(HTTP::Server::Simple::CGI);
    use JSON;

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
            "POST" => \&post_api,
            "PUT" => \&put_api,
            "DELETE" => \&delete_api,
            # 他のパスと関数を追加可能
        );

        if($cgi->path_info() eq "/testResponse"){
            print "{\"message\": \"response OK\"}";
        } elsif (exists $routes{$method}) {
            $routes{$method}->($cgi);
        } else {
            print "HTTP/1.0 404 Not Found\n";
            print "Content-Type: text/plain\n\n";
            print "Not Found";
        }

        sub get_api {
            my ($cgi) = @_;
            my ($campNo) = ($cgi->path_info()) =~ /\/camps\/(\d+)/;  # パスを分割

            my ($log, $timeline);
            my ($camp_log, $camp_timeline) = ("{}", "{}");
            # 掲示板ログ・タイムラインが両方ある場合のみ
            if (-e "../public/campBbsData/campBbsLog.json" && -e "../public/campBbsData/campBbsTimeline.json") {
                local $/; # 入力レコード区切りを無視

                open my $fh1, "../public/campBbsData/campBbsLog.json" or die $!;
                $log = <$fh1>;
                close $fh1;

                open my $fh2, "../public/campBbsData/campBbsTimeline.json" or die $!;
                $timeline = <$fh2>;
                close $fh2;

                my $log_json = decode_json($log);
                my $timeline_json = decode_json($timeline);
                $camp_log = encode_json($log_json->{$campNo});
                $camp_timeline = encode_json($timeline_json->{$campNo});
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";
        }

        sub post_api {
            my ($cgi) = @_;
            my ($campNo) = ($cgi->path_info()) =~ /\/camps\/(\d+)/;  # パスを分割
            my $newMessage =  $cgi->param('POSTDATA');
            my $newMessage_json = decode_json($newMessage);

            my ($log, $timeline);
            my ($camp_log, $camp_timeline) = ("{}", "{}");
            # 掲示板ログ・タイムラインが両方ある場合のみ
            if (-e "../public/campBbsData/campBbsLog.json" && -e "../public/campBbsData/campBbsTimeline.json") {
                local $/; # 入力レコード区切りを無視

                open my $fh1, "../public/campBbsData/campBbsLog.json" or die $!;
                $log = <$fh1>;
                close $fh1;

                open my $fh2, "../public/campBbsData/campBbsTimeline.json" or die $!;
                $timeline = <$fh2>;
                close $fh2;

                my $bbsTable_log = decode_json($log);
                my $bbsTable_timeline = decode_json($timeline);

                my @campIds = ($campNo, @{$newMessage_json->{"targetCampIds"}});
                # 陣営ごとに処理
                foreach my $id (@campIds){
                    # log追加処理
                    my $newNo = 0;
                    foreach my $message (@{$bbsTable_log->{$id}}) {
                        if ($message->{"No"} > $newNo) {
                            $newNo = $message->{"No"};
                        }
                    }
                    $newNo++; # 新規番号
                    $newMessage_json->{"No"} = "$newNo";
                    # log追加
                    push(@{$bbsTable_log->{$id}}, $newMessage_json);

                    # timeline追加処理
                    my $current = $bbsTable_timeline->{$campNo};
                    if($newMessage_json->{"parentId"}){
                        # 返信は階層を辿る
                        my $treePath = timeline_Index_Recursively($current, $newMessage_json->{"parentId"});
                        my @pathArray = split(/,/, $treePath);
                        for (my $i = 0; $i <= $#pathArray; $i++) {
                            $current = $current->{$pathArray[$i]}; # パスをたどる
                        }
                    }
                    $current->{$newMessage_json->{"No"}} = {};
                }

                $camp_log = encode_json($bbsTable_log->{$campNo});
                $camp_timeline = encode_json($bbsTable_timeline->{$campNo});

                open $fh1, "> ../public/campBbsData/campBbsLog.json" or die $!;
                print $fh1 encode_json($bbsTable_log);
                close $fh1;

                open $fh2, "> ../public/campBbsData/campBbsTimeline.json" or die $!;
                print $fh2 encode_json($bbsTable_timeline);
                close $fh2;
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";
        }

        sub put_api {
            my ($cgi) = @_;
            my ($api, $data, $campNo, $messageNo) = split('/', $cgi->path_info());  # パスを分割

        }

        sub delete_api {
            my ($cgi) = @_;
            my ($api, $data, $campNo, $messageNo) = split('/', $cgi->path_info());  # パスを分割

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
    }
}

# サーバーの起動
my $server = MyWebServer->new(8080);
$server->run();