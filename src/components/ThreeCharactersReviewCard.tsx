import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Award, Sparkles, User, ShieldCheck } from "lucide-react";

interface ThreeCharactersReviewCardProps {
  key?: React.Key;
  playerId: string;
  player: any;
  qKey: string;
  qIdx: number;
  questionData: {
    correctAnswer?: string;
    characterNames?: string[];
    images?: string[];
  };
  answerData: {
    answer?: string;
    characters?: string[];
    checked?: boolean;
    isDouble?: boolean;
    animeApproved?: boolean;
    charApproved?: boolean[];
    awardedPoints?: number;
  };
  onSave: (details: { animeCorrect: boolean; charsCorrect: boolean[] }) => Promise<void>;
  isCompact?: boolean;
}

function checkFuzzyMatch(guess: string, target: string): boolean {
  if (!guess || !target) return false;
  const g = guess.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (!g) return false;
  if (t.includes(g) || g.includes(t)) return true;
  const gWords = g.split(/[\s\(\)\,\.\-]+/).filter(w => w.length > 2);
  const tWords = t.split(/[\s\(\)\,\.\-]+/).filter(w => w.length > 2);
  for (const gw of gWords) {
    for (const tw of tWords) {
      if (tw.includes(gw) || gw.includes(tw)) return true;
    }
  }
  return false;
}

