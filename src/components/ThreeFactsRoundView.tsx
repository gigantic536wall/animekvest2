import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, Send, CheckCircle2, Lock, ChevronRight, Trophy
} from "lucide-react";
import { ROUND5_QUESTIONS, ThreeFactsQuestion } from "../data/round5Data";

interface ThreeFactsRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
  timeLeft: number;
  serverOffset?: number;
  globalPause?: any;
  isLeader?: boolean;
  leaderNickname?: string;
}

export default function ThreeFactsRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
  timeLeft,
  globalPause,
  isLeader,
  leaderNickname,
}: ThreeFactsRoundViewProps) {
  const currentQIdx = gameState.currentQuestion ?? 0;
  const questionData: ThreeFactsQuestion = ROUND5_QUESTIONS[currentQIdx] || ROUND5_QUESTIONS[0];
  
  // factsRevealed: 1 (5 б.), 2 (4 б.), 3 (3 б.)
  const factsRevealed = Math.min(3, Math.max(1, gameState.factsRevealed || 1));
  const currentPoints = factsRevealed === 1 ? 5 : (factsRevealed === 2 ? 4 : 3);

  const [answerInput, setAnswerInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedPoints, setSubmittedPoints] = useState<number | null>(null);

  const storageKey = `q${currentQIdx}`;
  const answerStoragePath = `players/${user?.id}/roundAnswers/${gameState.currentRound || 4}/${storageKey}`;

  // СБРОС ТОЛЬКО ПРИ СМЕНЕ ВОПРОСА (больше не стирает текст во время ввода!)
  const prevQIdxRef = useRef<number>(currentQIdx);
  useEffect(() => {
    if (prevQIdxRef.current !== currentQIdx) {
      prevQIdxRef.current = currentQIdx;
      setAnswerInput("");
      setHasSubmitted(false);
      setSubmittedPoints(null);
    }
  }, [currentQIdx]);

  // Проверка: отправил ли игрок уже ответ (не перезаписывает ввод, если игрок еще пишет)
  useEffect(() => {
    const existing = players?.[user?.id]?.roundAnswers?.[gameState.currentRound || 4]?.[storageKey];
    if (existing?.answered) {
      setHasSubmitted(true);
      setAnswerInput(existing.answer || "");
      setSubmittedPoints(existing.potentialPoints || 5);
    }
  }, [players, user?.id, gameState.currentRound, storageKey]);

  // Открытие следующего факта ведущим (5 ➔ 4 ➔ 3)
  const handleRevealNextFact = async () => {
    if (!user.isAdmin || factsRevealed >= 3) return;
    const nextRevealed = factsRevealed + 1;
    await restPatch("gameState", { factsRevealed: nextRevealed });
  };

  // Оценка ответа ведущим
  const handleMarkAnswer = async (playerId: string, isCorrect: boolean, basePoints: number) => {
    if (!user.isAdmin) return;
    const scoreKey = `${gameState.currentRound || 4}_${storageKey}`;
    const pts = isCorrect ? basePoints : 0;
    await restPut(`players/${playerId}/scores/${scoreKey}`, pts);
    await restPatch(`players/${playerId}/roundAnswers/${gameState.currentRound || 4}/${storageKey}`, {
      checked: true,
      pointsAwarded: pts,
    });
  };

  // Отправка ответа игроком
  const handlePlayerSubmit = async () => {
    const text = answerInput.trim();
    if (!text || hasSubmitted || user.isAdmin || isLeader === false) return;

    const clean = text.toLowerCase();
    const isAutoMatch = questionData.acceptableAnswers.some((acc) => clean.includes(acc.toLowerCase()));

    const payload = {
      answered: true,
      answer: text,
      timestamp: Date.now(),
      potentialPoints: currentPoints,
      factsRevealedAtAnswer: factsRevealed,
      isAutoMatch,
    };

    await restPut(answerStoragePath, payload);
    setHasSubmitted(true);
    setSubmittedPoints(currentPoints);
  };

  const isPaused = !!globalPause?.active || !!gameState?.globalPause?.active;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Шапка раунда */}
      <div className="bg-gradient-to-r from-purple-900/90 via-slate-900/90 to-indigo-900/90 p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-600/80 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Раунд 5 • Три факта об аниме
              </span>
              <span className={`text-xs font-black px-3 py-0.5 rounded-full border transition-all ${
                currentPoints === 5 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                  : currentPoints === 4 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}>
                Текущая награда: +{currentPoints} баллов
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Вопрос {currentQIdx + 1} из {ROUND5_QUESTIONS.length}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-5 py-2.5 rounded-2xl border font-mono font-black text-2xl sm:text-3xl shadow-lg flex items-center gap-2 transition-all ${
              isPaused 
                ? "bg-amber-950/90 border-amber-400 text-amber-300 animate-pulse" 
                : timeLeft <= 10 
                  ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse" 
                  : "bg-purple-950/80 border-purple-500 text-purple-200"
            }`}>
              <Clock className="w-6 h-6 shrink-0 text-amber-400" />
              <span>{isPaused ? `⏸️ ${timeLeft}s` : `${timeLeft}s`}</span>
            </div>

            <div className="hidden sm:flex flex-col items-center bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400">Шкала баллов</span>
              <span className="text-xs font-black text-purple-300">
                1 факт: 5б • 2: 4б • 3: 3б
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 карточки фактов */}
      <div className="space-y-4">
        {questionData.facts.map((factText, idx) => {
          const factNumber = idx + 1;
          const isRevealed = factsRevealed >= factNumber;
          const factPoints = factNumber === 1 ? 5 : (factNumber === 2 ? 4 : 3);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className={`p-5 sm:p-6 rounded-3xl border-2 transition-all relative overflow-hidden backdrop-blur-xl ${
                isRevealed
                  ? factNumber === 1
                    ? "bg-slate-900/90 border-purple-500/50 shadow-xl shadow-purple-950/20"
                    : factNumber === 2
                      ? "bg-slate-900/90 border-amber-500/50 shadow-xl shadow-amber-950/20"
                      : "bg-slate-900/90 border-blue-500/50 shadow-xl shadow-blue-950/20"
                  : "bg-black/40 border-white/10 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                    isRevealed 
                      ? "bg-purple-600 text-white shadow-md" 
                      : "bg-white/10 text-gray-400"
                  }`}>
                    {factNumber}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                    Факт #{factNumber}
                  </span>
                </div>

                <div className="shrink-0">
                  {isRevealed ? (
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                      +{factPoints} баллов
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Закрыто (цена снизится до {factPoints} б.)
                    </span>
                  )}
                </div>
              </div>

              {isRevealed ? (
                <p className="text-base sm:text-lg font-medium text-white leading-relaxed pl-10">
                  {factText}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-500 italic pl-10 flex items-center gap-2">
                  <span>🔒 Этот факт пока скрыт. Ведущий откроет его, если командам нужна подсказка.</span>
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Поле ввода для игроков */}
      {!user.isAdmin && isLeader === false && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-3xl p-5 text-center shadow-xl space-y-1.5">
          <p className="text-sm font-bold text-purple-200">
            👑 Ответ на раунд отправляет капитан вашей команды: <strong className="text-white underline">{leaderNickname || "Не назначен"}</strong>
          </p>
          <p className="text-xs text-gray-400">
            Совещайтесь в голосовом чате — ответ в игру вводит только капитан!
          </p>
        </div>
      )}

      {!user.isAdmin && isLeader !== false && (
        <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-purple-300">
              Ваш ответ (как капитан команды):
            </label>
            {hasSubmitted ? (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Ответ принят за +{submittedPoints} баллов!
              </span>
            ) : (
              <span className="text-amber-400 text-xs font-bold">
                Отправка прямо сейчас принесёт: +{currentPoints} баллов
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value.slice(0, 80))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !hasSubmitted) handlePlayerSubmit();
              }}
              disabled={hasSubmitted}
              placeholder={hasSubmitted ? "Ваш ответ отправлен" : "Введите название тайтла..."}
              maxLength={80}
              className="w-full flex-1 bg-black/60 border border-purple-500/40 rounded-2xl px-5 py-4 text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 font-medium transition-all"
            />
            <button
              onClick={handlePlayerSubmit}
              disabled={hasSubmitted || !answerInput.trim()}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 ${
                hasSubmitted
                  ? "bg-emerald-600/80 text-white cursor-default"
                  : "bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:to-purple-700 active:scale-95 text-white disabled:opacity-40 cursor-pointer"
              }`}
            >
              {hasSubmitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ОТВЕТ ПРИНЯТ ✅</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ОТПРАВИТЬ (+{currentPoints} Б.)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Показ ответа ведущим */}
      {(gameState.showAnswer || gameState.roundFinished) && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/80 border-2 border-emerald-500/60 rounded-3xl p-6 text-center space-y-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>Правильный ответ:</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white">
            {questionData.animeTitle}
          </h3>
        </motion.div>
      )}

      {/* Панель ведущего */}
      {user.isAdmin && (
        <div className="bg-slate-900/95 p-6 rounded-3xl border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>👑 Панель управления ведущего (Раунд 5)</span>
                <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                  Открыто фактов: {factsRevealed}/3
                </span>
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Правильный ответ: <span className="text-emerald-300 font-bold">{questionData.animeTitle}</span>
              </p>
            </div>

            {factsRevealed < 3 && (
              <button
                onClick={handleRevealNextFact}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 animate-pulse"
              >
                <span>Открыть Факт #{factsRevealed + 1} (цена: +{factsRevealed === 1 ? 4 : 3} б.)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-purple-300 uppercase tracking-wider">
                Ответы команд на Вопрос {currentQIdx + 1}:
              </span>
              <span className="text-gray-400">
                Всего ответов: {Object.values(players).filter((p: any) => p.roundAnswers?.[gameState.currentRound || 4]?.[storageKey]?.answered).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(players).map(([pId, pData]: [string, any]) => {
                const ans = pData?.roundAnswers?.[gameState.currentRound || 4]?.[storageKey];
                const scoreKey = `${gameState.currentRound || 4}_${storageKey}`;
                const awarded = pData?.scores?.[scoreKey] || ans?.pointsAwarded || 0;
                const ptsForThis = ans?.potentialPoints || 5;

                return (
                  <div
                    key={pId}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      awarded > 0
                        ? "bg-emerald-950/40 border-emerald-500/50"
                        : ans?.answered
                          ? ans.isAutoMatch
                            ? "bg-purple-950/40 border-amber-500/50"
                            : "bg-slate-900 border-white/10"
                          : "bg-black/30 border-white/5 opacity-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {pData.nickname || "Игрок"}
                        </span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded uppercase">
                          К{pData.team + 1}
                        </span>
                        {ans?.answered && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            {ans.factsRevealedAtAnswer || 1}-й факт (+{ptsForThis} б.)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-purple-200 mt-1 truncate">
                        {ans?.answered ? (
                          <span className="font-semibold text-white">«{ans.answer}»</span>
                        ) : (
                          <span className="text-gray-500 italic">Не ответил</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMarkAnswer(pId, true, ptsForThis)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          awarded > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40"
                        }`}
                      >
                        +{ptsForThis}
                      </button>
                      <button
                        onClick={() => handleMarkAnswer(pId, false, 0)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          awarded === 0 && ans?.checked
                            ? "bg-red-600 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        0
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
