import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS configuration so external static deployments (like GitHub Pages) can use this API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Auto-sync GEMINI_API_KEY into Firebase gameState so static clients (GitHub Pages) can also access it
const FIREBASE_DB = "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app";
async function autoSyncKeyToFirebase() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !apiKey.startsWith("AIza")) return;
  try {
    const urls = [
      `${FIREBASE_DB}/gameState/geminiApiKey.json`,
      `${FIREBASE_DB}/appConfig/geminiApiKey.json`,
      `${FIREBASE_DB}/geminiApiKey.json`
    ];
    for (const u of urls) {
      await fetch(u, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKey),
      });
    }
    console.log("[Server] Synced GEMINI_API_KEY to Firebase for GitHub Pages");
  } catch (err) {
    console.warn("[Server] Firebase key auto-sync warning:", err);
  }
}
autoSyncKeyToFirebase();

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
app.get(["/api/health", "/animekvest2/api/health"], (_req, res) => {
  res.json({ status: "ok" });
});

// Normalize Akinator responses
function normalizeAkinatorAnswer(rawText: string): string {
  if (!rawText) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
  
  let cleaned = rawText
    .replace(/[*_#~`"'«»“”]/g, " ")
    .replace(/[.,!?;:()\[\]{}]/g, " ")
    .trim()
    .toUpperCase();

  cleaned = cleaned.replace(/^(ОТВЕТ|ANSWER|ВЕРДИКТ|ИТОГ)\s+/i, "").trim();

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

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    const first = tokens[0];
    if (first === "ДА" || first === "YES") return "ДА";
    if (first === "НЕТ" || first === "NO") return "НЕТ";
  }

  if (tokens.includes("ДА") || tokens.includes("YES")) return "ДА";
  if (tokens.includes("НЕТ") || tokens.includes("NO")) return "НЕТ";

  return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
}

// API: Ask Akinator a question about the assigned anime
app.post(["/api/akinator/ask", "/animekvest2/api/akinator/ask"], async (req, res) => {
  try {
    const { animeTitle, question } = req.body;
    if (!animeTitle || !question) {
      return res.status(400).json({ error: "animeTitle and question are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
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
      // Прямой вызов стабильной модели без циклов перебора, экономим квоту!
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Вопрос игрока: "${question}"`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      });
      
      if (response && response.text) {
        rawAnswer = response.text;
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (genErr: any) {
      console.error("Gemini failed for /api/akinator/ask:", genErr);
      
      // Если это ошибка квоты - отправляем специальный статус 429
      if (genErr?.status === 429 || genErr?.message?.includes("Quota")) {
        return res.status(429).json({ error: "Квота исчерпана. Подождите 1 минуту." });
      }
      
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
app.post(["/api/akinator/check-guess", "/animekvest2/api/akinator/check-guess"], async (req, res) => {
  try {
    const { animeTitle, guess } = req.body;
    if (!animeTitle || !guess) {
      return res.status(400).json({ error: "animeTitle and guess are required" });
    }

    const clean = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
    const cleanGuess = clean(guess);
    const cleanTitle = clean(animeTitle);

    if (cleanGuess === cleanTitle || (cleanGuess.length >= 4 && cleanTitle.includes(cleanGuess))) {
      return res.json({ correct: true });
    }

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

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: { temperature: 0.0 }
      });
      
      const text = (response?.text || "").trim().toUpperCase();
      correct = text.startsWith("ДА") || text === "ДА";
    } catch (aiErr) {
      console.warn("AI check-guess fallback to basic string match:", aiErr);
      correct = cleanGuess === cleanTitle;
    }

    return res.json({ correct });
  } catch (err: any) {
    console.error("Akinator check guess error:", err);
    const clean = (s: string) => s.toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
    return res.json({ correct: clean(req.body.guess) === clean(req.body.animeTitle) });
  }
});

async function startServer() {
  const publicDir = path.join(process.cwd(), "public");
  app.use("/chars", express.static(path.join(publicDir, "chars")));
  app.use("/animekvest2/chars", express.static(path.join(publicDir, "chars")));
  app.use(express.static(publicDir));
  app.use("/animekvest2", express.static(publicDir));

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
