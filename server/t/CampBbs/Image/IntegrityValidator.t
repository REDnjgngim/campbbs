use strict;
use warnings;
use Test::More;
use FindBin ();
use lib "$FindBin::RealBin/../../../lib";
use CampBbs::Image::IntegrityValidator qw(validate_image_integrity);
use File::Temp;
use utf8;
my $builder = Test::More->builder;
binmode $builder->output,         ":encoding(utf8)";
binmode $builder->failure_output, ":encoding(utf8)";
binmode $builder->todo_output,    ":encoding(utf8)";

sub main {
    eval { validate_image_integrity(undef) };
    ok $@, 'ファイルパスがundefの場合は例外が発生する';

    eval { validate_image_integrity('') };
    ok $@, 'ファイルパスが空文字の場合は例外が発生する';

    # 存在しないパスの候補
    my $not_exist_path = '/tmp/SE1S4uz6mXX0GY6WfTaFmVcw';

    while (-f $not_exist_path) {
        # もし存在したらPIDと時刻を足して再試行;
        $not_exist_path =~ s/[0-9]$//;
        $not_exist_path .= $$;
        $not_exist_path .= time;
    }
    eval { validate_image_integrity($not_exist_path) };
    ok $@, '指定されたファイルが存在しない場合は例外が発生する';
    subtest acceptable_images => sub {
        my @acceptable_extensions = qw(gif jpg jpeg png);

        foreach my $extension (@acceptable_extensions) {
            my $tmp  = File::Temp->new(UNLINK => 1, SUFFIX => '.' . $extension);
            my $path = "$tmp";
            make_valid_image($path, $extension);
            ok !validate_image_integrity($path), sprintf '受付可能な画像ファイルでfalseが返ってくる:%s.%s', uc $extension, $extension;
        }
    };
    #
    my @extension_conditions = (
        { id => 0, valid => !!1, description => '受付可能な拡張子(小文字)',          value => 'png' },
        { id => 1, valid => !!1, description => '受付可能な拡張子(大文字)',          value => 'PNG' },
        { id => 2, valid => !!1, description => '受付可能な拡張子(大文字・小文字混合)',    value => 'pNg' },
        { id => 3, valid => !!0, description => '受付可能ではない拡張子(小文字)',       value => 'bmp' },
        { id => 4, valid => !!0, description => '受付可能ではない拡張子(大文字)',       value => 'BMP' },
        { id => 5, valid => !!0, description => '受付可能ではない拡張子(大文字・小文字混合)', value => 'bMp' },
        { id => 6, valid => !!0, description => '空文字',                    value => '' },
    );
    # valueのコードリファレンスの第1引数にパスを入力すると、そのパスにテスト用ファイルを生成する
    my @data_conditions = (
        {
            id          => 0,
            valid       => !!1,
            description => '受付可能な画像',
            value       => sub {
                my ($path) = @_;
                return make_valid_image($path, 'PNG');
            }
        },
        {
            id          => 1,
            valid       => !!0,
            description => '受付可能ではない画像',
            value       => sub {
                my ($path) = @_;
                return make_valid_image($path, 'BMP');
            }
        },
        {
            id          => 2,
            valid       => !!0,
            description => '非画像ファイル',
            value       => sub {
                my ($path) = @_;
                return make_rng_file($path, !!0);
            }
        },
        {
            id          => 3,
            valid       => !!0,
            description => 'マジックバイト部分だけ受付可能な非画像',
            value       => sub {
                my ($path) = @_;
                return make_rng_file($path, !!1);
            }
        },
        {
            id          => 4,
            valid       => !!0,
            description => '受付可能な画像が破損したもの',
            value       => sub {
                my ($path) = @_;
                return make_corrupted_image($path);
            }
        },
        {
            id          => 5,
            valid       => !!0,
            description => '長さが0',
            value       => sub {
                my ($path) = @_;
                open my $fh, '>', $path;
                return !!1;
            }
        },
    );
    subtest validate_image_integrity => sub {
        foreach my $extension_condition (@extension_conditions) {
            foreach my $data_condition (@data_conditions) {
                my $tmp  = File::Temp->new(UNLINK => 1, SUFFIX => '.' . $extension_condition->{value});
                my $path = "$tmp";
                $data_condition->{value}->($path);
                my $test_title = sprintf "Extenion-%02d-%s, Data-%02d-%s",
                    $extension_condition->{id},
                    $extension_condition->{description},
                    $data_condition->{id},
                    $data_condition->{description};

                if ($extension_condition->{valid} && $data_condition->{valid}) {
                    ok !validate_image_integrity($path), '受付可能ケース:' . $test_title;
                } else {
                    ok validate_image_integrity($path), '受付不可ケース:' . $test_title;
                }
            }
        }
    };
    done_testing;
}

sub make_valid_image {
    my ($path, $format) = @_;
    my $path_with_explicit_format = sprintf '%s:%s', $format, $path;
    my $exitcode = system 'convert', (qw(-size 1x1 xc:white -strip), $path_with_explicit_format);
    die 'failed to make image' if $exitcode;
    return !!1;
}

sub make_rng_file {
    my ($path, $valid_magicbytes) = @_;
    # $valid_magicbytesがtrueならデータの先頭をPNGのマジックバイトにする
    my $rng_binary = $valid_magicbytes ? (pack 'H*', '89504e477075f7df53f10fab71f95b9e') : (pack 'H*', 'edef85bf7075f7df53f10fab71f95b9e');
    open my $fh, '>:raw', $path;
    print $fh $rng_binary;
}

sub make_corrupted_image {
    my ($path) = @_;
    make_valid_image($path, 'PNG');
    # PNGの必須チャンクIHDRのヘッダー長を0に書き換えて壊す
    open my $fh, '+<:raw', $path;
    seek $fh, 11, 0;
    print $fh pack('C*', 0);
    close $fh;
    return !!1;
}

if ($0 eq __FILE__) {
    main();
}
1;
