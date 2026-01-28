#!/bin/bash

# 进入项目目录
cd "$(dirname "$0")"

# 停止可能正在运行的服务器
pkill -f "ng serve" || true
sleep 2

# 在后台启动服务器，并将输出保存到日志文件
nohup npx ng serve --port 4201 --host 0.0.0.0 > ng-serve.log 2>&1 &

# 获取进程ID
PID=$!
echo "Angular 开发服务器已在后台启动！"
echo "进程 ID: $PID"
echo "日志文件: ng-serve.log"
echo ""
echo "查看日志: tail -f ng-serve.log"
echo "停止服务器: kill $PID"
echo ""
echo "等待几秒让服务器启动..."
sleep 5

# 检查服务器是否成功启动
if ps -p $PID > /dev/null; then
    echo "✓ 服务器正在运行"
    echo "访问: http://localhost:4201"
else
    echo "✗ 服务器启动失败，请查看 ng-serve.log"
fi
