import { Link } from "@tanstack/react-router";
import { MessageSquare, TerminalSquare, Wrench, History, CircleUser } from "lucide-react";

const ITEMS = [
  { to: "/chat", label: "Chat", Icon: MessageSquare },
  { to: "/prompt", label: "Prompt", Icon: TerminalSquare },
  { to: "/tools", label: "Tools", Icon: Wrench },
  { to: "/riwayat", label: "Riwayat", Icon: History },
  { to: "/akun", label: "Akun", Icon: CircleUser },
] as const;

export default function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-[#a855f7]/25 bg-[#0a0a0f] px-2 pb-2 pt-3 font-mono">
      <ul className="flex items-end justify-between">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="group flex flex-col items-center gap-1.5 py-1 text-[#a1a1aa] transition data-[status=active]:text-[#a855f7]"
              activeProps={{ "data-active": "true" }}
            >
              <span className="flex h-10 w-12 items-center justify-center rounded-xl border border-transparent transition group-data-[status=active]:border-[#a855f7]/70 group-data-[status=active]:bg-[#a855f7]/10 group-data-[status=active]:shadow-[0_0_16px_rgba(168,85,247,0.45)]">
                <Icon size={22} />
              </span>
              <span className="text-[11px] tracking-wider group-data-[status=active]:font-bold">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
