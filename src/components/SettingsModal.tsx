import { useState, useEffect } from 'react';
import { X, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUsernameChange: (name: string) => void;
  onLogout: () => void;
  onClearChat: () => void;
}

const DEFAULT_SYSTEM_PROMPT =
  'Kamu adalah Bara AI, asisten AI yang cerdas, membantu, dan ramah.';

export default function SettingsModal({
  isOpen,
  onClose,
  username,
  onUsernameChange,
  onClearChat,
}: SettingsModalProps) {
  const [tempUsername, setTempUsername] = useState(username);
  const [systemPrompt, setSystemPrompt] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTempUsername(username);
      setSystemPrompt(localStorage.getItem('systemPrompt') || DEFAULT_SYSTEM_PROMPT);
    }
  }, [isOpen, username]);

  const handleSave = () => {
    onUsernameChange(tempUsername);
    localStorage.setItem('currentUser', tempUsername);
    localStorage.setItem('systemPrompt', systemPrompt);
    toast.success('Settings updated');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Right sidebar */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col border-l border-[#a855f7]/40 bg-[#12121a] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#a855f7]/30 px-5 py-4">
          <h2 className="text-sm font-bold tracking-[0.3em] text-[#a855f7]">SETTINGS</h2>
          <button onClick={onClose} className="text-[#a855f7] hover:text-white" aria-label="close">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {/* Username */}
          <div>
            <label className="mb-2 block text-xs tracking-widest text-[#a855f7]">USERNAME</label>
            <div className="flex items-center gap-2 rounded-full border border-[#a855f7]/40 bg-[#0a0a0f] px-4 py-3">
              <User size={16} className="text-[#a855f7]" />
              <input
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="mb-2 block text-xs tracking-widest text-[#a855f7]">
              SYSTEM PROMPT
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-2xl border border-[#a855f7]/40 bg-[#0a0a0f] px-4 py-3 text-sm text-white outline-none"
              placeholder="Atur kepribadian AI di sini..."
            />
          </div>

          <button
            onClick={onClearChat}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#a855f7]/50 bg-transparent px-4 py-3 text-sm text-[#a855f7] hover:bg-[#a855f7]/10"
          >
            <Trash2 size={16} /> Clear Chat
          </button>
        </div>

        <div className="flex gap-[10px] border-t border-[#a855f7]/30 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#a855f7]/50 bg-transparent px-4 py-3 text-sm text-[#a855f7] hover:bg-[#a855f7]/10"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-full bg-[#a855f7] px-4 py-3 text-sm font-bold text-black transition hover:brightness-110"
          >
            SAVE
          </button>
        </div>
      </aside>
    </>
  );
}
