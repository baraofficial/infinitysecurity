import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Query = z.object({ repo: z.string().min(3), path: z.string().optional() });

async function gh(path: string) {
  const token = process.env["GITHUB_TOKEN"];
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body) as unknown;
}

export const Route = createFileRoute("/api/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const { repo, path } = Query.parse({
            repo: url.searchParams.get("repo") ?? "",
            path: url.searchParams.get("path") ?? undefined,
          });
          const clean = repo
            .replace(/^https?:\/\/github\.com\//i, "")
            .replace(/\.git$/, "")
            .replace(/^\/+|\/+$/g, "");
          const data = await gh(
            `/repos/${clean}/contents/${path ? encodeURI(path) : ""}`,
          );
          return Response.json({ repo: clean, data });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "github request failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
