@echo off
:: Set terminal title
title 极速原图交付系统 - 服务端启动器
chcp 65001 >nul
echo ====================================================
echo      极速原图无损交付系统 - 一键启动器 (Windows)
echo ====================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境！
    echo 请先前往 https://nodejs.org 下载并安装 Node.js (推荐 LTS 版本)
    echo 安装完成后，请重新双击运行此程序。
    echo.
    pause
    exit /b
)

:: 2. Check if node_modules exists, otherwise run npm install
if not exist "node_modules\" (
    echo [提示] 检测到首次运行，正在为您全自动拉取依赖运行库 (npm install)...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请检查您的网络连接并重试。
        pause
        exit /b
    )
    echo.
    echo [成功] 依赖运行库配置完毕！
)

:: 3. Run development server
echo [启动] 正在唤醒大图无损后台服务...
echo 本地极速访问地址: http://localhost:3000
echo.
echo 💡 提示: 请保持本黑色运行窗口处于开启状态，关闭本窗口代表停止服务
echo ====================================================
echo.
call npm run dev
pause
