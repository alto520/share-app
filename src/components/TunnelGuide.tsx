import React, { useState } from "react";
import { Terminal, Copy, Check, Info, Shield, Zap, Laptop, Monitor, AlertCircle, RefreshCw } from "lucide-react";

export default function TunnelGuide() {
  const [os, setOs] = useState<"win" | "mac">("win");
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = {
    win: [
      {
        title: "① 安装组件依赖 (解决 'tsx' 报错)",
        desc: "解压 ZIP 安装包后，首先在文件夹路径打开 PowerShell 终端。您遇到的错误是因为没有先拉取项目依赖包。运行下方命令，它将会下载所有必要的运行环境 (包括 tsx 等运行工具) 👇",
        cmd: "npm install",
        lang: "PowerShell"
      },
      {
        title: "② 启动本地后台服务",
        desc: "依赖安装完毕后，再次在 PowerShell 运行下方命令。这将在您的本机 3000 端口启动具有高速图床能力的服务器 👇",
        cmd: "npm run dev",
        lang: "PowerShell"
      },
      {
        title: "③ 安装 Cloudflare 免费穿透客户端",
        desc: "如果您本地没有 cloudflared 客户端，可以在 PowerShell 运行此包管理命令进行全局免密秒装 👇",
        cmd: "winget install Cloudflare.cloudflared",
        lang: "PowerShell"
      },
      {
        title: "④ 建立零费用极速公网安全通道",
        desc: "安装完成后，开启一个新的 PowerShell 终端窗口并运行此穿透命令。这将会自动建立高强度加密的长连通道”，并分配一个对客公网链接 (类似 xxxx.trycloudflare.com) 👇",
        cmd: "cloudflared tunnel --url http://localhost:3000",
        lang: "PowerShell"
      }
    ],
    mac: [
      {
        title: "① 安装组件依赖 (解决 'tsx' 报错)",
        desc: "在解压后的项目根目录下打开 终端 (Terminal)。必须先安装依赖才能正常跑起整个服务。直接复制并回车 👇",
        cmd: "npm install",
        lang: "Bash"
      },
      {
        title: "② 启动本地后台服务",
        desc: "依赖获取完成后，通过下方命令，于您的 Mac 本地 3000 端口挂载多线程原图服务 👇",
        cmd: "npm run dev",
        lang: "Bash"
      },
      {
        title: "③ 在 macOS 安装 Cloudflared 客端",
        desc: "请确保已经安装 Homebrew 终端工具，然后在 Mac 键盘上拷贝此命令并安装 👇",
        cmd: "brew install cloudflare/cloudflare/cloudflared",
        lang: "Bash"
      },
      {
        title: "④ 快速打通外网通道",
        desc: "在您的 Terminal 内运行以下通道挂载命令，无需单独购买昂贵的服务器或公网IP 即可建立高速专线 👇",
        cmd: "cloudflared tunnel --url http://localhost:3000",
        lang: "Bash"
      }
    ]
  };

  return (
    <div id="tunnel-guide-container" className="bg-[#111216] border border-gray-900 rounded-2xl p-6 space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
            <Terminal size={22} id="terminal-guide-icon" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              本地一键部署与 Cloudflare Tunnel 指南
            </h3>
            <p className="text-xs text-gray-400">
              专为非公网环境打造的服务跑通指引。帮助您在 Windows 或 macOS 电脑中快速启动并完美链接世界上任一手机微信访客。
            </p>
          </div>
        </div>

        {/* OS Selectors */}
        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 self-start md:self-center">
          <button
            onClick={() => setOs("win")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              os === "win"
                ? "bg-[#1d212a] text-amber-400 border border-amber-500/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Monitor size={14} />
            <span>Windows 指南 (PowerShell)</span>
          </button>
          <button
            onClick={() => setOs("mac")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              os === "mac"
                ? "bg-[#1d212a] text-amber-400 border border-amber-500/15"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Laptop size={14} />
            <span>macOS 指南 (Terminal)</span>
          </button>
        </div>
      </div>

      {/* Warning Resolution Tip */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={16} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-300">💡 为什么会出现 'tsx is not recognized' / '无法识别 tsx' 报错？</h4>
          <p className="text-[11px] text-gray-300 leading-relaxed font-light">
            这是因为解压 ZIP 源码后，您当前的文件路径中还没有下载 node modules 核心依赖包。这是正常的！请必须在运行 <b>npm run dev</b> 之前，<b>先在终端运行一次 <code>npm install</code></b> 即可完美解决该问题！
          </p>
        </div>
      </div>

      {/* Guide Steps Layout - Side by Side or Vertical? Let's use responsive bento flex list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps[os].map((step, index) => (
          <div key={index} className="bg-gray-950/60 p-4 rounded-xl border border-gray-900 flex flex-col justify-between space-y-3 hover:border-amber-500/20 transition-all">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-gray-200 flex items-center justify-between">
                <span>{step.title}</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-900 font-mono">
                  {step.lang}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                {step.desc}
              </p>
            </div>

            <div className="relative mt-2">
              <div className="w-full bg-[#12141a] px-3.5 py-2.5 rounded-lg border border-gray-800 font-mono text-[11px] text-amber-400/95 overflow-x-auto whitespace-nowrap pr-12 select-all">
                {step.cmd}
              </div>
              <button
                onClick={() => copyText(step.cmd, `${os}-${index}`)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="复制命令"
              >
                {copied === `${os}-${index}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cloudflare Result Explanation */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs">
          <Shield size={14} />
          <span>完美对客流程提示：</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed font-light">
          当步骤 ④ 的穿透命令在您的电脑跑起后，您的终端屏幕上会飞快滚动日志，请从中找到形如 <b><code>https://xxxx.trycloudflare.com</code></b> 的临时安全公网链接。
        </p>
        <p className="text-[11px] text-gray-300 leading-relaxed font-light">
          现在，把这个 <b>trycloudflare 网址</b> 复制，填入页面上的 <b>“快速链接生成基准域名”</b>，接着生成的每一张分享卡就会通过微信秒级打开，尽享极速、无阻碍与真正的原地交付！
        </p>
      </div>

    </div>
  );
}
