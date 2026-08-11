import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Hindari loop: hanya redirect bila path saat ini bukan /chat
    if (typeof window !== "undefined" && window.location.pathname !== "/chat") {
      // import supabase lazily to avoid eager client imports during build
      import("@/integrations/supabase/client")
        .then(({ supabase }) => {
          supabase.auth.getSession().then(({ data }) => {
            if (data?.session) navigate({ to: "/chat", replace: true });
          }).catch(() => {});
        })
        .catch(() => {});
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 font-mono">
      <div className="w-full max-w-md text-center">
        <h1 className="mt-6 text-2xl text-[#a855f7] tracking-[0.3em]">BARA AI</h1>
        <p className="mt-4 text-sm text-muted-foreground">Mengalihkan ke chat…</p>
        <div className="mt-6">
          <Link to="/chat" className="inline-block border border-neon px-4 py-2 text-neon hover:bg-neon hover:text-black transition">
            [ pergi ke chat ]
          </Link>
        </div>
      </div>
    </div>
  );
}
