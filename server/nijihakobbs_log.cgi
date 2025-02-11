#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use JSON;
use CGI;

certification();
my $paramHTML = param_set();
script_output($paramHTML);

sub certification {
    my $cgi = CGI->new();
    my %URLparams = $cgi->Vars();
    my $master_params_json = import_master_params_json($URLparams{'hako'}, $URLparams{'eventNo'});
    if($URLparams{'eventNo'} == $master_params_json->{'eventNo'} && !$master_params_json->{'gameEnd'}){
        # 現在ゲーム進行中の掲示板は閲覧不可
        error_page("不正なアクセスです");
    }
}

sub param_set {
    my $cgi = CGI->new();
    my %URLparams = $cgi->Vars();

    my $master_params_json = import_master_params_json($URLparams{'hako'}, $URLparams{'eventNo'});
    # 陣営を整形
    my $campListsHTML = "";
    foreach my $record (@{$master_params_json->{"camp"}}) {
        $campListsHTML .= "{ id: \"$record->{'id'}\", name: \"$record->{'name'}\", mark: \"$record->{'mark'}\" },\n";
    }

    my $campViewLastTime = time();

    my $param = <<"    PARAM";
        window.islandId = 0;
        window.islandName = null;
        window.campId = "$URLparams{'campId'}";
        window.viewLastTime = $campViewLastTime;
        window.campLists = [
            $campListsHTML
        ];
        window.islandTurn = $master_params_json->{'islandTurn'};
        window.hako_idx = $URLparams{'hako'};
        window.eventNo = $URLparams{'eventNo'};
        window.gameEnd = true;
    PARAM

    return $param;
}

sub script_output {
    my ($paramHTML) = @_;
    my @index_html;
    if (open(my $fh, "<:encoding(UTF-8)", '../index.html')) {

        while (my $line = <$fh>) {
            push(@index_html, $line);
            if($line =~ /<script>/){
                push(@index_html, $paramHTML);
            }
        }
        close($fh);

        # index.htmlの内容を出力
        print "Content-type: text/html; charset=utf-8\n\n";
        print join("", @index_html);
    } else {
        error_page("インデックスファイルが存在しません。管理人へご連絡ください");
    }
}

sub import_master_params_json {
    my ($hako_idx, $eventNo) = @_;
    my $master_params;
    if (open(my $fh, "./campBbsData/" . hako_type($hako_idx) . "/event${eventNo}/master_params.json")) {
        local $/;
        $master_params = <$fh>;
        close $fh;
    }else{
        error_page("不正なアクセスです");
    }

    my $master_params_json = decode_json($master_params);
    return $master_params_json;
}

sub error_page {
    my ($error) = @_;
    my @error_html;
    if (open(my $fh, "<:encoding(UTF-8)", '../error.html')) {

        while (my $line = <$fh>) {
            push(@error_html, $line);
            if($line =~ /<h2/){
                push(@error_html, $error);
            }
        }
        close($fh);

        # error.htmlの内容を出力
        print "Content-type: text/html; charset=utf-8\n\n";
        print join("", @error_html);
    } else {
        print "Content-type: text/html; charset=utf-8\n\n";
        print "エラーが発生しました。管理人へご連絡ください";
    }

    die;
}

sub hako_type {
    my $hako_idx = shift;
    if($hako_idx == 3){
        return "kyotu";
    }elsif($hako_idx == 6){
        return "emp";
    }elsif($hako_idx == 11){
        return "sea";
    }
}