import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, CheckCircle2, XCircle, AlertTriangle, Trash2, 
  Sparkles, Eye, Send, RotateCcw, Award, Layers, Flame,
  SkipForward, Clock, History, AlertCircle, BookOpen
} from "lucide-react";
import { 
  BingoCell, 
  generateBingoPool32, 
  generateTeamBingoCard, 
  evaluateBingoCard 
} from "../data/bingoData";
import { BingoRulesModal } from "./BingoRulesModal";

interface BingoRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
}

const TOTAL_TEAMS = 10;

export default function BingoRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
}: BingoRoundViewProps) {
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
  const [adminSelectedTeam, setAdminSelectedTeam] = useState<number>(0);
  const [adminSelectedErrorCells, setAdminSelectedErrorCells] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [dockTab, setDockTab] = useState<"current" | "all">("current");
  const [showRulesModal, setShowRulesModal] = useState<boolean>(() => {
    // Auto-show rules when round 8 starts unless closed in current browser session
    const hasSeen = sessionStorage.getItem("bingo_rules_seen_r8");
    return !hasSeen;
  });

  const handleCloseRules = () => {
    sessionStorage.setItem("bingo_rules_seen_r8", "true");
    setShowRulesModal(false);
  };

  const bingoState = gameState?.bingo || {};
  const pool32: string[] = bingoState.pool32 || [];
  const revealedCount: number = bingoState.revealedCount || 0;
  const revealedAnime = pool32.slice(0, revealedCount);
  const lastRevealed: string[] = bingoState.lastRevealed || [];

  // The active pair that can be placed RIGHT NOW (only current drop of 2 anime)
  const currentPair: string[] = (lastRevealed && lastRevealed.length > 0)
    ? lastRevealed
    : pool32.slice(Math.max(0, revealedCount - 2), revealedCount);

  // If selectedAnime is no longer in currentPair, clear it
  useEffect(() => {
    if (selectedAnime && !currentPair.includes(selectedAnime)) {
      setSelectedAnime(null);
    }
  }, [currentPair, selectedAnime]);

  // Determine active team view
  const currentTeamIdx = user.isAdmin ? adminSelectedTeam : (user.team ?? 0);
  const teamsData = bingoState.teams || {};
  const currentTeamData = teamsData[currentTeamIdx] || null;
  const card: BingoCell[] = currentTeamData?.card || [];

  // Auto-initialize Bingo round if Admin is present and bingo state is missing
  useEffect(() => {
    if (user?.isAdmin && (!bingoState.pool32 || bingoState.pool32.length === 0)) {
      initializeBingoGame();
    }
  }, [user?.isAdmin, bingoState?.pool32]);

  const initializeBingoGame = async () => {
    setIsProcessing(true);
    try {
      const newPool = generateBingoPool32();
      const initialTeams: Record<string, any> = {};
      for (let t = 0; t < TOTAL_TEAMS; t++) {
        initialTeams[t] = {
          teamIdx: t,
          card: generateTeamBingoCard(t),
          submittedForReview: false,
          submissionType: null,
          submittedAt: null,
          firstLineApproved: false,
          fullApproved: false,
          penaltyTotal: 0,
          lastPenaltyNotice: null
        };
      }

      await restPatch("gameState/bingo", {
        pool32: newPool,
        revealedCount: 0,
        lastRevealed: [],
        teams: initialTeams,
        roundOver: false
      });
      setStatusNotice("Бинго инициализировано: 32 тайтла готовы к выдаче!");
      setTimeout(() => setStatusNotice(""), 3500);
    } catch (e) {
      console.error("Failed to initialize bingo:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Host: reveal next 2 anime
  const handleRevealNext2 = async () => {
    if (!user.isAdmin || revealedCount >= pool32.length) return;
    setIsProcessing(true);
    try {
      const nextCount = Math.min(revealedCount + 2, pool32.length);
      const newlyRevealed = pool32.slice(revealedCount, nextCount);
      await restPatch("gameState/bingo", {
        revealedCount: nextCount,
        lastRevealed: newlyRevealed
      });
      setSelectedAnime(null);
    } catch (e) {
      console.error("Error revealing anime:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Set of anime titles placed in this team's card
  const usedAnimeTitles = new Set(
    card.map(c => c?.placedAnime).filter(Boolean) as string[]
  );

  // Map of placed title to cell index
  const placedAnimeCellMap = new Map<string, number>();
  card.forEach((c, idx) => {
    if (c?.placedAnime) placedAnimeCellMap.set(c.placedAnime, idx);
  });

  // Evaluate card status
  const cardEvaluation = evaluateBingoCard(card);

  // Placing anime into an empty cell
  const handleCellClick = async (cellIndex: number) => {
    if (user.isAdmin) {
      // In Admin view, clicking a cell toggles it in the multi-error selection
      const cell = card[cellIndex];
      if (!cell?.placedAnime) {
        setStatusNotice("В этой ячейке нет аниме — ошибку можно отметить только в заполненной ячейке!");
        setTimeout(() => setStatusNotice(""), 3000);
        return;
      }
      setAdminSelectedErrorCells(prev => 
        prev.includes(cellIndex) 
          ? prev.filter(i => i !== cellIndex) 
          : [...prev, cellIndex]
      );
      return;
    }

    if (currentTeamData?.submittedForReview) {
      setStatusNotice("Ваша карточка сейчас находится на проверке у админа!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    const cell = card[cellIndex];
    if (cell.placedAnime) {
      setStatusNotice("Эта ячейка уже занята! Нажмите на 🗑️ в ячейке, чтобы освободить её.");
      setTimeout(() => setStatusNotice(""), 3500);
      return;
    }

    if (!selectedAnime) {
      setStatusNotice("Сначала выберите аниме из текущей пары тайтлов справа!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    // Only allow placing anime from the CURRENT drop
    if (!currentPair.includes(selectedAnime)) {
      setStatusNotice("Это аниме уже недоступно (сгорело при переходе к следующей паре тайтлов)!");
      setSelectedAnime(null);
      setTimeout(() => setStatusNotice(""), 3500);
      return;
    }

    if (usedAnimeTitles.has(selectedAnime)) {
      setStatusNotice("Это аниме уже поставлено в другую ячейку!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    // Place anime into cell
    try {
      const newCard = [...card];
      newCard[cellIndex] = {
        ...newCard[cellIndex],
        placedAnime: selectedAnime,
        hasError: false
      };

      await restPut(`gameState/bingo/teams/${currentTeamIdx}/card`, newCard);
      setSelectedAnime(null);
    } catch (e) {
      console.error("Error placing anime:", e);
    }
  };

  // Remove anime from a cell (can only delete, not drag/move)
  const handleDeleteCellAnime = async (e: React.MouseEvent, cellIndex: number) => {
    e.stopPropagation();
    if (currentTeamData?.submittedForReview && !user.isAdmin) {
      setStatusNotice("Нельзя менять карточку, пока идет проверка админом!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    try {
      const newCard = [...card];
      newCard[cellIndex] = {
        ...newCard[cellIndex],
        placedAnime: null,
        hasError: false
      };
      await restPut(`gameState/bingo/teams/${currentTeamIdx}/card`, newCard);
    } catch (e) {
      console.error("Error clearing cell:", e);
    }
  };

  // Team: submit for review
  const handleSubmitForReview = async (type: "line" | "full") => {
    if (user.isAdmin || currentTeamData?.submittedForReview) return;
    try {
      await restPatch(`gameState/bingo/teams/${currentTeamIdx}`, {
        submittedForReview: true,
        submissionType: type,
        submittedAt: Date.now(),
        lastPenaltyNotice: null
      });
      setStatusNotice(
        type === "line" 
          ? "🎉 Заявка на Бинго отправлена ведущему! Ожидайте проверки." 
          : "👑 Заявка на полное закрытие поля отправлена ведущему!"
      );
      setTimeout(() => setStatusNotice(""), 4500);
    } catch (e) {
      console.error("Error submitting review:", e);
    }
  };

  // Admin: approve review
  const handleAdminApprove = async () => {
    if (!user.isAdmin || !currentTeamData?.submittedForReview) return;
    setIsProcessing(true);
    const teamIdx = adminSelectedTeam;
    const isFull = currentTeamData.submissionType === "full" || cardEvaluation.allCompleted;

    try {
      const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === teamIdx);

      if (isFull) {
        // Full card completed: +24 points bonus, ends the round
        const scoreKey = "round8_bingo_full";
        for (const [pId] of teamPlayers) {
          await restPut(`players/${pId}/scores/${scoreKey}`, 24);
        }
        await restPatch(`gameState/bingo/teams/${teamIdx}`, {
          submittedForReview: false,
          fullApproved: true,
          firstLineApproved: true
        });
        await restPatch("gameState/bingo", {
          roundOver: true
        });
        alert(`🎉 Команда ${teamIdx + 1} заполнила ВСЕ ячейки (+24 балла)! Раунд Бинго завершен!`);
      } else {
        // Line completed: +12 points for first line
        const scoreKey = "round8_bingo_line";
        for (const [pId] of teamPlayers) {
          await restPut(`players/${pId}/scores/${scoreKey}`, 12);
        }
        await restPatch(`gameState/bingo/teams/${teamIdx}`, {
          submittedForReview: false,
          firstLineApproved: true
        });
        alert(`✅ Бинго подтверждено! Команда ${teamIdx + 1} получает +12 баллов.`);
      }
    } catch (e) {
      console.error("Approve error:", e);
    } finally {
      setIsProcessing(false);
      setAdminSelectedErrorCells([]);
    }
  };

  // Admin: reject review with multiple error cells and -3 penalty per cell
  const handleAdminReject = async () => {
    if (!user.isAdmin || !currentTeamData) return;
    if (adminSelectedErrorCells.length === 0) {
      alert("Сначала нажмите на ячейки с ошибочными аниме на карточке выше, чтобы отметить их (можно несколько)!");
      return;
    }

    const invalidIndices = adminSelectedErrorCells.filter(idx => card[idx]?.placedAnime);
    if (invalidIndices.length === 0) {
      alert("В выбранных ячейках нет аниме!");
      return;
    }

    setIsProcessing(true);
    const teamIdx = adminSelectedTeam;
    const count = invalidIndices.length;
    const penalty = count * 3;

    try {
      // 1. Deduct 3 points per invalid cell from each player of the team
      const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === teamIdx);
      const penaltyKey = `round8_penalty_${Date.now()}`;
      for (const [pId] of teamPlayers) {
        await restPut(`players/${pId}/scores/${penaltyKey}`, -penalty);
      }

      // 2. Remove incorrect anime from each selected cell so cells are free for other anime
      const newCard = [...card];
      const rejectedItems: string[] = [];
      for (const idx of invalidIndices) {
        const wrongCell = newCard[idx];
        rejectedItems.push(`#${idx + 1} («${wrongCell.criterion}» → «${wrongCell.placedAnime}»)`);
        newCard[idx] = {
          ...newCard[idx],
          placedAnime: null,
          hasError: false
        };
      }

      const penaltyNotice = `❌ Ошибки при проверке (${count} шт.): ${rejectedItems.join(", ")}. С команды списано ${penalty} б. (-3 б. за каждую ошибку). Ошибочные аниме удалены, ячейки снова свободны для заполнения.`;

      // 3. Update team state in Firebase
      await restPatch(`gameState/bingo/teams/${teamIdx}`, {
        submittedForReview: false,
        lastPenaltyNotice: penaltyNotice,
        penaltyTotal: (currentTeamData.penaltyTotal || 0) + penalty
      });
      await restPut(`gameState/bingo/teams/${teamIdx}/card`, newCard);

      setAdminSelectedErrorCells([]);
      alert(`Отклонено ${count} ошибочных ячеек. С команды ${teamIdx + 1} списано ${penalty} баллов (-3 за каждую). Карточка возвращена команде.`);
    } catch (e) {
      console.error("Reject error:", e);
      alert("Ошибка при отклонении ячеек");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      {/* Top Banner / Notification */}
      <AnimatePresence>
        {statusNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-purple-600/30 border border-purple-500/50 rounded-2xl text-center text-purple-200 text-sm font-semibold shadow-lg backdrop-blur-md"
          >
            {statusNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Penalty Alert for Team */}
      {currentTeamData?.lastPenaltyNotice && !user.isAdmin && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-rose-500/20 border-2 border-rose-500/50 rounded-2xl text-center text-rose-200 text-sm font-bold shadow-xl flex items-center justify-center gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <span>{currentTeamData.lastPenaltyNotice}</span>
          <button
            onClick={() => restPatch(`gameState/bingo/teams/${currentTeamIdx}`, { lastPenaltyNotice: null })}
            className="ml-auto text-xs text-rose-300 hover:text-white underline"
          >
            Понятно
          </button>
        </motion.div>
      )}

      {/* Header Info Bar */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-pink-500 rounded-2xl shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 uppercase tracking-tight">
                Аниме-Бинго 4×4
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-gray-300 border border-white/10">
                Раунд 8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Соберите 4 в ряд (строка или столбец) — <span className="text-amber-400 font-bold">+12 б.</span> | Все ячейки поля — <span className="text-pink-400 font-bold">+24 б.</span>
            </p>
          </div>
        </div>

        {/* Revealed counter & status & rules button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-purple-950/40 cursor-pointer"
            title="Открыть правила раунда 8"
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>📖 Правила раунда</span>
          </button>

          <div className="bg-black/50 px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Открыто тайтлов</div>
              <div className="text-base font-black text-white font-mono">
                <span className="text-purple-400">{revealedCount}</span> / 32
              </div>
            </div>
          </div>

          {currentTeamData?.firstLineApproved && (
            <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              <span>Линия +12 б.</span>
            </div>
          )}

          {currentTeamData?.fullApproved && (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md animate-pulse">
              <Award className="w-4 h-4" />
              <span>Фулл +24 б.!</span>
            </div>
          )}
        </div>
      </div>

      {/* Fresh Drop Spotlight (The latest 2 anime revealed) */}
      {lastRevealed.length > 0 && (
        <motion.div
          key={lastRevealed.join("-")}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-slate-900/70 p-4 rounded-3xl border border-pink-500/30 shadow-[0_0_25px_rgba(236,72,153,0.15)] flex flex-col md:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-pink-300 font-bold text-sm shrink-0">
            <Flame className="w-5 h-5 text-pink-400 animate-bounce" />
            <span>Новое пополнение пула (последние 2 аниме):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastRevealed.map((title, i) => (
              <span
                key={i}
                className="bg-pink-500/20 border border-pink-400/40 text-pink-200 px-3 py-1.5 rounded-xl font-black text-sm shadow-md"
              >
                {title}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Admin Quick Reveal Bar */}
      {user.isAdmin && (
        <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900/90 p-4 rounded-3xl border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase font-black text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Управление выдачей аниме (Ведущий)</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Каждое нажатие выдает 2 новых тайтла. Все нерасставленные тайтлы у команд сгорают!
            </p>
          </div>

          <button
            onClick={handleRevealNext2}
            disabled={isProcessing || revealedCount >= pool32.length}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <SkipForward className="w-4 h-4" />
            {revealedCount >= pool32.length
              ? "Все 32 аниме открыты"
              : `Выдать следующие 2 аниме (${revealedCount + 2}/32)`}
          </button>
        </div>
      )}

      {/* Admin Team Switcher */}
      {user.isAdmin && (
        <div className="bg-slate-900/90 p-4 rounded-3xl border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-300">
            <span>Просмотр карточки команды (Администратор):</span>
            <span className="text-[11px] text-gray-400">
              {Object.values(teamsData).filter((t: any) => t.submittedForReview).length > 0
                ? "🔔 Есть команды, заявившие Бинго!"
                : "Заявок на проверку нет"}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: TOTAL_TEAMS }).map((_, i) => {
              const tData = teamsData[i];
              const isSelected = adminSelectedTeam === i;
              const hasReview = tData?.submittedForReview;
              const hasWin = tData?.firstLineApproved;
              const hasFull = tData?.fullApproved;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setAdminSelectedTeam(i);
                    setAdminSelectedErrorCells([]);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all relative ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-105 border border-purple-400"
                      : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
                  }`}
                >
                  <div>К-{i + 1}</div>
                  {hasReview && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  )}
                  <div className="text-[9px] opacity-70">
                    {hasFull ? "Фулл" : hasWin ? "+12" : hasReview ? "БИНГО!" : "В игре"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Play Area: 4x4 Grid + Anime Selection Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4x4 Card (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Карточка: Команда {currentTeamIdx + 1}</span>
              {currentTeamData?.submittedForReview && (
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  ⏳ На проверке у ведущего
                </span>
              )}
            </h3>
            <div className="text-xs text-gray-400">
              Заполнено: <span className="font-bold text-white">{cardEvaluation.placedCount} / 16</span>
              {cardEvaluation.hasBingo && (
                <span className="ml-2 text-emerald-400 font-bold">
                  (Линий: {cardEvaluation.completedLinesCount})
                </span>
              )}
            </div>
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-slate-900/80 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
            {card.map((cell, idx) => {
              const isHighlighted = cardEvaluation.highlightedIndices.has(idx);
              const isSelectedError = user.isAdmin && adminSelectedErrorCells.includes(idx);

              return (
                <div
                  key={cell.id}
                  onClick={() => handleCellClick(idx)}
                  className={`min-h-[110px] sm:min-h-[125px] p-3 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer group ${
                    isSelectedError
                      ? "bg-rose-950/90 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] ring-2 ring-rose-500 scale-[1.02]"
                      : isHighlighted
                        ? "bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:border-emerald-300"
                        : cell.placedAnime
                          ? user.isAdmin 
                            ? "bg-purple-950/40 border-purple-500/40 hover:border-rose-400/80" 
                            : "bg-purple-950/40 border-purple-500/40 hover:border-purple-400"
                          : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {/* Cell Header: Number + Delete Button */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-gray-500">
                      #{idx + 1}
                    </span>
                    {cell.placedAnime && !user.isAdmin && (
                      <button
                        onClick={(e) => handleDeleteCellAnime(e, idx)}
                        className="opacity-70 group-hover:opacity-100 hover:text-red-400 p-1 hover:bg-red-500/20 rounded-md transition-all text-gray-400"
                        title="Удалить аниме из ячейки"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Criterion Text */}
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-200 leading-snug my-1 line-clamp-3">
                    {cell.criterion}
                  </div>

                  {/* Placed Anime or Empty Slot */}
                  {cell.placedAnime ? (
                    <div className="mt-1 pt-1.5 border-t border-white/10">
                      <div className={`text-[11px] sm:text-xs font-black leading-tight truncate ${
                        isSelectedError ? "text-rose-300 line-through" : "text-amber-300"
                      }`}>
                        {cell.placedAnime}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Занято
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 pt-1 border-t border-dashed border-white/10 text-[9px] text-gray-500 italic">
                      + Нажмите для выбора
                    </div>
                  )}

                  {/* Admin Error Select Badge */}
                  {user.isAdmin && isSelectedError && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1 shadow-md">
                      <span>❌ Ошибка (-3)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission / Verification Action Bar */}
          {!user.isAdmin && (
            <div className="bg-slate-900/80 p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-300">
                  Статус Бинго:{" "}
                  {cardEvaluation.hasBingo ? (
                    <span className="text-emerald-400 font-black">
                      Линия собрана ({cardEvaluation.completedLinesCount})!
                    </span>
                  ) : (
                    <span className="text-gray-400">Соберите 4 в ряд (строка или столбец)</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  Диагонали не учитываются. Ошибка при проверке: -3 балла штраф за каждую ошибочную ячейку!
                </div>
              </div>

              {/* Submit Button for line (+12 pts) */}
              {!currentTeamData?.firstLineApproved && (
                <button
                  onClick={() => handleSubmitForReview("line")}
                  disabled={!cardEvaluation.hasBingo || currentTeamData?.submittedForReview}
                  className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                    currentTeamData?.submittedForReview
                      ? "bg-amber-600/50 text-white cursor-default"
                      : cardEvaluation.hasBingo
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20"
                        : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {currentTeamData?.submittedForReview ? "ЗАЯВКА НА ПРОВЕРКЕ..." : "ЗАЯВИТЬ БИНГО (+12 б.)"}
                </button>
              )}

              {/* Submit Button for Full Card (+24 pts) */}
              {currentTeamData?.firstLineApproved && !currentTeamData?.fullApproved && (
                <button
                  onClick={() => handleSubmitForReview("full")}
                  disabled={!cardEvaluation.allCompleted || currentTeamData?.submittedForReview}
                  className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                    currentTeamData?.submittedForReview
                      ? "bg-amber-600/50 text-white cursor-default"
                      : cardEvaluation.allCompleted
                        ? "bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white shadow-amber-500/30 animate-pulse"
                        : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {currentTeamData?.submittedForReview ? "ФУЛЛ НА ПРОВЕРКЕ..." : "ФУЛЛ КАРТОЧКА (+24 б.)"}
                </button>
              )}
            </div>
          )}

          {/* Admin Review Verdict Actions */}
          {user.isAdmin && (
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Панель Верификации: Команда {adminSelectedTeam + 1}</span>
                    {currentTeamData?.submittedForReview && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                        ЗАЯВКА АКТИВНА
                      </span>
                    )}
                  </h4>
                  <div className="text-xs text-gray-400 mt-1">
                    {adminSelectedErrorCells.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-300 font-bold">
                          Выбрано ошибочных ячеек: {adminSelectedErrorCells.length} ({adminSelectedErrorCells.map(i => `#${i + 1}`).join(", ")}). Штраф: -{adminSelectedErrorCells.length * 3} б.
                        </span>
                        <button
                          onClick={() => setAdminSelectedErrorCells([])}
                          className="text-[11px] text-gray-400 hover:text-white underline"
                        >
                          Сбросить выбор
                        </button>
                      </div>
                    ) : (
                      <span>Нажмите на ошибочные ячейки на карточке выше, чтобы отметить их (можно выбрать сразу несколько).</span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Штрафов команды: <span className="text-red-400 font-bold">-{currentTeamData?.penaltyTotal || 0} б.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAdminApprove}
                  disabled={isProcessing || !currentTeamData?.submittedForReview}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {currentTeamData?.submissionType === "full" ? "ЗАЧЕСТЬ ВСЁ ПОЛЕ (+24 б.)" : "ЗАЧЕСТЬ БИНГО (+12 б.)"}
                </button>

                <button
                  onClick={handleAdminReject}
                  disabled={isProcessing || adminSelectedErrorCells.length === 0}
                  className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-40 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  {adminSelectedErrorCells.length > 0
                    ? `ОТКЛОНИТЬ ВЫБРАННЫЕ (${adminSelectedErrorCells.length} шт. = -${adminSelectedErrorCells.length * 3} б.)`
                    : "ВЫБЕРИТЕ ОШИБОЧНЫЕ ЯЧЕЙКИ"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Revealed Anime Dock (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Выдача аниме</span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  {dockTab === "current" ? "Доступно только сейчас" : "История всех открытых"}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-white/5 px-2.5 py-1 rounded-xl text-purple-300">
                {revealedCount} / 32
              </span>
            </div>

            {/* Dock Tabs: Current active pair vs All revealed */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 text-xs font-bold">
              <button
                onClick={() => setDockTab("current")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  dockTab === "current"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>Текущая пара ({currentPair.length})</span>
              </button>
              <button
                onClick={() => setDockTab("all")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  dockTab === "all"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Все тайтлы ({revealedAnime.length})</span>
              </button>
            </div>

            {/* Currently Selected Anime Badge */}
            {selectedAnime ? (
              <div className="p-3 bg-purple-600/30 border border-purple-400/50 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-black text-purple-300">Выбран тайтл:</div>
                  <div className="text-sm font-black text-white truncate">{selectedAnime}</div>
                  <div className="text-[10px] text-purple-200 mt-0.5">Нажмите на пустую ячейку слева</div>
                </div>
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="text-xs text-purple-300 hover:text-white bg-white/10 px-2 py-1 rounded-lg shrink-0"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="text-center py-1 text-xs text-gray-500 italic">
                (Нажмите на аниме ниже для выбора)
              </div>
            )}

            {/* TAB 1: Current Drop of 2 Anime (The only ones that can be placed) */}
            {dockTab === "current" && (
              <div className="space-y-3">
                {currentPair.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-4xl">⏳</div>
                    <div className="text-sm font-bold text-gray-400">Аниме еще не открыты</div>
                    <p className="text-xs text-gray-500">
                      Ожидайте, пока ведущий нажмет кнопку «Следующие 2 аниме»!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Warning Notice about Drop Expiration */}
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Внимание:</strong> эти аниме можно расставить только <u>СЕЙЧАС</u>. При нажатии ведущим следующих 2 аниме нерасставленные тайтлы сгорят!
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {currentPair.map((title, idx) => {
                        const isUsed = usedAnimeTitles.has(title);
                        const isCurrentSelection = selectedAnime === title;
                        const cellNum = placedAnimeCellMap.get(title);

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (isUsed) {
                                setStatusNotice(`Это аниме уже поставлено в ячейку #${cellNum! + 1}!`);
                                setTimeout(() => setStatusNotice(""), 2500);
                                return;
                              }
                              setSelectedAnime(title);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all text-xs font-bold cursor-pointer relative ${
                              isCurrentSelection
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-300 text-white shadow-xl shadow-purple-900/40 scale-[1.02]"
                                : isUsed
                                  ? "bg-white/5 border-white/5 text-gray-400 cursor-not-allowed"
                                  : "bg-slate-800/90 hover:bg-slate-700/90 border-white/10 text-white hover:border-purple-400"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-sm truncate">{title}</span>
                              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-mono shrink-0 font-bold bg-white/10">
                                {isUsed ? "✓ В ячейке" : "Доступно"}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                              <span>
                                {isUsed 
                                  ? `Размещено в ячейке #${cellNum! + 1}`
                                  : isCurrentSelection 
                                    ? "✓ Выбрано! Кликните по ячейке слева" 
                                    : "Нажмите, чтобы выбрать"}
                              </span>
                              {!isUsed && !isCurrentSelection && (
                                <span className="text-purple-400 font-bold">Выбрать →</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: History of all revealed anime */}
            {dockTab === "all" && (
              <div className="space-y-2">
                <div className="text-[11px] text-gray-400 pb-1 border-b border-white/5">
                  Тайтлы из прошлых выдач, не поставленные вовремя на карточку, сгорели.
                </div>

                {revealedAnime.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    Пока нет открытых тайтлов
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {revealedAnime.map((title, idx) => {
                      const isUsed = usedAnimeTitles.has(title);
                      const isCurrent = currentPair.includes(title);
                      const cellNum = placedAnimeCellMap.get(title);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isCurrent && !isUsed) {
                              setSelectedAnime(title);
                              setDockTab("current");
                            } else if (!isCurrent && !isUsed) {
                              setStatusNotice("Это аниме сгорело, так как раунд ушел вперед!");
                              setTimeout(() => setStatusNotice(""), 3000);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            isCurrent
                              ? "bg-purple-950/40 border-purple-500/50 text-white cursor-pointer hover:bg-purple-900/40"
                              : isUsed
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                                : "bg-white/5 border-white/5 text-gray-500 line-through opacity-60"
                          }`}
                        >
                          <span className="truncate">{title}</span>
                          <span className="text-[10px] shrink-0 font-bold">
                            {isUsed ? (
                              <span className="text-emerald-400">В ячейке #{cellNum! + 1}</span>
                            ) : isCurrent ? (
                              <span className="text-amber-400">⚡ Текущее</span>
                            ) : (
                              <span className="text-gray-500">✕ Сгорело</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Round 8 Full Rules Modal */}
      <BingoRulesModal
        isOpen={showRulesModal}
        onClose={handleCloseRules}
      />
    </div>
  );
}
