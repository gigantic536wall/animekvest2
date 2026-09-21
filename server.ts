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
  const text = rawText.trim().toUpperCase();
  if (text.includes("СКОРЕЕ ДА") || text.includes("PROBABLY YES") || text.includes("MOST LIKELY")) {
    return "СКОРЕЕ ДА";
  }
  if (text.includes("СКОРЕЕ НЕТ") || text.includes("PROBABLY NOT") || text.includes("UNLIKELY")) {
    return "СКОРЕЕ НЕТ";
  }
  if (text.includes("ЧАСТИЧНО") || text.includes("PARTIALLY")) {
    return "ЧАСТИЧНО";
  }
  if (text.startsWith("ДА") || text === "ДА" || text.includes(" YES")) {
    return "ДА";
  }
  if (text.startsWith("НЕТ") || text === "НЕТ" || text.includes(" NO")) {
    return "НЕТ";
  }
  if (text.includes("НЕ ЗНАЮ") || text.includes("НЕПРИМЕНИМО") || text.includes("UNKNOWN")) {
    return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
  }
  return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
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
4. Если вопрос бессмысленный, не по теме или на него невозможно ответить в таком формате, отвечай "НЕ ЗНАЮ / НЕПРИМЕНИМО".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Вопрос игрока: "${question}"`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      },
    });

    const rawAnswer = response.text || "";
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

    const ai = getAIClient();
    const prompt = `Загадано аниме: "${animeTitle}".
Игрок назвал свой вариант догадки: "${guess}".

Является ли вариант игрока тем же самым аниме (с учетом официального перевода на русский, английский, японский романдзи, небольших опечаток или сокращений вроде "АоТ" / "Тетрадка смерти" / "Клинки")?
Ответь строго ОДНИМ словом: ДА или НЕТ.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.0,
      },
    });

    const text = (response.text || "").trim().toUpperCase();
    const correct = text.startsWith("ДА") || text === "ДА";

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
