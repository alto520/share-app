#!/bin/bash
# ----------------------------------------------------
# 极速原图无损交付系统 - macOS 一键启动器
# ----------------------------------------------------

# Change working directory to the directory where this script sits
cd "$(dirname "$0")"

clear
echo "===================================================="
echo "    极速原图无损交付系统 - 一键启动器 (macOS)"
echo "===================================================="
echo

# 1. Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[错误] 未检测到 Node.js 环境！"
    echo "请先前往 https://nodejs.org 下载安装适合 macOS 的 Node.js (推荐 LTS 版本)"
    echo "安装完成后，再次双击运行此启动脚本。"
    echo
    exit 1
fi

# 2. Check node_modules and run npm install
if [ ! -d "node_modules" ]; then
    echo "[提示] 检测到首次运行，正在为您全自动拉取依赖库 (npm install)..."
    echo
    npm install
    if [ $? -ne 0 ]; then
        echo
        echo "[错误] 依赖库配置失败，请检查网络后重试！"
        exit 1
    fi
    echo
    echo "[成功] 依赖运行库配置完毕！"
fi

# 3. Boot server
echo "[启动] 正在唤醒大图无损后台服务..."
echo "本地极速访问地址: http://localhost:3000"
echo "极低功耗运行中，请保持本终端窗口开启 (关闭本窗口即停止服务)"
echo "===================================================="
echo
npm run dev
