/**
 * Utility for querying Akinator AI both in Fullstack (Cloud Run/Express)
 * and Static Hosting (GitHub Pages) environments.
 */

export function normalizeAkinatorAnswer(rawText: string): string {
  if (!rawText) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";

  // 1. Remove markdown formatting, quotes, punctuation
  let cleaned = rawText
    .replace(/[*_#~`"'«»“”]/g, " ")
    .replace(/^ответ\s*:\s*/i, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  // 2. Exact match check
  const upper = cleaned.toUpperCase().replace(/[.,!?:;]$/, "").trim();
  if (upper === "ДА" || upper === "YES") return "ДА";
  if (upper === "НЕТ" || upper === "NO") return "НЕТ";
  if (upper === "СКОРЕЕ ДА" || upper.startsWith("СКОРЕЕ ДА")) return "СКОРЕЕ ДА";
  if (upper === "СКОРЕЕ НЕТ" || upper.startsWith("СКОРЕЕ НЕТ")) return "СКОРЕЕ НЕТ";
  if (upper === "ЧАСТИЧНО" || upper.startsWith("ЧАСТИЧНО")) return "ЧАСТИЧНО";
  if (upper.includes("НЕ ЗНАЮ") || upper.includes("НЕПРИМЕНИМО")) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";

  // 3. Multi-word phrase inspection
  if (upper.includes("СКОРЕЕ ДА")) return "СКОРЕЕ ДА";
  if (upper.includes("СКОРЕЕ НЕТ")) return "СКОРЕЕ НЕТ";
  if (upper.includes("ЧАСТИЧНО")) return "ЧАСТИЧНО";

  // 4. Token search with word boundaries
  const tokens = upper.split(/[\s,.;:!?()]+/).filter(Boolean);
  if (tokens.length > 0) {
    const first = tokens[0];
    if (first === "ДА" || first === "YES") return "ДА";
    if (first === "НЕТ" || first === "NO") return "НЕТ";
  }

  if (tokens.includes("ДА") || tokens.includes("YES")) return "ДА";
  if (tokens.includes("НЕТ") || tokens.includes("NO")) return "НЕТ";

  return "НЕ ЗНАЮ / НЕПРИМЕНИМО";
}

export const DEFAULT_GEMINI_KEYS: string[] = [];

let clientKeyIndex = 0;

export async function resolveGeminiKeys(providedKey?: string): Promise<string[]> {
  const collected: string[] = [...DEFAULT_GEMINI_KEYS];

  const parseKeys = (raw: string) => {
    raw.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed.length > 10 && trimmed !== "MY_GEMINI_API_KEY") {
        collected.push(trimmed);
      }
    });
  };

  if (providedKey) parseKeys(providedKey);

  // Check localStorage
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("gemini_api_key");
    if (local) parseKeys(local);
  }

  // Check env (client side only checks VITE_ prefix, never raw server process.env)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey) parseKeys(envKey);

  // Try fetching from Firebase Realtime Database
  try {
    const urls = [
      "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app/gameState/geminiApiKey.json",
      "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app/appConfig/geminiApiKey.json",
      "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app/geminiApiKey.json"
    ];
    for (const u of urls) {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(u, { signal: controller.signal });
      clearTimeout(tId);
      if (res.ok) {
        const val = await res.json();
        if (typeof val === "string") parseKeys(val);
      }
    }
  } catch {
    // ignore
  }

  return Array.from(new Set(collected));
}

export function getNextGeminiKey(keys: string[]): string {
  if (keys.length === 0) return "";
  const key = keys[clientKeyIndex % keys.length];
  clientKeyIndex = (clientKeyIndex + 1) % keys.length;
  return key;
}

export async function resolveGeminiKey(providedKey?: string): Promise<string> {
  const keys = await resolveGeminiKeys(providedKey);
  return getNextGeminiKey(keys);
}

export const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
];

export async function askAkinator({
  animeTitle,
  question,
  geminiKey,
}: {
  animeTitle: string;
  question: string;
  geminiKey?: string;
}): Promise<{ success: boolean; answer: string; error?: string }> {
  const keys = await resolveGeminiKeys(geminiKey);
  const effectiveKeyStr = geminiKey || keys.join(",");

  const isStaticHost =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("github.io") ||
      window.location.protocol === "file:" ||
      window.location.hostname.includes("surge.sh"));

  // Strategy 1: Attempt to call Express backend (only if not on a pure static host like GitHub Pages)
  if (!isStaticHost) {
    const apiUrls = ["/api/akinator/ask", "./api/akinator/ask", "/animekvest2/api/akinator/ask"];
    
    for (const endpoint of apiUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeTitle, question, geminiKey: effectiveKeyStr }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.answer && !data.warning && !data.answer.includes("Требуется GEMINI_API_KEY")) {
            return { success: true, answer: data.answer };
          }
        }
      } catch {
        // Endpoint unreachable, continue to fallback
      }
    }
  }

  // Strategy 2: Direct Gemini REST API call with rotation and accurate error tracking
  let lastErrorMessage = "";
  if (keys.length > 0) {
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

    const maxAttempts = Math.min(keys.length * 2, 8);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const activeKey = getNextGeminiKey(keys);
      const model = FALLBACK_MODELS[attempt % FALLBACK_MODELS.length];
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `Вопрос игрока: "${question}"` }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 30,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const normalized = normalizeAkinatorAnswer(rawText);
          return { success: true, answer: normalized };
        } else {
          const errData = await res.json().catch(() => null);
          const msg = errData?.error?.message || `HTTP ${res.status}`;
          if (res.status === 429) {
            lastErrorMessage = "Превышен минутный лимит бесплатных запросов Gemini (429 Quota Exceeded). Подождите 15-30 секунд.";
          } else {
            lastErrorMessage = `Google Gemini вернул ошибку (${res.status}): ${msg}`;
          }
        }
      } catch (err: any) {
        lastErrorMessage = err?.message || "Ошибка сетевого соединения с Gemini API";
        console.warn(`Direct Gemini key ...${activeKey.slice(-6)} model ${model} failed:`, err);
      }
    }
  }

  // Strategy 3: Both server and direct API failed or keys are missing
  if (keys.length === 0) {
    return {
      success: false,
      answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
      error:
        "Ключи Gemini API не найдены в базе. Ведущему нужно ввести и сохранить ключи в Панели Управления ведущего (внизу страницы).",
    };
  }

  return {
    success: false,
    answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
    error: lastErrorMessage || "Не удалось связаться с ИИ Gemini. Нажмите «Повторить вопрос».",
  };
}

