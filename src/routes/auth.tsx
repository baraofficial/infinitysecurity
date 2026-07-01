import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const search = z.object({
  mode: z.enum(["login", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: search,
  component: AuthPage,
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">(mode ?? "register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (mode) setTab(mode); }, [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "register") {
        const existing: string[] = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
        if (existing.includes(username.trim())) {
          toast.error("Username already in use. Use another username");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        localStorage.setItem("registeredUsers", JSON.stringify([...existing, username.trim()]));
        localStorage.setItem("currentUser", username.trim());
        toast.success("// access granted");
        navigate({ to: "/chat" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("// link established");
        navigate({ to: "/chat" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 font-mono">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl text-neon tracking-[0.3em]" style={{ textShadow: "0 0 14px var(--neon)" }}>
            INFINITY AI
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-widest mt-1">[ PREMIUM AI ]</p>
        </div>
        <div className="rounded-xl border-2 border-neon bg-black p-6 sm:p-8" style={{ boxShadow: "var(--shadow-neon)" }}>
          <div className="flex gap-2 text-xs mb-6">
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2 border ${tab === "register" ? "border-neon text-neon bg-neon/10" : "border-neon/30 text-neon/50"}`}
            >
              [ REGISTER ]
            </button>
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 border ${tab === "login" ? "border-neon text-neon bg-neon/10" : "border-neon/30 text-neon/50"}`}
            >
              [ LOGIN ]
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <Field label="USERNAME" value={username} onChange={setUsername} required />
            )}
            <Field label="EMAIL" type="email" value={email} onChange={setEmail} required />
            <Field label="PASSWORD" type="password" value={password} onChange={setPassword} required minLength={6} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon text-black font-bold tracking-widest py-3 mt-2 border-2 border-neon hover:bg-black hover:text-neon transition disabled:opacity-50"
              style={{ boxShadow: "var(--shadow-neon-sm)" }}
            >
              {loading ? "// processing..." : tab === "register" ? "[ CREATE ACCOUNT ]" : "[ SIGN IN ]"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-neon/40 tracking-widest">
            <div className="flex-1 h-px bg-neon/20" /> OR <div className="flex-1 h-px bg-neon/20" />
          </div>
          <button
            type="button"
            onClick={async () => {
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
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-neon/60 hover:border-neon text-neon py-3 tracking-widest text-xs transition"
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.3 5.2C41.4 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            [ CONTINUE WITH GOOGLE ]
          </button>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {tab === "register" ? (
              <>already linked?{" "}
                <button onClick={() => setTab("login")} className="text-neon hover:underline">login &gt;</button>
              </>
            ) : (
              <>need access?{" "}
                <button onClick={() => setTab("register")} className="text-neon hover:underline">register &gt;</button>
              </>
            )}
          </div>
        </div>
        <div className="mt-2 text-center">
          <Link to="/" className="text-[10px] text-neon/60 hover:text-neon">&lt; back</Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, minLength,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number }) {
  return (
    <label className="block">
      <span className="block text-[10px] text-neon tracking-widest mb-1">&gt; {label}</span>
      <input
        type={type}
        value={value}
        required={required}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border-2 border-neon/60 focus:border-neon px-3 py-2 text-neon outline-none text-sm caret-neon transition"
      />
    </label>
  );
}
