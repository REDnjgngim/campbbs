#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use Encode qw/from_to/;
use JSON;

my ($islandId, $campId, $islandName, $campViewLastTime) = certification();
my $paramHTML = param_set($islandId, $campId, $islandName, $campViewLastTime)
script_output($paramHTML);

sub certification {

    check_referer();
    return check_island();

    sub check_referer {
        my $referer_fileName = 'hako-main.cgi'; # 現状はこれだけ
        my $own_filepath = $0;
        my $own_filename = (split('/', $own_filepath))[-1]; # 自身のファイル名

        # $referer_fileNameからのみ通過OK
        $ref = $ENV{'HTTP_REFERER'};
        if ($ref =~ /$referer_fileName/) {
            $ref =~ s/$referer_fileName/$own_filename/g;
        }
        $own_filepath =~ s/\~/.*/g;
        if (!($ref =~ /$ref_url/)) { 
            print "Content-type: text/html\n\n";
            print "不正なアクセスです";
            die;
        }
    }

    sub check_island {
        my $success = 0;
        my $islandId = $FORM{'id'};
        my $islandPassword = $FORM{'password'};
        my $campId = "";
        my $islandName = "";
        my $campViewLastTime = 0;

        open (my $fh, "./users.csv") or die $!;
            while (my $record = <$fh>) {
                ($id, $password, $campId, $name, $timestamp) = split('/', $record);
                if($id == $islandId && $password eq $islandPassword){
                    $campId = $campId;
                    $islandName = $name;
                    $campViewLastTime = $timestamp;
                    $success = 1;
                }
            }
        close $fh;

        unless($success) {
            print "Content-type: text/html\n\n";
            print "不正なアクセスです";
            die;
        }

        return ($islandId, $campId, $islandName, $campViewLastTime);
    }
}

sub param_set {
    my ($islandId, $campId, $islandName, $campViewLastTime) = @_;
    my $master_params;
    if (open(my $fh, './master_params.json')) {
        local $/; # 入力レコード区切りを無視
        $master_params = <$fh>;
        close $fh;
    }else{
        print "Content-type: text/html\n\n";
        print "必要なファイルが存在しません。管理人へご連絡ください";
        die;
    }

    $master_params_json = decode_json($master_params);
    # 陣営を整形
    $campListsHTML = "";
    foreach my $record (@{$master_params_json->{"camp"}}) {
        $campListsHTML .= "{ id: $record->{'id'}, name: "$record->{'name'}", mark: "$record->{'mark'}" },\n";
    }

    my $param = <<"    PARAM"
        window.islandId = $islandId;
        window.islandName = "$islandName";
        window.campId = "$campId";
        window.viewLastTime = $campViewLastTime;
        window.campLists = {
            $campListsHTML
        };
        window.islandTurn = $master_params_json->{'islandTurn'};
    PARAM

    return $param;
}

sub script_output {
    my ($paramHTML) = @_;
    my @index_html;
    if (open(my $fh, 'index.html')) {

        while (my $line = <$fh>) {
            push(@index_html, $line);
            if($line =~ /<script>/){
                push(@index_html, $paramHTML);
            }
        }

        my @lines = <$fh>;
        close($fh);

        # index.htmlの内容を出力
        print "Content-type: text/html\n\n";
        print join("", @lines);  # index.htmlの内容を出力
    } else {
        print "Content-type: text/html\n\n";
        print "ファイルが存在しません。管理人へご連絡ください";
        die;
    }
}