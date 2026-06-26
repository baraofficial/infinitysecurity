import { useState } from "react";
import { Code2, Copy, Check, Eye, EyeOff } from "lucide-react";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string, lang: string) {
  const esc = escapeHtml(code);
  const l = lang.toLowerCase();
  if (l === "html" || l === "xml" || l === "svg" || /<[a-z!/]/i.test(code)) {
    return esc.replace(
      /(&lt;\/?)([a-zA-Z0-9-]+)([^&]*?)(\/?&gt;)/g,
      (_m, open, tag, attrs, close) => {
        const attrHtml = attrs.replace(
          /([a-zA-Z-:]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|"[^"]*"|'[^']*')/g,
          `<span style="color:#60a5fa">$1</span>$2<span style="color:#facc15">$3</span>`,
        );
        return `<span style="color:#c084fc">${open}${tag}</span>${attrHtml}<span style="color:#c084fc">${close}</span>`;
      },
    );
  }
  // generic: strings + keywords
  return esc
    .replace(/(&quot;[^&]*?&quot;|'[^']*'|"[^"]*")/g, `<span style="color:#facc15">$1</span>`)
    .replace(
      /\b(const|let|var|function|return|if|else|for|while|import|from|export|class|new|async|await)\b/g,
      `<span style="color:#c084fc">$1</span>`,
    );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const label = (lang || "code").toUpperCase();

  return (
    <div
      className="my-2 rounded-xl overflow-hidden"
      style={{ background: "#111119", border: "1px solid #a855f733" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 gap-2"
        style={{ borderBottom: "1px solid #a855f733" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Code2 size={14} style={{ color: "#a855f7" }} />
          <span className="text-xs tracking-widest truncate" style={{ color: "#c084fc" }}>
            {label} CODE
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest rounded hover:bg-neon/10"
            style={{ color: "#a855f7", border: "1px solid #a855f733" }}
          >
            {open ? <EyeOff size={11} /> : <Eye size={11} />}
            {open ? "HIDE" : "VIEW CODE"}
          </button>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest rounded hover:bg-neon/10"
            style={{ color: "#a855f7", border: "1px solid #a855f733" }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "COPIED!" : "COPY CODE"}
          </button>
        </div>
      </div>
      {open && (
        <div
          className="code-body"
          style={{
            overflowX: "auto",
            whiteSpace: "pre",
            fontFamily: "'Fira Code', 'JetBrains Mono', ui-monospace, monospace",
            fontSize: "13px",
            lineHeight: 1.6,
            padding: "12px",
            color: "#e9d5ff",
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
        </div>
      )}
    </div>
  );
}

export function RenderMessage({ content }: { content: string }) {
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: content.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1] || "", content: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push({ type: "text", content: content.slice(last) });
  if (parts.length === 0) return <>{content}</>;

  return (
    <>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.content} lang={p.lang || ""} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">{p.content}</span>
        ),
      )}
    </>
  );
}
