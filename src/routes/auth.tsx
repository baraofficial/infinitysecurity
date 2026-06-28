import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
        <p className="mt-6 text-center text-[10px] text-muted-foreground tracking-widest">
          powered by darkness ai
        </p>
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
