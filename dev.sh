#!/bin/bash

# 定义颜色变量（使用 -e 选项的 echo 时）
PINK=$'\033[33m'
GREEN=$'\033[32m'
NC=$'\033[0m'

(cd renderer && npm run serve | while read -r line; do echo -e "${PINK}[renderer]${NC} $line"; done) &

(cd service && npm run serve | while read -r line; do echo -e "${GREEN}[service]${NC} $line"; done) &

wait