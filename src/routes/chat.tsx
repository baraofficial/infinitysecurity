import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  LogOut,
  Menu,
  Trash2,
  MessageSquare,
  Settings,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Github,
  ChevronDown,
} from "lucide-react";
import { RenderMessage } from "@/components/CodeBlock";
import SettingsModal from "@/components/SettingsModal";
import ChatInput from "@/components/ChatInput";
import BottomNav from "@/components/BottomNav";

export const Route = createFileRoute("/chat")({
  ssr: false,
  component: ChatPage,
});

type Conversation = { id: string; title: string; updated_at: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  media?: { url: string; type: string; name?: string }[];
};

const DEFAULT_SYSTEM_PROMPT =
  "Kamu adalah Bara Agent, asisten AI yang cerdas, membantu, dan ramah.";

const REPO_RE = /(https?:\/\/github\.com\/[^\s]+)/i;

function RepoCard({ url }: { url: string }) {
  const clean = url.replace(/[.,)]+$/, "");
  const parts = clean.replace(/^https?:\/\/github\.com\//i, "").split("/");
  return (
    <a
      href={clean}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 border border-[#a855f7]/50 bg-[#0a0a0f] px-3 py-2 rounded-xl hover:bg-[#a855f7]/10 transition"
    >
      <Github size={18} className="shrink-0 text-[#a855f7]" />
      <span className="min-w-0">
        <span className="block text-[10px] tracking-widest text-[#a855f7]/70">
          GITHUB REPO
        </span>
        <span className="block truncate text-xs text-[#f5f5f5]">
          {parts[0]}/{parts[1] ?? ""}
        </span>
      </span>
    </a>
  );
}

function AssistantActions({ content }: { content: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className="mt-3 flex items-center gap-1 border-t border-[#a855f7]/20 pt-2">
      <button
        type="button"
        aria-label="salin"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(content);
            toast.success("Disalin");
          } catch {
            toast.error("Gagal menyalin");
          }
        }}
        className="h-7 w-7 flex items-center justify-center rounded-lg text-[#a855f7]/70 hover:text-white hover:bg-[#a855f7]/15 transition"
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        aria-label="suka"
        onClick={() => {
          setVote("up");
          toast.success("Terima kasih atas feedback-nya");
        }}
        className={`h-7 w-7 flex items-center justify-center rounded-lg transition hover:bg-[#a855f7]/15 ${
          vote === "up" ? "text-[#a855f7]" : "text-[#a855f7]/70 hover:text-white"
        }`}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        type="button"
        aria-label="tidak suka"
        onClick={() => {
          setVote("down");
          toast("Masukan diterima");
        }}
        className={`h-7 w-7 flex items-center justify-center rounded-lg transition hover:bg-[#a855f7]/15 ${
          vote === "down" ? "text-[#a855f7]" : "text-[#a855f7]/70 hover:text-white"
        }`}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}

