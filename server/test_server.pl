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

            # 掲示板ログ
            my $log;
            my $camp_log = "{}";
            if (-e "../public/campBbsData/campBbsLog.json") {
                local $/; # 入力レコード区切りを無視
                open my $fh, "../public/campBbsData/campBbsLog.json" or die $!;
                $log = <$fh>;
                close $fh;

                my $log_json = decode_json($log);
                $camp_log = encode_json($log_json->{"$campNo"});
            }

            # 掲示板タイムライン
            my $timeline;
            my $camp_timeline = "{}";
            if (-e "../public/campBbsData/campBbsTimeline.json") {
                local $/; # 入力レコード区切りを無視
                open my $fh, "../public/campBbsData/campBbsTimeline.json" or die $!;
                $timeline = <$fh>;
                close $fh;

                my $timeline_json = decode_json($timeline);
                $camp_timeline = encode_json($timeline_json->{"$campNo"});
            }

            # 出力
            print "{ \"log\": $camp_log, \"timeline\": $camp_timeline }";
        }

        sub post_api {
            my ($cgi) = @_;
            my ($api, $data, $campNo, $messageNo) = split('/', $cgi->path_info());  # パスを分割

        }

        sub put_api {
            my ($cgi) = @_;
            my ($api, $data, $campNo, $messageNo) = split('/', $cgi->path_info());  # パスを分割

        }

        sub delete_api {
            my ($cgi) = @_;
            my ($api, $data, $campNo, $messageNo) = split('/', $cgi->path_info());  # パスを分割

        }
    }
}

# サーバーの起動
my $server = MyWebServer->new(8080);
$server->run();