    package CampBbs::Image::IntegrityValidator {
        use strict;
        use warnings;
        use utf8;
        use Exporter 'import';
        use Carp qw( croak );
        our @EXPORT_OK = qw(validate_image_integrity);

        # 受付可能な画像形式の定義
        # nameはImageMagickの画像形式名と一致している必要がある(ImageMagickの画像形式名は convert -list format で確認できる)
        our %ACCEPTABLE_FORMATS = (
            gif => {
                name                   => 'gif',
                extensions             => [qw(gif)],
                magicbytes_definitions => [
                    {
                        hex_string_pattern => qr/^474946$/i,
                        offset             => 0,
                        length             => 3,
                    }
                ],
            },
            jpeg => {
                name                   => 'jpeg',
                extensions             => [qw(jpg jpeg)],
                magicbytes_definitions => [
                    {
                        hex_string_pattern => qr/^ffd8$/i,
                        offset             => 0,
                        length             => 2,
                    }
                ],
            },
            png => {
                name                   => 'png',
                extensions             => [qw(png)],
                magicbytes_definitions => [
                    {
                        hex_string_pattern => qr/^89504e47$/i,
                        offset             => 0,
                        length             => 4,
                    }
                ],
            },
        );

        # すべての受付可能拡張子の配列
        # example: qw(ext1 ext2 ext3)
        # %ACCEPTABLE_FORMATS から生成
        our @ACCEPTABLE_EXTENSIONS = sub {
            my @extensions = ();

            foreach my $key (keys(%ACCEPTABLE_FORMATS)) {
                push @extensions, @{ $ACCEPTABLE_FORMATS{$key}->{extensions} };
            }
            return @extensions;
            }
            ->();

        # 受付可能拡張子に含まれるか判定するための事前コンパイルregex(ケースインセンシティブ)
        # example: /^(ext1|ext2|ext3)$/i
        # @ACCEPTABLE_EXTENSIONS から生成
        our $ACCEPTABLE_EXTENSIONS_CHECKER_REGEX = sub {
            my $acceptable_extensions = join '|', @ACCEPTABLE_EXTENSIONS;
            return qr/^(${acceptable_extensions})$/i;
            }
            ->();

        #　拡張子をキーにして画像形式の定義を取得するためのハッシュ
        # example: (ext1=>$ext1_format, ext1_synonym=>$ext1_format, ext2=>$ext2_format)
        # %ACCEPTABLE_FORMATS から生成
        our %FORMAT_FROM_EXTENSION = sub {
            my %format_from_extension = ();

            foreach my $key (keys(%ACCEPTABLE_FORMATS)) {
                my $format = $ACCEPTABLE_FORMATS{$key};

                foreach my $extension (@{ $format->{extensions} }) {
                    $format_from_extension{$extension} = $format->{name};
                }
            }
            return %format_from_extension;
            }
            ->();

        # 引数$file_pathのファイルが受付可能な画像形式かつ破損していないことを検証する
        # 戻り値:検出された異常を説明する文字列(異常がなければfalse)
        sub validate_image_integrity {
            my ($file_path) = @_;
            croak 'argument $file_path must be defined.' if not defined $file_path;
            croak "${file_path} does not exist."         if not -f $file_path;
            my $extension = _get_extension_from_file_path($file_path);

            # ImageMagickに読み込ませても問題のない画像か検証する
            if ($extension !~ $ACCEPTABLE_EXTENSIONS_CHECKER_REGEX) {
                return 'path has unacceptable extension.';
            }
            my $format = $ACCEPTABLE_FORMATS{ $FORMAT_FROM_EXTENSION{$extension} };

            if (not _file_has_correct_magicbytes($file_path, $format)) {
                return 'file has incorrect magic-bytes.';
            }

            # ここから先、ImageMagickに読み込ませる
            if (not _file_has_correct_data($file_path, $format)) {
                return 'file has incorrect data';
            }
            return !!0;
        }

        # 引数$formatで指定された画像形式のマジックバイトがファイルに含まれていることを検証する
        sub _file_has_correct_magicbytes {
            my ($file_path, $format) = @_;
            croak 'argument $file_path must be defined.' if not defined $file_path;
            croak 'argument $format must hash-ref.'      if (ref $format ne 'HASH');
            open(my $fh, '<:raw', $file_path)
                or croak "failed to open file at $file_path. error: $!";

            foreach my $magicbytes_definition (@{ $format->{magicbytes_definitions} }) {
                my $buffer;
                my $read_length = read($fh, $buffer, $magicbytes_definition->{length});

                if (not $read_length) {
                    # readに失敗した
                    if ($!) {
                        croak "failed to read file at $file_path. error: $!";
                    }
                    # readしたバイト長が0だった
                    return !!0;
                }
                my $magicbytes_as_hex_string = unpack "H*", $buffer;

                if ($magicbytes_as_hex_string =~ $magicbytes_definition->{hex_string_pattern}) {
                    return !!1;
                }
                seek($fh, 0, 0);
            }
            return !!0;
        }

        # ImageMagickが画像を読み込めることと、認識した画像形式が$formatと一致していることを検証する
        sub _file_has_correct_data {
            my ($file_path, $format) = @_;
            croak 'argument $file_path must be defined.' if not defined $file_path;
            croak 'argument $format must hash-ref.'      if (ref $format ne 'HASH');

            # -regard-warningsで警告をエラーとして扱う
            my @commands      = qw(-regard-warnings -format %[m]);
            my $identify_path = '/usr/local/bin/identify';
            # ImageMagickでは入力ファイルパスの前に FMT: を付けることで、画像形式の推論を無効化できる
            my $file_path_with_explicit_format = sprintf '%s:%s', $format->{name}, $file_path;
            # シェルインジェクションの可能性を排除するため、`$command`ではなくopen(handle, stdout-mode, $program, @arguments)を使用する
            open(my $identify_stdout, '-|', $identify_path, (@commands, $file_path_with_explicit_format)) or croak "failed to open pipe. error: $!";
            my $identify_output = do {
                local $/, undef;
                <$identify_stdout>;
            };
            close $identify_stdout;

            # $?がtrueだった場合はエラーが発生している
            if ($?) {
                # $!もtrueだった場合はopen/closeのエラー
                if ($!) {
                    croak "failed to close pipe. error: $!";
                }
                # $?だけtrueだった場合はコマンドの終了コードが0ではなかった
                return !!0;
            }
            chomp $identify_output;
            return (lc $identify_output) eq $format->{name};
        }

        sub _get_extension_from_file_path {
            my ($file_path) = @_;
            croak 'argument $file_path must be defined.' if not defined $file_path;
            my $extension_finder_regex = qr/\.([0-9a-zA-Z]+)$/;
            $file_path =~ $extension_finder_regex;

            if ($1) {
                return $1;
            }
            return '';
        }
    }
    1;
