import React, { useState } from "react";
import { Terminal, Copy, Check, Info, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function TunnelGuide() {
  const [os, setOs] = useState<"mac" | "win" | "linux">("mac");
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const commands = {
    mac: {
      install: "brew install cloudflare/cloudflare/cloudflared",
      run: "cloudflared tunnel --url http://localhost:3000",
    },
    win: {
      install: "winget install Cloudflare.cloudflared",
      run: "cloudflared.exe tunnel --url http://localhost:3000",
    },
    linux: {
      install: "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared",
      run: "./cloudflared tunnel --url http://localhost:3000",
    },
  };

  return (
    <div id="tunnel-guide-container" className="bg-[#12141a]/90 backdrop-blur-md rounded-2xl border border-gray-800/80 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
          <Terminal size={22} id="terminal-guide-icon" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Cloudflare Tunnel 内网穿透配置指引</h3>
          <p className="text-xs text-gray-400">零费用、零配置、无公网IP，安全稳定发布您的相册</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#161a22] p-4 rounded-xl border border-gray-800/40">
          <div className="flex items-center gap-2 mb-2 text-amber-500 font-medium text-sm">
            <Zap size={15} /> 1. 原理简述
          </div>
          <p className="text-xs leading-relaxed text-gray-400">
            在您的本地服务器上运行本程序，通过 Cloudflare 免费隧道代理，将本地的 <b>3000</b> 端口加密映射至公网。
          </p>
        </div>
        <div className="bg-[#161a22] p-4 rounded-xl border border-gray-800/40">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-medium text-sm">
            <Shield size={15} /> 2. 极致安全
          </div>
          <p className="text-xs leading-relaxed text-gray-400">
            不用暴露家庭或工作室IP，防止DDoS攻击。所有到相册和原图下载的请求均经过高级SSL证书加密。
          </p>
        </div>
        <div className="bg-[#161a22] p-4 rounded-xl border border-gray-800/40">
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-medium text-sm">
            <Info size={15} /> 3. 客户无感
          </div>
          <p className="text-xs leading-relaxed text-gray-400">
            您的客户<b>无需安装任何VPN或软件</b>，直接双击您发送的私密链接，即可通过浏览器极速预览、批量下载。
          </p>
        </div>
      </div>

      {/* OS Selector Tabs */}
      <div className="flex gap-2 border-b border-gray-800/60 pb-3 mb-4">
        {(["mac", "win", "linux"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setOs(item)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              os === item
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {item === "mac" && "macOS (Homebrew)"}
            {item === "win" && "Windows"}
            {item === "linux" && "Linux / Ubuntu"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Step 1 Command */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-gray-300">步骤一：安装 Cloudflared 客户端</span>
          </div>
          <div className="flex items-center bg-gray-950 px-4 py-3 rounded-xl border border-gray-800 font-mono text-xs text-amber-400/90 relative group">
            <span className="truncate select-all">{commands[os].install}</span>
            <button
              onClick={() => copyText(commands[os].install, "install")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer opacity-80 hover:opacity-100"
            >
              {copied === "install" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Step 2 Command */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-gray-300">步骤二：启动免登录临时隧道 (极其简便)</span>
            <span className="text-[10px] text-gray-500 font-mono">绑定本地 3000 端口</span>
          </div>
          <div className="flex items-center bg-gray-950 px-4 py-3 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400/90 relative group">
            <span className="truncate select-all">{commands[os].run}</span>
            <button
              onClick={() => copyText(commands[os].run, "run")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer opacity-80 hover:opacity-100"
            >
              {copied === "run" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-blue-950/10 border border-blue-900/20 rounded-xl p-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <b>提示</b>：启动隧道后，终端中会显示一个类似 <code className="text-blue-300 px-1 py-0.5 bg-gray-900/60 rounded">https://xxxx.trycloudflare.com</code> 的随机域名。这个域名就是您的专属传输总线地址。如果您是租用固定域名，亦可绑定固定 CNAME。在下方相册中，配置该域名即可直接生成一键分享链接！
        </p>
      </div>
    </div>
  );
}
