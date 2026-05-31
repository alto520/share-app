/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Camera, RefreshCw, Undo2 } from "lucide-react";
import PhotographerDashboard from "./components/PhotographerDashboard";
import ClientAlbumView from "./components/ClientAlbumView";

export default function App() {
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null);

  // Parse URL search parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const albumQuery = params.get("album");
    if (albumQuery) {
      setCurrentAlbumId(albumQuery);
    }

    // Support back/forward navigation
    const handleLocationChange = () => {
      const p = new URLSearchParams(window.location.search);
      const aq = p.get("album");
      setCurrentAlbumId(aq);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const handlePreviewAlbum = (id: string) => {
    // Navigate preview using clean URL state
    const newUrl = `${window.location.origin}${window.location.pathname}?album=${id}`;
    window.history.pushState({ album: id }, "", newUrl);
    setCurrentAlbumId(id);
  };

  const handleBackToDashboard = () => {
    // Clear url query state
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, "", cleanUrl);
    setCurrentAlbumId(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] font-sans antialiased text-gray-100 flex flex-col justify-between">
      {currentAlbumId ? (
        <div className="relative flex-1 flex flex-col">
          {/* Photographer preview banner (if launched from local admin preview) */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-xs font-mono text-amber-500 font-bold">
                PRO VIEWING NODE // 正在以终端客户选片端视角浏览
              </p>
            </div>
            
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-black font-extrabold text-[11px] rounded-lg border border-amber-400 hover:bg-amber-400 cursor-pointer transition-all uppercase tracking-widest font-mono"
            >
              <Undo2 size={11} />
              <span>返回管理控制台</span>
            </button>
          </div>
          <div className="flex-1">
            <ClientAlbumView albumId={currentAlbumId} />
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <PhotographerDashboard onPreviewAlbum={handlePreviewAlbum} />
        </div>
      )}
    </div>
  );
}
