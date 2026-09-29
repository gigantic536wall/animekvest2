/**
 * Utility for querying Akinator AI
 */

export function normalizeAkinatorAnswer(rawText: string): string {
  if (!rawText) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";

  let cleaned = rawText
    .replace(/[*_#~`"'«»“”]/g, " ")
    .replace(/^ответ\s*:\s*/i, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  const upper = cleaned.toUpperCase().replace(/[.,!?:;]$/, "").trim();
  if (upper === "ДА" || upper === "YES") return "ДА";
  if (upper === "НЕТ" || upper === "NO") return "НЕТ";
  if (upper === "СКОРЕЕ ДА" || upper.startsWith("СКОРЕЕ ДА")) return "СКОРЕЕ ДА";
  if (upper === "СКОРЕЕ НЕТ" || upper.startsWith("СКОРЕЕ НЕТ")) return "СКОРЕЕ НЕТ";
  if (upper === "ЧАСТИЧНО" || upper.startsWith("ЧАСТИЧНО")) return "ЧАСТИЧНО";
  if (upper.includes("НЕ ЗНАЮ") || upper.includes("НЕПРИМЕНИМО")) return "НЕ ЗНАЮ / НЕПРИМЕНИМО";

  if (upper.includes("СКОРЕЕ ДА")) return "СКОРЕЕ ДА";
  if (upper.includes("СКОРЕЕ НЕТ")) return "СКОРЕЕ НЕТ";
  if (upper.includes("ЧАСТИЧНО")) return "ЧАСТИЧНО";

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

let inMemoryKey = "";

export async function resolveGeminiKey(providedKey?: string): Promise<string> {
  if (providedKey && providedKey.trim().length > 10) {
    inMemoryKey = providedKey.trim();
    if (typeof window !== "undefined") {
      try { localStorage.setItem("gemini_api_key", inMemoryKey); } catch {}
    }
    return inMemoryKey;
  }

  if (inMemoryKey && inMemoryKey.length > 10) return inMemoryKey;

  if (typeof window !== "undefined") {
    const local = localStorage.getItem("gemini_api_key");
    if (local && local.trim().length > 10) {
      inMemoryKey = local.trim();
      return inMemoryKey;
    }
  }

  const envKey = (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
                 (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10 && envKey !== "MY_GEMINI_API_KEY") {
    inMemoryKey = envKey.trim();
    return inMemoryKey;
  }

  try {
    const urls = [
      "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app/appConfig/geminiApiKey.json",
      "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app/gameState/geminiApiKey.json"
    ];
    for (const u of urls) {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(u, { signal: controller.signal });
        clearTimeout(tId);
        if (res.ok) {
          const val = await res.json();
          if (typeof val === "string" && val.trim().length > 10) {
            inMemoryKey = val.trim();
            if (typeof window !== "undefined") {
              try { localStorage.setItem("gemini_api_key", inMemoryKey); } catch {}
            }
            return inMemoryKey;
          }
        }
      } catch {}
    }
  } catch {}

  return inMemoryKey;
}

export async function askAkinator({
  animeTitle,
  question,
  geminiKey,
}: {
  animeTitle: string;
  question: string;
  geminiKey?: string;
}): Promise<{ success: boolean; answer: string; error?: string }> {
  const isStaticHosting = typeof window !== "undefined" && (
    window.location.hostname.includes("github.io") ||
    window.location.hostname.endsWith(".pages.dev") ||
    window.location.protocol === "file:"
  );

  if (!isStaticHosting) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch("/api/akinator/ask", {
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
      } else if (res.status === 429) {
        return { success: false, answer: "НЕ ЗНАЮ", error: "⏳ Лимит запросов. Подождите 1 минуту." };
      }
    } catch {}
  }

  const apiKey = await resolveGeminiKey(geminiKey);

  if (!apiKey || apiKey.trim().length <= 10) {
    return {
      success: false,
      answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
      error: "Gemini API ключ не найден. Сохраните ключ в Панели Ведущего.",
    };
  }

  const promptText = `Ты — ведущий Акинатор в аниме-викторине.
Загаданное аниме: "${animeTitle}".
Игрок задает вопрос: "${question}".

Ответь строго ОДНИМ из 6 вариантов без кавычек и точек:
- ДА
- НЕТ
- СКОРЕЕ ДА
- СКОРЕЕ НЕТ
- ЧАСТИЧНО
- НЕ ЗНАЮ / НЕПРИМЕНИМО

Ответ:`;

  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 6000);

    // Возвращаем модель gemini-3.8-flash, которая привязана к твоему проекту
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 20,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(tId);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const normalized = normalizeAkinatorAnswer(rawText);
      return { success: true, answer: normalized };
    } else {
      const errJson = await res.json().catch(() => null);
      if (res.status === 429 || errJson?.error?.message?.toLowerCase().includes("quota")) {
        throw new Error("⏳ Лимит запросов ИИ исчерпан! Подождите ровно 1 минуту.");
      }
      throw new Error(errJson?.error?.message || `Ошибка Google API (${res.status})`);
    }
  } catch (err: any) {
    const isFriendlyError = err?.message?.includes("⏳");
    return {
      success: false,
      answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
      error: isFriendlyError ? err.message : `Ошибка соединения с ИИ: ${err?.message || "Таймаут"}`,
    };
  }
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

  if (cg && (cg === ct || (cg.length >= 4 && (ct.includes(cg) || co.includes(cg))))) {
    return true;
  }

  const apiKey = await resolveGeminiKey(geminiKey);

  if (apiKey && apiKey.trim().length > 10) {
    const prompt = `Ответь СТРОГО 'ДА' или 'НЕТ'.
Загаданное аниме: "${animeTitle}" (${originalOrEn || ""}).
Вариант игрока: "${guess}".
Имел ли игрок в виду это аниме (учитывая опечатки или перевод)?`;

    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 5000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 10 },
        }),
        signal: controller.signal,
      });
      clearTimeout(tId);

      if (res.ok) {
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").toUpperCase();
        return text.includes("ДА") || text.includes("YES");
      }
    } catch {}
  }

  return false;
}
