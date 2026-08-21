export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "causes" | "remedy" | "types" | "tool";
}

export interface BanTypeGuide {
  key: string;
  title: string;
  japaneseTitle: string;
  severity: "高" | "中" | "軽度";
  description: string;
  symptoms: string[];
  causes: string[];
  quickFix: string;
}

export const BAN_TYPE_GUIDES: BanTypeGuide[] = [
  {
    key: "searchBan",
    title: "Search Ban",
    japaneseTitle: "検索BAN（話題・最新タブ除外）",
    severity: "高",
    description:
      "Xの検索で特定ワードを入れたとき、あなたのポストが「話題」および「最新」タブに出なくなる状態です。プロフィール自体は見えても、発見経路が塞がれます。",
    symptoms: [
      "from:ユーザー名 で検索しても自分のポストが最新タブに出ない",
      "ハッシュタグ検索結果に載らない",
      "インプレッションが急に10分の1以下へ落ちる",
    ],
    causes: [
      "短時間の大量ポストや重複ハッシュタグの連投",
      "外部自動投稿ツールによる連続ポスト",
      "スパム報告・ミュート・ブロックの短時間集中",
    ],
    quickFix:
      "24〜72時間はログイン以外の操作を止める。ポスト・いいね・リポスト・フォローを完全に休止するのが最も有効です。",
  },
  {
    key: "searchSuggestionBan",
    title: "Search Suggestion Ban",
    japaneseTitle: "検索補完BAN（検索候補除外）",
    severity: "中",
    description:
      "検索窓にIDや名前を入力しても、サジェスト候補にアカウントが出てこない状態です。完全一致でしか見つかりません。",
    symptoms: [
      "IDを入力しても予測候補に出てこない",
      "新規フォロワーが検索から見つけにくい",
      "完全一致検索でのみヒットする",
    ],
    causes: [
      "短時間の大量フォロー・フォロー解除",
      "過度なセンシティブワードやハッシュタグのプロフィール掲載",
      "安全フィルターの誤判定",
    ],
    quickFix:
      "プロフィール文のハッシュタグと外部リンクを一旦外し、48時間静観してください。",
  },
  {
    key: "ghostBan",
    title: "Ghost Ban / Thread Ban",
    japaneseTitle: "ゴーストBAN（リプライ隠蔽）",
    severity: "高",
    description:
      "他人のポストへのリプライが、フォローしていない第三者から完全に見えなくなる状態です。会話から透明化されます。",
    symptoms: [
      "相手以外の第三者に「返信が見えない」と言われる",
      "スレッドで自分のリプライだけ欠ける",
      "リプライの表示回数がほぼゼロのまま",
    ],
    causes: [
      "同一文面のリプライを短時間で複数ユーザーへ送る",
      "URL付きリプライの連投",
      "ブロック・ミュート・通報直後の返信",
    ],
    quickFix:
      "設定から不要なアプリ連携をすべて取り消し、リプライを数日停止してください。",
  },
  {
    key: "replyDeboosting",
    title: "Reply Deboosting",
    japaneseTitle: "リプライ降格（返信折りたたみ）",
    severity: "軽度",
    description:
      "リプライは存在するが、スレッド下部や「さらに表示」「攻撃的な可能性」の折りたたみへ押し込まれた状態です。",
    symptoms: [
      "常に「さらに返信を表示」の奥へ格納される",
      "攻撃的な内容を含む可能性としてワンクッション挟まれる",
      "リプライ欄の順位が極端に低い",
    ],
    causes: [
      "強い言葉遣いやネガティブ語の検知",
      "短時間の過剰なリプライ連投",
      "電話番号未認証など初期アカウントでの活発な返信",
    ],
    quickFix:
      "電話番号と2段階認証を済ませ、丁寧な文面の自然なポストを数日続けてください。",
  },
];

export const FAQ_LIST: FAQItem[] = [
  {
    id: "1",
    category: "general",
    question: "シャドウバン（Shadowban）とは何ですか？",
    answer:
      "Xが運営者に通知せず、検索非表示やリプライ隠蔽などの表示制限をかける安全フィルターです。スパムや不適切アカウントの拡散を抑える目的で自動適用されます。",
  },
  {
    id: "2",
    category: "general",
    question: "公式にシャドウバンという制度は存在しますか？",
    answer:
      "X社は「意図的なシャドウバンは行っていない」と説明しています。一方で健全性アルゴリズムや「Freedom of Speech, Not Reach」により、特定アカウントの露出（Reach）は制御されています。",
  },
  {
    id: "3",
    category: "causes",
    question: "どのような行為が原因になりますか？",
    answer:
      "1. 短時間の短文・同一文言の大量ポスト\n2. 大量のハッシュタグや外部リンクの連続投稿\n3. 短時間の大量フォロー・大量フォロー解除\n4. 同一リプライの連投や自動化ボット\n5. プロフィールや投稿のセンシティブ設定漏れ",
  },
  {
    id: "4",
    category: "remedy",
    question: "解除までどれくらいかかりますか？",
    answer:
      "最多は24〜72時間の完全放置での自動解除です。違反の重さや再発回数によっては1〜2週間かかることもあります。",
  },
  {
    id: "5",
    category: "remedy",
    question: "早く解除する具体的な対処法は？",
    answer:
      "1. 投稿の完全停止：24〜48時間はポスト・リプライ・いいね・リポストをしない\n2. 外部連携解除：設定 > セキュリティとアカウントアクセス > アプリとセッション\n3. アカウント認証：電話・メール・2段階認証\n4. センシティブ設定の見直し",
  },
  {
    id: "6",
    category: "tool",
    question: "このチェッカーの判定はどこまで正確ですか？",
    answer:
      "プロフィールの公開・鍵・凍結は公開データから実測します。検索BAN・補完BAN・ゴースト・降格はX公式が公開していないため、公開シグナルと推定、そしてX上の直接テストリンクでクロスチェックする設計です。最終確認はXの検索と第三者視点のリプライ確認が確実です。",
  },
  {
    id: "7",
    category: "tool",
    question: "Grok診断は何をしてくれますか？",
    answer:
      "チェック結果とプロフィールの公開情報（bio、フォロー比、投稿数など）をGrokが読み、原因の仮説・回復手順・再発防止を日本語で組み立てます。公式のBAN通知の代わりではなく、行動プランを出すための分析です。",
  },
];
