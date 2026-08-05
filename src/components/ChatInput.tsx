import { useEffect, useRef, useState } from "react";
import { Plus, Send, Paperclip, Camera, Github, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
  attachments?: File[];
  onRemoveAttachment?: (index: number) => void;
  onClearAttachments?: () => void;
  initialText?: string;
}

export default function ChatInput({
  onSend,
  onFiles,
  disabled = false,
  attachments = [],
  onRemoveAttachment,
  onClearAttachments,
  initialText = "",
}: ChatInputProps) {
  const [value, setValue] = useState(initialText);
  const [menuOpen, setMenuOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialText) setValue(initialText);
  }, [initialText]);

  // auto-grow up to 7 lines, then scroll
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const line = 24;
    const max = line * 7;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value]);

  const attachmentCount = attachments.length;
  const canSend = (value.trim().length > 0 || attachmentCount > 0) && !disabled;

  useEffect(() => {
    const items = attachments.map((f) => ({
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
      name: f.name,
    }));
    setPreviews(items);
    return () => items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
  }, [attachments]);


  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function submitRepo() {
    const url = repoUrl.trim();
    if (!url) return;
    onSend(`Impor repo GitHub: ${url}\nTolong analisa repositori ini.`);
    setRepoUrl("");
    setGithubOpen(false);
  }

  return (
    <div className="p-4 bg-[#0a0a0f]">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles?.(files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles?.(files);
          e.target.value = "";
        }}
      />

      {githubOpen && (
        <div className="mb-2 rounded-2xl bg-[#12121a] border border-[#a855f7]/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] tracking-widest text-[#a855f7]">
              IMPOR REPO GITHUB
            </span>
            <button
              type="button"
              aria-label="close github import"
              onClick={() => setGithubOpen(false)}
              className="text-[#a855f7]/70 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitRepo();
                }
              }}
              placeholder="https://github.com/user/repo"
              className="flex-1 min-w-0 bg-[#0a0a0f] border border-[#a855f7]/30 rounded-xl px-3 py-2 text-white text-xs outline-none placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={submitRepo}
              className="shrink-0 text-xs px-3 py-2 rounded-xl bg-[#dc2626] hover:bg-[#a855f7] text-white transition"
            >
              IMPOR
            </button>
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {previews.map((p, i) => (
            <div
              key={i}
              className="relative h-16 w-16 rounded-xl overflow-hidden border border-[#a855f7]/40 bg-[#12121a]"
            >
              {p.url ? (
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-[9px] text-[#a855f7] px-1 text-center break-all">
                  {p.name.slice(0, 14)}
                </span>
              )}
              <button
                type="button"
                aria-label="hapus lampiran"
                onClick={() => onRemoveAttachment?.(i)}
                className="absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-black/70 text-[#a855f7]"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        ref={wrapRef}
        className="relative flex items-end gap-2 rounded-2xl bg-[#12121a] border border-[#a855f7]/30 px-2 py-2"
      >
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl bg-[#12121a] border border-[#a855f7]/30 p-2 space-y-1 z-20">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                fileRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white hover:bg-[#a855f7]/10 transition"
            >
              <Paperclip size={16} className="text-[#a855f7]" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                cameraRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white hover:bg-[#a855f7]/10 transition"
            >
              <Camera size={16} className="text-[#a855f7]" /> Kamera
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setGithubOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white hover:bg-[#a855f7]/10 transition"
            >
              <Github size={16} className="text-[#a855f7]" /> Impor Repo GitHub
            </button>
          </div>
        )}

        <button
          type="button"
          aria-label="attachment menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-[#a855f7]/10 hover:bg-[#a855f7]/20 transition"
        >
          <Plus
            size={18}
            className={`text-[#a855f7] transition-transform ${menuOpen ? "rotate-45" : ""}`}
          />
        </button>


        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Bara Agent..."
          disabled={disabled}
          className="flex-1 min-w-0 resize-none bg-transparent text-white text-sm leading-6 py-1.5 outline-none placeholder:text-gray-500 overflow-y-auto"
        />

        <button
          type="button"
          aria-label="send"
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full transition bg-[#dc2626] hover:bg-[#a855f7] disabled:bg-[#6b21a8]/40 disabled:hover:bg-[#6b21a8]/40"
        >
          <Send size={16} className={canSend ? "text-white" : "text-gray-500"} />
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-500">
        Bara Agent dapat membuat kesalahan. Periksa info penting.
      </p>
    </div>
  );
}
