import React, { useState } from "react";
import { Terminal, Copy, Check, Info, Shield, Zap, Laptop, Monitor, AlertCircle, RefreshCw } from "lucide-react";

export default function TunnelGuide() {
  const [os, setOs] = useState<"win" | "mac">("win");
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = async (text: string, id: string) => {
    let copySuccess = false;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        copySuccess = true;
      } catch (err) {
        console.warn("navigator.clipboard fails inside guide, trying fallback...", err);
      }
    }

    if (!copySuccess) {
      // Robust textarea copy fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        copySuccess = successful;
      } catch (err) {
        console.error("Fallback copy failed inside guide:", err);
      }
      document.body.removeChild(textArea);
    }

    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const steps = {
    win: [
      {
        title: "⚡ 【推荐】双击一键运行 (极速简便)",
        desc: "在项目根目录中，双击运行【一键启动_Windows.bat】。它会自动检查您的依赖情况，自动执行 npm install 获取环境依赖，并开启 3000 本地服务。后续每次直接双击它即可，无需再手动打开 PowerShell！",
        cmd: "一键启动_Windows.bat",
        lang: "Batch Script"
      },
      {
        title: "① 手动安装组件依赖 (解决 'tsx' 报错)",
        desc: "如果您习惯手动操作：解压 ZIP 后，首先在文件夹路径打开 PowerShell。您遇到的错误是因为没有下载依赖环境。请先在这个窗口运行以下命令拉取环境 👇",
        cmd: "npm install",
        lang: "PowerShell"
      },
      {
        title: "② 手动启动本地大图服务",
        desc: "依赖安装完毕后，在同一个 PowerShell 中运行下方命令。这将在您的本机 3000 端口启动高速图床服务器 👇",
        cmd: "npm run dev",
        lang: "PowerShell"
      },
      {
        title: "③ 安装 Cloudflare 免费穿透客户端",
        desc: "如果您电脑中还没有 cloudflared，可以直接在 PowerShell 运行此微软推荐的包管理工具一键配置 👇",
        cmd: "winget install Cloudflare.cloudflared",
        lang: "PowerShell"
      },
      {
        title: "④ 快速打通并建立公网安全长连通道",
        desc: "建立完毕后，开启另一个新的 PowerShell 终端并运行穿透。这将会自动建立高强度专线，并分配一个直接秒开的外网安全链接 👇",
        cmd: "cloudflared tunnel --url http://localhost:3000",
        lang: "PowerShell"
      }
    ],
    mac: [
      {
        title: "⚡ 【推荐】双击一键运行 (需要一次性授权)",
        desc: "我们为您封装了【一键启动_macOS.command】。首次双击若遇到『无法执行/没有适当权限』提示，请见下方【macOS 权限解锁提示】解锁。随后即可直接双击自动装载依赖、一键拉起服务！",
        cmd: "双击：一键启动_macOS.command",
        lang: "Shell Script"
      },
      {
        title: "① 手动安装组件依赖 (解决 'tsx' 报错)",
        desc: "在解压后的项目根目录下打开 终端 (Terminal)。必须先装载核心依赖才能工作。复制并回车 👇",
        cmd: "npm install",
        lang: "Bash"
      },
      {
        title: "② 手动启动本地大图服务",
        desc: "由于原图采用多线程和高速切片，依赖安装后，运行下方命令挂载 3000 本机服务 👇",
        cmd: "npm run dev",
        lang: "Bash"
      },
      {
        title: "③ 在 macOS 安装 Cloudflared 穿透客户端",
        desc: "确保您的 Mac 安装了 Homebrew 包管理终端，然后在您的 Terminal 输入此命令安装 👇",
        cmd: "brew install cloudflare/cloudflare/cloudflared",
        lang: "Bash"
      },
      {
        title: "④ 极速开启对客免流量传输通道",
        desc: "大功告成！直接在 Terminal 内运行以下端口映射通道，无需购置昂贵域名和服务器，完美建立安全公网保障 👇",
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

      {os === "mac" && (
        <div className="bg-[#12141a] border border-gray-900 rounded-xl p-4 space-y-2.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-amber-500 text-xs">
            <Shield size={14} className="text-amber-500" />
            <span>🔐 macOS 权限解锁提示 (首次双击打不开的解决方法)</span>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-light">
            macOS 安全规定任何下载的 <code className="font-mono text-amber-200">.command</code> 脚本文件在双击运行时必须授权执行权限。如果双击时提示 <b>「文件由于没有适当的访问权限而无法执行」</b>，请执行以下简易修复命令：
          </p>
          <ol className="list-decimal pl-5 text-[11px] text-gray-400 space-y-1">
            <li>在项目解压文件夹中右键 — 开启 <b>终端 (Terminal)</b> 窗口；</li>
            <li>拷贝并运行下方这行极速授权口令，即可永久开启双击速起功能：</li>
          </ol>
          <div className="relative mt-2">
            <div className="w-full bg-gray-950 px-3.5 py-2.5 rounded-lg border border-gray-800 font-mono text-[11px] text-amber-300 overflow-x-auto whitespace-nowrap pr-12 select-all">
              chmod +x 一键启动_macOS.command
            </div>
            <button
              onClick={() => copyText("chmod +x 一键启动_macOS.command", "chmod-cap")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[#12141a] hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="复制解锁代码"
            >
              {copied === "chmod-cap" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

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
