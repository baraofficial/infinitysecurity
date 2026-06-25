import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Send, LogOut, Menu, Trash2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/chat")({
  ssr: false,
  component: ChatPage,
});

type Conversation = { id: string; title: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant"; content: string };

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (!text || sending || !userId) return;
    setInput("");
    setSending(true);

    let convId = activeId;
    try {
      if (!convId) {
        const { data: conv, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title: text.slice(0, 40) })
          .select("id")
          .single();
        if (error) throw error;
        convId = conv.id;
        setActiveId(convId);
      }

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((m) => [...m, userMsg]);

      await supabase.from("messages").insert({
        conversation_id: convId, user_id: userId, role: "user", content: text,
      });

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
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-30 top-0 left-0 h-full w-72 bg-black border-r-2 border-neon flex flex-col transition-transform`}
        style={{ boxShadow: sidebarOpen ? "var(--shadow-neon)" : undefined }}
      >
        <div className="p-4 border-b-2 border-neon/60">
          <div className="text-[10px] tracking-[0.3em] text-neon" style={{ textShadow: "0 0 8px var(--neon)" }}>
            BARA // {username}
          </div>
          <button
            onClick={newChat}
            className="mt-3 w-full border border-neon px-3 py-2 text-xs tracking-widest hover:bg-neon hover:text-black transition flex items-center gap-2 justify-center"
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
              className={`group flex items-center gap-2 px-2 py-2 border text-xs cursor-pointer transition ${
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
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 text-xs text-neon/70 hover:text-neon py-2 border border-neon/40 hover:border-neon">
            <LogOut size={12} /> DISCONNECT
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b-2 border-neon flex items-center gap-3 px-4 py-3">
          <button className="md:hidden text-neon" onClick={() => setSidebarOpen(true)} aria-label="menu">
            <Menu size={18} />
          </button>
          <div className="text-xs tracking-[0.3em] text-neon" style={{ textShadow: "0 0 8px var(--neon)" }}>
            BARA OFFICIAL V1 <span className="text-neon/50">[ WIDE EDITION ]</span>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-2xl text-neon tracking-[0.3em]" style={{ textShadow: "0 0 14px var(--neon)" }}>
                  &gt; READY
                </div>
                <p className="mt-3 text-xs text-muted-foreground">// type a transmission below</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 border text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "border-neon bg-neon/10 text-neon"
                    : "border-neon/40 bg-black text-neon/90"
                }`}
              >
                <div className="text-[9px] tracking-widest text-neon/60 mb-1">
                  {m.role === "user" ? `> ${username}` : "> bara"}
                </div>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="border border-neon/40 px-4 py-3 text-sm text-neon/70">
                <span className="inline-block animate-pulse">// processing</span>
                <span className="ml-1 animate-pulse">▍</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t-2 border-neon p-3 sm:p-4"
        >
          <div className="flex items-center gap-2 border-2 border-neon bg-black px-2 py-1" style={{ boxShadow: "var(--shadow-neon-sm)" }}>
            <button
              type="button"
              onClick={newChat}
              className="p-2 text-neon hover:bg-neon/10"
              aria-label="new chat"
            >
              <Plus size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="// transmit message..."
              disabled={sending}
              className="flex-1 bg-transparent text-neon text-sm outline-none placeholder:text-neon/40 caret-neon py-2"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-2 text-neon hover:bg-neon hover:text-black disabled:opacity-40 transition"
              aria-label="send"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-center text-[9px] tracking-widest text-muted-foreground">
            powered by bara official
          </p>
        </form>
      </main>
    </div>
  );
}
