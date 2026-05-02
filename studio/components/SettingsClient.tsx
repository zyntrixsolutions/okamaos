'use client';

import { useState, useEffect } from "react";
import { Key, Cpu, Save, CheckCircle, Eye, EyeOff, ExternalLink, Wallet, Link } from "lucide-react";
import Header from "@/components/ui/Header";
import { MODEL_OPTIONS, type ModelId } from "@/lib/ai/router";
import { saveContractAddresses, getContractAddresses } from "@/lib/web3/contracts";

export default function SettingsClient() {
  const [model, setModel] = useState<ModelId>("gemini-3.1-flash-lite-preview");
  const [geminiKey, setGeminiKey] = useState("");
  const [qwenKey, setQwenKey] = useState("");
  const [publisherId, setPublisherId] = useState("com.okamalabs");
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showQwen, setShowQwen] = useState(false);

  const [web3Network, setWeb3Network] = useState<"base" | "base-sepolia">("base-sepolia");
  const [web3RpcBase, setWeb3RpcBase] = useState("https://mainnet.base.org");
  const [web3RpcSepolia, setWeb3RpcSepolia] = useState("https://sepolia.base.org");
  const [okTokenAddr, setOkTokenAddr] = useState("0x0000000000000000000000000000000000000000");
  const [okAssetsAddr, setOkAssetsAddr] = useState("0x0000000000000000000000000000000000000000");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setModel((localStorage.getItem("okama-model") as ModelId) ?? "gemini-3.1-flash-lite-preview");
    setGeminiKey(localStorage.getItem("okama-gemini-key") ?? "");
    setQwenKey(localStorage.getItem("okama-qwen-key") ?? "");
    setPublisherId(localStorage.getItem("okama-publisher-id") ?? "com.okamalabs");
    setDisplayName(localStorage.getItem("okama-display-name") ?? "");
    setWeb3Network((localStorage.getItem("okama-web3-network") as "base" | "base-sepolia") ?? "base-sepolia");
    setWeb3RpcBase(localStorage.getItem("okama-web3-rpc-base") ?? "https://mainnet.base.org");
    setWeb3RpcSepolia(localStorage.getItem("okama-web3-rpc-base-sepolia") ?? "https://sepolia.base.org");
    const addrs = getContractAddresses("base-sepolia");
    setOkTokenAddr(addrs.okToken);
    setOkAssetsAddr(addrs.okAssets);
  }, []);

  const save = () => {
    localStorage.setItem("okama-model", model);
    localStorage.setItem("okama-gemini-key", geminiKey);
    localStorage.setItem("okama-qwen-key", qwenKey);
    localStorage.setItem("okama-publisher-id", publisherId);
    localStorage.setItem("okama-display-name", displayName);
    localStorage.setItem("okama-web3-network", web3Network);
    localStorage.setItem("okama-web3-rpc-base", web3RpcBase);
    localStorage.setItem("okama-web3-rpc-base-sepolia", web3RpcSepolia);
    saveContractAddresses(web3Network, {
      okToken: okTokenAddr as `0x${string}`,
      okAssets: okAssetsAddr as `0x${string}`,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const geminiModels = MODEL_OPTIONS.filter((m) => m.provider === "gemini");
  const qwenModels = MODEL_OPTIONS.filter((m) => m.provider === "qwen");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header crumbs={[{ label: "Settings" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

          {/* AI Model */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} style={{ color: "#53d9e6" }} />
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#53d9e6" }}>
                AI Model
              </h2>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
            >
              <p className="text-xs mb-3" style={{ color: "#c9c3b3" }}>
                Select the AI model used in the Studio and Learn tutor.
              </p>
              <div className="space-y-4">
                {/* Gemini — Free tier */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8df77f" }}>
                    Google Gemini — Free Tier
                  </p>
                  <p className="text-xs mb-2" style={{ color: "#6b7464" }}>No billing required · use your API key from AI Studio</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {geminiModels.filter((m) => m.tier === "free").map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className="flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all"
                        style={{
                          borderColor: model === m.id ? "rgba(83,217,230,0.5)" : "rgba(243,239,228,0.08)",
                          background: model === m.id ? "rgba(83,217,230,0.08)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold" style={{ color: model === m.id ? "#53d9e6" : "#f3efe4" }}>
                            {m.label}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(83,217,230,0.12)", color: "#53d9e6" }}>
                            Free
                          </span>
                        </div>
                        {m.note && (
                          <span className="text-xs font-mono" style={{ color: "#6b7464" }}>
                            {m.note}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gemini — Paid tier */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#ffcf4a" }}>
                    Google Gemini — Paid Tier
                  </p>
                  <p className="text-xs mb-2" style={{ color: "#6b7464" }}>Requires billing enabled on your Google Cloud project</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {geminiModels.filter((m) => m.tier === "paid").map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className="flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all"
                        style={{
                          borderColor: model === m.id ? "rgba(255,207,74,0.4)" : "rgba(243,239,228,0.08)",
                          background: model === m.id ? "rgba(255,207,74,0.06)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold" style={{ color: model === m.id ? "#ffcf4a" : "#f3efe4" }}>
                            {m.label}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(255,207,74,0.10)", color: "#ffcf4a" }}>
                            Pro
                          </span>
                        </div>
                        <span className="text-xs font-mono" style={{ color: "#6b7464" }}>Requires billing</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qwen group */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#ffcf4a" }}>
                    Qwen (Alibaba Dashscope)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {qwenModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className="flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all"
                        style={{
                          borderColor: model === m.id ? "rgba(255,207,74,0.4)" : "rgba(243,239,228,0.08)",
                          background: model === m.id ? "rgba(255,207,74,0.06)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold" style={{ color: model === m.id ? "#ffcf4a" : "#f3efe4" }}>
                            {m.label}
                          </span>
                          {m.badge && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-bold"
                              style={{ background: "rgba(255,207,74,0.10)", color: "#ffcf4a" }}
                            >
                              {m.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* API Keys */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} style={{ color: "#ffcf4a" }} />
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#ffcf4a" }}>
                API Keys
              </h2>
            </div>
            <div
              className="rounded-xl border p-4 space-y-4"
              style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
            >
              <p className="text-xs" style={{ color: "#c9c3b3" }}>
                Keys are stored only in your browser (localStorage) — never sent to any server other than the AI provider directly.
              </p>

              {/* Gemini key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold" style={{ color: "#8df77f" }}>
                    Google Gemini API Key
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#6b7464" }}
                  >
                    Get key <ExternalLink size={10} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showGemini ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza…"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border text-sm font-mono outline-none"
                    style={{
                      background: "#10120f",
                      borderColor: geminiKey ? "rgba(141,247,127,0.3)" : "rgba(243,239,228,0.12)",
                      color: "#f3efe4",
                    }}
                  />
                  <button
                    onClick={() => setShowGemini((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "#6b7464" }}
                  >
                    {showGemini ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Qwen key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold" style={{ color: "#ffcf4a" }}>
                    Qwen Dashscope API Key
                  </label>
                  <a
                    href="https://dashscope.aliyuncs.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "#6b7464" }}
                  >
                    Get key <ExternalLink size={10} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showQwen ? "text" : "password"}
                    value={qwenKey}
                    onChange={(e) => setQwenKey(e.target.value)}
                    placeholder="sk-…"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border text-sm font-mono outline-none"
                    style={{
                      background: "#10120f",
                      borderColor: qwenKey ? "rgba(255,207,74,0.3)" : "rgba(243,239,228,0.12)",
                      color: "#f3efe4",
                    }}
                  />
                  <button
                    onClick={() => setShowQwen((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "#6b7464" }}
                  >
                    {showQwen ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Profile */}
          <section>
            <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: "#c9c3b3" }}>
              Profile
            </h2>
            <div
              className="rounded-xl border p-4 space-y-4"
              style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
            >
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "#c9c3b3" }}>
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ background: "#10120f", borderColor: "rgba(243,239,228,0.12)", color: "#f3efe4" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "#c9c3b3" }}>
                  Publisher ID
                  <span className="font-normal ml-1" style={{ color: "#6b7464" }}>
                    (used in package IDs, e.g. com.yourname)
                  </span>
                </label>
                <input
                  value={publisherId}
                  onChange={(e) => setPublisherId(e.target.value)}
                  placeholder="com.yourname"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm font-mono outline-none"
                  style={{ background: "#10120f", borderColor: "rgba(243,239,228,0.12)", color: "#f3efe4" }}
                />
              </div>
            </div>
          </section>

          {/* Web3 / Base */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={16} style={{ color: "#64a6ff" }} />
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#64a6ff" }}>
                Web3 — Base Network
              </h2>
            </div>
            <div
              className="rounded-xl border p-4 space-y-4"
              style={{ background: "#181a16", borderColor: "rgba(243,239,228,0.10)" }}
            >
              <p className="text-xs" style={{ color: "#c9c3b3" }}>
                Configure the Base (EVM L2) network used for OKToken rewards and OKAssets NFTs.
                Use <strong>Base Sepolia</strong> for development.
              </p>

              {/* Network selector */}
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: "#64a6ff" }}>
                  Active Network
                </label>
                <div className="flex gap-2">
                  {(["base-sepolia", "base"] as const).map((net) => (
                    <button
                      key={net}
                      onClick={() => setWeb3Network(net)}
                      className="flex-1 py-2 rounded-lg border text-xs font-bold transition-all"
                      style={{
                        borderColor: web3Network === net ? "rgba(100,166,255,0.5)" : "rgba(243,239,228,0.08)",
                        background: web3Network === net ? "rgba(100,166,255,0.10)" : "transparent",
                        color: web3Network === net ? "#64a6ff" : "#c9c3b3",
                      }}
                    >
                      {net === "base" ? "Base Mainnet" : "Base Sepolia (dev)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* RPC URLs */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "#c9c3b3" }}>
                  Base Mainnet RPC
                </label>
                <input
                  value={web3RpcBase}
                  onChange={(e) => setWeb3RpcBase(e.target.value)}
                  placeholder="https://mainnet.base.org"
                  className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none"
                  style={{ background: "#10120f", borderColor: "rgba(243,239,228,0.12)", color: "#f3efe4" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "#c9c3b3" }}>
                  Base Sepolia RPC
                </label>
                <input
                  value={web3RpcSepolia}
                  onChange={(e) => setWeb3RpcSepolia(e.target.value)}
                  placeholder="https://sepolia.base.org"
                  className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none"
                  style={{ background: "#10120f", borderColor: "rgba(243,239,228,0.12)", color: "#f3efe4" }}
                />
              </div>

              {/* Contract addresses */}
              <div className="pt-2 border-t" style={{ borderColor: "rgba(243,239,228,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Link size={12} style={{ color: "#64a6ff" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64a6ff" }}>
                    Contract Addresses ({web3Network})
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: "#8df77f" }}>
                      OKToken (ERC-20)
                    </label>
                    <input
                      value={okTokenAddr}
                      onChange={(e) => setOkTokenAddr(e.target.value)}
                      placeholder="0x…"
                      className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none"
                      style={{
                        background: "#10120f",
                        borderColor: okTokenAddr && okTokenAddr !== "0x0000000000000000000000000000000000000000"
                          ? "rgba(141,247,127,0.3)" : "rgba(243,239,228,0.12)",
                        color: "#f3efe4",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: "#ffcf4a" }}>
                      OKAssets (ERC-1155)
                    </label>
                    <input
                      value={okAssetsAddr}
                      onChange={(e) => setOkAssetsAddr(e.target.value)}
                      placeholder="0x…"
                      className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none"
                      style={{
                        background: "#10120f",
                        borderColor: okAssetsAddr && okAssetsAddr !== "0x0000000000000000000000000000000000000000"
                          ? "rgba(255,207,74,0.3)" : "rgba(243,239,228,0.12)",
                        color: "#f3efe4",
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: "#6b7464" }}>
                  Deploy contracts via <code>forge script</code> in <code>contracts/</code> then paste addresses here.
                </p>
              </div>
            </div>
          </section>

          {/* Save */}
          <button
            onClick={save}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: saved ? "rgba(141,247,127,0.15)" : "#8df77f",
              color: saved ? "#8df77f" : "#10120f",
            }}
          >
            {saved ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Settings</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
