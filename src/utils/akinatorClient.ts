
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

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
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
  // Strategy 1: Attempt to call Express backend (works on Cloud Run / dev server)
  const apiUrls = ["/api/akinator/ask", "./api/akinator/ask", "/animekvest2/api/akinator/ask"];
  
  for (const endpoint of apiUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeTitle, question }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.answer) {
          return { success: true, answer: data.answer };
        }
      }
    } catch {
      // Endpoint unreachable, continue to fallback
    }
  }

  // Strategy 2: If running statically (e.g. on GitHub Pages), call Gemini REST API directly
  const apiKey =
    geminiKey ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "");

  if (apiKey && apiKey.trim().length > 10) {
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

    for (const model of FALLBACK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
        }
      } catch (err) {
        console.warn(`Direct Gemini model ${model} failed:`, err);
      }
    }
  }

  // Strategy 3: Both server and direct API failed/absent
  return {
    success: false,
    answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
    error:
      "На GitHub Pages отсутствует бэкенд-сервер. Чтобы ИИ отвечал, ведущему нужно сохранить Gemini API ключ в Панели Управления ведущего (внизу страницы).",
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

  // Try Express backend
  const apiUrls = ["/api/akinator/check-guess", "./api/akinator/check-guess", "/animekvest2/api/akinator/check-guess"];
  for (const endpoint of apiUrls) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeTitle, guess }),
      });
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

  // Direct Gemini check if API key exists
  const apiKey =
    geminiKey ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "");

  if (apiKey && apiKey.trim().length > 10) {
    const prompt = `Ответь СТРОГО 'ДА' или 'НЕТ'.
Загаданное аниме: "${animeTitle}" (также может быть известно как "${originalOrEn || ""}").
Вариант ответа игрока: "${guess}".
Имел ли игрок в виду именно это аниме? (Учитывай опечатки, русские и английские названия, синонимы).`;

    for (const model of FALLBACK_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
