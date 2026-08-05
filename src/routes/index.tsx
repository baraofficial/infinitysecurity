import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import splashVideo from "@/assets/splash.mp4.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: "/auth" });
    }, 11000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-5 font-mono">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#a855f7]/40 bg-black">
        <video
          src={splashVideo.url}
          autoPlay
          muted
          playsInline
          className="block h-auto w-full"
        />
      </div>

      <div className="mt-6 w-full max-w-md">
        <div className="h-1 w-full overflow-hidden rounded bg-[#a855f7]/20">
          <div
            className="h-full bg-[#a855f7]"
            style={{ animation: "loading-bar 11s linear forwards" }}
          />
        </div>
        <p className="mt-3 text-center text-[11px] tracking-[0.25em] text-[#a855f7]">
          LOADING BARA AGENT...
        </p>
      </div>
    </div>
  );
}
