import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, CheckCircle2, XCircle, AlertTriangle, Trash2, 
  Sparkles, Eye, Send, RotateCcw, Award, Layers, Flame,
  SkipForward, Clock, History, AlertCircle, BookOpen, Users,
  Check, ChevronRight
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
  isLeader?: boolean;
  leaderNickname?: string;
}

const TOTAL_TEAMS = 10;
const PARTIES_COUNT = 3;

export default function BingoRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
  isLeader,
  leaderNickname,
}: BingoRoundViewProps) {
  // Current active party (0, 1, or 2)
  const currentParty: number = Math.max(0, Math.min(PARTIES_COUNT - 1, gameState?.currentQuestion ?? 0));
  
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [dockTab, setDockTab] = useState<"current" | "all">("current");
  
  // Teammate tab view for regular players
  const [viewedPlayerId, setViewedPlayerId] = useState<string>(user?.id || "");
  
  // Admin review controls
  const [adminSelectedPlayerId, setAdminSelectedPlayerId] = useState<string | null>(null);
  const [adminSelectedTeam, setAdminSelectedTeam] = useState<number>(0);
  const [adminSelectedErrorCells, setAdminSelectedErrorCells] = useState<number[]>([]);
  const [showScoreSummary, setShowScoreSummary] = useState<boolean>(false);
  
  const [showRulesModal, setShowRulesModal] = useState<boolean>(() => {
    const hasSeen = sessionStorage.getItem("bingo_rules_seen_r8");
    return !hasSeen;
  });

  const handleCloseRules = () => {
    sessionStorage.setItem("bingo_rules_seen_r8", "true");
    setShowRulesModal(false);
  };

  const bingoState = gameState?.bingo || {};
  // Party-specific state (supports parties[currentParty] or root bingoState fallback for party 0)
  const partyState = bingoState.parties?.[currentParty] || (currentParty === 0 && bingoState.pool32 ? bingoState : {}) || {};
  const pool32: string[] = partyState.pool32 || [];
  const revealedCount: number = partyState.revealedCount || 0;
  const revealedAnime = pool32.slice(0, revealedCount);
  const lastRevealed: string[] = partyState.lastRevealed || [];

  // Current active drop of 2 anime
  const currentPair: string[] = (lastRevealed && lastRevealed.length > 0)
    ? lastRevealed
    : pool32.slice(Math.max(0, revealedCount - 2), revealedCount);

  // Clear selected anime if it's no longer in current drop
  useEffect(() => {
    if (selectedAnime && !currentPair.includes(selectedAnime)) {
      setSelectedAnime(null);
    }
  }, [currentPair, selectedAnime]);

  // Sync viewedPlayerId when user changes
  useEffect(() => {
    if (user?.id && !user.isAdmin) {
      setViewedPlayerId(user.id);
    }
  }, [user?.id, user?.isAdmin]);

  // Teammates list for regular player
  const myTeamIdx = user?.team ?? 0;
  const teamMembers: any[] = !user?.isAdmin && user?.team !== undefined && user?.team >= 0
    ? Object.values(players || {}).filter((p: any) => p.team === myTeamIdx)
    : [];

  // Submissions for this party: Record<playerId, submission>
  const submissions: Record<string, any> = partyState.submissions || {};
  const partyPlayers: Record<string, any> = partyState.players || {};

  // Auto-initialize Party if Admin is present and party is empty
  useEffect(() => {
    if (user?.isAdmin && (!partyState.pool32 || partyState.pool32.length === 0)) {
      initializeParty(currentParty);
    }
  }, [user?.isAdmin, currentParty, partyState.pool32]);

  // Auto-generate player card if missing for current user
  useEffect(() => {
    if (!user || user.isAdmin || !user.id || currentParty === undefined) return;
    
    const existingPlayerEntry = partyPlayers[user.id];
    if (!existingPlayerEntry || !existingPlayerEntry.card || existingPlayerEntry.card.length !== 16) {
      const seed = (user.id.charCodeAt(0) || 1) * 31 + currentParty * 17 + (user.team ?? 0);
      const newCard = generateTeamBingoCard(seed);
      restPut(`gameState/bingo/parties/${currentParty}/players/${user.id}`, {
        card: newCard,
        submittedForReview: false,
        submissionType: null,
        firstLineApproved: false,
        fullApproved: false,
        penaltyTotal: 0
      }).catch(console.error);
    }
  }, [user?.id, user?.isAdmin, currentParty, partyPlayers]);

  const initializeParty = async (partyIdx: number) => {
    setIsProcessing(true);
    try {
      const newPool = generateBingoPool32();
      await restPatch(`gameState/bingo/parties/${partyIdx}`, {
        pool32: newPool,
        revealedCount: 0,
        lastRevealed: [],
        roundOver: false,
        submissions: {},
        partyName: `Партия ${partyIdx + 1}`
      });
      setStatusNotice(`Партия ${partyIdx + 1} инициализирована: 32 тайтла готовы к выдаче!`);
      setTimeout(() => setStatusNotice(""), 3500);
    } catch (e) {
      console.error("Failed to initialize party:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch party by Admin
  const handleSwitchParty = async (pIdx: number) => {
    if (!user.isAdmin || isProcessing) return;
    setIsProcessing(true);
    try {
      await restPatch("gameState", { currentQuestion: pIdx });
      setSelectedAnime(null);
      setAdminSelectedPlayerId(null);
      setAdminSelectedErrorCells([]);
    } catch (e) {
      console.error("Failed to switch party:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Host: reveal next 2 anime
  const handleRevealNext2 = async () => {
    if (!user.isAdmin || revealedCount >= pool32.length || isProcessing) return;
    setIsProcessing(true);
    try {
      const nextCount = Math.min(revealedCount + 2, pool32.length);
      const newlyRevealed = pool32.slice(revealedCount, nextCount);
      await restPatch(`gameState/bingo/parties/${currentParty}`, {
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

  // Active target card to display
  // For Admin: currently selected submitted player or first in team
  // For Player: either my card or viewed teammate's card
  const activeDisplayPlayerId = user.isAdmin
    ? (adminSelectedPlayerId || Object.keys(submissions)[0] || user.id)
    : viewedPlayerId;

  const activePlayerData = partyPlayers[activeDisplayPlayerId] || {};
  const activeCard: BingoCell[] = activePlayerData.card || [];
  const isViewingSelf = !user.isAdmin && activeDisplayPlayerId === user.id;

  // Set of anime titles placed in active player's card
  const usedAnimeTitles = new Set(
    activeCard.map(c => c?.placedAnime).filter(Boolean) as string[]
  );

  // Map of placed title to cell index
  const placedAnimeCellMap = new Map<string, number>();
  activeCard.forEach((c, idx) => {
    if (c?.placedAnime) placedAnimeCellMap.set(c.placedAnime, idx);
  });

  // Evaluate card status
  const cardEvaluation = evaluateBingoCard(activeCard);

  // Placing anime into an empty cell on my card
  const handleCellClick = async (cellIndex: number) => {
    if (user.isAdmin) {
      // In Admin view, clicking a cell toggles it in error selection
      const cell = activeCard[cellIndex];
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

    if (!isViewingSelf) {
      setStatusNotice("Вы просматриваете карточку сокомандника. Переключитесь на вкладку «Моя карточка», чтобы играть!");
      setTimeout(() => setStatusNotice(""), 3500);
      return;
    }

    if (activePlayerData?.submittedForReview) {
      setStatusNotice("Ваша карточка сейчас находится на проверке у ведущего!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    const cell = activeCard[cellIndex];
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

    if (!currentPair.includes(selectedAnime)) {
      setStatusNotice("Это аниме уже недоступно (сгорело при переходе к следующей паре тайтлов)!");
      setSelectedAnime(null);
      setTimeout(() => setStatusNotice(""), 3500);
      return;
    }

    if (usedAnimeTitles.has(selectedAnime)) {
      setStatusNotice("Это аниме уже поставлено в другую ячейку вашей карточки!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    // Place anime into cell
    try {
      const newCard = [...activeCard];
      newCard[cellIndex] = {
        ...newCard[cellIndex],
        placedAnime: selectedAnime,
        hasError: false
      };

      await restPut(`gameState/bingo/parties/${currentParty}/players/${user.id}/card`, newCard);
      setSelectedAnime(null);
    } catch (e) {
      console.error("Error placing anime:", e);
    }
  };

  // Remove anime from a cell
  const handleDeleteCellAnime = async (e: React.MouseEvent, cellIndex: number) => {
    e.stopPropagation();
    if (!isViewingSelf || user.isAdmin) return;

    if (activePlayerData?.submittedForReview) {
      setStatusNotice("Нельзя менять карточку, пока идет проверка ведущим!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    try {
      const newCard = [...activeCard];
      newCard[cellIndex] = {
        ...newCard[cellIndex],
        placedAnime: null,
        hasError: false
      };
      await restPut(`gameState/bingo/parties/${currentParty}/players/${user.id}/card`, newCard);
    } catch (e) {
      console.error("Error clearing cell:", e);
    }
  };

  // Player: submit for review (Line or Full)
  const handleSubmitForReview = async (type: "line" | "full") => {
    if (user.isAdmin || activePlayerData?.submittedForReview) return;
    try {
      const submissionObj = {
        playerId: user.id,
        playerName: user.nickname,
        teamIdx: user.team ?? 0,
        submissionType: type,
        submittedAt: Date.now(),
        card: activeCard
      };

      await restPatch(`gameState/bingo/parties/${currentParty}/players/${user.id}`, {
        submittedForReview: true,
        submissionType: type,
        submittedAt: Date.now()
      });

      await restPut(`gameState/bingo/parties/${currentParty}/submissions/${user.id}`, submissionObj);

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
    if (!user.isAdmin || !activeDisplayPlayerId) return;
    const targetSub = submissions[activeDisplayPlayerId];
    if (!targetSub) {
      alert("Выберите игрока с активной заявкой на проверку!");
      return;
    }

    setIsProcessing(true);
    const targetPlayerId = activeDisplayPlayerId;
    const isFull = targetSub.submissionType === "full" || cardEvaluation.allCompleted;
    const pts = isFull ? 24 : 12;
    const scoreKey = `round8_p${currentParty}_${targetSub.submissionType || (isFull ? "full" : "line")}`;

    try {
      // Award points directly to this player
      await restPut(`players/${targetPlayerId}/scores/${scoreKey}`, pts);

      // Update player state
      await restPatch(`gameState/bingo/parties/${currentParty}/players/${targetPlayerId}`, {
        submittedForReview: false,
        fullApproved: isFull ? true : Boolean(activePlayerData.fullApproved),
        firstLineApproved: true
      });

      // Remove submission
      await restPatch(`gameState/bingo/parties/${currentParty}/submissions`, {
        [targetPlayerId]: null
      });

      setAdminSelectedPlayerId(null);
      setAdminSelectedErrorCells([]);
      setStatusNotice(`✅ Заявка игрока ${targetSub.playerName} одобрена (+${pts} баллов в копилку команды #${targetSub.teamIdx + 1})!`);
      setTimeout(() => setStatusNotice(""), 4000);
    } catch (e) {
      console.error("Approve error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin: reject review with multiple error cells and -3 penalty per cell
  const handleAdminReject = async () => {
    if (!user.isAdmin || !activeDisplayPlayerId) return;
    const targetSub = submissions[activeDisplayPlayerId];
    if (!targetSub) {
      alert("Выберите игрока с активной заявкой на проверку!");
      return;
    }

    if (adminSelectedErrorCells.length === 0) {
      alert("Сначала нажмите на ячейки с ошибочными аниме на карточке игрока выше, чтобы отметить их!");
      return;
    }

    const invalidIndices = adminSelectedErrorCells.filter(idx => activeCard[idx]?.placedAnime);
    if (invalidIndices.length === 0) {
      alert("В выбранных ячейках нет аниме!");
      return;
    }

    setIsProcessing(true);
    const targetPlayerId = activeDisplayPlayerId;
    const count = invalidIndices.length;
    const penalty = count * 3;

    try {
      // Deduct penalty from this player
      const penaltyKey = `round8_p${currentParty}_pen_${Date.now()}`;
      await restPut(`players/${targetPlayerId}/scores/${penaltyKey}`, -penalty);

      // Mark error on invalid cells
      const updatedCard = activeCard.map((cell, idx) => {
        if (invalidIndices.includes(idx)) {
          return { ...cell, hasError: true };
        }
        return cell;
      });

      await restPatch(`gameState/bingo/parties/${currentParty}/players/${targetPlayerId}`, {
        card: updatedCard,
        submittedForReview: false,
        penaltyTotal: (activePlayerData.penaltyTotal || 0) + penalty
      });

      // Remove submission
      await restPatch(`gameState/bingo/parties/${currentParty}/submissions`, {
        [targetPlayerId]: null
      });

      setAdminSelectedPlayerId(null);
      setAdminSelectedErrorCells([]);
      setStatusNotice(`❌ Заявка игрока ${targetSub.playerName} отклонена (-${penalty} баллов штрафа)!`);
      setTimeout(() => setStatusNotice(""), 4000);
    } catch (e) {
      console.error("Reject error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate team scores for all 3 parties and total
  const getRound8TeamPartyScore = (teamIdx: number, pIdx: number): number => {
    const tPlayers: any[] = Object.values(players || {}).filter((p: any) => p.team === teamIdx);
    return tPlayers.reduce((sum: number, p: any) => {
      const pScores = p.scores || {};
      let pSum = 0;
      Object.entries(pScores).forEach(([key, val]: [string, any]) => {
        if (key.startsWith(`round8_p${pIdx}_`)) {
          pSum += typeof val === "number" ? val : 0;
        }
      });
      return sum + pSum;
    }, 0);
  };

  const getRound8TeamTotal = (teamIdx: number): number => {
    return (
      getRound8TeamPartyScore(teamIdx, 0) +
      getRound8TeamPartyScore(teamIdx, 1) +
      getRound8TeamPartyScore(teamIdx, 2)
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* ================= HEADER & PARTY TABS ================= */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs uppercase px-3 py-1 rounded-full tracking-wider shadow-md">
                Раунд 8: Аниме-Бинго 4×4
              </span>
              <span className="bg-amber-500/20 text-amber-300 font-bold text-xs px-3 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Линия: +12 б. • Всё поле: +24 б. • Ошибка: -3 б.
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Играет <strong>каждый игрок команды</strong> на своей карточке! В конце раунда все баллы игроков суммируются в общий счёт команды.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowScoreSummary(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer shadow-md active:scale-95"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Таблица Бинго (3 партии)</span>
            </button>
            <button
              onClick={() => setShowRulesModal(true)}
              className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-purple-500/30 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Правила</span>
            </button>
          </div>
        </div>

        {/* 3 Parties Navigation Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto">
          <span className="text-[11px] font-black uppercase text-purple-300 mr-1 shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Партии раунда:
          </span>
          {[0, 1, 2].map((pIdx) => {
            const isActive = currentParty === pIdx;
            const pSubsCount = Object.keys(bingoState.parties?.[pIdx]?.submissions || {}).length;

            return (
              <button
                key={pIdx}
                onClick={() => user.isAdmin && handleSwitchParty(pIdx)}
                disabled={!user.isAdmin}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 scale-[1.02]"
                    : "bg-black/40 text-gray-400 border border-white/5 hover:text-white"
                } ${user.isAdmin ? "cursor-pointer active:scale-95 hover:border-purple-400" : "cursor-default"}`}
                title={user.isAdmin ? `Переключить на Партию ${pIdx + 1}` : `Партия ${pIdx + 1}`}
              >
                <span>Партия {pIdx + 1} {isActive ? "🔥 (Текущая)" : ""}</span>
                {pSubsCount > 0 && (
                  <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pSubsCount}
                  </span>
                )}
              </button>
            );
          })}
          {user.isAdmin && (
            <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline italic">
              Ведущий может переключать партии кликом по вкладке
            </span>
          )}
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-purple-950/90 border border-purple-500/50 rounded-2xl text-center text-xs font-bold text-white shadow-xl flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusNotice}</span>
        </motion.div>
      )}

      {/* ================= MAIN PLAYGROUND LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Player's 4x4 Bingo Board (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {/* Teammates Selector Tabs for regular players */}
          {!user.isAdmin && teamMembers.length > 1 && (
            <div className="flex items-center gap-2 p-2 bg-slate-900/80 border border-purple-500/20 rounded-2xl overflow-x-auto shadow-md">
              <span className="text-[11px] font-bold text-gray-400 ml-1 shrink-0 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Карточка:
              </span>
              <button
                onClick={() => setViewedPlayerId(user.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  viewedPlayerId === user.id
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/50"
                    : "bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                Моя карточка {isLeader ? "👑" : ""}
              </button>
              {teamMembers
                .filter((p: any) => p.id !== user.id)
                .map((teammate: any) => (
                  <button
                    key={teammate.id}
                    onClick={() => setViewedPlayerId(teammate.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      viewedPlayerId === teammate.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white/5 hover:bg-white/10 text-gray-300"
                    }`}
                  >
                    {teammate.nickname}
                  </button>
                ))}
            </div>
          )}

          {/* Card Header Info */}
          <div className="flex items-center justify-between px-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🎯</span>
                {user.isAdmin ? (
                  <span>
                    Карточка игрока:{" "}
                    <strong className="text-amber-300">
                      {players[activeDisplayPlayerId]?.nickname || "Не выбран"}
                    </strong>{" "}
                    (Команда #{Number(players[activeDisplayPlayerId]?.team ?? adminSelectedTeam) + 1})
                  </span>
                ) : isViewingSelf ? (
                  <span>Ваша карточка (Партия {currentParty + 1})</span>
                ) : (
                  <span>
                    Карточка сокомандника:{" "}
                    <strong className="text-amber-300">
                      {players[activeDisplayPlayerId]?.nickname}
                    </strong>
                  </span>
                )}
              </span>
              {activePlayerData.submittedForReview && (
                <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full animate-pulse">
                  На проверке у ведущего
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">
                Заполнено: <strong className="text-white">{cardEvaluation.placedCount}/16</strong>
              </span>
              {cardEvaluation.completedLinesCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  Линий: {cardEvaluation.completedLinesCount}
                </span>
              )}
            </div>
          </div>

          {/* 4x4 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-slate-900/90 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-xl">
            {activeCard.map((cell, idx) => {
              const hasAnime = !!cell.placedAnime;
              const isHighlighted = cardEvaluation.highlightedIndices.has(idx);
              const isError = cell.hasError || (user.isAdmin && adminSelectedErrorCells.includes(idx));
              const row = Math.floor(idx / 4);
              const col = idx % 4;

              return (
                <motion.div
                  key={cell.id ?? idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleCellClick(idx)}
                  className={`min-h-[105px] sm:min-h-[120px] p-2.5 rounded-2xl border-2 transition-all flex flex-col justify-between relative group cursor-pointer ${
                    isError
                      ? "bg-red-950/70 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : isHighlighted
                        ? "bg-emerald-950/80 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                        : hasAnime
                          ? "bg-purple-950/60 border-purple-400/80 shadow-md"
                          : "bg-black/50 border-white/10 hover:border-purple-500/50"
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-gray-500 font-bold">
                      #{idx + 1}
                    </span>
                    {hasAnime && isViewingSelf && !activePlayerData.submittedForReview && (
                      <button
                        onClick={(e) => handleDeleteCellAnime(e, idx)}
                        className="text-gray-400 hover:text-red-400 p-1 rounded-md hover:bg-white/10 transition-colors"
                        title="Удалить аниме из ячейки"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Criterion Text */}
                  <p className="text-[11px] sm:text-xs font-semibold text-gray-200 leading-snug line-clamp-3">
                    {cell.criterion}
                  </p>

                  {/* Placed Anime or Empty Slot */}
                  <div className="mt-2 pt-1 border-t border-white/10">
                    {hasAnime ? (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] sm:text-xs font-black text-amber-300 truncate" title={cell.placedAnime || ""}>
                          🎬 {cell.placedAnime}
                        </span>
                        {isError && (
                          <span className="text-[9px] font-black text-red-400 shrink-0">
                            ОШИБКА
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic flex items-center gap-1">
                        <span>+ Пусто</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Submission Bar for Current Player */}
          {isViewingSelf && (
            <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
                  Заявить результат в ведущему:
                </span>
                <span className="text-[11px] text-gray-400">
                  {cardEvaluation.hasBingo
                    ? "У вас собрана линия! Нажмите «Заявить Бинго», чтобы получить +12 баллов."
                    : cardEvaluation.allCompleted
                      ? "Все 16 ячеек заполнены! Нажмите «Заявить всё поле» (+24 балла)."
                      : "Заполняйте клетки аниме из выдачи справа, собирайте 4 в ряд или всё поле!"}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSubmitForReview("line")}
                  disabled={!cardEvaluation.hasBingo || activePlayerData.submittedForReview}
                  className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                    cardEvaluation.hasBingo && !activePlayerData.submittedForReview
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 cursor-pointer active:scale-95 shadow-amber-500/20"
                      : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 opacity-50"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Заявить БИНГО! (+12)</span>
                </button>

                <button
                  onClick={() => handleSubmitForReview("full")}
                  disabled={!cardEvaluation.allCompleted || activePlayerData.submittedForReview}
                  className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                    cardEvaluation.allCompleted && !activePlayerData.submittedForReview
                      ? "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white cursor-pointer active:scale-95 shadow-purple-500/30"
                      : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 opacity-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Всё поле (+24)</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Verification Action Bar */}
          {user.isAdmin && (
            <div className="bg-slate-900/95 border-2 border-amber-500/40 p-4 rounded-3xl shadow-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Проверка заявки Бинго (Ведущий)
                </span>
                {adminSelectedPlayerId && submissions[adminSelectedPlayerId] && (
                  <span className="text-xs text-white font-bold bg-purple-600/30 px-2.5 py-0.5 rounded-lg border border-purple-500/40">
                    Игрок: {submissions[adminSelectedPlayerId].playerName} (Команда #{submissions[adminSelectedPlayerId].teamIdx + 1})
                  </span>
                )}
              </div>

              {adminSelectedPlayerId && submissions[adminSelectedPlayerId] ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-300">
                    <div>
                      Тип заявки:{" "}
                      <strong className="text-amber-300 uppercase">
                        {submissions[adminSelectedPlayerId].submissionType === "full" ? "Всё поле (+24 б.)" : "Бинго 4 в ряд (+12 б.)"}
                      </strong>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Кликайте по карточке игрока выше, чтобы отметить ошибочные ячейки при отклонении.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleAdminApprove}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Подтвердить ({submissions[adminSelectedPlayerId].submissionType === "full" ? "+24 б." : "+12 б."})
                      </span>
                    </button>

                    <button
                      onClick={handleAdminReject}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>
                        Отклонить {adminSelectedErrorCells.length > 0 ? `(-${adminSelectedErrorCells.length * 3} б.)` : "(-3 б.)"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-gray-400 italic">
                  Выберите игрока из очереди заявок справа, чтобы проверить его карточку
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Active Drop Pair & Review Queue / Anime History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Admin Host Control Dock */}
          {user.isAdmin && (
            <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase text-purple-300">
                  Управление Партией {currentParty + 1}
                </span>
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  Выдано: {revealedCount}/32
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleRevealNext2}
                  disabled={revealedCount >= pool32.length || isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4" />
                  <span>
                    {revealedCount >= pool32.length 
                      ? "Все 32 тайтла выданы" 
                      : `Выдать следующие 2 тайтла (#${revealedCount + 1}-${revealedCount + 2})`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => initializeParty(currentParty)}
                    disabled={isProcessing}
                    className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-[11px] py-2 px-3 rounded-xl border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Сбросить партию</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentParty < PARTIES_COUNT - 1) {
                        handleSwitchParty(currentParty + 1);
                      } else {
                        setStatusNotice("Это финальная партия 3 из 3!");
                        setTimeout(() => setStatusNotice(""), 3000);
                      }
                    }}
                    className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-bold text-[11px] py-2 px-3 rounded-xl border border-purple-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>След. партия</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submissions Queue for Admin */}
          {user.isAdmin && (
            <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-3xl shadow-xl space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  Очередь заявок ({Object.keys(submissions).length})
                </span>
              </div>

              {Object.keys(submissions).length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500 italic">
                  Пока нет активных заявок от игроков
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {Object.entries(submissions).map(([pId, sub]: [string, any]) => {
                    const isSelected = adminSelectedPlayerId === pId;
                    return (
                      <button
                        key={pId}
                        onClick={() => {
                          setAdminSelectedPlayerId(pId);
                          setAdminSelectedErrorCells([]);
                        }}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/40 border-purple-400 text-white shadow-md scale-[1.01]"
                            : "bg-black/40 border-white/5 text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black truncate">{sub.playerName}</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded font-bold">
                              К#{sub.teamIdx + 1}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                            {sub.submissionType === "full" ? "👑 Заявка на ВСЁ ПОЛЕ" : "🎉 Заявка на БИНГО"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-purple-300 shrink-0">
                          {isSelected ? "Выбрано →" : "Проверить"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Current Drop Dock: Anime Pair to Place */}
          <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-3xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDockTab("current")}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    dockTab === "current"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ⚡ Текущая пара ({currentPair.length})
                </button>
                <button
                  onClick={() => setDockTab("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    dockTab === "all"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  История ({revealedCount})
                </button>
              </div>
            </div>

            {dockTab === "current" && (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-300">
                  Выберите тайтл и нажмите на свободную ячейку на своей карточке:
                </p>

                {currentPair.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    Ожидайте выдачи следующей пары тайтлов от ведущего...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPair.map((title, idx) => {
                      const isSelected = selectedAnime === title;
                      const isUsed = usedAnimeTitles.has(title);
                      const cellNum = placedAnimeCellMap.get(title);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isUsed) {
                              setStatusNotice(`Тайтл уже в ячейке #${cellNum! + 1}!`);
                              setTimeout(() => setStatusNotice(""), 3000);
                              return;
                            }
                            setSelectedAnime(isSelected ? null : title);
                          }}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                            isUsed
                              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 opacity-70"
                              : isSelected
                                ? "bg-purple-600/40 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02]"
                                : "bg-black/50 border-white/10 hover:border-purple-400/50 text-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black truncate">{title}</span>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-mono font-bold bg-white/10">
                              {isUsed ? "✓ В ячейке" : "Доступно"}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">
                            {isUsed 
                              ? `Размещено в ячейке #${cellNum! + 1}`
                              : isSelected
                                ? "✓ Выбрано! Кликните по ячейке слева"
                                : "Нажмите, чтобы выбрать"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {dockTab === "all" && (
              <div className="space-y-2">
                <div className="text-[11px] text-gray-400 pb-1 border-b border-white/5">
                  Тайтлы из прошлых выдач, не поставленные вовремя, сгорели.
                </div>
                {revealedAnime.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    Пока нет открытых тайтлов
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
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
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            isCurrent
                              ? "bg-purple-950/40 border-purple-500/50 text-white cursor-pointer"
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

      {/* ================= MODAL: 3-PARTIES ROUND 8 SCORE SUMMARY ================= */}
      {showScoreSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase">
                  Сводка баллов Раунда 8: Аниме-Бинго
                </h3>
              </div>
              <button
                onClick={() => setShowScoreSummary(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Баллы всех 3 партий Бинго суммируются в общий командный счет викторины. Каждый игрок вносит свой вклад!
            </p>

            <div className="space-y-2">
              {Array.from({ length: TOTAL_TEAMS }).map((_, tIdx) => {
                const p1 = getRound8TeamPartyScore(tIdx, 0);
                const p2 = getRound8TeamPartyScore(tIdx, 1);
                const p3 = getRound8TeamPartyScore(tIdx, 2);
                const total = p1 + p2 + p3;
                const tPlayers = Object.values(players || {}).filter((p: any) => p.team === tIdx);

                return (
                  <div
                    key={tIdx}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      tIdx === myTeamIdx && !user.isAdmin
                        ? "bg-purple-950/40 border-purple-500/60"
                        : "bg-white/5 border-white/5"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">Команда #{tIdx + 1}</span>
                        {tIdx === myTeamIdx && !user.isAdmin && (
                          <span className="text-[9px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-full">
                            Ваша команда
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {tPlayers.map((p: any) => p.nickname).join(", ") || "Нет игроков"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono font-bold">
                      <span className="text-gray-400">П1: <strong className="text-white">{p1}</strong></span>
                      <span className="text-gray-400">П2: <strong className="text-white">{p2}</strong></span>
                      <span className="text-gray-400">П3: <strong className="text-white">{p3}</strong></span>
                      <span className="bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-xl border border-amber-400/30 font-black">
                        Итого: {total} б.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowScoreSummary(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Round 8 Full Rules Modal */}
      <BingoRulesModal
        isOpen={showRulesModal}
        onClose={handleCloseRules}
      />
    </div>
  );
}
