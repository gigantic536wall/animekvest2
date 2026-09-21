import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Shared Gemini client utility
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Normalize Akinator responses
function normalizeAkinatorAnswer(rawText: string): string {
  if (!rawText) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
  
  // 1. Remove markdown symbols, quotes, punctuation
  let cleaned = rawText
    .replace(/[*_#~`"'«»“”]/g, " ")
    .replace(/[.,!?;:()\[\]{}]/g, " ")
    .trim()
    .toUpperCase();

  // 2. Remove common prefixes
  cleaned = cleaned.replace(/^(ОТВЕТ|ANSWER|ВЕРДИКТ|ИТОГ)\s+/i, "").trim();

  // 3. Multi-word phrases
  if (cleaned.includes("СКОРЕЕ ДА") || cleaned.includes("PROBABLY YES") || cleaned.includes("ВЕРОЯТНО ДА")) {
    return "СКОРЕЕ ДА";
  }
  if (cleaned.includes("СКОРЕЕ НЕТ") || cleaned.includes("PROBABLY NOT") || cleaned.includes("ВЕРОЯТНО НЕТ")) {
    return "СКОРЕЕ НЕТ";
  }
  if (cleaned.includes("ЧАСТИЧНО") || cleaned.includes("PARTIALLY")) {
    return "ЧАСТИЧНО";
  }
  if (cleaned.includes("НЕ ЗНАЮ") || cleaned.includes("НЕПРИМЕНИМО") || cleaned.includes("UNKNOWN") || cleaned.includes("НЕ УВЕРЕН")) {
    return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
  }

  // 4. Tokenize by whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    const first = tokens[0];
    if (first === "ДА" || first === "YES") return "ДА";
    if (first === "НЕТ" || first === "NO") return "НЕТ";
  }

  // 5. Look for standalone tokens
  if (tokens.includes("ДА") || tokens.includes("YES")) return "ДА";
  if (tokens.includes("НЕТ") || tokens.includes("NO")) return "НЕТ";

  return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
}

// Supported Gemini models with fallbacks in case of high demand / 503 errors
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: string,
  config: any
): Promise<string> {
  let lastErr: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${model} encountered an issue, trying next candidate:`, err?.message || err);
      lastErr = err;
      // Brief pause before trying next fallback model
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw lastErr || new Error("All Gemini models failed to respond");
}

// API: Ask Akinator a question about the assigned anime
app.post("/api/akinator/ask", async (req, res) => {
  try {
    const { animeTitle, question } = req.body;
    if (!animeTitle || !question) {
      return res.status(400).json({ error: "animeTitle and question are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return a simulated fallback if no API key is set yet
      return res.json({ 
        answer: "НЕ ЗНАЮ (Требуется GEMINI_API_KEY)",
        warning: "GEMINI_API_KEY is not configured in Settings > Secrets." 
      });
    }

    const ai = getAIClient();
    const systemPrompt = `Ты — неподкупный ведущий Акинатор в аниме-викторине.
Твое секретное аниме, которое загадано: "${animeTitle}".
Игрок задает тебе вопрос на "Да/Нет", чтобы угадать это аниме.

ОТВЕТЬ СТРОГО ОДНИМ ИЗ 6 ВАРИАНТОВ:
- ДА
- НЕТ
- СКОРЕЕ ДА
- СКОРЕЕ НЕТ
- ЧАСТИЧНО
- НЕ ЗНАЮ / НЕПРИМЕНИМО

СТРОГИЕ ПРАВИЛА:
1. Запрещено писать любые вступительные слова, пояснения, рассуждения или знаки препинания. Ответ — ТОЛЬКО одно выбранное словосочетание из списка выше.
2. Никогда не называй само аниме и не подсказывай прямо.
3. Отвечай честно и точно по канону сюжета, персонажей, авторов, жанров и фактов об аниме "${animeTitle}".
4. Если вопрос бессмысленный, не по теме или на него невозможно ответить в таком формате, отвечай "НЕ ЗНАЮ / НЕПРИМЕНИМО".
5. Выведи ТОЛЬКО чистый текст ответа без звездочек (**), без кавычек и без точек.`;

    let rawAnswer = "";
    try {
      rawAnswer = await generateWithFallback(
        ai,
        `Вопрос игрока: "${question}"`,
        {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      );
    } catch (genErr: any) {
      console.error("All Gemini models failed for /api/akinator/ask:", genErr);
      // Soft fallback so the game is not disrupted
      return res.json({
        answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
        warning: "ИИ временно перегружен, ответ по умолчанию: НЕ ЗНАЮ"
      });
    }

    const cleanAnswer = normalizeAkinatorAnswer(rawAnswer);

    return res.json({ 
      answer: cleanAnswer,
      raw: rawAnswer
    });
  } catch (err: any) {
    console.error("Akinator ask error:", err);
    return res.status(500).json({ 
      error: "Ошибка генерации ответа Акинатора", 
      details: err?.message || String(err) 
    });
  }
});

// API: Check if player's guess matches the secret anime
app.post("/api/akinator/check-guess", async (req, res) => {
  try {
    const { animeTitle, guess } = req.body;
    if (!animeTitle || !guess) {
      return res.status(400).json({ error: "animeTitle and guess are required" });
    }

    const clean = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
    const cleanGuess = clean(guess);
    const cleanTitle = clean(animeTitle);

    // Fast exact or substring match
    if (cleanGuess === cleanTitle || (cleanGuess.length >= 4 && cleanTitle.includes(cleanGuess))) {
      return res.json({ correct: true });
    }

    // AI check for alternate names, English/Romaji titles, minor typos
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ correct: cleanGuess === cleanTitle });
    }

    let correct = false;
    try {
      const ai = getAIClient();
      const prompt = `Загадано аниме: "${animeTitle}".
Игрок назвал свой вариант догадки: "${guess}".

Является ли вариант игрока тем же самым аниме (с учетом официального перевода на русский, английский, японский романдзи, небольших опечаток или сокращений вроде "АоТ" / "Тетрадка смерти" / "Клинки")?
Ответь строго ОДНИМ словом: ДА или НЕТ.`;

      const rawText = await generateWithFallback(ai, prompt, { temperature: 0.0 });
      const text = rawText.trim().toUpperCase();
      correct = text.startsWith("ДА") || text === "ДА";
    } catch (aiErr) {
      console.warn("AI check-guess fallback to basic string match:", aiErr);
      correct = cleanGuess === cleanTitle;
    }

    return res.json({ correct });
  } catch (err: any) {
    console.error("Akinator check guess error:", err);
    // Fallback to basic string comparison
    const clean = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
    return res.json({ correct: clean(req.body.guess) === clean(req.body.animeTitle) });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
