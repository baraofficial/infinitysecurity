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
      { title: "Bara AI" },
      { name: "description", content: "Bara AI — asisten AI cerdas dengan tema gelap merah, dibuat oleh Bara Official." },
      { property: "og:title", content: "Bara AI" },
      { name: "twitter:title", content: "Bara AI" },
      { property: "og:description", content: "Bara AI — asisten AI cerdas dengan tema gelap merah, dibuat oleh Bara Official." },
      { name: "twitter:description", content: "Bara AI — asisten AI cerdas dengan tema gelap merah, dibuat oleh Bara Official." },
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

const THEME_INIT_SCRIPT = `(function(){try{var c='#ef4444';var r=document.documentElement;r.style.setProperty('--accent-color',c);r.style.setProperty('--neon',c);r.style.setProperty('--neon-dim','#7f1d1d');r.style.setProperty('--primary',c);r.style.setProperty('--ring',c);r.style.setProperty('--border',c);r.style.setProperty('--shadow-neon','none');r.style.setProperty('--shadow-neon-sm','none');}catch(e){}})();`;

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
