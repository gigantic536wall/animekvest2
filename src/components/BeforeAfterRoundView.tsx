import React, { useState, useEffect, useRef } from "react";
import { Clock, Send, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";

interface BeforeAfterRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
  timeLeft: number;
  globalPause?: any;
  isLeader?: boolean;
  leaderNickname?: string;
}

export default function BeforeAfterRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
  timeLeft,
  globalPause,
  isLeader,
  leaderNickname,
}: BeforeAfterRoundViewProps) {
  const currentQIdx = gameState.currentQuestion ?? 0;
  const questionData = gameState.active ? gameState.roundData?.questions?.[currentQIdx] : null;

  const [answerInput, setAnswerInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const storageKey = `q${currentQIdx}`;
  const answerStoragePath = `players/${user?.id}/roundAnswers/${gameState.currentRound || 5}/${storageKey}`;

  const prevQIdxRef = useRef<number>(currentQIdx);

  // Сброс поля при смене вопроса
  useEffect(() => {
    if (prevQIdxRef.current !== currentQIdx) {
      prevQIdxRef.current = currentQIdx;
      setAnswerInput("");
      setHasSubmitted(false);
    }
  }, [currentQIdx]);

  // Проверка отправленного ответа
  useEffect(() => {
    const existing = players?.[user?.id]?.roundAnswers?.[gameState.currentRound || 5]?.[storageKey];
    if (existing?.answered) {
      setHasSubmitted(true);
      setAnswerInput(existing.answer || "");
    }
  }, [players, user?.id, gameState.currentRound, storageKey]);

  // Отправка ответа игроком
  const handlePlayerSubmit = async () => {
    const text = answerInput.trim();
    if (!text || hasSubmitted || user.isAdmin || isLeader === false) return;

    const payload = {
      answered: true,
      answer: text,
      timestamp: Date.now(),
      potentialPoints: 4, 
    };

    await restPut(answerStoragePath, payload);
    setHasSubmitted(true);
  };

  // Оценка ответа ведущим (+4 или 0)
  const handleMarkAnswer = async (playerId: string, isCorrect: boolean) => {
    if (!user.isAdmin) return;
    const scoreKey = `${gameState.currentRound || 5}_${storageKey}`;
    const pts = isCorrect ? 4 : 0;
    
    await restPut(`players/${playerId}/scores/${scoreKey}`, pts);
    await restPatch(`players/${playerId}/roundAnswers/${gameState.currentRound || 5}/${storageKey}`, {
      checked: true,
      pointsAwarded: pts,
    });
  };

  // Функция для правильных ссылок на Github Pages
  const getAssetPath = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base : base + "/";
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return cleanBase + cleanPath;
  };

  const isPaused = !!globalPause?.active || !!gameState?.globalPause?.active;
  
  // ПРАВИЛЬНАЯ ссылка на картинку с пропуском через getAssetPath
  const rawImageSrc = questionData?.image || `/foto6/round6_${currentQIdx + 1}.jpg`;
  const imageSrc = getAssetPath(rawImageSrc);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* ================= ШАПКА ================= */}
      <div className="bg-gradient-to-r from-purple-900/90 via-slate-900/90 to-indigo-900/90 p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-600/80 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Раунд 6 • Что было ДО / ПОСЛЕ
              </span>
              <span className="text-xs font-black px-3 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                За правильный ответ: +4 балла
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Вопрос {currentQIdx + 1} из 5
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-6 py-2.5 rounded-2xl border font-mono font-black text-2xl sm:text-3xl shadow-lg flex items-center gap-2 transition-all ${
              isPaused 
                ? "bg-amber-950/90 border-amber-400 text-amber-300 animate-pulse" 
                : timeLeft <= 10 
                  ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse" 
                  : "bg-purple-950/80 border-purple-500 text-purple-200"
            }`}>
              <Clock className="w-6 h-6 shrink-0 text-amber-400" />
              <span>{isPaused ? `⏸️ ${timeLeft}s` : `${timeLeft}s`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ФОТОГРАФИЯ (КАДР) ================= */}
      <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl aspect-video bg-black/60 rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center">
          <img 
            src={imageSrc}
            alt={`Кадр вопроса ${currentQIdx + 1}`}
            className="w-full h-full object-contain"
            // Убрали заглушку с горой, чтобы в случае ошибки сразу видеть проблему!
          />
          <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-xl text-white font-black text-sm border border-purple-500/40 shadow-lg flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" /> Внимательно изучите кадр!
          </div>
        </div>
        <p className="text-gray-300 font-bold mt-4 text-center">
          Напишите, что произошло <span className="text-amber-400">ДО</span> или <span className="text-amber-400">ПОСЛЕ</span> этого момента.
        </p>
      </div>

      {/* ================= ВВОД ИГРОКА ================= */}
      {!user.isAdmin && isLeader === false && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-3xl p-5 text-center shadow-xl space-y-1.5 max-w-4xl mx-auto">
          <p className="text-sm font-bold text-purple-200">
            👑 Ответ на раунд отправляет капитан вашей команды: <strong className="text-white underline">{leaderNickname || "Не назначен"}</strong>
          </p>
          <p className="text-xs text-gray-400">
            Совещайтесь в голосовом чате — ответ в систему вводит только капитан!
          </p>
        </div>
      )}

      {!user.isAdmin && isLeader !== false && (
        <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-purple-300">
              Ваш ответ (как капитан команды):
            </label>
            {hasSubmitted && (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Ответ отправлен!
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value.slice(0, 150))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !hasSubmitted) handlePlayerSubmit();
              }}
              disabled={hasSubmitted}
              placeholder={hasSubmitted ? "Ожидайте проверку ведущим..." : "Опишите текстом, что произошло..."}
              maxLength={150}
              className="w-full flex-1 bg-black/60 border border-purple-500/40 rounded-2xl px-5 py-4 text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 font-medium transition-all"
            />
            <button
              onClick={handlePlayerSubmit}
              disabled={hasSubmitted || !answerInput.trim()}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 ${
                hasSubmitted
                  ? "bg-emerald-600/80 text-white cursor-default"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white cursor-pointer"
              }`}
            >
              {hasSubmitted ? "ОТВЕТ ПРИНЯТ ✅" : "ОТПРАВИТЬ (+4 Б.)"}
            </button>
          </div>
        </div>
      )}

      {/* ================= ПАНЕЛЬ ВЕДУЩЕГО ================= */}
      {user.isAdmin && (
        <div className="bg-slate-900/95 p-6 rounded-3xl border border-purple-500/30 space-y-4 shadow-2xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>👑 Проверка ответов (Вопрос {currentQIdx + 1})</span>
            </h4>
            <span className="text-xs text-gray-400">Оценивайте вручную!</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(players)
              .filter(([_, p]: [string, any]) => p.roundAnswers?.[gameState.currentRound || 5]?.[storageKey]?.answered)
              .map(([pId, pData]: [string, any]) => {
                const ans = pData.roundAnswers[gameState.currentRound || 5][storageKey];
                const scoreKey = `${gameState.currentRound || 5}_${storageKey}`;
                const awarded = pData.scores?.[scoreKey] || ans.pointsAwarded || 0;

                return (
                  <div
                    key={pId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      awarded > 0
                        ? "bg-emerald-950/40 border-emerald-500/50"
                        : ans.checked
                          ? "bg-red-950/40 border-red-500/50"
                          : "bg-slate-800 border-white/10"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {pData.nickname || "Игрок"}
                        </span>
                        <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full uppercase font-bold">
                          К{pData.team + 1}
                        </span>
                        {awarded > 0 && (
                          <span className="text-[10px] text-emerald-400 font-bold ml-2">Начислено: +4</span>
                        )}
                      </div>
                      <div className="text-sm text-purple-200 mt-1.5 font-medium break-words">
                        «{ans.answer}»
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMarkAnswer(pId, true)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                          awarded > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/60 hover:text-white"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Верно (+4)
                      </button>
                      <button
                        onClick={() => handleMarkAnswer(pId, false)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                          awarded === 0 && ans.checked
                            ? "bg-red-600 text-white"
                            : "bg-red-600/30 text-red-300 hover:bg-red-600/60 hover:text-white"
                        }`}
                      >
                        <XCircle className="w-4 h-4" /> Неверно (0)
                      </button>
                    </div>
                  </div>
                );
            })}
            
            {Object.values(players).filter((p: any) => p.roundAnswers?.[gameState.currentRound || 5]?.[storageKey]?.answered).length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 italic">
                Ожидаем ответы от команд...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
