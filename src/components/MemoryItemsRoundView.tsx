import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Eye, EyeOff, Clock, CheckCircle2, XCircle, Sparkles, Send, 
  Upload, AlertCircle, ArrowRight, RotateCcw, Trophy, HelpCircle, Lock, ShieldCheck
} from "lucide-react";
import { ROUND4_STAGES, MemoryStage, MemorySubQuestion } from "../data/round4Data";

interface MemoryItemsRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
  serverOffset?: number;
}

export default function MemoryItemsRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
  serverOffset = 0,
}: MemoryItemsRoundViewProps) {
  // Current stage (0, 1, 2)
  const currentStageIdx: number = gameState.memoryStage ?? 0;
  const stageData: MemoryStage = ROUND4_STAGES[currentStageIdx] || ROUND4_STAGES[0];

  // Current sub-question (0, 1, 2, 3)
  const currentSubQIdx: number = gameState.memorySubQuestion ?? 0;
  const currentQuestion: MemorySubQuestion = stageData.subQuestions[currentSubQIdx] || stageData.subQuestions[0];

  // Phase: 'memorize' (picture visible for 15s) | 'question' (picture hidden, answering for 15s) | 'stage_finished' (waiting for admin to start next stage)
  const currentPhase: "memorize" | "question" | "stage_finished" = gameState.memoryPhase || "memorize";

  // Local state
  const [answerInput, setAnswerInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminPeekImage, setAdminPeekImage] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronized timer
  const [localSecondsLeft, setLocalSecondsLeft] = useState<number>(15);
  const prevPhaseKeyRef = useRef<string>("");
  const lastQuestionKeyRef = useRef<string>("");

  // Storage key for user answer in Firebase:
  // players/${user.id}/roundAnswers/3/stage${currentStageIdx}_q${currentSubQIdx}
  const answerStoragePath = `players/${user.id}/roundAnswers/${gameState.currentRound || 3}/stage${currentStageIdx}_q${currentSubQIdx}`;
  const scoreKey = `round4_stage${currentStageIdx}_q${currentSubQIdx}`;

  // Unique key identifying the current question
  const currentQKey = `${currentStageIdx}_${currentSubQIdx}`;

  // Check if player has already submitted for this specific question
  // BUG FIX: Do NOT include `players` whole object in deps, and do NOT clear input if still on same question!
  useEffect(() => {
    const existingAns = players[user.id]?.roundAnswers?.[gameState.currentRound || 3]?.[`stage${currentStageIdx}_q${currentSubQIdx}`];
    if (existingAns?.answered) {
      setHasSubmitted(true);
      setAnswerInput(existingAns.answer || "");
    } else {
      setHasSubmitted(false);
      // ONLY clear user input if navigating to a different question!
      if (lastQuestionKeyRef.current !== currentQKey) {
        setAnswerInput("");
      }
    }
    lastQuestionKeyRef.current = currentQKey;
  }, [
    currentQKey, 
    user.id, 
    players?.[user.id]?.roundAnswers?.[gameState.currentRound || 3]?.[`stage${currentStageIdx}_q${currentSubQIdx}`]?.answered
  ]);

  // Timer countdown hook
  useEffect(() => {
    const updateCountdown = () => {
      if (!gameState.active || gameState.roundFinished) return;
      const targetEnd = gameState.memoryEndTime;
      if (!targetEnd) {
        setLocalSecondsLeft(currentPhase === "memorize" ? 15 : currentQuestion.answerTime);
        return;
      }
      const now = Date.now() + serverOffset;
      const remainingMs = Math.max(0, targetEnd - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setLocalSecondsLeft(remainingSec);

      // Auto-advance by Admin:
      // 1. Memorize phase (15s) -> automatically goes to Question 1
      // 2. Question phase (15s) -> automatically goes to next Question (Q1 -> Q2 -> Q3 -> Q4)
      // 3. Question 4 ends -> STOP and wait for Admin to switch to next Picture!
      if (remainingMs <= 0 && user.isAdmin) {
        const phaseKey = `${currentStageIdx}-${currentSubQIdx}-${currentPhase}`;
        if (prevPhaseKeyRef.current !== phaseKey) {
          prevPhaseKeyRef.current = phaseKey;
          if (currentPhase === "memorize") {
            // Automatically switch from memorize (15s) to question 1 (15s)
            startQuestionPhase(currentStageIdx, 0);
          } else if (currentPhase === "question") {
            if (currentSubQIdx < 3) {
              // Automatically advance to the next question in this stage!
              startQuestionPhase(currentStageIdx, currentSubQIdx + 1);
            } else {
              // Finished all 4 questions: transition to stage_finished and wait for Admin!
              finishStagePhase(currentStageIdx);
            }
          }
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [gameState.memoryEndTime, gameState.active, currentPhase, currentStageIdx, currentSubQIdx, serverOffset, user.isAdmin]);

  // Image source resolution with GitHub Pages basePath support and auto-fallbacks
  const customUploadedImage = gameState.round4Images?.[currentStageIdx];
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allCandidatesFailed, setAllCandidatesFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setAllCandidatesFailed(false);
  }, [currentStageIdx, customUploadedImage]);

  const n = currentStageIdx + 1;
  const base = (import.meta as any).env?.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : base + "/";

  const candidates = customUploadedImage
    ? [customUploadedImage]
    : [
        `${cleanBase}foto4/round4_${n}.jpg`,
        `./foto4/round4_${n}.jpg`,
        `/animekvest2/foto4/round4_${n}.jpg`,
        `/foto4/round4_${n}.jpg`,
        `${cleanBase}foto4/round4_${n}.png`,
        `./foto4/round4_${n}.png`,
        `/animekvest2/foto4/round4_${n}.png`,
        `/foto4/round4_${n}.png`,
      ];

  const currentImgSrc = candidates[candidateIdx] || candidates[0];

  const handleImgError = () => {
    if (candidateIdx < candidates.length - 1) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setAllCandidatesFailed(true);
    }
  };

  // ==================== ADMIN ACTIONS ====================

  const startMemorizePhase = async (stageIdx: number) => {
    if (!user.isAdmin) return;
    const duration = 15;
    await restPatch("gameState", {
      memoryStage: stageIdx,
      memorySubQuestion: 0,
      memoryPhase: "memorize",
      memoryEndTime: Date.now() + duration * 1000,
      showAnswer: false,
    });
  };

  const startQuestionPhase = async (stageIdx: number, subQIdx: number) => {
    if (!user.isAdmin) return;
    const subQ = ROUND4_STAGES[stageIdx]?.subQuestions[subQIdx] || ROUND4_STAGES[0].subQuestions[0];
    const duration = subQ.answerTime || 15;
    await restPatch("gameState", {
      memoryStage: stageIdx,
      memorySubQuestion: subQIdx,
      memoryPhase: "question",
      memoryEndTime: Date.now() + duration * 1000,
      showAnswer: false,
    });
  };

  const toggleShowAnswer = async () => {
    if (!user.isAdmin) return;
    await restPatch("gameState", {
      showAnswer: !gameState.showAnswer,
    });
  };

  const finishStagePhase = async (stageIdx: number) => {
    if (!user.isAdmin) return;
    await restPatch("gameState", {
      memoryStage: stageIdx,
      memoryPhase: "stage_finished",
      memoryEndTime: 0,
      showAnswer: false,
    });
  };

  const nextSubQuestion = async () => {
    if (!user.isAdmin) return;
    const nextQ = currentSubQIdx + 1;
    if (nextQ < stageData.subQuestions.length) {
      await startQuestionPhase(currentStageIdx, nextQ);
    } else {
      // Finished all 4 questions for this stage! Enter stage_finished and wait for Admin
      await finishStagePhase(currentStageIdx);
    }
  };

  const prevSubQuestion = async () => {
    if (!user.isAdmin) return;
    if (currentSubQIdx > 0) {
      await startQuestionPhase(currentStageIdx, currentSubQIdx - 1);
    } else if (currentStageIdx > 0) {
      await startQuestionPhase(currentStageIdx - 1, 3);
    }
  };

  // Point award handler (+5 or 0)
  const awardPoints = async (playerId: string, points: number) => {
    if (!user.isAdmin) return;
    await restPut(`players/${playerId}/scores/${scoreKey}`, points);
    await restPatch(`players/${playerId}/roundAnswers/${gameState.currentRound || 3}/stage${currentStageIdx}_q${currentSubQIdx}`, {
      checked: true,
      pointsAwarded: points,
    });
  };

  // Bulk award +5 to all players whose answer matches acceptable answers
  const autoAcceptCorrectAnswers = async () => {
    if (!user.isAdmin) return;
    const playersList = Object.entries(players);
    for (const [pId, pData] of playersList) {
      const ansData = (pData as any)?.roundAnswers?.[gameState.currentRound || 3]?.[`stage${currentStageIdx}_q${currentSubQIdx}`];
      if (ansData?.answered && ansData.answer) {
        const cleanAns = ansData.answer.trim().toLowerCase();
        const isMatch = currentQuestion.acceptableAnswers.some(acc => cleanAns.includes(acc.toLowerCase()));
        if (isMatch) {
          await awardPoints(pId, currentQuestion.points);
        }
      }
    }
  };

  // Image file upload handler (for host to drop or pick the picture)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, stageIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadStatus("Загрузка картинки...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        try {
          await restPut(`gameState/round4Images/${stageIdx}`, dataUrl);
          setImageUploadStatus(`Картинка ${stageIdx + 1} успешно сохранена в базе!`);
          setTimeout(() => setImageUploadStatus(""), 4000);
        } catch (err) {
          setImageUploadStatus("Ошибка сохранения картинки в базе");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // ==================== PLAYER ANSWER SUBMIT ====================

  const handlePlayerSubmit = async () => {
    const text = answerInput.trim();
    if (!text || hasSubmitted || isSubmitting || user.isAdmin) return;

    setIsSubmitting(true);
    try {
      // Check if matches acceptable answers for auto-flagging
      const clean = text.toLowerCase();
      const isAutoCorrect = currentQuestion.acceptableAnswers.some(acc => clean.includes(acc.toLowerCase()));

      const payload = {
        answered: true,
        answer: text,
        timestamp: Date.now(),
        potentialPoints: currentQuestion.points,
        autoCorrect: isAutoCorrect,
      };

      await restPut(answerStoragePath, payload);
      setHasSubmitted(true);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer progress percentage
  const totalPhaseTime = currentPhase === "memorize" ? 15 : currentQuestion.answerTime;
  const progressPercent = Math.max(0, Math.min(100, (localSecondsLeft / totalPhaseTime) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* ==================== HEADER BAR ==================== */}
      <div className="bg-gradient-to-r from-purple-900/90 via-slate-900/90 to-indigo-900/90 p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-600/80 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Раунд 4 • Фото-память
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                +5 баллов за вопрос
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>🖼️ {stageData.title}</span>
              {currentPhase === "memorize" ? (
                <span className="text-amber-400 text-sm font-bold animate-pulse">
                  (Запоминание предметов)
                </span>
              ) : currentPhase === "stage_finished" ? (
                <span className="text-emerald-400 text-sm font-bold">
                  (Вопросы завершены)
                </span>
              ) : (
                <span className="text-purple-300 text-sm font-bold">
                  (Вопрос {currentSubQIdx + 1} из 4)
                </span>
              )}
            </h2>
          </div>

          {/* Central Countdown Timer */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className={`px-5 py-2.5 rounded-2xl border font-mono font-black text-2xl sm:text-3xl shadow-lg flex items-center gap-2 transition-all ${
                currentPhase === "stage_finished"
                  ? "bg-slate-900 border-white/20 text-gray-300 text-base sm:text-lg"
                  : localSecondsLeft <= 5 
                    ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse" 
                    : currentPhase === "memorize" 
                      ? "bg-amber-950/80 border-amber-500 text-amber-300"
                      : "bg-purple-950/80 border-purple-500 text-purple-200"
              }`}>
                <Clock className="w-6 h-6 shrink-0" />
                <span>{currentPhase === "stage_finished" ? "Ожидание" : `${localSecondsLeft}s`}</span>
              </div>
            </div>

            {/* Stages navigation indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 p-2 rounded-2xl border border-white/10">
              {ROUND4_STAGES.map((s, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                    idx === currentStageIdx 
                      ? "bg-purple-600 text-white shadow-lg scale-110 ring-2 ring-purple-400" 
                      : idx < currentStageIdx 
                        ? "bg-emerald-600/60 text-white" 
                        : "bg-white/10 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Timer Progress Bar */}
        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-4 border border-white/10">
          <div 
            className={`h-full transition-all duration-300 ${
              localSecondsLeft <= 5 
                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" 
                : currentPhase === "memorize"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                  : "bg-gradient-to-r from-purple-500 to-pink-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ==================== MAIN CONTENT AREA ==================== */}

      {/* PHASE 1: MEMORIZATION (15 SECONDS) */}
      {currentPhase === "memorize" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="space-y-4"
        >
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 text-center">
            <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center justify-center gap-2">
              <Eye className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>ФАЗА ЗАПОМИНАНИЯ (15 СЕКУНД)</span>
            </h3>
            <p className="text-xs text-amber-200/80 mt-1 max-w-xl mx-auto">
              Внимательно запомните все предметы, детали, цвета и числа на картинке! Через 15 секунд картинка исчезнет, и вам предстоит ответить на 4 вопроса по памяти.
            </p>
          </div>

          {/* Picture Box */}
          <div className="relative bg-slate-900/90 border border-white/15 rounded-3xl p-3 shadow-2xl overflow-hidden flex items-center justify-center min-h-[380px]">
            {!allCandidatesFailed ? (
              <img
                key={currentImgSrc}
                src={currentImgSrc}
                alt={stageData.title}
                referrerPolicy="no-referrer"
                className="max-h-[560px] w-auto max-w-full rounded-2xl object-contain shadow-2xl transition-all"
                onError={handleImgError}
              />
            ) : (
              <div 
                className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-2xl">
                  🖼️
                </div>
                <h4 className="text-white font-bold text-sm">
                  Изображение для {stageData.title}
                </h4>
                <p className="text-xs text-gray-400">
                  Картинка не найдена по пути <code className="text-purple-300 bg-black/40 px-2 py-0.5 rounded">public/foto4/round4_{n}.jpg</code>. Загрузите её в панели ведущего ниже.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 2: QUESTIONS (PICTURE IS HIDDEN, 15 SECONDS PER QUESTION) */}
      {currentPhase === "question" && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Question Card */}
          <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Top Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Вопрос {currentSubQIdx + 1} из 4
                </span>
                <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Картинка скрыта
                </span>
              </div>
              <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                +5 баллов
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed mb-6">
              {currentQuestion.text}
            </h3>

            {/* Answer Input Section for Players */}
            {!user.isAdmin && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
                    <span>Ваш ответ по памяти:</span>
                    {hasSubmitted && (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ответ отправлен и зафиксирован
                      </span>
                    )}
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={answerInput}
                      onChange={(e) => !hasSubmitted && setAnswerInput(e.target.value.slice(0, 80))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !hasSubmitted) handlePlayerSubmit();
                      }}
                      disabled={hasSubmitted || isSubmitting}
                      placeholder={hasSubmitted ? "Ответ зафиксирован" : "Введите ваш ответ здесь..."}
                      maxLength={80}
                      className="w-full flex-1 bg-black/60 border border-purple-500/40 rounded-2xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 font-medium transition-all"
                    />
                    <button
                      onClick={handlePlayerSubmit}
                      disabled={hasSubmitted || isSubmitting || !answerInput.trim()}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shrink-0 flex items-center justify-center gap-2 ${
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
                          <span>ОТПРАВИТЬ (+5 Б.)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {hasSubmitted && (
                  <p className="text-[11px] text-gray-400 text-center font-medium">
                    Ответ принят. Согласно правилам, после отправки изменить ответ нельзя. Ожидайте окончания раунда.
                  </p>
                )}
              </div>
            )}

            {/* Answer Reveal (when host enables it or round finished) */}
            {(gameState.showAnswer || gameState.roundFinished) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl space-y-1"
              >
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Правильный ответ:</span>
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  {currentQuestion.correctAnswer}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* PHASE 3: STAGE FINISHED (WAITING FOR ADMIN TO MOVE TO NEXT PICTURE) */}
      {currentPhase === "stage_finished" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-5 backdrop-blur-xl"
        >
          <div className="w-16 h-16 bg-purple-600/30 border border-purple-500/50 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg">
            🏁
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Вопросы по {stageData.title} завершены!
            </h3>
            <p className="text-sm text-purple-200/80 max-w-lg mx-auto">
              {currentStageIdx < 2 
                ? `Все 4 вопроса к этой картинке отвечены. Ожидайте, пока ведущий проверит ответы и откроет Картинку ${currentStageIdx + 2}.`
                : "Все 3 картинки и все 12 вопросов 4-го раунда завершены! Ведущий подводит итоги раунда."
              }
            </p>
          </div>

          {/* Admin transition button directly inside the view */}
          {user.isAdmin && (
            <div className="pt-2 flex justify-center">
              {currentStageIdx < 2 ? (
                <button
                  onClick={() => startMemorizePhase(currentStageIdx + 1)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl transition-all shadow-xl flex items-center gap-3 cursor-pointer active:scale-95 animate-pulse"
                >
                  <span>Перейти к Картинке {currentStageIdx + 2} (15 сек) ➔</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await restPatch("gameState", {
                      roundFinished: true,
                      active: false,
                      showAnswer: true,
                    });
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl transition-all shadow-xl flex items-center gap-3 cursor-pointer active:scale-95"
                >
                  <span>Завершить 4-й раунд 🏆</span>
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== ADMIN HOST CONTROL PANEL ==================== */}
      {user.isAdmin && (
        <div className="bg-slate-900/95 p-6 rounded-3xl border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>👑 Панель управления ведущего (Раунд 4)</span>
                <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                  {currentPhase === "memorize" ? "Показ картинки" : `Вопрос ${currentSubQIdx + 1}/4`}
                </span>
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Правильный ответ: <span className="text-emerald-300 font-bold">{currentQuestion.correctAnswer}</span>
              </p>
            </div>

            {/* Host Peek Image button */}
            <button
              onClick={() => setAdminPeekImage(!adminPeekImage)}
              className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              {adminPeekImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{adminPeekImage ? "Скрыть картинку" : "👁️ Подсмотреть картинку"}</span>
            </button>
          </div>

          {/* Admin Image Peek View */}
          {adminPeekImage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-black/60 border border-purple-500/30 rounded-2xl flex flex-col items-center space-y-3"
            >
              <p className="text-xs font-bold text-amber-300">
                👁️ Просмотр картинки этапа (видна только ведущему для сверки):
              </p>
              <img
                key={currentImgSrc}
                src={currentImgSrc}
                alt={stageData.title}
                referrerPolicy="no-referrer"
                className="max-h-[360px] w-auto max-w-full rounded-xl object-contain border border-white/20"
                onError={handleImgError}
              />
            </motion.div>
          )}

          {/* Control Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => startMemorizePhase(currentStageIdx)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Показать картинку игрокам (15 сек)</span>
            </button>

            <button
              onClick={() => startQuestionPhase(currentStageIdx, currentSubQIdx)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Запустить вопрос {currentSubQIdx + 1} (15 сек)</span>
            </button>

            <button
              onClick={toggleShowAnswer}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{gameState.showAnswer ? "Скрыть ответ" : "Показать ответ"}</span>
            </button>

            {currentSubQIdx < 3 && currentPhase !== "stage_finished" ? (
              <button
                onClick={nextSubQuestion}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 ml-auto cursor-pointer"
              >
                <span>Следующий вопрос ({currentSubQIdx + 2}/4) ➔</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : currentStageIdx < 2 ? (
              <button
                onClick={() => startMemorizePhase(currentStageIdx + 1)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 ml-auto cursor-pointer animate-pulse"
              >
                <span>Перейти к Картинке {currentStageIdx + 2} (15 сек) ➔</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={async () => {
                  await restPatch("gameState", {
                    roundFinished: true,
                    active: false,
                    showAnswer: true,
                  });
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 ml-auto cursor-pointer"
              >
                <span>Завершить 4-й раунд 🏁</span>
              </button>
            )}
          </div>

          {/* Player Answers Review Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>📋 Ответы игроков на текущий вопрос:</span>
                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[11px] font-mono">
                  {Object.values(players).filter((p: any) => p.roundAnswers?.[gameState.currentRound || 3]?.[`stage${currentStageIdx}_q${currentSubQIdx}`]?.answered).length} отв.
                </span>
              </h5>

              <button
                onClick={autoAcceptCorrectAnswers}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Принять все похожие (+5)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {Object.entries(players).map(([pId, pData]: [string, any]) => {
                const ans = pData?.roundAnswers?.[gameState.currentRound || 3]?.[`stage${currentStageIdx}_q${currentSubQIdx}`];
                const cleanAns = (ans?.answer || "").trim().toLowerCase();
                const isAutoMatch = currentQuestion.acceptableAnswers.some(acc => cleanAns.includes(acc.toLowerCase()));
                const awarded = pData?.scores?.[scoreKey] || ans?.pointsAwarded || 0;

                return (
                  <div
                    key={pId}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      awarded > 0 
                        ? "bg-emerald-950/40 border-emerald-500/50" 
                        : ans?.answered 
                          ? isAutoMatch 
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
                        {awarded > 0 && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                            +{awarded} б.
                          </span>
                        )}
                        {isAutoMatch && awarded === 0 && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                            ✓ Похоже
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

                    {/* Point Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => awardPoints(pId, 5)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          awarded === 5 
                            ? "bg-emerald-600 text-white" 
                            : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40"
                        }`}
                      >
                        +5
                      </button>
                      <button
                        onClick={() => awardPoints(pId, 0)}
                        className={`px-2 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
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

          {/* Host Image Uploader */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Загрузить или заменить картинку этапа:</span>
                </p>
                <p className="text-[10px] text-gray-400">
                  Загруженная картинка мгновенно сохранится в Firebase и будет видна всем игрокам онлайн.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[0, 1, 2].map((sIdx) => (
                  <label
                    key={sIdx}
                    className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                  >
                    <span>Фото {sIdx + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, sIdx)}
                    />
                  </label>
                ))}
              </div>
            </div>
            {imageUploadStatus && (
              <p className="text-xs text-emerald-400 mt-2 font-bold animate-pulse">
                {imageUploadStatus}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
