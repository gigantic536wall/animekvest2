import React, { useState, useEffect, useRef } from "react";
import { Clock, Send, CheckCircle2, XCircle, Image as ImageIcon, Sparkles } from "lucide-react";

interface BeforeAfterRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  teamsData?: Record<string, any>;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
  timeLeft: number;
  serverOffset?: number;
  globalPause?: any;
  isLeader?: boolean;
  leaderNickname?: string;
}

export default function BeforeAfterRoundView({
  user,
  gameState,
  players,
  teamsData,
  restPatch,
  restPut,
  timeLeft,
  serverOffset = 0,
  globalPause,
  isLeader,
  leaderNickname,
}: BeforeAfterRoundViewProps) {
  const currentQIdx = gameState.currentQuestion ?? 0;
  const questionData = gameState.active ? gameState.roundData?.questions?.[currentQIdx] : null;

  const [answerInput, setAnswerInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const roundIdx = gameState.currentRound ?? 6;
  const storageKey = `q${currentQIdx}`;
  const answerStoragePath = `players/${user?.id}/roundAnswers/${roundIdx}/${storageKey}`;

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
    const existing = players?.[user?.id]?.roundAnswers?.[roundIdx]?.[storageKey];
    if (existing?.answered) {
      setHasSubmitted(true);
      setAnswerInput(existing.answer || "");
    }
  }, [players, user?.id, roundIdx, storageKey]);

  // Проверка ответа капитана для всей команды
  const teamId = user?.team;
  const teamMemberWhoAnswered: any = teamId !== undefined && teamId >= 0
    ? Object.values(players).find((p: any) => p.team === teamId && p.roundAnswers?.[roundIdx]?.[storageKey]?.answered)
    : null;
  const teamCaptainAnswerObj = teamMemberWhoAnswered?.roundAnswers?.[roundIdx]?.[storageKey];
  const captainSubmittedAnswer = hasSubmitted ? answerInput : (teamCaptainAnswerObj?.answer || "");

  const [teammateSentNotice, setTeammateSentNotice] = useState(false);
  const suggestionDebounceRef = useRef<any>(null);

  const getAvatarSrc = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base : base + "/";
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return cleanBase + cleanPath;
  };

  const syncTeammateSuggestion = (val: string) => {
    if (!user || user.isAdmin || isLeader || teamId === undefined || teamId < 0) return;
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);

    suggestionDebounceRef.current = setTimeout(async () => {
      try {
        await restPatch(`teams/${teamId}/suggestions/${user.id}`, {
          userId: user.id,
          nickname: user.nickname || "Игрок",
          avatar: user.avatar || null,
          round: roundIdx,
          question: currentQIdx,
          anime: val.trim(),
          updatedAt: Date.now()
        });
      } catch (e) {
        console.error("Error syncing teammate suggestion:", e);
      }
    }, 400);
  };

  const submitTeammateSuggestion = async () => {
    if (!user || user.isAdmin || isLeader || teamId === undefined || teamId < 0) return;
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);

    try {
      await restPatch(`teams/${teamId}/suggestions/${user.id}`, {
        userId: user.id,
        nickname: user.nickname || "Игрок",
        avatar: user.avatar || null,
        round: roundIdx,
        question: currentQIdx,
        anime: answerInput.trim(),
        updatedAt: Date.now()
      });
      setTeammateSentNotice(true);
      setTimeout(() => setTeammateSentNotice(false), 3500);
    } catch (e) {
      console.error("Error submitting teammate suggestion:", e);
    }
  };

  // Отправка ответа игроком
  const handlePlayerSubmit = async () => {
    const text = answerInput.trim();
    if (!text || hasSubmitted || user.isAdmin || !isLeader) return;

    const payload = {
      answered: true,
      answer: text,
      timestamp: Date.now(),
      potentialPoints: 4, 
      checked: false,
    };

    await restPut(answerStoragePath, payload);
    setHasSubmitted(true);

    if (teamId !== undefined && teamId >= 0) {
      const teamAns = {
        round: roundIdx,
        question: currentQIdx,
        answer: text,
        potentialPoints: 4,
        timestamp: Date.now(),
        by: user.nickname
      };
      restPatch(`teams/${teamId}`, {
        lastAnswer: teamAns,
        [`answers/r${roundIdx}_q${currentQIdx}`]: teamAns
      }).catch(console.error);
    }
  };

  // Оценка ответа ведущим (+4 или 0)
  const handleMarkAnswer = async (playerId: string, isCorrect: boolean) => {
    if (!user.isAdmin) return;
    const scoreKey = `${roundIdx}_${storageKey}`;
    const pts = isCorrect ? 4 : 0;
    
    await restPut(`players/${playerId}/scores/${scoreKey}`, pts);
    await restPatch(`players/${playerId}/roundAnswers/${roundIdx}/${storageKey}`, {
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
      {!user.isAdmin && !isLeader && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-3xl p-5 text-center shadow-xl space-y-2">
            <p className="text-sm font-bold text-purple-200">
              👑 Итоговый ответ отправляет капитан вашей команды: <strong className="text-white underline">{leaderNickname || "Не назначен"}</strong>
            </p>
            {captainSubmittedAnswer ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl max-w-lg mx-auto shadow-lg space-y-1">
                <span className="text-xs text-emerald-400 font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Капитан отправил официальный ответ:
                </span>
                <span className="text-base font-black text-white bg-black/40 px-4 py-1.5 rounded-xl border border-emerald-500/30 inline-block">
                  «{captainSubmittedAnswer}»
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                💡 Опишите вашу версию событий ниже — капитан команды увидит её и сможет отправить на проверку!
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => {
                const val = e.target.value.slice(0, 150);
                setAnswerInput(val);
                syncTeammateSuggestion(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTeammateSuggestion();
              }}
              disabled={Boolean(captainSubmittedAnswer)}
              placeholder="Опишите, что произошло (для капитана)..."
              maxLength={150}
              className="w-full flex-1 bg-black/60 border border-purple-500/40 rounded-2xl px-5 py-4 text-white text-base placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 font-medium transition-all"
            />
            <button
              onClick={submitTeammateSuggestion}
              disabled={Boolean(captainSubmittedAnswer) || !answerInput.trim()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg active:scale-95 cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>💡</span>
              <span>{teammateSentNotice ? "ВАРИАНТ ОТПРАВЛЕН ✅" : "ПРЕДЛОЖИТЬ КАПИТАНУ"}</span>
            </button>
          </div>
        </div>
      )}

      {!user.isAdmin && Boolean(isLeader) && (
        <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl max-w-4xl mx-auto">
          {/* Подсказки сокомандников для капитана */}
          {(() => {
            const otherPlayerSuggestions = isLeader && teamId !== undefined && teamId >= 0 && teamsData
              ? Object.values(teamsData?.[teamId]?.suggestions || {})
                  .filter((s: any) =>
                    s &&
                    s.round === roundIdx &&
                    s.question === currentQIdx &&
                    s.userId !== user?.id &&
                    s.anime &&
                    s.anime.trim().length > 0
                  )
                  .map((s: any) => ({
                    userId: s.userId,
                    nickname: s.nickname || "Игрок",
                    avatar: s.avatar,
                    guess: s.anime.trim()
                  }))
              : [];

            if (!isLeader || otherPlayerSuggestions.length === 0) return null;

            return (
              <div className="p-3 bg-purple-950/80 border border-purple-500/40 rounded-2xl space-y-1.5 shadow-md animate-fade-in">
                <div className="text-xs font-black uppercase text-purple-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Варианты сокомандников:</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">клик = подставить</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherPlayerSuggestions.map((s, si) => (
                    <button
                      key={si}
                      type="button"
                      onClick={() => setAnswerInput(s.guess)}
                      className="inline-flex items-center gap-2 bg-black/60 hover:bg-purple-800/60 border border-purple-400/40 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      {s.avatar && <img src={getAvatarSrc(s.avatar)} alt="" className="w-4 h-4 rounded-full object-cover" />}
                      <span className="text-gray-300 text-[11px] font-normal">{s.nickname}:</span>
                      <span className="text-amber-300 font-black">«{s.guess}»</span>
                      <span className="text-xs text-purple-300">↵</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

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