function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const d = localStorage.getItem("draftPrompt");
    if (d) {
      setDraft(d);
      localStorage.removeItem("draftPrompt");
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.session.user.id)
        .maybeSingle();
      setUsername(p?.username || data.session.user.email?.split("@")[0] || "user");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!sess) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    setConversations(data ?? []);
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id,role,content")
      .eq("conversation_id", cid)
      .order("created_at");
    setMessages((data ?? []) as Message[]);
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollBtn(!nearBottom);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function deleteChat(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    loadConversations();
  }

  async function clearChat() {
    if (!activeId) {
      setMessages([]);
      return;
    }
    await supabase.from("messages").delete().eq("conversation_id", activeId);
    setMessages([]);
  }

  async function send(text: string) {
    if ((!text && attachments.length === 0) || sending || !userId) return;
    const titleText =
      text || (attachments.length ? `[${attachments.length} media]` : "chat");
    setSending(true);

    let convId = activeId;
    try {
      if (!convId) {
        const { data: conv, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title: titleText.slice(0, 40) })
          .select("id")
          .single();
        if (error) throw error;
        convId = conv.id;
        setActiveId(convId);
      }

      const media = attachments.map((f) => ({
        url: URL.createObjectURL(f),
        type: f.type.startsWith("video/")
          ? "video"
          : f.type.startsWith("image/")
            ? "image"
            : "file",
        name: f.name,
      }));
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        media,
      };
      setMessages((m) => [...m, userMsg]);
      setAttachments([]);

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId,
        role: "user",
        content: text,
      });

      const systemPrompt =
        localStorage.getItem("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...[...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const aiId = crypto.randomUUID();
      let content = "";

      if (res.body) {
        // Streaming: bytes mulai mengalir langsung, jadi tidak kena timeout 524
        setMessages((m) => [...m, { id: aiId, role: "assistant", content: "" }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                setMessages((m) =>
                  m.map((mm) => (mm.id === aiId ? { ...mm, content } : mm)),
                );
              }
            } catch {
              /* ignore partial chunk */
            }
          }
        }
      }

      if (!content) {
        content = "(kosong)";
        setMessages((m) =>
          m.some((mm) => mm.id === aiId)
            ? m.map((mm) => (mm.id === aiId ? { ...mm, content } : mm))
            : [...m, { id: aiId, role: "assistant", content }],
        );
      }

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId,
        role: "assistant",
        content,
      });


      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
      loadConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "send failed");
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-[#a855f7] font-mono overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 top-0 left-0 h-full w-72 bg-[#0a0a0f] border-r border-[#a855f7]/40 flex flex-col transition-transform`}
      >
        <div className="p-4 border-b border-[#a855f7]/30">
          <button
            onClick={newChat}
            className="w-full border border-[#a855f7] px-3 py-2 text-xs tracking-widest hover:bg-[#a855f7] hover:text-black transition flex items-center gap-2 justify-center rounded-2xl"
          >
            <Plus size={14} /> NEW CHAT
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-gray-500 px-2 py-4">// no transmissions yet</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2 border text-xs cursor-pointer transition rounded-2xl ${
                activeId === c.id
                  ? "border-[#a855f7] bg-[#a855f7]/10"
                  : "border-transparent hover:border-[#a855f7]/40"
              }`}
              onClick={() => {
                setActiveId(c.id);
                setSidebarOpen(false);
              }}
            >
              <MessageSquare size={12} className="shrink-0 text-[#a855f7]/70" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[#a855f7]/60 hover:text-white"
                aria-label="delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#a855f7]/30">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-[#a855f7]/40 text-[#a855f7] text-xs tracking-widest hover:bg-[#a855f7]/10 transition"
          >
            <LogOut size={16} /> LOG OUT
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="relative flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="menu"
            className="shrink-0 h-11 w-11 flex items-center justify-center bg-[#12121a] border border-[#a855f7]/40 rounded-2xl hover:bg-[#a855f7]/10 transition"
          >
            <Menu size={20} className="text-[#a855f7]" />
          </button>

          <div className="flex items-center gap-3 px-5 py-2 bg-[#12121a] border border-[#a855f7]/40 rounded-full">
            <span className="text-[#a855f7] text-sm font-bold tracking-widest">
              BARA AGENT
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="settings"
            className="shrink-0 h-11 w-11 flex items-center justify-center bg-[#12121a] border border-[#a855f7]/40 rounded-2xl hover:bg-[#a855f7]/10 transition"
          >
            <Settings size={20} className="text-[#a855f7]" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="h-full flex items-center justify-center text-center px-4">
              <div className="flex flex-col items-center">
                <div className="mt-6 text-xl sm:text-2xl text-[#a855f7] tracking-[0.2em]">
                  Welcome to Bara Agent
                </div>
                <div className="mt-3 text-[10px] sm:text-xs tracking-[0.3em] text-[#a855f7]/70">
                  by Bara Official
                </div>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] text-sm leading-relaxed rounded-2xl ${
                  m.role === "user"
                    ? "px-4 py-3 border border-[#a855f7]/50 bg-[#a855f7]/10 text-[#f5f5f5]"
                    : "px-5 py-4 border border-[#a855f7]/40 bg-[#12121a] text-[#f5f5f5]"
                }`}
              >
                <div className="text-[9px] tracking-widest text-[#a855f7]/70 mb-1">
                  {m.role === "user" ? `> ${username}` : "> bara"}
                </div>
                {m.role === "assistant" ? (
                  <>
                    <RenderMessage content={m.content} />
                    <AssistantActions content={m.content} />
                  </>
                ) : (
                  <div className="space-y-2">
                    {m.media && m.media.length > 0 && (
                      <div className="space-y-2">
                        {m.media.map((mm, i) =>
                          mm.type === "video" ? (
                            <video
                              key={i}
                              src={mm.url}
                              controls
                              className="max-w-full rounded-xl border border-[#a855f7]/40"
                            />
                          ) : mm.type === "image" ? (
                            <img
                              key={i}
                              src={mm.url}
                              alt="attachment"
                              className="max-w-full rounded-xl border border-[#a855f7]/40"
                            />
                          ) : (
                            <a
                              key={i}
                              href={mm.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-xs px-3 py-2 rounded-xl border border-[#a855f7]/40 bg-[#0a0a0f] text-[#f5f5f5]"
                            >
                              📄 {mm.name ?? "file"}
                            </a>
                          ),
                        )}
                      </div>
                    )}
                    {REPO_RE.test(m.content) && (
                      <RepoCard url={m.content.match(REPO_RE)![1]} />
                    )}
                    {m.content && (
                      <span className="whitespace-pre-wrap block">{m.content}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[#a855f7]/40 bg-[#12121a] px-4 py-3 text-sm flex items-center gap-2 text-[#a855f7]">
                <span className="inline-block animate-pulse">thinking</span>

              </div>
            </div>
          )}
        </div>

        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="scroll to new messages"
            className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-[#12121a] border border-[#a855f7]/60 text-[#a855f7] text-xs shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:bg-[#a855f7]/10 transition animate-fade-in"
          >
            ⬇️ <ChevronDown size={16} />
          </button>
        )}

        <ChatInput
          initialText={draft}
          onSend={send}
          onFiles={(files) => setAttachments((prev) => [...prev, ...files])}
          disabled={sending}
          attachments={attachments}
          onRemoveAttachment={(i) =>
            setAttachments((prev) => prev.filter((_, idx) => idx !== i))
          }
          onClearAttachments={() => setAttachments([])}
        />
        <BottomNav />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        username={username}
        onUsernameChange={setUsername}
        onLogout={signOut}
        onClearChat={clearChat}
      />
    </div>
  );
}
