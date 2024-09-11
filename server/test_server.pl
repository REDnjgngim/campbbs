#!/usr/bin/perl
use strict;
use warnings;
use HTTP::Server::Simple::CGI;
use JSON;

# サーバーの実装
{
    package MyWebServer;
    use base qw(HTTP::Server::Simple::CGI);

    sub handle_request {
        my ($self, $cgi) = @_;

        my $path = $cgi->path_info();
        my $method = $cgi->request_method();

        # ヘッダー
        print "HTTP/1.0 200 OK\n";
        print "Access-Control-Allow-Origin: *\n";
        print "Content-Type: application/json\n\n";

        # 汎用的な処理
        my %routes = (
            "GET" => \&get_api,
            "POST" => \&post_api,
            # 他のパスと関数を追加可能
        );

        if($path eq "/testResponse"){
            print "{\"message\": \"Hello from Perl API\", \"api\": \"$method\", \"path\": \"$path\"}";
        } elsif (exists $routes{$path}) {
            $routes{$path}->($path, $method);
        } else {
            print "HTTP/1.0 404 Not Found\n";
            print "Content-Type: text/plain\n\n";
            print "Not Found";
        }

        my sub get_api {
            my ($path, $submited_json) = @_;
        }

        my sub post_api {
            my ($path, $submited_json) = @_;
        }
    }
}

# サーバーの起動
my $server = MyWebServer->new(8080);
$server->run();