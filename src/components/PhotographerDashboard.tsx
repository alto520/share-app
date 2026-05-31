import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, Plus, Trash2, Link as LinkIcon, ToggleLeft, ToggleRight, 
  Upload, Sparkles, FolderKanban, HardDrive, Eye, Calendar, Lock, 
  Unlock, Check, Copy, Loader2, Info, Users, ExternalLink, RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Album, SystemStatus } from "../types";
import TunnelGuide from "./TunnelGuide";

interface PhotographerDashboardProps {
  onPreviewAlbum: (id: string) => void;
}

export default function PhotographerDashboard({ onPreviewAlbum }: PhotographerDashboardProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Album Form State
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // File Upload State
  const [uploadingAlbumId, setUploadingAlbumId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Tunnel Domain Config
  const [customTunnelDomain, setCustomTunnelDomain] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // 1. Fetch system metrics
      const statusRes = await fetch("/api/system/status");
      if (statusRes.ok) {
        const metrics = await statusRes.json();
        setSystemStatus(metrics);
      }

      // 2. Fetch all albums
      const albumsRes = await fetch("/api/albums");
      if (albumsRes.ok) {
        const data = await albumsRes.json();
        setAlbums(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Pre-fill default domain field with current host
    setCustomTunnelDomain(window.location.origin);
  }, []);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, clientName, description, password }),
      });

      if (res.ok) {
        // Reset form
        setTitle("");
        setClientName("");
        setDescription("");
        setPassword("");
        // Reload list
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
      alert("创建相册失败，请重启后台服务试一试");
    }
  };

  // Real-time AI generated luxury caption using Gemini model
  const handleAIGeneratedDescription = async () => {
    if (!title.trim()) {
      alert("请先填写项目名称以供 AI 进行光影文案创作");
      return;
    }
    setGeneratingDescription(true);
    try {
      const res = await fetch("/api/system/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, clientName }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setDescription(data.text);
      } else {
        alert(data.error || "智能文案创作失败，请确认您已在 Secrets 面板中配置了有效的 GEMINI_API_KEY。");
      }
    } catch (err) {
      console.error(err);
      alert("连接 AI 节点失败，请确保网络通畅。");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleToggleLinkActive = async (id: string) => {
    try {
      const res = await fetch(`/api/albums/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        setAlbums(prev => prev.map(a => {
          if (a.id === id) {
            return { ...a, isActive: !a.isActive };
          }
          return a;
        }));
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm("确定要删除此相册吗？此操作将永久抹除其下所有无损原图照片文件！该操作不可逆。")) return;

    try {
      const res = await fetch(`/api/albums/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerUploadClick = (albumId: string) => {
    setUploadingAlbumId(albumId);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const albumId = uploadingAlbumId;
    if (!files || files.length === 0 || !albumId) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("photos", files[i]);
    }

    setUploadProgress(10); // Start artificial warm up

    try {
      // Create XMLHttp Request to fetch authentic granular upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90) + 10;
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setTimeout(() => {
            setUploadingAlbumId(null);
            setUploadProgress(0);
            fetchDashboardData(true);
          }, 1000);
        } else {
          alert("上传失败，可能文件超出了单次限制。");
          setUploadingAlbumId(null);
          setUploadProgress(0);
        }
      });

      xhr.addEventListener("error", () => {
        alert("网络传输中断，已暂停原画上传通道，请检查您的连通性。");
        setUploadingAlbumId(null);
        setUploadProgress(0);
      });

      xhr.open("POST", `/api/albums/${albumId}/upload`);
      xhr.send(formData);

    } catch (err) {
      console.error("Upload error", err);
      setUploadingAlbumId(null);
      setUploadProgress(0);
    }
  };

  const handleCopyLink = (albumId: string) => {
    // Trim backslash
    const base = customTunnelDomain.endsWith("/") ? customTunnelDomain.slice(0, -1) : customTunnelDomain;
    const link = `${base}?album=${albumId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(albumId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getDiskUsageColor = (emb: number) => {
    if (emb > 5000) return "text-red-400";
    if (emb > 2000) return "text-amber-400";
    return "text-emerald-400";
  };

  if (loading) {
    return (
      <div id="loading" className="min-h-screen flex flex-col justify-center items-center bg-[#0b0c0e]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-sm font-mono tracking-widest text-gray-400">LOADING SHUTTER DASHBOARD...</p>
      </div>
    );
  }

  return (
    <div id="photographer-dashboard" className="min-h-screen bg-[#0b0c0e] py-10 px-4 md:px-8 selection:bg-amber-500/30">
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header branding */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase font-mono font-bold rounded tracking-widest">PHOTOGRAPHER CONTROL PANEL</span>
              {refreshing && <Loader2 className="animate-spin text-gray-500" size={14} />}
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Camera className="text-amber-500" size={28} /> Aperture Share 相册管理端
            </h1>
            <p className="text-xs text-gray-400">
              专为独立摄影师打造的零成本、私密、原图无损在线交付与打包下载解决方案
            </p>
          </div>
          
          <button 
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#12141a] border border-gray-800 rounded-xl hover:border-amber-500/30 text-xs font-semibold tracking-wider text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>刷新数据</span>
          </button>
        </div>

        {/* Bento Statistics Grid */}
        {systemStatus && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111216] border border-gray-900 rounded-2xl p-5 relative overflow-hidden group">
              <div className="text-gray-500 text-xs font-bold font-mono tracking-wider mb-2">ACTIVE CHANNELS / 激活链接</div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                {systemStatus.activeAlbumsCount}
                <span className="text-xs text-gray-500 font-normal">个活跃</span>
              </div>
              <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg">
                <LinkIcon size={14} />
              </div>
            </div>

            <div className="bg-[#111216] border border-gray-900 rounded-2xl p-5 relative overflow-hidden">
              <div className="text-gray-500 text-xs font-bold font-mono tracking-wider mb-2">TOTAL ALBUMS / 相册总数</div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                {systemStatus.totalAlbumsCount}
                <span className="text-xs text-gray-500 font-normal">组客照</span>
              </div>
              <div className="absolute top-4 right-4 bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg">
                <FolderKanban size={14} />
              </div>
            </div>

            <div className="bg-[#111216] border border-gray-900 rounded-2xl p-5 relative overflow-hidden">
              <div className="text-gray-500 text-xs font-bold font-mono tracking-wider mb-2">STORED PHOTOS / 原图原件</div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                {systemStatus.totalPhotosCount}
                <span className="text-xs text-gray-500 font-normal">张原图</span>
              </div>
              <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-500 p-1.5 rounded-lg">
                <Users size={14} />
              </div>
            </div>

            <div className="bg-[#111216] border border-gray-900 rounded-2xl p-5 relative overflow-hidden">
              <div className="text-gray-500 text-xs font-bold font-mono tracking-wider mb-2">LOCAL DISK SPENT / 空间占用</div>
              <div className="text-2xl font-black font-mono flex items-baseline gap-1">
                <span className={`font-black ${getDiskUsageColor(systemStatus.diskUsageMB)}`}>
                  {systemStatus.diskUsageMB >= 1024 
                    ? `${(systemStatus.diskUsageMB / 1024).toFixed(2)} GB` 
                    : `${systemStatus.diskUsageMB} MB`}
                </span>
              </div>
              <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-400 p-1.5 rounded-lg">
                <HardDrive size={14} />
              </div>
            </div>
          </div>
        )}

        {/* Cloudflare Tunnel Tutorial Block */}
        <TunnelGuide />

        {/* Dynamic Dual columns: Create new, List Existing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Creator Core Form */}
          <div className="lg:col-span-5 bg-[#111216] border border-gray-900 p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-900">
              <Plus className="text-amber-500" size={18} />
              <h2 className="font-bold text-base text-white">新建首发交付相册</h2>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider">项目名称 / Album Title *</label>
                <input 
                  type="text" 
                  placeholder="如：2026夏日新中式户外人像写真" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161a22] border border-gray-800 focus:outline-none focus:border-amber-500/70 rounded-xl text-white text-xs" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider">主图客户名称 / Client Ref Name</label>
                <input 
                  type="text" 
                  placeholder="如：张先生 & 李女士" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161a22] border border-gray-800 focus:outline-none focus:border-amber-500/70 rounded-xl text-white text-xs" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">相册卷首致词 / Album Intro Paragraph</label>
                  <button
                    type="button"
                    onClick={handleAIGeneratedDescription}
                    disabled={generatingDescription}
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-bold tracking-tight bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 cursor-pointer disabled:opacity-50"
                  >
                    {generatingDescription ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        <span>正在光影创作...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        <span>AI 智能创作卷首语</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  placeholder="用一小段写意高级的文案升华交付品质。支持手动撰写，或者在输入上方项目名称后点击右侧 AI 帮您一键匹配温润的卷首情绪描述..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161a22] border border-gray-800 focus:outline-none focus:border-amber-500/70 rounded-xl text-white text-xs leading-relaxed resize-none" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">相册访问加固密码 / Protected Code</label>
                  <span className="text-[10px] text-gray-500">(可选，留空则客户免密直接浏览)</span>
                </div>
                <input 
                  type="password" 
                  placeholder="留空即表示该相册公开" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#161a22] border border-gray-800 focus:outline-none focus:border-amber-500/70 rounded-xl text-white text-xs font-mono" 
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-[#0b0c0e] font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5 shadow-lg"
              >
                <Plus size={14} />
                <span>立即创建并开启通道</span>
              </button>
            </form>
          </div>

          {/* List Dashboard */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tunnel host name configurator */}
            <div className="bg-[#111216] border border-gray-900 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-sm">
                <div className="text-xs font-bold text-gray-300">快速链接生成基准域名</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  请填写 Cloudflare 通道终端为您提供的那个随机域名（试运行），如 <b>{"https://xxxx.trycloudflare.com"}</b>。我们将用此域名为您自动拼装给客户的一键分享卡。
                </p>
              </div>
              <input
                type="url"
                value={customTunnelDomain}
                onChange={(e) => setCustomTunnelDomain(e.target.value)}
                placeholder="https://your-custom-subdomain.trycloudflare.com"
                className="w-full md:w-80 px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500 text-xs font-mono text-white text-center md:text-left"
              />
            </div>

            {/* Existing shares */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-sm text-gray-300">已经激活的交付系列 ({albums.length})</h3>
                <span className="text-[10px] text-gray-600 font-mono">CLIENT PORTFOLIOS</span>
              </div>

              {albums.length === 0 ? (
                <div className="text-center py-16 bg-[#111216] border border-gray-900 rounded-2xl">
                  <FolderKanban className="mx-auto text-gray-700 mb-2" size={32} />
                  <p className="text-xs text-gray-400">目前没有交付项目</p>
                  <p className="text-[11px] text-gray-600 mt-1">请在左侧表单中输入信息以开启摄影师原图交付流程。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {albums.map((album) => (
                    <motion.div
                      key={album.id}
                      layout
                      className="bg-[#111216] border border-gray-900 rounded-2xl p-5 hover:border-gray-800 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-gray-900/60 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-white">
                              {album.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800 font-mono">
                              CLIENT ID: {album.id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users size={12} /> 交付客户: {album.clientName || "通用客户"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> 创建时间: {new Date(album.createdDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="text-amber-500 font-mono font-semibold">
                              已浏览: {album.visitCount || 0} 次
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle control link */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className={`text-[10px] font-bold ${album.isActive ? "text-emerald-500" : "text-gray-500"}`}>
                            {album.isActive ? "在线通道激活" : "通道已关闭"}
                          </span>
                          <button
                            onClick={() => handleToggleLinkActive(album.id)}
                            className="text-gray-400 hover:text-white cursor-pointer transition-all shrink-0"
                            title={album.isActive ? "关闭分享链接" : "重开分享链接"}
                          >
                            {album.isActive ? (
                              <ToggleRight className="text-emerald-500" size={28} />
                            ) : (
                              <ToggleLeft className="text-gray-600" size={28} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Photo status check, Upload Progress and interactive upload zone */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-8 space-y-1.5">
                          <div className="text-xs text-gray-400 font-medium">
                            文件状态: <span className="text-white font-bold">{album.photos.length}</span> 张无损摄影物理原件
                          </div>
                          {album.photos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pt-1">
                              {album.photos.slice(0, 8).map((photo, pIdx) => (
                                <span 
                                  key={photo.id}
                                  className="text-[10px] font-mono text-gray-400 bg-gray-950 px-2 py-1 rounded border border-gray-900/80 truncate max-w-[120px]"
                                  title={photo.originalName}
                                >
                                  {photo.originalName}
                                </span>
                              ))}
                              {album.photos.length > 8 && (
                                <span className="text-[10px] font-mono text-amber-500 font-extrabold bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                                  +{album.photos.length - 8}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-4 justify-self-stretch sm:justify-self-end flex flex-col items-stretch gap-2">
                          {uploadingAlbumId === album.id ? (
                            <div className="w-full space-y-1">
                              <div className="flex justify-between text-[10px] text-amber-500 font-mono">
                                <span>正在极速同步大图...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-950 rounded-full h-1">
                                <div 
                                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => triggerUploadClick(album.id)}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1c1f26] hover:bg-[#252a34] border border-gray-800 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer w-full text-center"
                            >
                              <Upload size={13} />
                              <span>上传无损原图</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Sharing & Preview block */}
                      <div className="flex items-center justify-between gap-3 bg-gray-950 p-2.5 rounded-xl border border-gray-900/50">
                        {/* Password indication */}
                        <div className="flex items-center gap-2 px-1.5 py-1 text-[10px] font-mono shrink-0">
                          {album.password ? (
                            <span className="flex items-center gap-1 text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10" title="此分享受密码保护">
                              <Lock size={10} /> 密码保护: ****
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500 font-medium">
                              <Unlock size={10} /> 公开分享
                            </span>
                          )}
                        </div>

                        {/* Actions block */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onPreviewAlbum(album.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-850 rounded-lg text-[11px] text-gray-350 hover:text-white transition-all cursor-pointer border border-gray-800"
                            title="模拟终端客户体验视角"
                          >
                            <Eye size={12} />
                            <span>预览选片端</span>
                          </button>

                          <button
                            onClick={() => handleCopyLink(album.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-black font-extrabold hover:bg-amber-400 rounded-lg text-[11px] transition-all cursor-pointer"
                          >
                            {copiedLink === album.id ? (
                              <>
                                <Check size={12} />
                                <span>已复制口令</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>复制分享链接</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteAlbum(album.id)}
                            className="p-2 bg-red-950/25 border border-red-900/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="抹除此交付通道"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
