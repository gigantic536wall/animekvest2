/**
 * Client utility for Akinator AI.
 * All queries are proxied securely through the backend server (/api/akinator/*).
 * No API keys or direct Gemini API calls ever exist on the client side.
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

/**
 * Ask Akinator a question through the secure server endpoint.
 */
export async function askAkinator({
  animeTitle,
  question,
}: {
  animeTitle: string;
  question: string;
  geminiKey?: string; // Kept for interface backward-compatibility, completely ignored
}): Promise<{ success: boolean; answer: string; error?: string }> {
  const apiUrls = ["/api/akinator/ask", "./api/akinator/ask"];

  for (const endpoint of apiUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
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
          return { success: true, answer: normalizeAkinatorAnswer(data.answer) };
        }
      }
    } catch {
      // Continue to next endpoint attempt
    }
  }

  return {
    success: false,
    answer: "НЕ ЗНАЮ / НЕПРИМЕНИМО",
    error: "Сервер ИИ временно недоступен. Попробуйте нажать «Повторить вопрос».",
  };
}

/**
 * Check if player's guess matches the target anime via secure server endpoint.
 */
export async function checkAkinatorGuess({
  animeTitle,
  originalOrEn,
  guess,
}: {
  animeTitle: string;
  originalOrEn?: string;
  guess: string;
  geminiKey?: string; // Kept for interface backward-compatibility, completely ignored
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

  // Call backend server
  const apiUrls = ["/api/akinator/check-guess", "./api/akinator/check-guess"];
  for (const endpoint of apiUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeTitle, guess }),
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
      // Continue
    }
  }

  // Fallback to substring match
  return cg.length >= 3 && (ct.includes(cg) || co.includes(cg));
}
