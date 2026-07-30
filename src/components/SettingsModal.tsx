import { useState, useEffect } from 'react';
import { X, Upload, Trash2, LogOut, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUsernameChange: (name: string) => void;
  onUploadPhoto: (file: File) => void;
  onLogout: () => void;
  onClearChat: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  username,
  onUsernameChange,
  onUploadPhoto,
  onLogout,
  onClearChat,
}: SettingsModalProps) {
  const [tempUsername, setTempUsername] = useState(username);
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  // Load data dari localStorage pas modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTempUsername(username);
      const sp = localStorage.getItem("systemPrompt") || "Kamu adalah Infinity AI, asisten AI yang membantu dan ramah.";
      setSystemPrompt(sp);
    }
  }, [isOpen, username]);

  const handleSave = () => {
    onUsernameChange(tempUsername);
    localStorage.setItem("systemPrompt", systemPrompt); // SIMPAN SYSTEM PROMPT
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadPhoto(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] border-2 border-[#8B5CF6] rounded-2xl w-full max-w-md p-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#8B5CF6] text-lg font-bold tracking-widest">SETTINGS</h2>
          <button onClick={onClose} className="text-[#8B5CF6] hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="text-xs text-[#8B5CF6] tracking-widest mb-2 block">USERNAME</label>
          <div className="flex items-center gap-2 bg-black border border-[#8B5CF6] rounded-xl px-3 py-2">
            <User size={16} className="text-[#8B5CF6]" />
            <input
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className="bg-transparent outline-none text-white text-sm w-full"
            />
          </div>
        </div>

        {/* SYSTEM PROMPT BARU */}
        <div className="mb-4">
          <label className="text-xs text-[#8B5CF6] tracking-widest mb-2 block">SYSTEM PROMPT</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full bg-black border-[#8B5CF6] rounded-xl px-3 py-2 text-white text-sm outline-none resize-none"
            placeholder="Atur kepribadian AI di sini..."
          />
        </div>

        {/* Upload Photo */}
        <div className="mb-4">
          <label className="text-xs text-[#8B5CF6] tracking-widest mb-2 block">PROFILE PHOTO</label>
          <label className="flex items-center justify-center gap-2 bg-black border border-dashed border-[#8B5CF6] rounded-xl px-3 py-3 cursor-pointer hover:bg-[#8B5CF6]/10">
            <Upload size={16} className="text-[#8B5CF6]" />
            <span className="text-xs text-[#8B5CF6]">Upload Foto</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 bg-black border-red-500 text-red-500 rounded-xl px-3 py-2 text-sm hover:bg-red-500 hover:text-white"
          >
            <Trash2 size={16} /> Clear Chat
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-black border border-[#8B5CF6] text-[#8B5CF6] rounded-xl px-3 py-2 text-sm hover:bg-[#8B5CF6] hover:text-black"
          >
            <LogOut size={16} /> Logout
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-[#8B5CF6] text-black font-bold rounded-xl px-3 py-2 text-sm mt-2"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
