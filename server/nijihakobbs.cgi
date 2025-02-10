#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use JSON;
use CGI;

my ($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx, $eventNo) = certification();
my $paramHTML = param_set($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx, $eventNo);
script_output($paramHTML);
campViewLastTime_update($islandId, $hako_idx, $eventNo);

sub certification {

    my ($hako_idx) = check_referer();
    my ($id, $CampId, $name, $viewLastTime, $eventNo) = check_island($hako_idx);
    check_transitionable($hako_idx, $eventNo);
    return ($id, $CampId, $name, $viewLastTime, $hako_idx, $eventNo);

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
            error_page("不正なアクセスです");
        }

        return $hako_idx;
    }

    sub check_island {
        my ($hako_idx) = @_;
        my $cgi = CGI->new();
        my %FORM = $cgi->Vars();
        my $success = 0;
        my ($islandId, $islandPassword, $eventNo) = (
            $FORM{'id'}, $FORM{'password'}, $FORM{'hako'}
        );
        my $islandCampId = "";
        my $islandName = "";
        my $campViewLastTime = 0;

        open (my $fh, "<:encoding(UTF-8)", "./campBbsData/" . hako_type($hako_idx) . "/event${eventNo}/users.csv") or die $!;
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
            error_page("不正なアクセスです");
        }

        return ($islandId, $islandCampId, $islandName, $campViewLastTime, $eventNo);
    }

    sub check_transitionable {
        my ($hako_idx, $eventNo) = @_;
        my $master_params_json = import_master_params_json($hako_idx, $eventNo);
        my $current_time = time();
        my $suspendTime = 3600 * 24 * 3;
        if($master_params_json->{'gameEnd'} && $current_time > $master_params_json->{'transitionableTime'} + $suspendTime){
            # 開発画面からの陣営掲示板の使用可能時刻はゲーム終了後から72時間を想定
            error_page("ゲーム終了から一定期間が過ぎたため使用できません。");
        }
    }
}

sub param_set {
    my ($islandId, $islandCampId, $islandName, $campViewLastTime, $hako_idx, $eventNo) = @_;

    my $master_params_json = import_master_params_json($hako_idx, $eventNo);
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
        window.eventNo = $eventNo;
        window.gameEnd = $master_params_json->{'gameEnd'};
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

sub campViewLastTime_update {
    my ($islandId, $hako_idx, $eventNo) == @_;

    my @user_tables;
    if (open(my $IN, "<:encoding(UTF-8)", "./campBbsData/" . hako_type($hako_idx) . "/event${eventNo}/users.csv")) {
		@user_tables = <$IN>;
	    close($IN);
    }else{
        # 最終閲覧時刻は更新出来ないが掲示板は閲覧可能
        return;
    }

    for (0..$#user_tables){
        if($user_tables[$_] =~ /^$islandId/){
            my $viewTime = time();
            $user_tables[$_] =~ s/\,\d+$/\,$viewTime/;
            last;
        }
    }

	if (open(my $OUT, ">:encoding(UTF-8)", "./campBbsData/" . hako_type($hako_idx) . "/event${eventNo}/users.csv")) {
		print $OUT join("", @user_tables);
	    close($OUT);
    }else{
        # 最終閲覧時刻は更新出来ないが掲示板は閲覧可能
        return;
    }
}

sub import_master_params_json {
    my $hako_idx = shift;
    my $master_params;
    if (open(my $fh, "./campBbsData/" . hako_type($hako_idx) . "/event${eventNo}/master_params.json")) {
        local $/;
        $master_params = <$fh>;
        close $fh;
    }else{
        error_page("設定ファイルが存在しません。管理人へご連絡ください");
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