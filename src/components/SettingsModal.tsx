import { useState, useEffect } from 'react';
import { X, Trash2, User, Database } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const PROTECTED_KEYS = ['theme'];

export default function SettingsModal({
  isOpen,
  onClose,
  username,
  onUsernameChange,
  onClearChat,
}: SettingsModalProps) {
  const [tempUsername, setTempUsername] = useState(username);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [confirm, setConfirm] = useState<null | 'chat' | 'data'>(null);

  useEffect(() => {
    if (isOpen) {
      setTempUsername(username);
      setSystemPrompt(localStorage.getItem('systemPrompt') || DEFAULT_SYSTEM_PROMPT);
      supabase.auth.getUser().then(({ data }) => {
        const u = data.user;
        if (!u) return;
        setEmail(u.email ?? '');
        const meta = u.user_metadata as Record<string, unknown> | null;
        const pic = (meta?.avatar_url || meta?.picture) as string | undefined;
        setAvatar(pic || '');
      });
    }
  }, [isOpen, username]);

  const handleSave = () => {
    onUsernameChange(tempUsername);
    localStorage.setItem('currentUser', tempUsername);
    localStorage.setItem('systemPrompt', systemPrompt);
    toast.success('Settings updated');
    onClose();
  };

  const runConfirm = () => {
    if (confirm === 'chat') {
      onClearChat();
      toast.success('Chat deleted');
    } else if (confirm === 'data') {
      Object.keys(localStorage)
        .filter((k) => !PROTECTED_KEYS.includes(k))
        .forEach((k) => localStorage.removeItem(k));
      onClearChat();
      toast.success('Data deleted');
    }
    setConfirm(null);
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
          {/* Google account */}
          {(email || avatar) && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#a855f7]/40 bg-[#0a0a0f] px-4 py-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Foto profil Google"
                  className="h-10 w-10 rounded-full border border-[#a855f7]/50 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#a855f7]/50">
                  <User size={16} className="text-[#a855f7]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{username}</p>
                <p className="truncate text-[11px] text-[#71717a]">{email}</p>
              </div>
            </div>
          )}

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
            onClick={() => setConfirm('chat')}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#a855f7]/50 bg-transparent px-4 py-3 text-sm text-[#a855f7] hover:bg-[#a855f7]/10"
          >
            <Trash2 size={16} /> Delete Chat
          </button>

          <button
            onClick={() => setConfirm('data')}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#a855f7]/50 bg-transparent px-4 py-3 text-sm text-[#a855f7] hover:bg-[#a855f7]/10"
          >
            <Database size={16} /> Delete Data
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

      {/* Confirmation popup */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-[#a855f7]/50 bg-[#12121a] p-5 text-center">
            <p className="text-sm text-white">Are you sure you want to delete?</p>
            <p className="mt-1 text-[11px] text-[#71717a]">This action cannot be undone.</p>
            <div className="mt-5 flex gap-[10px]">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-full border border-[#a855f7]/50 px-4 py-3 text-xs tracking-widest text-[#a855f7] hover:bg-[#a855f7]/10"
              >
                CANCEL
              </button>
              <button
                onClick={runConfirm}
                className="flex-1 rounded-full bg-[#ef4444] px-4 py-3 text-xs font-bold tracking-widest text-white hover:brightness-110"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
