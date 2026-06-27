import { useEffect, useRef, useState } from "react";
import { X, Upload, LogOut, Trash2, Database, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [savedPhoto, setSavedPhoto] = useState<string>("");
  const [savedUsername, setSavedUsername] = useState<string>("");
  const [photo, setPhoto] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const p = localStorage.getItem("profilePhoto") || "";
    const u = localStorage.getItem("currentUser") || "";
    setSavedPhoto(p); setPhoto(p);
    setSavedUsername(u); setUsername(u);
    setError("");
  }, [open]);

  if (!open) return null;

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
      list = list.filter((u) => u !== savedUsername);
      list.push(trimmed);
      localStorage.setItem("registeredUsers", JSON.stringify(list));
    }
    localStorage.setItem("currentUser", trimmed);
    if (photo) localStorage.setItem("profilePhoto", photo);
    toast.success("Saved!", { duration: 1500 });
    setTimeout(() => onClose(), 200);
  }

  function handleCancel() {
    setPhoto(savedPhoto);
    setUsername(savedUsername);
    setError("");
    onClose();
  }

  async function logOut() {
    localStorage.removeItem("currentUser");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function clearChat() {
    localStorage.removeItem("chatHistory");
    window.location.reload();
  }

  function clearCache() {
    const keep = localStorage.getItem("registeredUsers");
    localStorage.clear();
    if (keep) localStorage.setItem("registeredUsers", keep);
    window.location.reload();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 font-mono text-neon relative"
        style={{ background: "#111119", border: "2px solid #a855f7", boxShadow: "0 0 24px #a855f766" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCancel}
          aria-label="close"
          className="absolute top-3 right-3 text-neon hover:opacity-70"
        >
          <X size={18} />
        </button>

        <h2 className="text-sm tracking-widest text-center mb-5" style={{ textShadow: "0 0 8px #a855f7" }}>
          SETTINGS
        </h2>

        <div className="flex flex-col items-center gap-2 mb-5">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
            style={{ border: "2px solid #a855f7", background: "#000" }}
          >
            {photo ? (
              <img src={photo} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-neon/60">NO IMG</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-[10px] tracking-widest px-3 py-1 border border-neon hover:bg-neon hover:text-black transition"
          >
            <Upload size={12} /> UPLOAD PHOTO
          </button>
        </div>

        <label className="block mb-2">
          <span className="block text-[10px] tracking-widest mb-1">&gt; USERNAME</span>
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            className="w-full bg-black border-2 border-neon/60 focus:border-neon px-3 py-2 text-neon outline-none text-sm caret-neon"
          />
          <span className="block text-[9px] text-neon/50 mt-1">Unique username</span>
        </label>

        {error && (
          <div
            className="text-[10px] tracking-widest px-3 py-2 mb-2 rounded"
            style={{ background: "#3b0a0a", border: "1px solid #ef4444", color: "#fca5a5" }}
          >
            ⚠ {error}
          </div>
        )}

        <div className="border-t border-neon/40 my-4" />

        <div className="space-y-2">
          <button
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 py-2 border border-neon text-xs tracking-widest hover:bg-neon hover:text-black transition"
          >
            <LogOut size={14} /> LOG OUT
          </button>
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-2 border border-neon text-xs tracking-widest hover:bg-neon hover:text-black transition"
          >
            <Trash2 size={14} /> CLEAR CHAT
          </button>
          <button
            onClick={clearCache}
            className="w-full flex items-center justify-center gap-2 py-2 border border-neon text-xs tracking-widest hover:bg-neon hover:text-black transition"
          >
            <Database size={14} /> CLEAR CACHE
          </button>
        </div>

        <div className="flex gap-[10px] mt-4">
          <button
            onClick={handleCancel}
            className="flex-1 text-xs tracking-widest font-bold transition"
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid #a855f7",
              color: "#a855f7",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#a855f722"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 text-xs tracking-widest font-bold transition"
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#a855f7",
              color: "#000",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.2)";
              e.currentTarget.style.boxShadow = "0 0 16px #a855f7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Save size={14} /> SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
