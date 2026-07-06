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
import Header from "../Header";

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
      { property: "og:title", content: "INFINITY AI" },
      { name: "twitter:title", content: "INFINITY AI" },
      { property: "og:description", content: "BARA Official V1 — Wide Edition. Cyberpunk AI chat." },
      { name: "twitter:description", content: "BARA Official V1 — Wide Edition. Cyberpunk AI chat." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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

const THEME_INIT_SCRIPT = `(function(){try{var m={purple:'#a855f7',green:'#22c55e',blue:'#3b82f6'};var d={purple:'#6b21a8',green:'#15803d',blue:'#1d4ed8'};var t=localStorage.getItem('theme');if(!m[...]

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
      <Header />
      <Outlet />
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}
