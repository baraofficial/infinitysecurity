import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY tidak ditemukan");

const genAI = new GoogleGenerativeAI(API_KEY);

export async function sendMessageToGemini(history: Content[]) {
  const systemPrompt = localStorage.getItem('systemPrompt') ||
    "Kamu adalah Infinity AI. Jawab dengan ramah, singkat, dan membantu."

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt
  });

  const chat = model.startChat({ history: history.slice(0, -1) });
  const lastMessage = history[history.length - 1].parts[0].text;
  const result = await chat.sendMessage(lastMessage);
  return result.response.text();
}
