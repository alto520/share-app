import React, { useState, useEffect } from "react";
import { Camera, Download, Lock, X, ArrowLeft, ArrowRight, Loader2, Grid, ZoomIn, Check, AlertTriangle, FileArchive } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";

interface Photo {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

interface ClientAlbum {
  id: string;
  title: string;
  clientName: string;
  description: string;
  isPasswordProtected: boolean;
  createdDate: string;
  photos: Photo[];
}

interface ClientAlbumViewProps {
  albumId: string;
}

export default function ClientAlbumView({ albumId }: ClientAlbumViewProps) {
  const [password, setPassword] = useState("");
  const [album, setAlbum] = useState<ClientAlbum | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  
  // Lightbox state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Download ZIP queue state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    total: number;
    current: number;
    currentName: string;
    stage: 'downloading' | 'compressing' | 'saving' | 'idle';
    percent: number;
  }>({
    total: 0,
    current: 0,
    currentName: "",
    stage: 'idle',
    percent: 0,
  });

  const fetchAlbumData = async (pwdAttempt?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pwd = pwdAttempt || password;
      const headers: Record<string, string> = {};
      if (pwd) {
        headers["x-album-password"] = pwd;
      }

      const res = await fetch(`/api/client/albums/${albumId}?password=${encodeURIComponent(pwd)}`, {
        headers
      });

      if (res.status === 401) {
        setIsAuthRequired(true);
        setAlbum(null);
      } else if (res.status === 403) {
        const data = await res.json();
        setError(data.error || "分享链接已被关闭");
        setAlbum(null);
      } else if (!res.ok) {
        setError("相册加载失败，请检查连通性");
        setAlbum(null);
      } else {
        const data = await res.json();
        setAlbum(data);
        setIsAuthRequired(false);
        if (pwd) {
          // Cache validated password locally for smooth refreshes
          sessionStorage.setItem(`album_pwd_${albumId}`, pwd);
        }
      }
    } catch (err) {
      console.error(err);
      setError("连接本地服务器失败，请确保程序正在运行且未被阻止。");
    } finally {
      setLoading(false);
      setSubmittingPassword(false);
    }
  };

  useEffect(() => {
    // Attempt auto-login if password cached in sessionStorage
    const cached = sessionStorage.getItem(`album_pwd_${albumId}`);
    if (cached) {
      setPassword(cached);
      fetchAlbumData(cached);
    } else {
      fetchAlbumData();
    }
  }, [albumId]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmittingPassword(true);
    fetchAlbumData(password);
  };

  const getPhotoUrl = (photoId: string, download = false) => {
    const pwd = password || sessionStorage.getItem(`album_pwd_${albumId}`) || "";
    return `/api/client/albums/${albumId}/photos/${photoId}?pwd=${encodeURIComponent(pwd)}${download ? "&download=true" : ""}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // High stability, queue-style client-side downloader & zip-compiler
  const handleBatchDownload = async () => {
    if (!album || album.photos.length === 0 || isZipping) return;

    setIsZipping(true);
    const photosToDownload = album.photos;
    const zip = new JSZip();
    const pwd = password || sessionStorage.getItem(`album_pwd_${albumId}`) || "";

    setZipProgress({
      total: photosToDownload.length,
      current: 0,
      currentName: "",
      stage: 'downloading',
      percent: 0,
    });

    try {
      for (let i = 0; i < photosToDownload.length; i++) {
        const photo = photosToDownload[i];
        setZipProgress(prev => ({
          ...prev,
          current: i + 1,
          currentName: photo.originalName,
          percent: Math.round((i / photosToDownload.length) * 100),
        }));

        // Fetch original photo bytes
        const fileUrl = `/api/client/albums/${albumId}/photos/${photo.id}?pwd=${encodeURIComponent(pwd)}&download=true`;
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error(`无法获取文件: ${photo.originalName}`);
        
        const blob = await fileRes.blob();
        // Add original uncompressed file to ZIP
        zip.file(photo.originalName, blob);
      }

      // Stage 2: client-side memory compression to keep zero server CPU loads
      setZipProgress(prev => ({
        ...prev,
        stage: 'compressing',
        currentName: "正在打包无损原图...",
        percent: 100,
      }));

      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        // dynamic compression updates
        setZipProgress(prev => ({
          ...prev,
          percent: Math.round(metadata.percent),
        }));
      });

      // Stage 3: trigger client browser download
      setZipProgress(prev => ({
        ...prev,
        stage: 'saving',
        currentName: "配置完成，即将保存至本地...",
      }));

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${album.title || "相册"}_原图打包_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (err) {
      console.error("ZIP Generation failed", err);
      alert("打包下载失败。这可能与网络瞬时中断有关，请重试或单独点击原图下载。");
    } finally {
      setIsZipping(false);
      setZipProgress({
        total: 0,
        current: 0,
        currentName: "",
        stage: 'idle',
        percent: 0,
      });
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!album || selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === 0 ? album.photos.length - 1 : selectedPhotoIndex - 1
    );
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!album || selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === album.photos.length - 1 ? 0 : selectedPhotoIndex + 1
    );
  };

  // Listen to keyboard escapes and arrows for maximum UX polish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") setSelectedPhotoIndex(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex]);

  if (loading) {
    return (
      <div id="loading-spinner" className="min-h-screen flex flex-col justify-center items-center bg-[#0b0c0e]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-sm font-mono tracking-widest text-gray-400">CONNECTING TO SHUTTER GATEWAY...</p>
      </div>
    );
  }

  // Password Input View
  if (isAuthRequired) {
    return (
      <div id="password-auth-container" className="min-h-screen flex justify-center items-center bg-[#0b0c0e] px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111216] border border-gray-800/80 p-8 rounded-2xl shadow-2xl text-center"
        >
          <div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex justify-center items-center mb-6">
            <Lock size={22} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">此相册受密码保护</h2>
          <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
            摄影师设置了访问密码。请输入密码以浏览无损照片并获得打包下载权限。
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="密匙 / Code Access"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-center tracking-widest px-4 py-3 bg-[#161a22] border border-gray-800 focus:outline-none focus:border-amber-500 rounded-xl text-white font-mono text-sm placeholder:tracking-normal transition-all"
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle size={12} /> {error === "password_required" ? "密码错误" : error}
              </p>
            )}
            <button
              type="submit"
              disabled={submittingPassword}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-[#0b0c0e] font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2"
            >
              {submittingPassword ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>DECRYPTING...</span>
                </>
              ) : (
                <span>验证并进入</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Error View (Link deactivated etc.)
  if (error || !album) {
    return (
      <div id="error-view-container" className="min-h-screen flex justify-center items-center bg-[#0b0c0e] px-4">
        <div className="w-full max-w-sm text-center bg-[#111216] p-8 rounded-2xl border border-gray-800">
          <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex justify-center items-center mb-4">
            <X size={24} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">获取相册失败</h2>
          <p className="text-xs leading-relaxed text-gray-400 mb-6">
            {error || "未知错误。请检查链接是否完整，或获取摄影师最新分享配置。"}
          </p>
          <button
            onClick={() => fetchAlbumData()}
            className="px-6 py-2 bg-gray-900 border border-gray-800 text-xs text-white uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const activePhotoObj = selectedPhotoIndex !== null ? album.photos[selectedPhotoIndex] : null;

  return (
    <div id="client-album-layout" className="min-h-screen bg-[#0b0c0e] flex flex-col selection:bg-amber-500/30">
      
      {/* Immersive Dark Banner Hero */}
      <div className="relative border-b border-gray-900 overflow-hidden bg-gradient-to-b from-[#111318] to-[#0b0c0e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_bottom,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-60" />
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-500 tracking-wider">
              <Camera size={14} />
              <span>DELIVERY SESSION ID: {album.id}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none">
              {album.title}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              客户专属交付: <span className="text-gray-300 font-semibold">{album.clientName}</span> ✨ 相册创建日期: {new Date(album.createdDate).toLocaleDateString()}
            </p>
            {album.description && (
              <p className="text-sm text-gray-400 font-light leading-relaxed pt-2 border-t border-gray-800/40">
                {album.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {album.photos.length > 0 && (
              <button
                onClick={handleBatchDownload}
                disabled={isZipping}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-500/50 text-[#0b0c0e] px-6 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                {isZipping ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>打包进度 {zipProgress.percent}%</span>
                  </>
                ) : (
                  <>
                    <FileArchive size={14} />
                    <span>一键批量打包下载原图 ({album.photos.length}张)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Download Loader Banner */}
      <AnimatePresence>
        {isZipping && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500/10 border-b border-amber-500/20 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg animate-pulse">
                  <Loader2 className="animate-spin" size={16} />
                </div>
                <div className="text-xs">
                  <div className="text-gray-400 font-mono font-medium">
                    {zipProgress.stage === 'downloading' && `正在拉取无损原图: [${zipProgress.current}/${zipProgress.total}]`}
                    {zipProgress.stage === 'compressing' && "正在生成 ZIP 压缩包 (极速无损打包中)..."}
                    {zipProgress.stage === 'saving' && "处理完毕，正在保存至浏览器下载文件夹..."}
                  </div>
                  <div className="text-white font-medium truncate max-w-sm md:max-w-md">
                    {zipProgress.currentName}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-80 flex items-center gap-3">
                <div className="flex-1 bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${zipProgress.percent}%` }}
                  />
                </div>
                <span className="text-xs text-amber-500 font-mono font-bold w-10 text-right">
                  {zipProgress.percent}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Photographic Works Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {album.photos.length === 0 ? (
          <div className="text-center py-24 bg-[#111216] border border-gray-900 rounded-2xl flex flex-col items-center justify-center">
            <Grid size={40} className="text-gray-600 mb-4" />
            <p className="text-sm text-gray-400 font-medium">暂无照片</p>
            <p className="text-xs text-gray-500 mt-2">摄影师尚未上传或保存任何原图相片至此相册。</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#111216]/50 border border-gray-900/60 p-4 rounded-xl">
              <span className="text-xs font-mono text-gray-400">TOTAL: {album.photos.length} IMAGES</span>
              <span className="text-xs text-amber-500/80 bg-amber-500/5 px-2 py-1 border border-amber-500/10 rounded font-medium">
                无损保真、不压缩原图输出
              </span>
            </div>

            {/* Premium Photo Masonry Fluid Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {album.photos.map((photo, index) => {
                const photoSrc = getPhotoUrl(photo.id);
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 4) * 0.05 }}
                    className="group flex flex-col bg-[#111216] rounded-xl overflow-hidden border border-gray-900/80 hover:border-amber-500/30 transition-all shadow-md group"
                  >
                    {/* Square Image Cover Container */}
                    <div
                      onClick={() => setSelectedPhotoIndex(index)}
                      className="aspect-square relative w-full bg-[#0a0a0d] overflow-hidden cursor-zoom-in photo-gloss flex items-center justify-center group"
                    >
                      <img
                        src={photoSrc}
                        alt={photo.originalName}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="object-cover w-full h-full transform group-hover:scale-105 transition-all duration-500 ease-out"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null; // Detach error handler to prevent infinite loop
                          img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // Clean transparent fallback
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] font-mono text-gray-200 truncate pr-4 max-w-[70%]">
                          {photo.originalName}
                        </span>
                        <div className="p-1.5 bg-white/10 rounded-lg text-white pointer-events-none">
                          <ZoomIn size={14} />
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-4 flex items-center justify-between gap-3 border-t border-gray-900">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-200 truncate" title={photo.originalName}>
                          {photo.originalName}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500 mt-1">
                          {formatBytes(photo.size)}
                        </p>
                      </div>
                      <a
                        href={getPhotoUrl(photo.id, true)}
                        className="bg-gray-900 hover:bg-amber-500 hover:text-gray-950 p-2 text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-all cursor-pointer shrink-0"
                        title="下载原图"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Premium Cinematic Lightbox Overlay */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && activePhotoObj && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            {/* Top Bar control links */}
            <div className="p-4 flex items-center justify-between text-white border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent">
              <div className="font-medium text-xs md:text-sm">
                <span className="text-amber-500 font-bold">{selectedPhotoIndex + 1}</span> / {album.photos.length} — {activePhotoObj.originalName}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getPhotoUrl(activePhotoObj.id, true)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-amber-500 hover:text-gray-950 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer"
                >
                  <Download size={13} />
                  <span>下载原图 ({formatBytes(activePhotoObj.size)})</span>
                </a>
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Middle Cinematic Zoom & Stage Panel */}
            <div className="flex-1 relative flex items-center justify-center p-4">
              {/* Left trigger */}
              <button
                onClick={handlePrev}
                className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-white/10 rounded-full text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>

              {/* Large Picture content */}
              <motion.img
                key={activePhotoObj.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                src={getPhotoUrl(activePhotoObj.id)}
                alt={activePhotoObj.originalName}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] max-w-[95vw] object-contain rounded select-none shadow-2xl border border-white/5"
                onClick={(e) => e.stopPropagation()} // retain zoom when clicked image boundary
              />

              {/* Right trigger */}
              <button
                onClick={handleNext}
                className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-white/10 rounded-full text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Bottom Photo Metadata and hotkey indicator */}
            <div className="p-6 text-center text-xs text-gray-400 bg-gradient-to-t from-black to-transparent border-t border-white/5 space-y-1">
              <p className="font-mono text-[11px]">
                SIZE: {formatBytes(activePhotoObj.size)} • UPLOADED: {new Date(activePhotoObj.uploadedAt).toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-600">
                支持键盘上/下/左/右键切换 • 按 Esc 退出预览
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fine Print Footer */}
      <footer className="border-t border-gray-900 bg-[#090a0d] py-8 text-center text-xs text-gray-500">
        <p className="tracking-wide">Powered by Aperture Share • 摄影师高速无锁交付总线</p>
      </footer>
    </div>
  );
}
