#!/bin/bash

echo "=========================================="
echo "Angular 开发服务器启动诊断脚本"
echo "=========================================="
echo ""

# 进入项目目录
cd "$(dirname "$0")"
echo "✓ 当前目录: $(pwd)"
echo ""

# 检查 Node.js
echo "1. 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✓ Node.js 版本: $NODE_VERSION"
else
    echo "   ✗ Node.js 未安装！"
    exit 1
fi
echo ""

# 检查 npm
echo "2. 检查 npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✓ npm 版本: $NPM_VERSION"
else
    echo "   ✗ npm 未安装！"
    exit 1
fi
echo ""

# 检查 node_modules
echo "3. 检查依赖..."
if [ -d "node_modules" ]; then
    echo "   ✓ node_modules 目录存在"
else
    echo "   ✗ node_modules 不存在，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "   ✗ 依赖安装失败！"
        exit 1
    fi
fi
echo ""

# 停止可能正在运行的服务器
echo "4. 停止可能正在运行的服务器..."
pkill -f "ng serve" 2>/dev/null || true
pkill -f "node.*4201" 2>/dev/null || true
sleep 2
echo "   ✓ 已清理旧进程"
echo ""

# 检查端口占用
echo "5. 检查端口 4201..."
if lsof -Pi :4201 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ⚠ 端口 4201 被占用，正在尝试释放..."
    lsof -ti:4201 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo "   ✓ 端口 4201 可用"
echo ""

# 启动服务器
echo "6. 启动 Angular 开发服务器..."
echo "   → 端口: 4201"
echo "   → 主机: 0.0.0.0 (所有网络接口)"
echo ""
echo "=========================================="
echo "服务器正在启动，请等待编译完成..."
echo "成功后会显示: Local: http://localhost:4201/"
echo "=========================================="
echo ""

# 启动服务器
npx ng serve --port 4201 --host 0.0.0.0
