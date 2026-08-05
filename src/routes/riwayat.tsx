import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { MessageSquare, Trash2 } from "lucide-react";

export const Route = createFileRoute("/riwayat")({
  ssr: false,
  component: RiwayatPage,
  head: () => ({
    meta: [
      { title: "Riwayat — Bara Agent" },
      { name: "description", content: "Riwayat percakapan Bara Agent milik kamu." },
      { property: "og:title", content: "Riwayat — Bara Agent" },
      { property: "og:description", content: "Riwayat percakapan Bara Agent milik kamu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Riwayat — Bara Agent" },
      { name: "twitter:description", content: "Riwayat percakapan Bara Agent milik kamu." },
    ],
  }),
});

type Conversation = { id: string; title: string; updated_at: string };

function RiwayatPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Conversation[]>([]);

  async function load() {
    const { data } = await supabase
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    setItems(data ?? []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
      else load();
    });
  }, [navigate]);

  async function remove(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    load();
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f] font-mono text-[#f5f5f5]">
      <header className="shrink-0 border-b border-[#a855f7]/25 px-4 py-4">
        <h1 className="text-sm tracking-[0.3em] text-[#a855f7]">RIWAYAT</h1>
        <p className="mt-1 text-[11px] text-[#a1a1aa]">{items.length} percakapan tersimpan</p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {items.length === 0 && (
          <p className="text-[11px] text-[#71717a]">// belum ada percakapan</p>
        )}
        {items.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-[#a855f7]/30 bg-[#12121a] px-4 py-3"
          >
            <MessageSquare size={14} className="shrink-0 text-[#a855f7]" />
            <button
              type="button"
              onClick={() => navigate({ to: "/chat" })}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-xs text-[#f5f5f5]">{c.title}</span>
              <span className="block text-[10px] text-[#71717a]">
                {new Date(c.updated_at).toLocaleString()}
              </span>
            </button>
            <button
              type="button"
              aria-label="hapus"
              onClick={() => remove(c.id)}
              className="text-[#a855f7]/70 transition hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
