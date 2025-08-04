# campbbs

## 概要
- ゲーム用の専用陣営掲示板。外交メッセージ機能付き。
- 画像投稿も可能で、見た目はXライクに仕上げ。

## 主要なライブラリ・技術スタック

| 区分         | パッケージ・技術名                | バージョン    | コピーライト |
|:-------------|:----------------------------------|:-------------|:-------------|
| フロントエンド | React                            | 18.3.1      | © Facebook, Inc. and its affiliates |
|               | Vite                             | 5.4.1       | © Evan You |
|               | Redux Toolkit                    | 2.2.7       | © Redux Team |
|               | Tailwind CSS                     | 3.4.10      | © Tailwind Labs Inc. |
|               | axios                            | 1.7.7       | © Matt Zabriskie |
| バックエンド   | Perl CGI                         | 5.26.3   | © Larry Wall et al. |
| 開発支援       | Node.js                          | 20.14.0   | © OpenJS Foundation and other contributors |
|               | ESLint                           | 9.9.0       | © OpenJS Foundation and other contributors |
|               | Prettier                         | 3.3.3       | © James Long and contributors |
|               | Husky                            | 9.1.6       | © Typicode |

## 起動方法

### フロントエンド

```bash
npm install
npm run dev
```
- ブラウザで http://localhost:5173 へアクセス

### バックエンド

- Perl CGIを動作させるWebサーバに `server/` ディレクトリを配置
```bash
perl server_perl.cgi
```
※ http://localhost:8080 が起動

## 主な機能

- メッセージの投稿(テキスト・画像対応)
- 外交メッセージの投稿
- メッセージの管理(編集、削除、固定)
- 画像の整合性チェック

## 補足
- ゲーム中はnijihakobbs.cgiからアクセスし、所属陣営であればそのログを取得して掲示板を表示
- ゲーム終了後はnijihakobbs_log.cgiからアクセスし、第三者含めてログの閲覧のみが可能

## Contributors
- @patatan168
- @korarusentoraru