#!/bin/bash

echo "正在停止 Angular 开发服务器..."

# 停止所有 ng serve 进程
pkill -f "ng serve" || true

# 等待进程完全停止
sleep 2

# 检查是否还有进程在运行
if pgrep -f "ng serve" > /dev/null; then
    echo "强制停止..."
    pkill -9 -f "ng serve" || true
    sleep 1
fi

echo "✓ 服务器已停止"
