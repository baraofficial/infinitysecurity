import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-neon" style={{ textShadow: "0 0 18px var(--neon)" }}>404</h1>
        <p className="mt-4 text-sm text-muted-foreground">// signal lost</p>
        <Link to="/" className="mt-6 inline-block border border-neon px-4 py-2 text-neon hover:bg-neon hover:text-black transition">
          [ return home ]
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono">
      <div className="max-w-md text-center">
        <h1 className="text-xl text-neon">// system error</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 border border-neon px-4 py-2 text-neon hover:bg-neon hover:text-black transition"
        >
          [ retry ]
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "INFINITY AI" },
      { name: "description", content: "BARA Official V1 — Wide Edition. Cyberpunk AI chat." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_INIT_SCRIPT = `(function(){try{var m={purple:'#a855f7',green:'#22c55e',blue:'#3b82f6'};var d={purple:'#6b21a8',green:'#15803d',blue:'#1d4ed8'};var t=localStorage.getItem('theme');if(!m[t])t='purple';var c=m[t],x=d[t],r=document.documentElement.style;r.setProperty('--accent-color',c);r.setProperty('--neon',c);r.setProperty('--neon-dim',x);r.setProperty('--primary',c);r.setProperty('--ring',c);r.setProperty('--border',c);r.setProperty('--shadow-neon','0 0 12px '+c+'99');r.setProperty('--shadow-neon-sm','0 0 6px '+c+'66');}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { initThemeFromStorage } from "@/lib/theme";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { initThemeFromStorage(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}
