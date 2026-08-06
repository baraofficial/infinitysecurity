import { useState, type ReactNode } from "react";
import { Code2, Copy, Check, Eye, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);
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
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest rounded hover:bg-neon/10"
            style={{ color: "#a855f7", border: "1px solid #a855f733" }}
          >
            <Eye size={11} />
            VIEW CODE
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="close"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "#12121a", border: "1px solid #a855f7", color: "#a855f7" }}
            >
              <X size={18} />
            </button>
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: "#111119", border: "1px solid #a855f7" }}
            >
              <div
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{ borderBottom: "1px solid #a855f733" }}
              >
                <span className="text-xs tracking-widest" style={{ color: "#c084fc" }}>
                  {label} CODE
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] tracking-widest"
                  style={{ color: "#a855f7", border: "1px solid #a855f733" }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "COPIED!" : "COPY CODE"}
                </button>
              </div>
              <div
                style={{
                  overflow: "auto",
                  maxHeight: "70vh",
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function stripMarkdownEmphasis(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1$2");
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => stripMarkdownEmphasis(c.trim()));
}

function MarkdownTable({ rows }: { rows: string[] }) {
  const head = splitRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitRow);
  return (
    <div className="my-2 overflow-x-auto rounded-xl" style={{ border: "1px solid #a855f755" }}>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-bold whitespace-nowrap"
                style={{ color: "#a855f7", borderBottom: "1px solid #a855f755", background: "#12121a" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((r, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? "#0f0f16" : "transparent" }}>
              {head.map((_, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 align-top text-gray-200"
                  style={{ borderTop: "1px solid #a855f722" }}
                >
                  {r[ci] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function TextWithTables({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: ReactNode[] = [];
  let buffer: string[] = [];

  const flushText = () => {
    if (buffer.length) {
      out.push(
        <span key={`t${out.length}`} className="whitespace-pre-wrap">
          {stripMarkdownEmphasis(buffer.join("\n"))}
        </span>,
      );
      buffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const isTableStart =
      lines[i].trim().includes("|") &&
      i + 1 < lines.length &&
      TABLE_SEP.test(lines[i + 1]);
    if (isTableStart) {
      flushText();
      const rows: string[] = [lines[i], lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().includes("|")) {
        rows.push(lines[j]);
        j++;
      }
      out.push(<MarkdownTable key={`tbl${out.length}`} rows={rows} />);
      i = j - 1;
    } else {
      buffer.push(lines[i]);
    }
  }
  flushText();
  return <>{out}</>;
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
  if (parts.length === 0) return <TextWithTables content={content} />;

  return (
    <>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.content} lang={p.lang || ""} />
        ) : (
          <TextWithTables key={i} content={p.content} />
        ),
      )}
    </>
  );
}
