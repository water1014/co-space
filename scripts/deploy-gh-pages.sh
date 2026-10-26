#!/usr/bin/env bash
# 一键发布到 gh-pages 分支（当前 Pages 的实际来源）。
# 依赖：已登录 GitHub 且 git 能推到 origin（gh auth login 后跑一次 gh auth setup-git）。
set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH="gh-pages"
REMOTE_URL="$(git remote get-url origin)"

echo "→ 构建"
pnpm build

echo "→ 提交静态产物"
cd dist
rm -rf .git
git init -q -b "$BRANCH"
git add -A
git commit -qm "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "$REMOTE_URL" "$BRANCH"
cd ..
rm -rf dist/.git

echo "→ 已推送 $BRANCH，Pages 会在一分钟内重建"
echo "  https://$(git remote get-url origin | sed -E 's#https://github.com/([^/]+)/.*#\1#').github.io/$(basename "$(pwd)")/"
