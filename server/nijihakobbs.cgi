#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use JSON;
use CGI;

my ($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx) = certification();
my $paramHTML = param_set($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx);
script_output($paramHTML);

sub certification {

    my ($hako_idx) = check_referer();
    my ($id, $CampId, $name, $viewLastTime) = check_island($hako_idx);
    return ($id, $CampId, $name, $viewLastTime, $hako_idx);

    sub check_referer {
        my $hako_idx = 0;
        my $referer_fileName_kyotu = '/kyotu/st/hako-main.cgi';
        my $referer_fileName_emp = '/emp/st/hako-main.cgi';
        my $referer_fileName_sea = '/sea/st/hako-main.cgi';
        my $own_filepath = "/campbbs/server/nijihakobbs.cgi";
        my $own_filename = (split(/\\/, $own_filepath))[-1]; # 自身のファイル名

        # $referer_fileNameからのみ通過OK。リファラで箱庭を判定する
        my $ref = $ENV{'HTTP_REFERER'};
        if ($ref =~ /$referer_fileName_kyotu/) {
            $hako_idx = 3;
            $ref =~ s/$referer_fileName_kyotu/$own_filename/g;
        } elsif ($ref =~ /$referer_fileName_emp/) {
            $hako_idx = 6;
            $ref =~ s/$referer_fileName_emp/$own_filename/g;
        } elsif ($ref =~ /$referer_fileName_sea/) {
            $hako_idx = 11;
            $ref =~ s/$referer_fileName_sea/$own_filename/g;
        }

        $own_filepath =~ s/\~/.*/g;
        if (!($ref =~ /$own_filepath/)) {
            print "Content-type: text/html; charset=utf-8\n\n";
            print "$ref =~ /$own_filepath/<br>";
            print "不正なアクセスです1";
            die;
        }

        return $hako_idx;
    }

    sub check_island {
        my ($hako_idx) = @_;
        my $cgi = CGI->new();
        my %FORM = $cgi->Vars();
        my $success = 0;
        my $islandId = $FORM{'id'};
        my $islandPassword = $FORM{'password'};
        my $islandCampId = "";
        my $islandName = "";
        my $campViewLastTime = 0;
        my $master_params_json = import_master_params_json($hako_idx);

        open (my $fh, "<:encoding(UTF-8)", "./campBbsData/" . hako_type($hako_idx) . $master_params_json->{'eventNo'} . "/users.csv") or die $!;
            while (my $record = <$fh>) {
                my ($id, $password, $campId, $name, $timestamp) = split(',', $record);
                if($id == $islandId && $password eq $islandPassword){
                    $islandCampId = $campId;
                    $islandName = $name;
                    chomp($timestamp);
                    $campViewLastTime = $timestamp;
                    $success = 1;
                }
            }
        close $fh;

        unless($success) {
            print "Content-type: text/html; charset=utf-8\n\n";
            print "不正なアクセスです2";
            die;
        }

        return ($islandId, $islandCampId, $islandName, $campViewLastTime);
    }
}

sub param_set {
    my ($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx) = @_;

    my $master_params_json = import_master_params_json($hako_idx);
    # 陣営を整形
    my $campListsHTML = "";
    foreach my $record (@{$master_params_json->{"camp"}}) {
        $campListsHTML .= "{ id: \"$record->{'id'}\", name: \"$record->{'name'}\", mark: \"$record->{'mark'}\" },\n";
    }

    my $param = <<"    PARAM";
        window.islandId = $islandId;
        window.islandName = "$islandName";
        window.campId = "$islandCampId";
        window.viewLastTime = $campViewLastTime;
        window.campLists = [
            $campListsHTML
        ];
        window.islandTurn = $master_params_json->{'islandTurn'};
        window.hako_idx = $hako_idx;
        window.eventNo = $master_params_json->{'eventNo'};
    PARAM

    return $param;
}

sub script_output {
    my ($paramHTML) = @_;
    my @index_html;
    if (open(my $fh, './index.html')) {

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
        print "Content-type: text/html; charset=utf-8\n\n";
        print "ファイルが存在しません。管理人へご連絡ください2";
        die;
    }
}

sub import_master_params_json {
    my $hako_idx = shift;
    my $master_params;
    if (open(my $fh, "./campBbsData/" . hako_type($hako_idx) . "/master_params.json")) {
        local $/;
        $master_params = <$fh>;
        close $fh;
    }else{
        print "Content-type: text/html; charset=utf-8\n\n";
        print "必要なファイルが存在しません。管理人へご連絡ください1";
        die;
    }

    my $master_params_json = decode_json($master_params);
    return $master_params_json;
}

sub hako_type {
    $hako_idx = shift;
    if($hako_idx == 3){
        return "kyotu";
    }elsif($hako_idx == 6){
        return "emp";
    }elsif($hako_idx == 11){
        return "sea";
    }
}