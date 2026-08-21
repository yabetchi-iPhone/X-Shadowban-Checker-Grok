# X Shadowban Checker（Grok edition）

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)
![Grok](https://img.shields.io/badge/Grok-4.5-1D9BF0)
![Vercel](https://img.shields.io/badge/Vercel-Deployable-black?logo=vercel&logoColor=white)

X（旧Twitter）アカウントのシャドウバン（検索BAN・補完BAN・ゴーストBAN・リプライ降格）を公開データから判定し、**Grok** が回復プランを出すチェッカーです。

Gemini 版: [X-Shadowban-Checker](https://github.com/yabetchi-iPhone/X-Shadowban-Checker)

---

## 主な機能

### 1. 4種類のシャドウバンを個別判定
- **検索BAN** — 話題 / 最新タブの検索結果に出るか
- **検索補完BAN** — 検索サジェストにユーザー名が出るか
- **ゴーストBAN** — リプライが第三者から見えない状態か
- **リプライ降格** — 「さらに返信を表示」側へ追いやられていないか

公開プロフィールは実測（存在・凍結・鍵アカ・フォロワー数など）。検索BANなどは X が公式に出していないため、推定と「Xで確認」リンクを分けて表示します。

### 2. アカウント健全度スコア（0〜100）
- ALL CLEAR / WARNING / BAN DETECTED
- X 上での直接検索テスト（話題・最新・プロフィール）
- 結果のコピーとポスト共有

### 3. Grok による詳細診断
- リスクレベル
- 推測される原因
- ステップごとの回復プラン
- 推定復旧期間
- 再発防止の投稿テクニック

任意で最近の活動（連投、自動化ツールなど）を追記できます。

### 4. ナレッジベース & FAQ
シャドウバン4種の仕組み・原因・確認方法。キーワード検索付き FAQ。

### 5. 診断履歴
サインインすると履歴をサーバーに保存。未ログイン時はブラウザ内のみ。

---

## 技術スタック

- **アプリ**: TanStack Start, React 19, TypeScript, Vite, Tailwind CSS v4
- **AI**: xAI Grok (`grok-4.5`)
- **データ**: 公開プロフィール取得 + Better Auth（任意）+ PGLite / Postgres
- **デプロイ**: Vercel（Nitro preset）

---

## セットアップ

前提: Node.js 20 以上

```bash
git clone https://github.com/yabetchi-iPhone/X-Shadowban-Checker-Grok.git
cd X-Shadowban-Checker-Grok
npm install
cp .env.example .env
```

`.env` に xAI API キーを入れます。

```env
XAI_API_KEY=xai-...
```

キーは [xAI Console](https://console.x.ai/) で発行します。

```bash
npm run dev
```

ブラウザで `http://localhost:8080` を開きます。シャドウバン判定そのものはキーなしでも動きます。Grok 診断だけ `XAI_API_KEY` が必要です。

```bash
npm run build
```

---

## Vercel へのデプロイ

1. [Vercel](https://vercel.com/) でこのリポジトリを Import
2. Environment Variables に `XAI_API_KEY` を追加
3. Deploy

### 公開時の課金について

`XAI_API_KEY` はサーバー側だけに置かれ、ブラウザの JS には出ません。  
ただし **「診断を実行」を押した訪問者の分は、設置したキーの枠で消費** されます。判定ボタンは Grok を呼びません。

公開する場合の目安:

| 方針 | 内容 |
| --- | --- |
| 判定だけ公開 | `XAI_API_KEY` を本番に置かない |
| 診断も公開 | ログイン必須 + 回数制限を入れる |
| 自分専用 | 非公開デプロイ、またはアクセス制限 |

---

## ディレクトリ構成

```text
├── src/
│   ├── components/          # 検索バー・判定カード・Grok診断・FAQ
│   ├── lib/
│   │   ├── x-check.server.ts    # 公開データからの判定
│   │   ├── server-fns.ts        # check / diagnose (Grok)
│   │   ├── shadowban-knowledge.ts
│   │   └── auth/                # Better Auth
│   ├── routes/              # / と /login
│   └── styles.css
├── migrations/              # 認証・履歴テーブル
├── public/favicon.svg
├── public/og.jpg
└── README.md
```

---

## 免責事項

- X / X Corp. の公式サービスではありません。
- 判定は公開データとアルゴリズムの挙動からの推定です。最終確認は X の検索画面で行ってください。
- 仕様変更で結果が変わることがあります。

---

## ライセンス

[Apache License 2.0](LICENSE)
