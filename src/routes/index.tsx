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

const SPLASH_VIDEO =
  "https://www.image2url.com/r2/default/videos/1785590870389-70e9c4c2-297c-44e5-a9c8-0b22af07145c.mp4";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/auth" }), 21000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-5 font-mono">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#a855f7]/40 bg-black">
        <video
          src={SPLASH_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          className="aspect-video h-full w-full object-cover"
        />
      </div>

      <div className="mt-8 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded bg-[#a855f7]/20">
          <div
            className="h-full bg-[#a855f7]"
            style={{ animation: "loading-bar 21s linear forwards" }}
          />
        </div>
      </div>

      <p className="absolute bottom-8 text-[10px] font-bold tracking-[0.25em] text-[#c084fc]">
        created by Bara Official
      </p>
    </div>
  );
}
