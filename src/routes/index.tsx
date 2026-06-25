import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setGlitch(true), 600);
    const t2 = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      navigate({ to: data.session ? "/chat" : "/auth" });
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-mono px-6 text-center">
      <div className="border border-neon px-8 py-6 sm:px-14 sm:py-10" style={{ boxShadow: "var(--shadow-neon)" }}>
        <h1
          className={`text-3xl sm:text-5xl md:text-6xl font-bold text-neon tracking-widest ${glitch ? "animate-pulse" : ""}`}
          style={{ textShadow: "0 0 20px var(--neon), 0 0 40px var(--neon-dim)" }}
        >
          BARA OFFICIAL V1
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-neon/80 tracking-[0.4em]">[ WIDE EDITION ]</p>
      </div>
      <div className="mt-10 flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground tracking-widest">
        <span className="h-1 w-1 rounded-full bg-neon animate-pulse" />
        powered by bara official
      </div>
    </div>
  );
}
