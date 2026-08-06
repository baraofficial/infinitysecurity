import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/prompt")({
  ssr: false,
  component: PromptPage,
  head: () => ({
    meta: [
      { title: "Prompt — Bara AI" },
      {
        name: "description",
        content: "Kumpulan prompt siap pakai untuk Bara AI, langsung kirim ke chat.",
      },
      { property: "og:title", content: "Prompt — Bara AI" },
      { property: "og:description", content: "Kumpulan prompt siap pakai untuk Bara AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Prompt — Bara AI" },
      { name: "twitter:description", content: "Kumpulan prompt siap pakai untuk Bara AI." },
    ],
  }),
});

const PROMPTS = [
  { title: "Debug Error", body: "Analisis error berikut, jelaskan penyebabnya, lalu berikan perbaikan kodenya:\n\n" },
  { title: "Review Code", body: "Review kode berikut dari sisi keamanan, performa, dan keterbacaan:\n\n" },
  { title: "Buat Fitur", body: "Rancang dan tuliskan kode untuk fitur berikut, sertakan struktur file:\n\n" },
  { title: "Perbandingan", body: "Buat tabel perbandingan lengkap antara: " },
  { title: "Ringkas Dokumen", body: "Ringkas isi dokumen/teks ini menjadi poin-poin penting:\n\n" },
  { title: "Rencana Deploy", body: "Buat langkah-langkah deploy aplikasi berikut ke cloud: " },
];

function PromptPage() {
  const navigate = useNavigate();

  function use(body: string) {
    localStorage.setItem("draftPrompt", body);
    toast.success("Prompt dimuat ke chat");
    navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f] font-mono text-[#f5f5f5]">
      <header className="shrink-0 border-b border-[#a855f7]/25 px-4 py-4">
        <h1 className="text-sm tracking-[0.3em] text-[#a855f7]">PROMPT</h1>
        <p className="mt-1 text-[11px] text-[#a1a1aa]">Pilih prompt untuk dipakai di chat</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {PROMPTS.map((p) => (
          <button
            key={p.title}
            type="button"
            onClick={() => use(p.body)}
            className="w-full rounded-2xl border border-[#a855f7]/30 bg-[#12121a] p-4 text-left transition hover:border-[#a855f7] hover:bg-[#a855f7]/10"
          >
            <span className="block text-xs font-bold tracking-wider text-[#a855f7]">
              &gt; {p.title}
            </span>
            <span className="mt-1 block whitespace-pre-wrap text-[11px] leading-relaxed text-[#a1a1aa]">
              {p.body.trim()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
