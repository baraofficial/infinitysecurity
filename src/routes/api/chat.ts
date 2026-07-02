import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are INFINITY AI — a highly intelligent, precise, and thoughtful assistant created by Bara Official.

Core behavior:
- Think step-by-step before answering. Break complex problems into clear reasoning, then give a clean final answer.
- Be accurate above all. If you are unsure, say so honestly instead of guessing.
- Prefer depth and clarity over verbosity. Structure long answers with short paragraphs, bullet points, and headings when useful.
- For coding questions: give working, idiomatic code with a brief explanation of the key decisions and edge cases.
- For math, logic, or analysis: show the reasoning chain, then the conclusion.
- For open questions: consider multiple angles before recommending one.
- Match the user's language automatically (Indonesian, English, etc.).
- Use markdown when it improves readability. Keep a light, modern tone — no unnecessary jargon, no filler.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require an authenticated caller
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const body = (await request.json()) as { messages?: ChatMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...body.messages.slice(-30),
            ],
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          if (res.status === 429) return new Response("Rate limited. Try again shortly.", { status: 429 });
          if (res.status === 402) return new Response("AI credits exhausted. Add credits to continue.", { status: 402 });
          return new Response(text || "AI request failed", { status: res.status });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ content });
      },
    },
  },
});
