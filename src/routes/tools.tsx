import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import {
  Globe,
  NotebookPen,
  Github,
  Code2,
  FolderArchive,
  ImagePlus,
  Database,
  Terminal,
  FunctionSquare,
  Images,
  GitBranch,
  Rocket,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/tools")({
  ssr: false,
  component: ToolsPage,
  head: () => ({
    meta: [
      { title: "Tools — Bara Agent" },
      {
        name: "description",
        content:
          "Katalog tools Bara Agent: browser, catatan, GitHub connector, code editor, file manager, image generator, database, dan lainnya.",
      },
      { property: "og:title", content: "Tools — Bara Agent" },
      {
        property: "og:description",
        content: "Katalog tools agent Bara Agent dengan tema gelap ungu futuristik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tools — Bara Agent" },
      {
        name: "twitter:description",
        content: "Katalog tools agent Bara Agent dengan tema gelap ungu futuristik.",
      },
    ],
  }),
});

type Tool = {
  name: string;
  desc: string;
  Icon: typeof Globe;
  prompt: string;
};

const TOOLS: Tool[] = [
  {
    name: "Browser",
    desc: "Menelusuri informasi terkini dan referensi dunia maya.",
    Icon: Globe,
    prompt: "Telusuri informasi terkini tentang: ",
  },
  {
    name: "Catatan",
    desc: "Mencatat, menyimpan, dan mengingatkan poin penting user.",
    Icon: NotebookPen,
    prompt: "Catat poin penting ini dan ingatkan saya nanti: ",
  },
  {
    name: "GithubConnector",
    desc: "Menghubungkan ke repo Github. Bisa baca file, edit code, dan push commit.",
    Icon: Github,
    prompt: "Hubungkan ke repo GitHub berikut dan jelaskan strukturnya: ",
  },
  {
    name: "CodeEditor",
    desc: "Membaca, menganalisis, dan mengedit file .js .tsx .py. Bisa debug error.",
    Icon: Code2,
    prompt: "Analisis dan perbaiki kode berikut: ",
  },
  {
    name: "FileManager",
    desc: "Upload, ekstrak, dan download file .zip .pdf .docx.",
    Icon: FolderArchive,
    prompt: "Bantu saya memproses file yang saya lampirkan: ",
  },
  {
    name: "ImageGenerator",
    desc: "Membuat gambar dari teks prompt. Tema: Futuristik Dark & Purple.",
    Icon: ImagePlus,
    prompt: "Buatkan gambar futuristik dark & purple tentang: ",
  },
  {
    name: "Database",
    desc: "Menyimpan data produk, user, dan chat. Bisa search dan update.",
    Icon: Database,
    prompt: "Bantu saya query/update data di database untuk: ",
  },
  {
    name: "Code Execution",
    desc: "Mengeksekusi kode program secara langsung dalam sandbox.",
    Icon: Terminal,
    prompt: "Jalankan dan uji kode berikut lalu jelaskan hasilnya: ",
  },
  {
    name: "Function Calling",
    desc: "Memanggil fungsi API eksternal dan custom functions.",
    Icon: FunctionSquare,
    prompt: "Panggil API eksternal berikut dan olah responsnya: ",
  },
  {
    name: "Multimodal",
    desc: "Menganalisis dan memproses gambar serta input multimodal lainnya.",
    Icon: Images,
    prompt: "Analisis gambar/media yang saya kirim: ",
  },
  {
    name: "GitHub API",
    desc: "Mengakses GitHub API via Octokit untuk membaca/menulis file.",
    Icon: Github,
    prompt: "Gunakan GitHub API untuk: ",
  },
  {
    name: "Git CLI",
    desc: "Menjalankan perintah Git CLI (add, commit, push, pull).",
    Icon: GitBranch,
    prompt: "Susun perintah Git CLI untuk: ",
  },
  {
    name: "Deploy Tools",
    desc: "Mendeploy aplikasi dan tools ke server atau cloud.",
    Icon: Rocket,
    prompt: "Bantu saya deploy aplikasi ini ke: ",
  },
];

function ToolsPage() {
  const navigate = useNavigate();
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: string }[] | null>(null);

  function runTool(t: Tool) {
    localStorage.setItem("draftPrompt", t.prompt);
    toast.success(`${t.name} aktif`);
    navigate({ to: "/chat" });
  }

  async function readRepo() {
    if (!repo.trim()) return;
    setLoading(true);
    setFiles(null);
    try {
      const res = await fetch(`/api/github?repo=${encodeURIComponent(repo.trim())}`);
      const json = (await res.json()) as {
        error?: string;
        data?: { name: string; type: string }[];
      };
      if (!res.ok || json.error) throw new Error(json.error ?? "gagal membaca repo");
      setFiles(Array.isArray(json.data) ? json.data : []);
      toast.success("Repo terbaca");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "gagal membaca repo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0f] font-mono text-[#f5f5f5]">
      <header className="shrink-0 border-b border-[#a855f7]/25 px-4 py-4">
        <h1 className="text-sm tracking-[0.3em] text-[#a855f7]">TOOLS</h1>
        <p className="mt-1 text-[11px] text-[#a1a1aa]">
          {TOOLS.length} tools tersedia untuk Bara Agent
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <section className="mb-5 rounded-2xl border border-[#a855f7]/40 bg-[#12121a] p-4">
          <div className="flex items-center gap-2 text-[#a855f7]">
            <Github size={16} />
            <span className="text-xs tracking-widest">GITHUB CONNECTOR</span>
          </div>
          <p className="mt-1 text-[11px] text-[#a1a1aa]">
            Masukkan owner/repo untuk membaca isi repository.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="min-w-0 flex-1 rounded-full border border-[#a855f7]/40 bg-[#1F1F1F] px-4 py-2.5 text-xs text-[#f5f5f5] placeholder:text-[#71717a] focus:border-[#a855f7] focus:outline-none"
            />
            <button
              type="button"
              onClick={readRepo}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-[#a855f7] px-4 py-2.5 text-xs font-bold text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} BACA
            </button>
          </div>
          {files && (
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-[11px]">
              {files.length === 0 && <li className="text-[#71717a]">// kosong</li>}
              {files.map((f) => (
                <li key={f.name} className="truncate text-[#a1a1aa]">
                  {f.type === "dir" ? "📁" : "📄"} {f.name}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => runTool(t)}
              className="flex items-start gap-3 rounded-2xl border border-[#a855f7]/30 bg-[#12121a] p-4 text-left transition hover:border-[#a855f7] hover:bg-[#a855f7]/10"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#a855f7]/50 text-[#a855f7]">
                <t.Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold tracking-wider text-[#a855f7]">
                  {t.name}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#a1a1aa]">
                  {t.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