export default function ThreeCharactersReviewCard({
  playerId,
  player,
  qKey,
  qIdx,
  questionData,
  answerData,
  onSave,
  isCompact = false
}: ThreeCharactersReviewCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize checks: if previously saved, use saved values; otherwise suggest with fuzzy matching
  const [animeCorrect, setAnimeCorrect] = useState<boolean>(() => {
    if (answerData?.checked && answerData?.animeApproved !== undefined) {
      return answerData.animeApproved;
    }
    return checkFuzzyMatch(answerData?.answer || "", questionData?.correctAnswer || "");
  });

  const [charsCorrect, setCharsCorrect] = useState<boolean[]>(() => {
    if (answerData?.checked && Array.isArray(answerData?.charApproved)) {
      return [
        answerData.charApproved[0] ?? false,
        answerData.charApproved[1] ?? false,
        answerData.charApproved[2] ?? false
      ];
    }
    const chars = answerData?.characters || [];
    const correctNames = questionData?.characterNames || [];
    return [
      checkFuzzyMatch(chars[0] || "", correctNames[0] || ""),
      checkFuzzyMatch(chars[1] || "", correctNames[1] || ""),
      checkFuzzyMatch(chars[2] || "", correctNames[2] || "")
    ];
  });

  // Calculate current score to award
  let basePoints = (animeCorrect ? 2 : 0);
  charsCorrect.forEach(c => {
    if (c) basePoints += 1;
  });

  let calculatedPoints = basePoints;
  if (answerData?.isDouble) {
    calculatedPoints = basePoints > 0 ? basePoints * 2 : -2;
  }

  const handleSave = async (overrides?: { anime: boolean; chars: boolean[] }) => {
    setIsSaving(true);
    try {
      const finalAnime = overrides ? overrides.anime : animeCorrect;
      const finalChars = overrides ? overrides.chars : charsCorrect;
      await onSave({
        animeCorrect: finalAnime,
        charsCorrect: finalChars
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAllCorrect = () => {
    setAnimeCorrect(true);
    setCharsCorrect([true, true, true]);
    handleSave({ anime: true, chars: [true, true, true] });
  };

  const handleMarkAllWrong = () => {
    setAnimeCorrect(false);
    setCharsCorrect([false, false, false]);
    handleSave({ anime: false, chars: [false, false, false] });
  };

  const isChecked = !!answerData?.checked;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isChecked
          ? "bg-slate-900/60 border-green-500/30 shadow-md"
          : "bg-slate-900/90 border-purple-500/40 shadow-xl"
      } ${isCompact ? "p-3.5 space-y-3" : "p-5 space-y-4"}`}
    >
      {/* Header with player info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{player?.nickname || "Игрок"}</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Команда {(player?.team ?? 0) + 1}
              </span>
              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono font-bold">
                Вопрос {qIdx + 1}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {answerData?.isDouble && (
            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
              💎 ДАБЛ
            </span>
          )}
          {isChecked ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Проверено (+{answerData?.awardedPoints ?? calculatedPoints} б.)
            </span>
          ) : (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full animate-pulse">
              ⏳ Ожидает проверки
            </span>
          )}
        </div>
      </div>

      {/* 1. Anime Title Evaluation */}
      <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-purple-300 flex items-center gap-1.5">
            🎬 Название аниме:
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded font-mono">
              +2 б.
            </span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAnimeCorrect(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                animeCorrect
                  ? "bg-green-600 text-white shadow-md shadow-green-900/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Верно (+2)
            </button>
            <button
              type="button"
              onClick={() => setAnimeCorrect(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                !animeCorrect
                  ? "bg-red-600/80 text-white shadow-md shadow-red-900/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Неверно (0)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 p-2 rounded-lg">
            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Ответ игрока:</span>
            <span className="text-white font-bold break-words">
              {answerData?.answer?.trim() ? `"${answerData.answer}"` : <span className="text-gray-500 italic">не введен</span>}
            </span>
          </div>
          <div className="bg-green-950/30 border border-green-500/20 p-2 rounded-lg">
            <span className="text-[10px] text-green-400 uppercase font-bold block mb-0.5">Правильный тайтл:</span>
            <span className="text-green-300 font-bold break-words">{questionData?.correctAnswer}</span>
          </div>
        </div>
      </div>

      {/* 2. Character Names Evaluation (3 characters, each +1 point) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-purple-300 block">
          👥 Имена персонажей (по +1 баллу за каждого):
        </span>

        <div className="space-y-2">
          {[0, 1, 2].map(idx => {
            const charGuess = answerData?.characters?.[idx] || "";
            const correctChar = questionData?.characterNames?.[idx] || `Персонаж #${idx + 1}`;
            const isApproved = !!charsCorrect[idx];

            return (
              <div
                key={idx}
                className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                      Персонаж #{idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Правильно: <span className="text-green-300 font-bold">{correctChar}</span>
                    </span>
                  </div>
                  <div className="text-xs text-white">
                    <span className="text-gray-400">Игрок написал: </span>
                    <span className="font-bold text-purple-200">
                      {charGuess.trim() ? `"${charGuess}"` : <span className="text-gray-500 italic">пусто</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCharsCorrect(prev => {
                        const next = [...prev];
                        next[idx] = true;
                        return next;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isApproved
                        ? "bg-green-600 text-white shadow-md shadow-green-900/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    +1 б.
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCharsCorrect(prev => {
                        const next = [...prev];
                        next[idx] = false;
                        return next;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      !isApproved
                        ? "bg-red-600/80 text-white shadow-md shadow-red-900/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    0 б.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions & Summary */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300 font-medium">Итого к начислению:</span>
          <span className="text-base font-black text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20 font-mono">
            {calculatedPoints >= 0 ? `+${calculatedPoints}` : calculatedPoints} баллов
          </span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            (Аниме: {animeCorrect ? "+2" : "0"} + Герои: +{charsCorrect.filter(Boolean).length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllCorrect}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/40 transition-all flex items-center gap-1"
            title="Зачесть и аниме (+2), и всех 3 персонажей (+3)"
          >
            <Sparkles className="w-3.5 h-3.5 text-green-400" />
            Все верно (+5)
          </button>

          <button
            type="button"
            onClick={handleMarkAllWrong}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition-all"
            title="Поставить 0 баллов"
          >
            Все неверно (0)
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 ${
              isChecked
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
            } disabled:opacity-50`}
          >
            <Award className="w-3.5 h-3.5" />
            {isSaving ? "Сохранение..." : isChecked ? "Обновить оценку" : `Подтвердить (+${calculatedPoints} б.)`}
          </button>
        </div>
      </div>
    </div>
  );
}
