import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      navigate({ to: data.session ? "/chat" : "/auth" });
    }, 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-mono px-6 text-center">
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-widest"
        style={{
          color: "var(--accent-color)",
          textShadow: "0 0 20px var(--accent-color), 0 0 40px var(--accent-color)",
        }}
      >
        INFINITY AI
      </h1>
      <p
        className="mt-6 text-sm sm:text-base tracking-[0.2em]"
        style={{ color: "var(--accent-color)" }}
      >
        Loading Infinity AI...
      </p>
      <div className="mt-6 w-64 h-1 bg-neon/20 overflow-hidden rounded">
        <div
          className="h-full animate-[loading_2.2s_ease-in-out_forwards]"
          style={{ background: "var(--accent-color)" }}
        />
      </div>
      <style>{`
        @keyframes loading {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
