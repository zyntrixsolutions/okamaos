'use client';

import { useState, useEffect, useCallback } from "react";
import { Wifi, RefreshCw, Trash2, CheckCircle, AlertCircle, Copy, Server } from "lucide-react";

interface HostedGame {
  id: string;
  name: string;
  version: string;
  size_bytes: number;
  download_url: string;
  hosted_at: string;
  category?: string;
}

interface ServerInfo {
  catalog_url: string;
}

export default function DevServerPanel() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [games, setGames] = useState<HostedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("");

  const fetchInfo = useCallback(async () => {
    // Use current deployment URL for catalog
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
    setInfo({ catalog_url: `${currentUrl}/api/dev-store/catalog` });
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev-store/catalog");
      const data = await res.json();
      setGames(data.games ?? []);
    } catch {
      setStatus("Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
    fetchCatalog();
  }, [fetchInfo, fetchCatalog]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const removeGame = async (game: HostedGame) => {
    const safeName = `${game.id.replace(/\./g, "-")}-${game.version}`;
    await fetch(`/api/dev-store/remove?name=${encodeURIComponent(safeName)}`, { method: "DELETE" });
    setGames((prev) => prev.filter((g) => g.id !== game.id || g.version !== game.version));
  };

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };


  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full" style={{ background: "#10120f" }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Server size={16} style={{ color: "#53d9e6" }} />
        <span className="text-sm font-black uppercase tracking-widest" style={{ color: "#53d9e6" }}>
          Dev Store Server
        </span>
        <button
          onClick={() => { fetchInfo(); fetchCatalog(); }}
          className="ml-auto p-1 rounded"
          style={{ color: "#6b7464" }}
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* How it works */}
      <div
        className="p-3 rounded-lg text-xs flex flex-col gap-1"
        style={{ background: "rgba(83,217,230,0.06)", border: "1px solid rgba(83,217,230,0.15)" }}
      >
        <p style={{ color: "#53d9e6" }} className="font-bold">How to connect from console</p>
        <p style={{ color: "#c9c3b3" }}>
          1. Package your game with <strong>Publish to Dev Server</strong> below.
        </p>
        <p style={{ color: "#c9c3b3" }}>
          2. In OkamaOS → Game Store → press <strong>X</strong> → enter the Catalog URL.
        </p>
        <p style={{ color: "#c9c3b3" }}>
          3. The console fetches your catalog and can download + install games wirelessly.
        </p>
      </div>

      {/* Catalog URL */}
      {info && (
        <div
          className="p-3 rounded-lg flex flex-col gap-2"
          style={{ background: "rgba(141,247,127,0.04)", border: "1px solid rgba(141,247,127,0.15)" }}
        >
          <p className="text-xs font-bold" style={{ color: "#8df77f" }}>
            Catalog URL — Enter this on your OkamaOS console:
          </p>
          <div
            className="flex items-center gap-2 p-2 rounded font-mono text-xs cursor-pointer"
            style={{ background: "#10120f", border: "1px solid rgba(141,247,127,0.2)" }}
            onClick={() => copyUrl(info.catalog_url)}
          >
            <span style={{ color: "#8df77f", flex: 1, wordBreak: "break-all" }}>{info.catalog_url}</span>
            {copied === info.catalog_url
              ? <CheckCircle size={12} style={{ color: "#8df77f", flexShrink: 0 }} />
              : <Copy size={12} style={{ color: "#6b7464", flexShrink: 0 }} />
            }
          </div>
          <p className="text-xs" style={{ color: "#6b7464" }}>
            Game Store → Press <strong style={{ color: "#c9c3b3" }}>X</strong> → Set Server URL → paste above
          </p>
        </div>
      )}

      {/* Hosted games */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
            Hosted Games ({games.length})
          </p>
          {loading && <RefreshCw size={11} style={{ color: "#6b7464" }} className="animate-spin" />}
        </div>

        {games.length === 0 && !loading && (
          <p className="text-xs" style={{ color: "#6b7464" }}>
            No games published yet. Use Export tab → Publish to Dev Server.
          </p>
        )}

        {games.map((g) => (
          <div
            key={`${g.id}-${g.version}`}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: "#181a16", border: "1px solid rgba(243,239,228,0.08)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "#f3efe4" }}>{g.name}</p>
              <p className="text-xs font-mono truncate" style={{ color: "#6b7464" }}>
                {g.id} · v{g.version} · {formatSize(g.size_bytes)}
              </p>
            </div>
            <button
              onClick={() => removeGame(g)}
              className="p-1 rounded shrink-0"
              style={{ color: "#6b7464" }}
              title="Remove from server"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {status && (
        <div className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(242,109,91,0.08)" }}>
          <AlertCircle size={12} style={{ color: "#f26d5b" }} />
          <p className="text-xs" style={{ color: "#f26d5b" }}>{status}</p>
        </div>
      )}

      {/* Cloud hosting note */}
      <div
        className="p-3 rounded-lg"
        style={{ background: "rgba(255,207,74,0.04)", border: "1px solid rgba(255,207,74,0.12)" }}
      >
        <div className="flex items-start gap-2">
          <Wifi size={12} style={{ color: "#ffcf4a", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: "#c9c3b3" }}>
            <strong style={{ color: "#ffcf4a" }}>Cloud Dev Server</strong> — games are stored in cloud
            blob storage and accessible from anywhere. Use the catalog URL above in your OkamaOS console.
          </p>
        </div>
      </div>
    </div>
  );
}

