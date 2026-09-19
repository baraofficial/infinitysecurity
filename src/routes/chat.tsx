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
  MoreVertical,
  Share2,
} from "lucide-react";
import { RenderMessage } from "@/components/CodeBlock";
import SettingsModal from "@/components/SettingsModal";
import ChatInput from "@/components/ChatInput";

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
  "Kamu adalah Bara AI, asisten AI yang cerdas, membantu, dan ramah.";

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
  const [menuId, setMenuId] = useState<string | null>(null);

  async function shareChat(c: Conversation) {
    const url = `${window.location.origin}/chat?c=${c.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: c.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link disalin");
      }
    } catch {
      /* dibatalkan */
    }
  }

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

  // Auto-scroll: only when user isn't actively scrolling; use auto behavior to reduce repaint
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isUserScrolling) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [messages, sending, isUserScrolling]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let userScrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      // mark user scrolling briefly
      setIsUserScrolling(true);
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
      userScrollTimeout = setTimeout(() => setIsUserScrolling(false), 700);

      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollBtn(!nearBottom);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
      el.removeEventListener("scroll", handleScroll);
    };
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
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 top-0 left-0 h-full w-72 bg-[#0a0a0f] border-r border-[#a855f7]/40 flex flex-col transition-transform duration-300`}
      >
        <div className="p-4">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#a855f7]/50 px-4 py-3 text-sm hover:bg-[#a855f7]/10 transition"
          >
            <Plus size={16} /> NEW CHAT
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2.5 cursor-pointer transition ${
                activeId === c.id
                  ? "bg-[#a855f7]/15 border border-[#a855f7]/40"
                  : "hover:bg-[#a855f7]/5 border border-transparent"
              }`}
              onClick={() => {
                setActiveId(c.id);
                setSidebarOpen(false);
              }}
            >
              <MessageSquare size={14} className="shrink-0 text-[#a855f7]/60" />
              <span className="flex-1 truncate text-xs text-[#f5f5f5]">
                {c.title}
              </span>
              <button
                type="button"
                aria-label="opsi"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId(menuId === c.id ? null : c.id);
                }}
                className="shrink-0 text-[#a855f7]/60 hover:text-white p-1"
              >
                <MoreVertical size={14} />
              </button>
              {menuId === c.id && (
                <div
                  className="absolute right-2 top-full z-40 mt-1 w-32 rounded-xl border border-[#a855f7]/40 bg-[#12121a] py-1 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setMenuId(null);
                      shareChat(c);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#a855f7] hover:bg-[#a855f7]/10"
                  >
                    <Share2 size={13} /> Bagikan
                  </button>
                  <button
                    onClick={() => {
                      setMenuId(null);
                      deleteChat(c.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#ef4444] hover:bg-[#ef4444]/10"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-[#a855f7]/30 p-3 space-y-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs hover:bg-[#a855f7]/10 transition"
          >
            <Settings size={15} /> Setting
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-xs text-[#a855f7]/70 hover:bg-[#a855f7]/10 transition"
          >
            <LogOut size={15} /> {username || "user"}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-6 border-b border-[#a855f7]/30 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="menu"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[#a855f7]/50"
          >
            <Menu size={16} />
          </button>
          <div className="inline-flex items-center rounded-full border border-[#a855f7]/50 px-4 py-1.5 overflow-hidden max-w-full">
            <span className="whitespace-nowrap text-xs font-bold tracking-[0.25em] animate-marquee">
              BARA AI V 24.08 by Bara Official&nbsp;&nbsp;&nbsp;BARA AI V 24.08
              by Bara Official&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 relative">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-lg font-bold tracking-[0.3em]">BARA AI</p>
              <p className="mt-2 text-[11px] text-[#a855f7]/60">
                by Bara Official
              </p>
              <p className="mt-4 text-xs text-[#71717a]">
                Mulai percakapan baru di bawah.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] bg-[#a855f7]/15 border border-[#a855f7]/40 px-4 py-3 text-sm text-[#f5f5f5]"
                        : "max-w-[85%] rounded-[20px] border border-[#8B5CF6] bg-transparent px-5 py-4 text-sm text-[#a855f7]"
                    }
                  >
                    {m.media && m.media.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {m.media.map((med, i) =>
                          med.type === "image" ? (
                            <img
                              key={i}
                              src={med.url}
                              alt={med.name || "gambar"}
                              className="max-h-48 rounded-lg border border-[#a855f7]/40"
                            />
                          ) : med.type === "video" ? (
                            <video
                              key={i}
                              src={med.url}
                              controls
                              className="max-h-48 rounded-lg border border-[#a855f7]/40"
                            />
                          ) : (
                            <span
                              key={i}
                              className="rounded-lg border border-[#a855f7]/40 px-2 py-1 text-[10px]"
                            >
                              {med.name || "file"}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      m.content ? (
                        <>
                          <RenderMessage content={m.content} />
                          {REPO_RE.test(m.content) && (
                            <div className="mt-2 space-y-2">
                              {(m.content.match(REPO_RE) ?? []).map((u) => (
                                <RepoCard key={u} url={u} />
                              ))}
                            </div>
                          )}
                          <AssistantActions content={m.content} />
                        </>
                      ) : (
                        <span className="text-xs text-[#a855f7]/60">
                          thinking
                        </span>
                      )
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            aria-label="ke bawah"
            className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-[#a855f7]/50 bg-[#12121a] text-[#a855f7] hover:bg-[#a855f7]/15 transition"
          >
            <ChevronDown size={16} />
          </button>
        )}

        {/* Input */}
        <div className="border-t border-[#a855f7]/30 p-3">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={send}
              disabled={sending}
              initialText={draft}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>
        </div>
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
