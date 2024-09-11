#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use JSON;

# CGIオブジェクトの作成
my $cgi = CGI->new;

# HTTPヘッダーを出力
print $cgi->header(
    -type => 'application/json',
);