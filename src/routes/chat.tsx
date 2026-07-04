import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Send, LogOut, Menu, Trash2, MessageSquare, Camera, Paperclip, Settings, Loader2, Search } from "lucide-react";
import { RenderMessage } from "@/components/CodeBlock";
import { SettingsModal } from "@/components/SettingsModal";

const IMAGE_TRIGGERS = /(buatkan gambar|generate image|buat foto|\/imagine|imagine)/i;
const IMG_PREFIX = "__IMG__:";

function ImageMessage({ content }: { content: string }) {
  const prompt = content.slice(IMG_PREFIX.length);
  const url = `https://placehold.co/600x400/0a0a0a/3b82f6?text=AI+Image`;
  return (
    <div className="space-y-2">
      <img
        src={url}
        alt={prompt}
        className="max-w-full"
        style={{
          border: "1px solid var(--accent-color)",
          boxShadow: "0 0 20px var(--accent-color)",
        }}
      />
      <p className="text-[10px] tracking-wider text-neon/70">Prompt: {prompt}</p>
    </div>
  );
}

export const Route = createFileRoute("/chat")({
  ssr: false,
  component: ChatPage,
});

type Conversation = { id: string; title: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant"; content: string; media?: { url: string; type: string }[] };

function ChatPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setUserId(data.session.user.id);
      const { data: p } = await supabase.from("profiles").select("username").eq("id", data.session.user.id).maybeSingle();
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

  useEffect(() => { loadConversations(); }, [loadConversations]);

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function newChat() {
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function deleteChat(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) { setActiveId(null); setMessages([]); }
    loadConversations();
  }

  async function send() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending || !userId) return;
    const titleText = text || (attachments.length ? `[${attachments.length} media]` : "chat");
    setInput("");
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
        type: f.type.startsWith("video/") ? "video" : "image",
      }));
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, media };
      setMessages((m) => [...m, userMsg]);
      setAttachments([]);

      await supabase.from("messages").insert({
        conversation_id: convId, user_id: userId, role: "user", content: text,
      });

      const isImageReq = imageMode || IMAGE_TRIGGERS.test(text);

      if (isImageReq) {
        const cleanPrompt = text.replace(IMAGE_TRIGGERS, "").trim() || text;
        await new Promise((r) => setTimeout(r, 2500));
        const imgContent = IMG_PREFIX + cleanPrompt;
        const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: imgContent };
        setMessages((m) => [...m, aiMsg]);
        await supabase.from("messages").insert({
          conversation_id: convId, user_id: userId, role: "assistant", content: imgContent,
        });
        setImageMode(false);
      } else {
        const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const { data: sess } = await supabase.auth.getSession();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ messages: history }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || "AI request failed");
        }
        const { content } = (await res.json()) as { content: string };
        const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content };
        setMessages((m) => [...m, aiMsg]);
        await supabase.from("messages").insert({
          conversation_id: convId, user_id: userId, role: "assistant", content,
        });
      }
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
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
    <div className="flex h-screen bg-black text-neon font-mono overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 top-0 left-0 h-full w-72 bg-black border-r-2 border-neon flex flex-col transition-[...]
        style={{ boxShadow: sidebarOpen ? "var(--shadow-neon)" : undefined }}
      >
        <div className="p-4 border-b-2 border-neon/60">
          <button
            onClick={newChat}
            className="mt-3 w-full border border-neon px-3 py-2 text-xs tracking-widest hover:bg-neon hover:text-black transition flex items-center gap-2 justify-center rounded-2xl"
          >
            <Plus size={14} /> NEW CHAT
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4">// no transmissions yet</p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2 border text-xs cursor-pointer transition rounded-2xl ${
                activeId === c.id ? "border-neon bg-neon/10" : "border-transparent hover:border-neon/40"
              }`}
              onClick={() => { setActiveId(c.id); setSidebarOpen(false); }}
            >
              <MessageSquare size={12} className="shrink-0 text-neon/70" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-neon/60 hover:text-destructive"
                aria-label="delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t-2 border-neon/60">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="settings"
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border transition text-xs tracking-widest"
            style={{ borderColor: "#a855f733", color: "#a855f7" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#a855f7";
              e.currentTarget.style.backgroundColor = "#a855f722";
              e.currentTarget.style.boxShadow = "0 0 12px #a855f766";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#a855f733";
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Settings size={18} color="#a855f7" />
            <span>Setting</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col">
          {/* Kapsul Header */}
          <div className="flex items-center justify-center gap-3 px-6 py-4 mx-4 mt-4 bg-[#1F1F1F] border border-[#8B5CF6] rounded-full">
            {/* Icon Menu */}
            <span className="text-[#8B5CF6] text-xl">☰</span>
            
            {/* Teks INFINITY AI */}
            <h1 className="text-[#8B5CF6] text-sm font-bold tracking-widest">
              INFINITY AI
            </h1>
          </div>

          {/* Garis Ungu Separator */}
          <div className="h-[2px] bg-[#8B5CF6] w-full mt-2"></div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="h-full flex items-center justify-center text-center px-4">
              <div>
                <div className="text-xl sm:text-2xl text-neon tracking-[0.2em]" style={{ textShadow: "0 0 14px var(--neon)" }}>
                  Welcome to Infinity AI
                </div>
                <div className="mt-3 text-[10px] sm:text-xs tracking-[0.3em] text-neon/70">
                  by Bara Official
                </div>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[70%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "px-4 py-3 border border-neon bg-neon/10 text-neon rounded-2xl rounded-tr-sm"
                    : "px-5 py-4 text-neon/90 rounded-[20px]"
                }`}
                style={
                  m.role === "assistant"
                    ? { border: "1px solid #8B5CF6", backgroundColor: "rgba(139,92,246,0.05)" }
                    : undefined
                }
              >
                <div className="text-[9px] tracking-widest text-neon/60 mb-1">
                  {m.role === "user" ? `> ${username}` : "> infinity"}
                </div>
                {m.role === "assistant" ? (
                  m.content.startsWith(IMG_PREFIX)
                    ? <ImageMessage content={m.content} />
                    : <RenderMessage content={m.content} />
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
                              className="max-w-full"
                              style={{ border: "1px solid var(--accent-color)", boxShadow: "0 0 12px var(--accent-color)" }}
                            />
                          ) : (
                            <img
                              key={i}
                              src={mm.url}
                              alt="attachment"
                              className="max-w-full"
                              style={{ border: "1px solid var(--accent-color)", boxShadow: "0 0 12px var(--accent-color)" }}
                            />
                          ),
                        )}
                      </div>
                    )}
                    {m.content && <span className="whitespace-pre-wrap block">{m.content}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="border border-neon/40 px-4 py-3 text-sm flex items-center gap-2" style={{ color: "var(--accent-color)" }}>
                {imageMode || IMAGE_TRIGGERS.test(input + " " + (messages[messages.length - 1]?.content ?? "")) ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>🎨 Generating your image...</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block animate-pulse">thinking</span>
                    <span className="ml-1 animate-pulse">▍</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t-2 border-neon p-3 sm:p-4"
        >
          <div className="relative flex items-center gap-2 rounded-full bg-[#1F1F1F] border border-transparent pl-4 pr-2 py-1">
            {attachOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl border-2 border-neon bg-black z-10 overflow-hidden" style={{ boxShadow: "var(--shadow-neon)" }}>
                <button
                  type="button"
                  onClick={() => { cameraRef.current?.click(); setAttachOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs tracking-widest text-neon hover:bg-neon hover:text-black transition"
                >
                  <Camera size={14} /> CAMERA
                </button>
                <button
                  type="button"
                  onClick={() => { fileRef.current?.click(); setAttachOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs tracking-widest text-neon hover:bg-neon hover:text-black transition border-t border-neon/40"
                >
                  <Paperclip size={14} /> FILE
                </button>
              </div>
            )}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFiles}
            />
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFiles}
            />
            <button
              type="button"
              onClick={() => setAttachOpen((v) => !v)}
              className="p-1 text-neutral-400 hover:text-neon transition"
              aria-label="attach"
            >
              <Search size={18} />
            </button>
            {attachments.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-neon/70">
                {attachments.length} file{attachments.length > 1 ? "s" : ""}
                <button type="button" onClick={() => setAttachments([])} className="text-neon/50 hover:text-neon ml-1">×</button>
              </div>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={imageMode ? "Describe the image you want..." : "Message Infinity AI..."}
              disabled={sending}
              className="flex-1 min-w-0 bg-transparent text-neon text-sm outline-none placeholder:text-neutral-500 caret-neon py-2"
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || sending}
              className="p-2 rounded-full text-neon hover:bg-neon/10 disabled:opacity-40 transition"
              aria-label="send"
              style={{ color: "var(--neon)" }}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </main>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
