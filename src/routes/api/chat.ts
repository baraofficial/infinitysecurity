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
- Whenever the user asks you to write a prompt, put the final prompt inside a fenced code block (use three backticks and the language tag "prompt") so it can be copied.
- Put real code inside fenced code blocks with the correct language tag. Never wrap comparison tables inside code blocks.`;

const GEMINI_MODEL = "gemini-3.1-pro-preview";

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

        const body = (await request.json()) as {
          messages?: ChatMessage[];
          systemPrompt?: string;
        };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }

        const customSystem =
          typeof body.systemPrompt === "string" && body.systemPrompt.trim()
            ? body.systemPrompt.trim()
            : null;

        // Convert OpenAI-style messages to Gemini contents format
        const contents = body.messages
          .slice(-30)
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));

        const payload = {
          systemInstruction: {
            parts: [{ text: customSystem ?? SYSTEM_PROMPT }],
          },
          contents,
        };

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          if (res.status === 429)
            return new Response("Rate limited. Try again shortly.", {
              status: 429,
            });
          if (res.status === 400 && text.includes("API key"))
            return new Response("Gemini API key tidak valid.", { status: 400 });
          return new Response(text || "AI request failed", {
            status: res.status || 500,
          });
        }

        // Transform Gemini SSE chunks into OpenAI-style deltas so the
        // existing client parser (choices[0].delta.content) keeps working.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let buffer = "";
            const send = (content: string) => {
              const chunk = {
                choices: [{ delta: { content } }],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
              );
            };

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const parts =
                      json?.candidates?.[0]?.content?.parts ?? [];
                    for (const part of parts) {
                      if (typeof part?.text === "string" && part.text) {
                        send(part.text);
                      }
                    }
                  } catch {
                    // ignore malformed chunk
                  }
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
          },
        });

        return new Response(stream, {
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
