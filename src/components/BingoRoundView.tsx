
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, CheckCircle2, XCircle, AlertTriangle, Trash2, 
  Sparkles, Eye, Send, RotateCcw, Award, Layers, Flame
} from "lucide-react";
import { 
  BingoCell, 
  generateBingoPool32, 
  generateTeamBingoCard, 
  evaluateBingoCard 
} from "../data/bingoData";

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
  const [adminSelectedErrorCell, setAdminSelectedErrorCell] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"card" | "pool">("card");

  const bingoState = gameState?.bingo || {};
  const pool32: string[] = bingoState.pool32 || [];
  const revealedCount: number = bingoState.revealedCount || 0;
  const revealedAnime = pool32.slice(0, revealedCount);
  const lastRevealed: string[] = bingoState.lastRevealed || [];

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

  // Evaluate card status
  const cardEvaluation = evaluateBingoCard(card);

  // Placing anime into an empty cell
  const handleCellClick = async (cellIndex: number) => {
    if (user.isAdmin) {
      // In Admin view, clicking a cell toggles it as the error cell to reject
      if (adminSelectedErrorCell === cellIndex) {
        setAdminSelectedErrorCell(null);
      } else {
        setAdminSelectedErrorCell(cellIndex);
      }
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
      setStatusNotice("Сначала выберите аниме из списка выпавших тайтлов ниже!");
      setTimeout(() => setStatusNotice(""), 3000);
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
      setAdminSelectedErrorCell(null);
    }
  };

  // Admin: reject review with error cell and -3 penalty
  const handleAdminReject = async () => {
    if (!user.isAdmin || !currentTeamData) return;
    if (adminSelectedErrorCell === null) {
      alert("Сначала нажмите на ячейку с ошибочным аниме, чтобы отметить её!");
      return;
    }

    const cellIndex = adminSelectedErrorCell;
    const wrongCell = card[cellIndex];
    if (!wrongCell || !wrongCell.placedAnime) {
      alert("В выбранной ячейке нет аниме!");
      return;
    }

    setIsProcessing(true);
    const teamIdx = adminSelectedTeam;
    try {
      // 1. Deduct 3 points from each player of the team
      const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === teamIdx);
      const penaltyKey = `round8_penalty_${Date.now()}`;
      for (const [pId] of teamPlayers) {
        await restPut(`players/${pId}/scores/${penaltyKey}`, -3);
      }

      // 2. Remove incorrect anime from the cell so cell is free for another anime
      const newCard = [...card];
      const rejectedTitle = wrongCell.placedAnime;
      newCard[cellIndex] = {
        ...newCard[cellIndex],
        placedAnime: null,
        hasError: false
      };

      const penaltyNotice = `❌ Ошибка в ячейке #${cellIndex + 1} («${wrongCell.criterion}»): тайтл «${rejectedTitle}» не подошел! С команды списано 3 балла. Аниме удалено, ячейка снова свободна.`;

      // 3. Update team state
      await restPatch(`gameState/bingo/teams/${teamIdx}`, {
        submittedForReview: false,
        lastPenaltyNotice: penaltyNotice,
        penaltyTotal: (currentTeamData.penaltyTotal || 0) + 3
      });
      await restPut(`gameState/bingo/teams/${teamIdx}/card`, newCard);

      setAdminSelectedErrorCell(null);
      alert(`Ошибочная ячейка #${cellIndex + 1} отклонена. -3 балла начислено команде ${teamIdx + 1}.`);
    } catch (e) {
      console.error("Reject error:", e);
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

        {/* Revealed counter & status */}
        <div className="flex items-center gap-3">
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
                    setAdminSelectedErrorCell(null);
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
              const isSelectedError = user.isAdmin && adminSelectedErrorCell === idx;

              return (
                <div
                  key={cell.id}
                  onClick={() => handleCellClick(idx)}
                  className={`min-h-[110px] sm:min-h-[125px] p-3 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer group ${
                    isSelectedError
                      ? "bg-rose-950/80 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] scale-[1.02]"
                      : isHighlighted
                        ? "bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:border-emerald-300"
                        : cell.placedAnime
                          ? "bg-purple-950/40 border-purple-500/40 hover:border-purple-400"
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
                      <div className="text-[11px] sm:text-xs font-black text-amber-300 leading-tight truncate">
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
                    <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                      Ошибка!
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
                  Диагонали не учитываются. Ошибка при проверке: -3 балла штраф!
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
                  <p className="text-xs text-gray-400">
                    {adminSelectedErrorCell !== null
                      ? `Выбрана ячейка #${adminSelectedErrorCell + 1} для отклонения с ошибкой.`
                      : "Нажмите на ошибочную ячейку на карточке выше, чтобы указать ошибку."}
                  </p>
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
                  disabled={isProcessing || adminSelectedErrorCell === null}
                  className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-40 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  ОТКЛОНИТЬ ЯЧЕЙКУ (-3 б. ШТРАФ)
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
                  <span>Пул выпавших аниме</span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  Выберите тайтл и нажмите на ячейку в карточке
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-white/5 px-2.5 py-1 rounded-xl text-purple-300">
                {revealedAnime.length} / 32
              </span>
            </div>

            {/* Currently Selected Anime Badge */}
            {selectedAnime ? (
              <div className="p-3 bg-purple-600/30 border border-purple-400/50 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-black text-purple-300">Выбран тайтл:</div>
                  <div className="text-sm font-black text-white truncate">{selectedAnime}</div>
                </div>
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="text-xs text-purple-300 hover:text-white bg-white/10 px-2 py-1 rounded-lg shrink-0"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-gray-500 italic">
                (Ничего не выбрано)
              </div>
            )}

            {/* Anime List / Buttons */}
            {revealedAnime.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="text-4xl">⏳</div>
                <div className="text-sm font-bold text-gray-400">Аниме еще не открыты</div>
                <p className="text-xs text-gray-500">
                  Ожидайте, пока ведущий нажмет кнопку «Следующие 2 аниме»!
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {revealedAnime.map((title, idx) => {
                  const isUsed = usedAnimeTitles.has(title);
                  const isCurrentSelection = selectedAnime === title;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (isUsed) {
                          setStatusNotice("Это аниме уже поставлено на вашу карточку!");
                          setTimeout(() => setStatusNotice(""), 2500);
                          return;
                        }
                        setSelectedAnime(title);
                      }}
                      disabled={isUsed}
                      className={`w-full text-left p-3 rounded-2xl border transition-all text-xs font-bold flex items-center justify-between gap-2 ${
                        isCurrentSelection
                          ? "bg-purple-600 border-purple-300 text-white shadow-lg scale-[1.02]"
                          : isUsed
                            ? "bg-white/5 border-white/5 text-gray-500 opacity-40 cursor-not-allowed"
                            : "bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-white hover:border-purple-400"
                      }`}
                    >
                      <span className="truncate">{title}</span>
                      <span className="text-[10px] shrink-0 font-normal">
                        {isUsed ? "Использовано" : `#${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
