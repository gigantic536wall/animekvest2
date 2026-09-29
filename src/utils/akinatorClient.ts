/**
 * Utility for querying Akinator AI both in Fullstack and Static Hosting (GitHub Pages)
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
let cachedWorkingModel = "";

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
        const tId = setTimeout(() => controller.abort(), 2500);
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

// Автоматический поиск актуальной рабочей Flash-модели через ListModels
async function getActiveGeminiModel(apiKey: string): Promise<string> {
  if (cachedWorkingModel) return cachedWorkingModel;

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("gemini_working_model");
    if (saved) {
      cachedWorkingModel = saved;
      return cachedWorkingModel;
    }
  }

  try {
    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`, {
      signal: controller.signal,
    });
    clearTimeout(tId);

    if (res.ok) {
      const data = await res.json();
      const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = data?.models || [];
      
      const contentModels = models.filter(m => 
        m.supportedGenerationMethods?.includes("generateContent")
      );

      // Ищем самую быструю актуальную Flash модель
      const best = contentModels.find(m => m.name.includes("flash") && !m.name.includes("preview") && !m.name.includes("thinking"))
        || contentModels.find(m => m.name.includes("flash"))
        || contentModels.find(m => m.name.includes("gemini"))
        || contentModels[0];

      if (best) {
        const cleanName = best.name.replace(/^models\//, "");
        cachedWorkingModel = cleanName;
        if (typeof window !== "undefined") {
          try { localStorage.setItem("gemini_working_model", cleanName); } catch {}
        }
        return cleanName;
      }
    }
  } catch {}

  // Запасные варианты на случай сетевого сбоя ListModels
  cachedWorkingModel = "gemini-2.5-flash";
  return cachedWorkingModel;
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
      }
    } catch {}
  }

  const apiKey = await resolveGeminiKey(geminiKey);

  if (!apiKey || apiKey.trim().length <= 10) {
    return {
      success: false,
      answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
      error: "Gemini API ключ не найден. Ведущему нужно сохранить ключ в Панели Ведущего внизу страницы.",
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

  const activeModel = await getActiveGeminiModel(apiKey);
  const modelsToTry = Array.from(new Set([activeModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]));

  let lastApiError = "";

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), 6000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
        cachedWorkingModel = model;
        if (typeof window !== "undefined") {
          try { localStorage.setItem("gemini_working_model", model); } catch {}
        }
        return { success: true, answer: normalized };
      } else {
        const errJson = await res.json().catch(() => null);
        lastApiError = errJson?.error?.message || `Ошибка Google API (${res.status})`;
      }
    } catch (err: any) {
      lastApiError = err?.message || "Таймаут соединения с Google";
    }
  }

  return {
    success: false,
    answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
    error: lastApiError ? `Ошибка ИИ: ${lastApiError}` : "Не удалось связаться с Gemini API.",
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

  if (cg && (cg === ct || (cg.length >= 4 && (ct.includes(cg) || co.includes(cg))))) {
    return true;
  }

  const apiKey = await resolveGeminiKey(geminiKey);

  if (apiKey && apiKey.trim().length > 10) {
    const prompt = `Ответь СТРОГО 'ДА' или 'НЕТ'.
Загаданное аниме: "${animeTitle}" (${originalOrEn || ""}).
Вариант игрока: "${guess}".
Имел ли игрок в виду это аниме (учитывая опечатки или перевод)?`;

    const activeModel = await getActiveGeminiModel(apiKey);
    const modelsToTry = Array.from(new Set([activeModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]));

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 5000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
  }

  return false;
}
