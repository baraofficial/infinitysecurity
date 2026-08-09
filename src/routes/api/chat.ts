import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are Bara AI — a highly intelligent, precise, and thoughtful assistant created by Bara Official.

Core behavior:
- Think step-by-step before answering. Break complex problems into clear reasoning, then give a clean final answer.
- Be accurate above all. If you are unsure, say so honestly instead of guessing.
- Prefer depth and clarity over verbosity. Structure long answers with short paragraphs, bullet points, and headings when useful.
- For coding questions: give working, idiomatic code with a brief explanation of the key decisions and edge cases.
- For math, logic, or analysis: show the reasoning chain, then the conclusion.
- For open questions: consider multiple angles before recommending one.
- Match the user's language automatically (Indonesian, English, etc.).
- Use markdown when it improves readability. Keep a light, modern tone — no unnecessary jargon, no filler.
- Whenever the user asks for a comparison (e.g. "perbandingan ChatGPT vs Claude"), ALWAYS include a markdown table (| header | header | with a |---|---| separator row) summarizing the differences.
- Whenever the user asks you to write a prompt, put the final prompt inside a fenced code block (```prompt ... ``` ) so it can be copied.
- Put real code inside fenced code blocks with the correct language tag. Never wrap comparison tables inside code blocks.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require an authenticated caller
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response("Missing GEMINI_API_KEY", { status: 500 });
        }

        const body = (await request.json()) as { messages?: ChatMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        // Build the contents array in the format expected by Google Generative API
        const lastMessages = body.messages.slice(-30).map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));

        const payload = {
          // adjust parameters as needed
          temperature: 0.2,
          max_output_tokens: 1024,
          top_p: 0.95,
          candidate_count: 1,
          contents: [
            { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
            ...lastMessages,
          ],
        };

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${encodeURIComponent(
          apiKey,
        )}`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          if (res.status === 429) return new Response("Rate limited. Try again shortly.", { status: 429 });
          if (res.status === 402) return new Response("AI credits exhausted. Add credits to continue.", { status: 402 });
          return new Response(text || "AI request failed", { status: res.status || 500 });
        }

        // Proxy the streaming response (SSE) from Google's streaming endpoint
        return new Response(res.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
