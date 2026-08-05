import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import SettingsModal from "@/components/SettingsModal";
import { LogOut, Settings, CircleUser } from "lucide-react";

export const Route = createFileRoute("/akun")({
  ssr: false,
  component: AkunPage,
  head: () => ({
    meta: [
      { title: "Akun — Bara Agent" },
      { name: "description", content: "Kelola akun dan pengaturan Bara Agent." },
      { property: "og:title", content: "Akun — Bara Agent" },
      { property: "og:description", content: "Kelola akun dan pengaturan Bara Agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Akun — Bara Agent" },
      { name: "twitter:description", content: "Kelola akun dan pengaturan Bara Agent." },
    ],
  }),
});

function AkunPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(data.session.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .maybeSingle();
      setUsername(p?.username || data.session.user.email?.split("@")[0] || "user");
    });
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f] font-mono text-[#f5f5f5]">
      <header className="shrink-0 border-b border-[#a855f7]/25 px-4 py-4">
        <h1 className="text-sm tracking-[0.3em] text-[#a855f7]">AKUN</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#a855f7]/40 bg-[#12121a] p-4">
          <CircleUser size={36} className="text-[#a855f7]" />
          <div className="min-w-0">
            <p className="truncate text-sm text-[#f5f5f5]">{username}</p>
            <p className="truncate text-[11px] text-[#71717a]">{email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#a855f7]/50 py-3 text-xs tracking-widest text-[#a855f7] transition hover:bg-[#a855f7]/10"
        >
          <Settings size={16} /> PENGATURAN
        </button>

        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#a855f7]/50 py-3 text-xs tracking-widest text-[#a855f7] transition hover:bg-[#a855f7]/10"
        >
          <LogOut size={16} /> LOG OUT
        </button>
      </div>

      <BottomNav />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        username={username}
        onUsernameChange={setUsername}
        onLogout={signOut}
        onClearChat={async () => {}}
      />
    </div>
  );
}
