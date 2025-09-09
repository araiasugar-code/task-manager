#!/bin/bash

# ロールバックスクリプト
# 使用方法: ./rollback.sh

echo "🚨 緊急ロールバック開始..."

# 現在の変更を一時保存
git stash push -m "Emergency rollback stash $(date)"

# 安定版にロールバック
git checkout v1.1-stable

# ビルドとデプロイ
echo "📦 ビルド中..."
npm run build

if [ $? -eq 0 ]; then
    echo "🚀 本番デプロイ中..."
    vercel --prod
    echo "✅ ロールバック完了！"
    echo "🔗 安定版URL: https://task-manager-90mqgepgp-akihiro-arais-projects.vercel.app"
else
    echo "❌ ビルドに失敗しました"
    exit 1
fi