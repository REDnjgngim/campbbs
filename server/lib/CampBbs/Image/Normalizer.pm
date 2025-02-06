use strict;
use warnings;

package CampBbs::Image::Normalizer {
    use Carp qw(croak);
    use File::Temp;

    our $MAGICK_CONVERT_PATH  = '/usr/bin/convert';
    our $MAGICK_IDENTIFY_PATH = '/usr/bin/identify';

    sub normalize {
        my ($input_path, $output_path) = @_;
        eval {
            if (not -f $input_path) {
                croak "input-file dose not exist. path:$input_path";
            }

            if (_icc_embedded($input_path)) {
                my $tmp_extracted_icc = File::Temp->new(SUFFIX => '.icc');
                my @extract_options   = ('-regard-warnings', $input_path, "ICC:${tmp_extracted_icc}");
                system $MAGICK_CONVERT_PATH, @extract_options
                    and croak "command {$MAGICK_CONVERT_PATH @extract_options} exit with non-zero statuscode ${?}.";
                my @normalize_options = (
                    '-regard-warnings',
                    $input_path,
                    qw(+repage -auto-orient +repage -strip -profile),
                    "ICC:${tmp_extracted_icc}",
                    $output_path
                );
                system $MAGICK_CONVERT_PATH, @normalize_options
                    and croak "command {$MAGICK_CONVERT_PATH @normalize_options} exit with non-zero statuscode ${?}.";
            } else {
                my @normalize_options = ('-regard-warnings', $input_path, qw(+repage -auto-orient +repage -strip), $output_path);
                system $MAGICK_CONVERT_PATH, @normalize_options
                    and croak "command {$MAGICK_CONVERT_PATH @normalize_options} exit with non-zero statuscode ${?}.";
            }
        };
        return $@ ? $@ : !!0;
    }

    sub _icc_embedded {
        my ($input_path) = @_;
        my @identify_command = (qw(-regard-warnings -format %[profiles] ), $input_path);
        open my $identify_stdout, '-|', $MAGICK_IDENTIFY_PATH, @identify_command
            or croak "command {$MAGICK_IDENTIFY_PATH @identify_command} failed to open pipe. error: ${!}";

        my $identified = <$identify_stdout>;
        close $identify_stdout
            or (
                $!
                ? croak "command {$MAGICK_IDENTIFY_PATH @identify_command} failed to close pipe. error:${!}"
                : croak "command {$MAGICK_IDENTIFY_PATH @identify_command} exit with non-zero statuscode ${?}."
            );

        if (defined $identified) {
            my @profiles = split ',', $identified;
            my $embedded = grep /^icc$/, @profiles;
            return $embedded ? !!1 : !!0;
        } else {
            return !!0;
        }
    }

}
__DATA__
=pod
=head1 CampBbs::Image::Normalizer
画像をノーマライズし、閲覧環境による差異・プライバシー・セキュリティなどの問題を軽減するためのモジュール。
=head2 public sub
=head3 normalize($input_path, $output_path)
$input_path にある画像ファイルをノーマライズしたものを $output_path に出力する（すでに存在するファイルは上書きされる）。
カラープロファイル以外のメタデータは削除される（回転情報が含まれる場合は削除前に画像の向きを統一する）。
戻り値:正常終了時 = False, 異常終了時 = エラーメッセージ
=cut
