# 本番環境デプロイメントガイド

## 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `task-manager` (任意)
4. パスワード設定とリージョン選択 (Asia Pacific推奨)
5. プロジェクト作成完了まで待機

## 2. データベース設定

### 2.1 SQL実行
1. Supabaseダッシュボードの「SQL Editor」を開く
2. `database-schema.sql`の内容をコピー＆ペースト
3. 「RUN」ボタンで実行
4. テーブル作成完了を確認

### 2.2 認証設定
1. Authentication → Settings
2. 「Email Auth」を有効にする
3. 必要に応じて「Email confirmations」を設定

## 3. 環境変数設定

### 3.1 Supabase接続情報取得
1. Supabaseプロジェクト → Settings → API
2. 以下をコピー：
   - `Project URL`
   - `anon` `public` key

### 3.2 ローカル環境設定
`.env.local`を更新：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
NEXT_PUBLIC_MOCK_MODE=false
```

## 4. Gitリポジトリ設定

### 4.1 初期化とコミット
```bash
git add .
git commit -m "Initial commit - Task Manager Application"
```

### 4.2 GitHub作成
1. GitHubでNew repositoryを作成
2. Repository name: `task-manager` (任意)
3. Private/Publicを選択
4. 「Create repository」

### 4.3 リモート接続
```bash
git remote add origin https://github.com/your-username/task-manager.git
git push -u origin main
```

## 5. Vercel デプロイ

### 5.1 Vercelプロジェクト作成
1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントで連携
3. 「Import Project」→ GitHubから該当リポジトリを選択
4. プロジェクト設定：
   - Project Name: `task-manager`
   - Framework: Next.js (自動検出)
   - Root Directory: `./` (デフォルト)

### 5.2 環境変数設定
Vercelのプロジェクト設定 → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-actual-anon-key
NEXT_PUBLIC_MOCK_MODE = false
```

### 5.3 デプロイ実行
「Deploy」ボタンでデプロイ開始

## 6. 動作確認

### 6.1 基本機能テスト
1. ユーザー登録・ログイン
2. スタッフ追加
3. タスク作成・編集・削除
4. 稼働履歴表示

### 6.2 データベース確認
Supabase → Table Editorでデータが正しく保存されているか確認

## 7. 本番運用設定

### 7.1 Supabase設定
- Row Level Security (RLS) 有効化済み
- 認証設定の最適化
- バックアップ設定 (必要に応じて)

### 7.2 Vercel設定
- カスタムドメイン設定 (必要に応じて)
- Analytics有効化
- セキュリティヘッダー設定

## トラブルシューティング

### よくある問題
1. **環境変数が反映されない**
   - Vercelで再デプロイ実行
   - 環境変数のスペルミス確認

2. **データベース接続エラー**
   - Supabase URL/KEYの確認
   - RLSポリシーの確認

3. **認証エラー**
   - Supabase Auth設定確認
   - リダイレクトURL設定

### サポート
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs