import { useState, useEffect } from 'react';
import { X, Trash2, LogOut, User } from 'lucide-react';
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
  onLogout,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12121a] border border-[#ef4444]/50 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#ef4444] text-lg font-bold tracking-widest">SETTINGS</h2>
          <button onClick={onClose} className="text-[#ef4444] hover:text-white" aria-label="close">
            <X size={20} />
          </button>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="text-xs text-[#ef4444] tracking-widest mb-2 block">USERNAME</label>
          <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#ef4444]/40 rounded-full px-4 py-3">
            <User size={16} className="text-[#ef4444]" />
            <input
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="bg-transparent outline-none text-white text-sm w-full"
            />
          </div>
        </div>

        {/* System prompt */}
        <div className="mb-4">
          <label className="text-xs text-[#ef4444] tracking-widest mb-2 block">SYSTEM PROMPT</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            className="w-full bg-[#0a0a0f] border border-[#ef4444]/40 rounded-2xl px-4 py-3 text-white text-sm outline-none resize-none"
            placeholder="Atur kepribadian AI di sini..."
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#ef4444]/50 text-[#ef4444] rounded-full px-4 py-3 text-sm hover:bg-[#ef4444]/10"
          >
            <Trash2 size={16} /> Clear Chat
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#ef4444]/50 text-[#ef4444] rounded-full px-4 py-3 text-sm hover:bg-[#ef4444]/10"
          >
            <LogOut size={16} /> Log Out
          </button>
          <div className="flex gap-[10px] pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-transparent border border-[#ef4444]/50 text-[#ef4444] rounded-full px-4 py-3 text-sm hover:bg-[#ef4444]/10"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-[#dc2626] hover:bg-[#ef4444] text-white font-bold rounded-full px-4 py-3 text-sm transition"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