export async function checkAkinatorGuess({
  animeTitle,
  originalOrEn,
  guess,
  geminiKey,
}: {
  animeTitle: string;
  originalOrEn?: string;
  guess: string;
  geminiKey?: string;
}): Promise<boolean> {
  const clean = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-zа-я0-9]/gi, "")
      .trim();

  const cg = clean(guess);
  const ct = clean(animeTitle);
  const co = clean(originalOrEn || "");

  // Fast exact or substring matching
  if (cg && (cg === ct || (cg.length >= 4 && (ct.includes(cg) || co.includes(cg))))) {
    return true;
  }

  const keys = await resolveGeminiKeys(geminiKey);
  const effectiveKeyStr = geminiKey || keys.join(",");

  const isStaticHost =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("github.io") ||
      window.location.protocol === "file:" ||
      window.location.hostname.includes("surge.sh"));

  // Try Express backend if not purely static
  if (!isStaticHost) {
    const apiUrls = ["/api/akinator/check-guess", "./api/akinator/check-guess", "/animekvest2/api/akinator/check-guess"];
    for (const endpoint of apiUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeTitle, guess, geminiKey: effectiveKeyStr }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && typeof data.correct === "boolean") {
            return data.correct;
          }
        }
      } catch {
        // continue
      }
    }
  }

  // Direct Gemini check if API key exists with round-robin keys
  if (keys.length > 0) {
    const prompt = `Ответь СТРОГО 'ДА' или 'НЕТ'.
Загаданное аниме: "${animeTitle}" (также может быть известно как "${originalOrEn || ""}").
Вариант ответа игрока: "${guess}".
Имел ли игрок в виду именно это аниме? (Учитывай опечатки, русские и английские названия, синонимы).`;

    const maxAttempts = Math.min(keys.length * 2, 6);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const activeKey = getNextGeminiKey(keys);
      const model = FALLBACK_MODELS[attempt % FALLBACK_MODELS.length];
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.0, maxOutputTokens: 10 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").toUpperCase();
          return text.includes("ДА") || text.includes("YES");
        }
      } catch {
        // continue
      }
    }
  }

  return false;
}

// Utility to directly test provided Gemini keys and return diagnostics
export async function testGeminiKeys(providedKey?: string): Promise<{
  success: boolean;
  totalKeys: number;
  validKeys: number;
  details: Array<{ keyMask: string; status: 'ok' | 'error'; message?: string; modelUsed?: string }>;
}> {
  const keys = await resolveGeminiKeys(providedKey);
  if (keys.length === 0) {
    return {
      success: false,
      totalKeys: 0,
      validKeys: 0,
      details: [{ keyMask: "none", status: "error", message: "Ключи не введены" }]
    };
  }

  // First try backend test endpoint if available
  try {
    const res = await fetch("/api/akinator/test-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geminiKey: keys.join(",") }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.validKeys === "number") {
        return data;
      }
    }
  } catch {
    // Backend not reachable, proceed to direct client test
  }

  // Direct client test via fetch
  const details: Array<{ keyMask: string; status: 'ok' | 'error'; message?: string; modelUsed?: string }> = [];

  for (const k of keys) {
    const mask = `...${k.slice(-6)}`;
    let keyOk = false;
    let errMessage = "";

    for (const model of FALLBACK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Ответь одним словом: ДА" }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          details.push({
            keyMask: mask,
            status: "ok",
            modelUsed: model,
            message: text ? text.trim() : "Успешно"
          });
          keyOk = true;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          errMessage = errData?.error?.message || `HTTP ${res.status}`;
        }
      } catch (e: any) {
        errMessage = e?.message || "Сеть недоступна";
      }
    }

    if (!keyOk) {
      details.push({
        keyMask: mask,
        status: "error",
        message: errMessage
      });
    }
  }

  const validCount = details.filter(d => d.status === "ok").length;
  return {
    success: validCount > 0,
    totalKeys: keys.length,
    validKeys: validCount,
    details
  };
}
