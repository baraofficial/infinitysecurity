import { useEffect, useRef, useState } from "react";
import { X, Upload, LogOut, Trash2, Database, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { THEME_COLORS as THEMES, applyTheme, type ThemeKey } from "@/lib/theme";

type ConfirmCfg = { title?: string; action: () => void } | null;

const PROTECTED_KEYS = new Set([
  "currentUser",
  "profilePhoto",
  "theme",
  "registeredUsers",
  "chatHistory",
]);

function formatBytes(n: number): string {
  if (!n || n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function computeCacheSize(): Promise<number> {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || PROTECTED_KEYS.has(k) || k.startsWith("sb-")) continue;
      total += (k.length + (localStorage.getItem(k) || "").length) * 2;
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      total += (k.length + (sessionStorage.getItem(k) || "").length) * 2;
    }
    if ("caches" in window) {
      const names = await caches.keys();
      for (const n of names) {
        const c = await caches.open(n);
        const reqs = await c.keys();
        for (const r of reqs) {
          const resp = await c.match(r);
          const buf = await resp?.clone().arrayBuffer();
          if (buf) total += buf.byteLength;
        }
      }
    }
  } catch {}
  return total;
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [savedPhoto, setSavedPhoto] = useState<string>("");
  const [savedUsername, setSavedUsername] = useState<string>("");
  const [photo, setPhoto] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [theme, setTheme] = useState<ThemeKey>("purple");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmCfg>(null);
  const [cacheSize, setCacheSize] = useState<string>("—");
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = THEMES[theme];

  useEffect(() => {
    if (!open) return;
    const p = localStorage.getItem("profilePhoto") || "";
    const u = localStorage.getItem("currentUser") || "";
    const t = (localStorage.getItem("theme") as ThemeKey) || "purple";
    setSavedPhoto(p); setPhoto(p);
    setSavedUsername(u); setUsername(u);
    setTheme(THEMES[t] ? t : "purple");
    setError("");
    setSaving(false);
    setConfirm(null);
    setCacheSize("…");
    computeCacheSize().then((n) => setCacheSize(formatBytes(n)));
  }, [open]);

  // apply theme globally on mount and on change
  useEffect(() => {
    const t = (localStorage.getItem("theme") as ThemeKey) || "purple";
    if (THEMES[t]) applyTheme(t);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (!open) return null;

  function pickTheme(t: ThemeKey) {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(f);
  }

  function handleSave() {
    const trimmed = username.trim();
    if (!trimmed) { setError("Username cannot be empty"); return; }
    if (trimmed !== savedUsername) {
      const raw = localStorage.getItem("registeredUsers");
      let list: string[] = [];
      try { list = raw ? JSON.parse(raw) : []; } catch { list = []; }
      if (list.includes(trimmed)) { setError("Username is already in use"); return; }
    }
    setSaving(true);
    setTimeout(() => {
      if (trimmed !== savedUsername) {
        const raw = localStorage.getItem("registeredUsers");
        let list: string[] = [];
        try { list = raw ? JSON.parse(raw) : []; } catch { list = []; }
        list = list.filter((u) => u !== savedUsername);
        list.push(trimmed);
        localStorage.setItem("registeredUsers", JSON.stringify(list));
      }
      localStorage.setItem("currentUser", trimmed);
      localStorage.setItem("theme", theme);
      applyTheme(theme);
      if (photo) localStorage.setItem("profilePhoto", photo);
      toast.success("✓ Saved!", {
        duration: 1500,
        style: { background: "#0a0a0a", color: "#22c55e", border: "1px solid #22c55e" },
      });
      setSaving(false);
      setTimeout(() => onClose(), 1500);
    }, 500);
  }

  function handleCancel() {
    if (saving) return;
    setPhoto(savedPhoto);
    setUsername(savedUsername);
    setError("");
    onClose();
  }

  async function doLogOut() {
    localStorage.removeItem("currentUser");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  function doClearChat() {
    localStorage.removeItem("chatHistory");
    window.location.reload();
  }
  async function doClearCache() {
    // Only remove junk: non-protected localStorage keys, sessionStorage, Cache Storage.
    // Preserve: user account, chat history, profile photo, theme, supabase auth.
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (PROTECTED_KEYS.has(k) || k.startsWith("sb-")) continue;
        toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } catch {}
    toast.success("✓ Cache cleared", {
      duration: 1500,
      style: { background: "#0a0a0a", color: "#22c55e", border: "1px solid #22c55e" },
    });
    const n = await computeCacheSize();
    setCacheSize(formatBytes(n));
  }

  const disabled = saving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 font-mono relative"
        style={{ background: "#111119", border: `2px solid ${accent}`, boxShadow: `0 0 24px ${accent}66`, color: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCancel}
          aria-label="close"
          disabled={disabled}
          className="absolute top-3 right-3 hover:opacity-70 disabled:opacity-40"
          style={{ color: accent }}
        >
          <X size={18} />
        </button>

        <h2 className="text-sm tracking-widest text-center mb-5" style={{ textShadow: `0 0 8px ${accent}` }}>
          SETTINGS
        </h2>

        <div className="flex flex-col items-center gap-2 mb-5">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ border: `2px solid ${accent}`, background: "#000" }}
          >
            {photo ? (
              <img src={photo} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] opacity-60">NO IMG</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} disabled={disabled} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-1 text-[10px] tracking-widest px-3 py-1 transition disabled:opacity-40"
            style={{ border: `1px solid ${accent}`, color: accent }}
          >
            <Upload size={12} /> UPLOAD PHOTO
          </button>
        </div>

        <label className="block mb-2">
          <span className="block text-[10px] tracking-widest mb-1">&gt; USERNAME</span>
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            disabled={disabled}
            className="w-full bg-black px-3 py-2 outline-none text-sm disabled:opacity-50"
            style={{ border: `2px solid ${accent}99`, color: accent, caretColor: accent }}
          />
          <span className="block text-[9px] opacity-50 mt-1">Unique username</span>
        </label>

        {error && (
          <div
            className="text-[10px] tracking-widest px-3 py-2 mb-2 rounded"
            style={{ background: "#3b0a0a", border: "1px solid #ef4444", color: "#fca5a5" }}
          >
            ⚠ {error}
          </div>
        )}

        <div className="my-4" style={{ borderTop: `1px solid ${accent}66` }} />

        {/* THEME SWITCHER */}
        <div className="mb-4">
          <span className="block text-[10px] tracking-widest mb-2">&gt; THEME</span>
          <div className="flex gap-2">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
              const c = THEMES[k];
              const active = theme === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickTheme(k)}
                  disabled={disabled}
                  className="flex-1 text-[10px] tracking-widest py-2 rounded-lg transition disabled:opacity-40"
                  style={{
                    background: active ? `${c}33` : "transparent",
                    border: `1px solid ${c}`,
                    color: c,
                    boxShadow: active ? `0 0 10px ${c}99` : "none",
                  }}
                >
                  {k === "purple" ? "🟣 PURPLE" : k === "green" ? "🟢 GREEN" : "🔵 BLUE"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="my-4" style={{ borderTop: `1px solid ${accent}66` }} />

        <div className="space-y-2">
          <button
            onClick={() => setConfirm({ action: doLogOut })}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs tracking-widest transition disabled:opacity-40"
            style={{ border: `1px solid ${accent}`, color: accent }}
          >
            <LogOut size={14} /> LOG OUT
          </button>
          <button
            onClick={() => setConfirm({ action: doClearChat })}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs tracking-widest transition disabled:opacity-40"
            style={{ border: `1px solid ${accent}`, color: accent }}
          >
            <Trash2 size={14} /> CLEAR CHAT
          </button>
          <button
            onClick={() => setConfirm({ action: doClearCache })}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs tracking-widest transition disabled:opacity-40"
            style={{ border: `1px solid ${accent}`, color: accent }}
          >
            <Database size={14} /> CLEAR CACHE
          </button>
        </div>

        <div className="flex gap-[10px] mt-4">
          <button
            onClick={handleCancel}
            disabled={disabled}
            className="flex-1 text-xs tracking-widest font-bold transition disabled:opacity-40"
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "transparent",
              border: `1px solid ${accent}`,
              color: accent,
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 text-xs tracking-widest font-bold transition disabled:opacity-60"
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: accent,
              color: "#000",
              boxShadow: `0 0 12px ${accent}88`,
            }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" style={{ color: "#000" }} />
            ) : (
              <>
                <Save size={14} /> SAVE
              </>
            )}
          </button>
        </div>

        {confirm && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setConfirm(null)}
          >
            <div
              className="w-full max-w-xs p-5 font-mono"
              style={{
                background: "#111119",
                border: `2px solid ${accent}`,
                borderRadius: "8px",
                boxShadow: `0 0 16px ${accent}88`,
                color: accent,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm tracking-widest text-center mb-1" style={{ textShadow: `0 0 8px ${accent}` }}>
                Are you sure?
              </h3>
              <p className="text-[10px] tracking-widest text-center opacity-70 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-[10px]">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 text-xs tracking-widest font-bold"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: `1px solid ${accent}`,
                    color: accent,
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { const a = confirm.action; setConfirm(null); a(); }}
                  className="flex-1 text-xs tracking-widest font-bold"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#ef4444",
                    color: "#000",
                    boxShadow: "0 0 12px #ef444488",
                  }}
                >
                  YES, DELETE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
