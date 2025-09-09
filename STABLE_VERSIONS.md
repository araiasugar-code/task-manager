# 安定版バージョン管理

## 現在の安定版
- **バージョン**: v1.1-stable
- **Git タグ**: v1.1-stable
- **コミット**: 7da81e2
- **デプロイURL**: https://task-manager-90mqgepgp-akihiro-arais-projects.vercel.app
- **日付**: 2025-09-09
- **説明**: 稼働履歴集計修正版、デバッグログ強化、UI改善

## ロールバック手順

### 1. Gitでコードをロールバック
```bash
git checkout v1.1-stable
```

### 2. 本番環境にデプロイ
```bash
npm run build
vercel --prod
```

### 3. 確認URL
- 現在の安定版: https://task-manager-90mqgepgp-akihiro-arais-projects.vercel.app

## 履歴
| バージョン | タグ | URL | 日付 | 説明 |
|-----------|------|-----|------|------|
| v1.1-stable | v1.1-stable | https://task-manager-90mqgepgp-akihiro-arais-projects.vercel.app | 2025-09-09 | 稼働履歴集計修正版 |
