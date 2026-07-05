import { useState, useRef, useEffect } from 'react';
import { Plus, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const callGeminiAPI = async (text: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY tidak ditemukan di .env');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: text,
              },
            ],
          },
        ],
      }),
      credentials: 'omit',
      mode: 'cors',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      // Call Gemini API
      const response = await callGeminiAPI(text);
      
      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-neon font-mono overflow-hidden flex-col">
      {/* Header */}
      <div className="flex flex-col border-b-2 border-[#8B5CF6]">
        <div className="flex items-center justify-center gap-3 px-6 py-4 mx-4 mt-4 bg-[#1F1F1F] border border-[#8B5CF6] rounded-full">
          <span className="text-[#8B5CF6] text-xl">☰</span>
          <h1 className="text-[#8B5CF6] text-sm font-bold tracking-widest">INFINITY AI</h1>
        </div>
        <div className="h-[2px] bg-[#8B5CF6] w-full mt-2"></div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div>
              <div className="text-xl sm:text-2xl text-neon tracking-[0.2em]" style={{ textShadow: '0 0 14px var(--neon)' }}>
                Welcome to Infinity AI
              </div>
              <div className="mt-3 text-[10px] sm:text-xs tracking-[0.3em] text-neon/70">
                by Bara Official
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] sm:max-w-[70%] text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'px-4 py-3 border border-neon bg-neon/10 text-neon rounded-2xl rounded-tr-sm'
                  : 'px-5 py-4 text-neon/90 rounded-[20px]'
              }`}
              style={
                m.role === 'assistant'
                  ? { border: '1px solid #8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)' }
                  : undefined
              }
            >
              <div className="text-[9px] tracking-widest text-neon/60 mb-1">
                {m.role === 'user' ? '> you' : '> infinity'}
              </div>
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="border border-neon/40 px-4 py-3 text-sm flex items-center gap-2" style={{ color: 'var(--accent-color)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span>thinking</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t-2 border-neon p-3 sm:p-4"
      >
        <div className="relative flex items-center gap-2 rounded-full bg-[#1F1F1F] border border-[#8B5CF6] pl-2 pr-2 py-1">
          {/* Menu Dropdown */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-44 rounded-2xl border-2 border-[#8B5CF6] bg-black z-10 overflow-hidden" style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}>
              <button
                type="button"
                onClick={() => {
                  fileRef.current?.click();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs tracking-widest text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-black transition"
              >
                Upload File
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={() => {}}
          />

          {/* Plus Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:scale-110 transition"
            style={{ backgroundColor: '#8B5CF6', color: 'black' }}
            aria-label="menu"
          >
            <Plus size={16} strokeWidth={3} />
          </button>

          {/* Input Message */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Infinity AI..."
            disabled={sending}
            className="flex-1 min-w-0 bg-transparent text-neon text-sm outline-none placeholder:text-neutral-500 caret-[#8B5CF6] py-2"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-full hover:bg-[#8B5CF6]/10 disabled:opacity-40 transition"
            aria-label="send"
          >
            <Send size={18} color="#8B5CF6" />
          </button>
        </div>
      </form>
    </div>
  );
}
