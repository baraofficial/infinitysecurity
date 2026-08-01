import { useRef, useState } from "react";
import { Plus, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
  attachmentCount?: number;
  onClearAttachments?: () => void;
}

export default function ChatInput({
  onSend,
  onFiles,
  disabled = false,
  attachmentCount = 0,
  onClearAttachments,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canSend = (value.trim().length > 0 || attachmentCount > 0) && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="p-4 bg-[#0a0a0f]">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles?.(files);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2 rounded-2xl bg-[#12121a] border border-[#ef4444]/30 px-2 py-2">
        <button
          type="button"
          aria-label="upload file"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition"
        >
          <Plus size={18} className="text-[#ef4444]" />
        </button>

        {attachmentCount > 0 && (
          <button
            type="button"
            onClick={onClearAttachments}
            className="shrink-0 text-[10px] text-[#ef4444] px-2"
          >
            {attachmentCount} file{attachmentCount > 1 ? "s" : ""} ×
          </button>
        )}

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Bara AI..."
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
        />

        <button
          type="button"
          aria-label="send"
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full transition bg-[#dc2626] hover:bg-[#ef4444] disabled:bg-[#7f1d1d]/40 disabled:hover:bg-[#7f1d1d]/40"
        >
          <Send size={16} className={canSend ? "text-white" : "text-gray-500"} />
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-500">
        Bara AI dapat membuat kesalahan. Periksa info penting.
      </p>
    </div>
  );
}
