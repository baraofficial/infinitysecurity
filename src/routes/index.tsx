import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Splash,
  head: () => ({
    meta: [
      { title: "Bara AI — AI Agent Serbaguna" },
      {
        name: "description",
        content:
          "Bara AI: AI agent dengan tools browser, catatan, GitHub, code editor, database, dan deploy. Tema gelap ungu futuristik.",
      },
      { property: "og:title", content: "Bara AI — AI Agent Serbaguna" },
      {
        property: "og:description",
        content: "AI agent dengan tools browser, GitHub, code editor, database, dan deploy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bara AI — AI Agent Serbaguna" },
      {
        name: "twitter:description",
        content: "AI agent dengan tools browser, GitHub, code editor, database, dan deploy.",
      },
    ],
  }),
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/auth" }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-5 font-mono">
      <h1 className="text-2xl tracking-[0.35em] text-[#a855f7]">BARA AI</h1>
      <p className="mt-3 text-[11px] tracking-[0.3em] text-[#a855f7]/60">AI AGENT SYSTEM</p>

      <div className="mt-8 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded bg-[#a855f7]/20">
          <div
            className="h-full bg-[#a855f7]"
            style={{ animation: "loading-bar 2.2s linear forwards" }}
          />
        </div>
      </div>

      <p className="absolute bottom-8 text-[10px] tracking-[0.25em] text-[#a855f7]/50">
        created by Bara Official
      </p>
    </div>
  );
}
