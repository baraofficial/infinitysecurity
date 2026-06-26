import { useEffect, useRef, useState } from "react";
import { X, Upload, LogOut, Trash2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPhoto(localStorage.getItem("profilePhoto") || "");
    setUsername(localStorage.getItem("currentUser") || "");
  }, [open]);

  if (!open) return null;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const data = String(r.result);
      setPhoto(data);
      localStorage.setItem("profilePhoto", data);
    };
    r.readAsDataURL(f);
  }

  function saveUsername(v: string) {
    setUsername(v);
    localStorage.setItem("currentUser", v);
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
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 font-mono text-neon relative"
        style={{ background: "#111119", border: "2px solid #a855f7", boxShadow: "0 0 24px #a855f766" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
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

        <label className="block mb-5">
          <span className="block text-[10px] tracking-widest mb-1">&gt; USERNAME</span>
          <input
            value={username}
            onChange={(e) => saveUsername(e.target.value)}
            className="w-full bg-black border-2 border-neon/60 focus:border-neon px-3 py-2 text-neon outline-none text-sm caret-neon"
          />
          <span className="block text-[9px] text-neon/50 mt-1">Unique username</span>
        </label>

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
      </div>
    </div>
  );
}
