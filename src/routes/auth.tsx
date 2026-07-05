import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
  }, [navigate]);

  async function handleGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) { toast.error(result.error.message || "google sign-in failed"); return; }
      if (result.redirected) return;
      navigate({ to: "/chat" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 font-mono">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl text-neon tracking-[0.3em]" style={{ textShadow: "0 0 14px var(--neon)" }}>
            INFINITY AI
          </h1>
        </div>
        <div className="rounded-2xl border-2 border-neon bg-black p-6 sm:p-8" style={{ boxShadow: "var(--shadow-neon)" }}>
          <p className="text-center text-neon tracking-widest text-sm mb-6">Sign in with</p>
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 border-2 border-neon/60 hover:border-neon text-neon py-3 tracking-widest text-xs transition rounded-full"
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.4 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            [ CONTINUE WITH GOOGLE ]
          </button>
        </div>
        <div className="mt-3 text-center">
          <Link to="/" className="text-[10px] text-neon/60 hover:text-neon">&lt; back</Link>
        </div>
      </div>
    </div>
  );
}
