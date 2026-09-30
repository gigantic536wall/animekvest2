import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, CheckCircle2, XCircle, AlertTriangle, Trash2, 
  Sparkles, Eye, Send, RotateCcw, Award, Layers, Flame,
  SkipForward, Clock, History, AlertCircle, BookOpen, ArrowRight, StopCircle
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

// Извлечение чистого названия
function getAnimeTitle(item: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return item.title || item.name || item.anime || "";
  }
  return String(item);
}

// Защищенный конвертер карточки в 4x4 сетку
function to4x4Grid(cardRaw: any): BingoCell[][] {
  if (!cardRaw) return [];

  let flatCells: BingoCell[] = [];

  if (Array.isArray(cardRaw)) {
    if (cardRaw.length > 0 && Array.isArray(cardRaw[0])) {
      return cardRaw.map(row => 
        (Array.isArray(row) ? row : Object.values(row || {})).map(cell => ({
          title: getAnimeTitle(cell),
          checked: typeof cell === 'object' ? !!cell?.checked : false,
          id: typeof cell === 'object' ? cell?.id : undefined
        }))
      );
    }
    flatCells = cardRaw.map(c => ({
      title: getAnimeTitle(c),
      checked: typeof c === 'object' ? !!c?.checked : false,
      id: typeof c === 'object' ? c?.id : undefined
    }));
  } else if (typeof cardRaw === "object") {
    const keys = Object.keys(cardRaw).sort((a, b) => Number(a) - Number(b));
    const firstVal = cardRaw[keys[0]];

    if (Array.isArray(firstVal) || (firstVal && typeof firstVal === 'object' && !('title' in firstVal) && !('checked' in firstVal))) {
      return keys.map(k => {
        const rowObj = cardRaw[k];
        const rowCells = Array.isArray(rowObj) ? rowObj : Object.values(rowObj || {});
        return rowCells.map((cell: any) => ({
          title: getAnimeTitle(cell),
          checked: typeof cell === 'object' ? !!cell?.checked : false,
          id: typeof cell === 'object' ? cell?.id : undefined
        }));
      });
    } else {
      flatCells = keys.map(k => {
        const cell = cardRaw[k];
        return {
          title: getAnimeTitle(cell),
          checked: typeof cell === 'object' ? !!cell?.checked : false,
          id: typeof cell === 'object' ? cell?.id : undefined
        };
      });
    }
  }

  const grid: BingoCell[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: BingoCell[] = [];
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      row.push(flatCells[idx] || { title: "", checked: false });
    }
    grid.push(row);
  }
  return grid;
}

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
    const hasSeen = sessionStorage.getItem("bingo_rules_seen_r8");
    return !hasSeen;
  });

  const handleCloseRules = () => {
    sessionStorage.setItem("bingo_rules_seen_r8", "true");
    setShowRulesModal(false);
  };

  const currentQIdx = gameState?.currentQuestion ?? 0;
  const isGame2 = currentQIdx === 1;

  const bingoState = gameState?.bingo || {};
  
  const rawPool = bingoState.pool32;
  const poolList: any[] = Array.isArray(rawPool) 
    ? rawPool 
    : (rawPool && typeof rawPool === 'object' ? Object.values(rawPool) : []);
  const pool32: string[] = poolList.map(getAnimeTitle).filter(Boolean);

  const revealedCount = Math.min(32, Math.max(0, Number(bingoState.revealedCount) || 0));

  const rawLast = bingoState.lastRevealed;
  const lastList: any[] = Array.isArray(rawLast)
    ? rawLast
    : (rawLast && typeof rawLast === 'object' ? Object.values(rawLast) : []);
  const lastRevealed: string[] = lastList.map(getAnimeTitle).filter(Boolean);

  const revealedAnime = pool32.slice(0, revealedCount);
  const currentPair: string[] = (lastRevealed && lastRevealed.length > 0)
    ? lastRevealed
    : pool32.slice(Math.max(0, revealedCount - 2), revealedCount);

  const roundOver: boolean = !!bingoState.roundOver;

  useEffect(() => {
    if (selectedAnime && !currentPair.includes(selectedAnime)) {
      setSelectedAnime(null);
    }
  }, [currentPair, selectedAnime]);

  const teamsData: Record<string, any> = bingoState.teams || {};
  const currentTeamIdx = user.isAdmin ? adminSelectedTeam : (user.team ?? 0);
  const myTeamData = teamsData[currentTeamIdx] || null;

  const revealedAnimeSet = new Set(
    pool32.slice(0, revealedCount).map((s) => s.toLowerCase().trim())
  );

  useEffect(() => {
    if (user?.isAdmin && (!gameState?.bingo?.pool32 || !gameState?.bingo?.teams)) {
      const pool = generateBingoPool32();
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
          lastPenaltyNotice: null,
        };
      }
      restPatch("gameState/bingo", {
        gameIndex: currentQIdx,
        pool32: pool,
        revealedCount: 0,
        lastRevealed: [],
        teams: initialTeams,
        roundOver: false,
      });
    }
  }, [user?.isAdmin, gameState?.bingo]);

  const handleRevealNextTwo = async () => {
    if (!user.isAdmin || roundOver) return;
    const nextCount = Math.min(32, revealedCount + 2);
    const newRevealed = pool32.slice(revealedCount, nextCount);
    await restPatch("gameState/bingo", {
      revealedCount: nextCount,
      lastRevealed: newRevealed,
    });
    setSelectedAnime(null);
  };

  const handleStartGame2 = async () => {
    if (!user.isAdmin) return;
    if (!window.confirm("Все результаты 1-й партии проверены? Начать 2-ю партию с новыми карточками?")) return;

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

      await restPatch("gameState", {
        currentQuestion: 1, 
        bingo: {
          pool32: newPool,
          revealedCount: 0,
          lastRevealed: [],
          teams: initialTeams,
          roundOver: false
        }
      });
      setDockTab("current");
      setSelectedAnime(null);
      setStatusNotice("Партия 2 успешно запущена! Новые карточки выданы.");
      setTimeout(() => setStatusNotice(""), 4000);
    } catch (e) {
      console.error("Error starting game 2:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveSubmission = async (targetTeamIdx: number, type: "line" | "full") => {
    if (!user.isAdmin) return;
    const points = type === "line" ? 12 : 24;
    const scoreKey = `bingo_q${currentQIdx}_${type}`;

    const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === targetTeamIdx);
    for (const [pId] of teamPlayers) {
      await restPut(`players/${pId}/scores/${scoreKey}`, points);
    }

    const patchData: any = { submittedForReview: false };
    if (type === "line") patchData.firstLineApproved = true;
    if (type === "full") patchData.fullApproved = true;

    await restPatch(`gameState/bingo/teams/${targetTeamIdx}`, patchData);
    setAdminSelectedErrorCells([]);
  };

  const handleRejectSubmissionWithPenalty = async (targetTeamIdx: number) => {
    if (!user.isAdmin || !myTeamData) return;
    if (adminSelectedErrorCells.length === 0) {
      alert("Сначала нажмите на ячейки с ошибочными аниме на карточке выше, чтобы отметить их!");
      return;
    }

    const grid = to4x4Grid(myTeamData.card);
    const flatCard = grid.flat();

    const invalidIndices = adminSelectedErrorCells.filter(idx => flatCard[idx]?.title);
    if (invalidIndices.length === 0) {
      alert("В выбранных ячейках нет отмеченных аниме!");
      return;
    }

    setIsProcessing(true);
    const count = invalidIndices.length;
    const penalty = count * 3;

    try {
      const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === targetTeamIdx);
      const penaltyKey = `bingo_q${currentQIdx}_penalty_${Date.now()}`;
      for (const [pId] of teamPlayers) {
        await restPut(`players/${pId}/scores/${penaltyKey}`, -penalty);
      }

      for (const idx of invalidIndices) {
        const r = Math.floor(idx / 4);
        const c = idx % 4;
        grid[r][c].checked = false;
        grid[r][c].title = ""; 
      }

      const penaltyNotice = `❌ Ведущий отклонил ячейки (${count} шт.). Списано ${penalty} б. (-3 б. за каждую). Ошибочные отметки удалены.`;

      await restPatch(`gameState/bingo/teams/${targetTeamIdx}`, {
        submittedForReview: false,
        lastPenaltyNotice: penaltyNotice,
        penaltyTotal: (myTeamData.penaltyTotal || 0) + penalty
      });
      await restPut(`gameState/bingo/teams/${targetTeamIdx}/card`, grid);

      setAdminSelectedErrorCells([]);
      alert(`С команды ${targetTeamIdx + 1} списано ${penalty} баллов.`);
    } catch (e) {
      console.error("Reject error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellClick = async (rIdx: number, cIdx: number) => {
    if (user.isAdmin) {
      const flatIdx = rIdx * 4 + cIdx;
      setAdminSelectedErrorCells(prev => 
        prev.includes(flatIdx) 
          ? prev.filter(i => i !== flatIdx) 
          : [...prev, flatIdx]
      );
      return;
    }

    if (myTeamData?.submittedForReview) {
      setStatusNotice("Ваша карточка сейчас находится на проверке у админа!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    if (roundOver) {
      setStatusNotice("Партия завершена! Расставлять тайтлы больше нельзя.");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    const grid = to4x4Grid(myTeamData?.card);
    const cell = grid[rIdx][cIdx];

    if (cell.title) {
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

    const flatCard = grid.flat();
    const usedAnimeTitles = new Set(flatCard.map(c => c.title).filter(Boolean));

    if (usedAnimeTitles.has(selectedAnime)) {
      setStatusNotice("Это аниме уже поставлено в другую ячейку!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    try {
      grid[rIdx][cIdx].title = selectedAnime;
      grid[rIdx][cIdx].checked = true;
      await restPut(`gameState/bingo/teams/${teamIdx}/card`, grid);
      setSelectedAnime(null);
    } catch (e) {
      console.error("Error placing anime:", e);
    }
  };

  const handleDeleteCellAnime = async (e: React.MouseEvent, rIdx: number, cIdx: number) => {
    e.stopPropagation();
    if (roundOver) return;
    if (myTeamData?.submittedForReview && !user.isAdmin) {
      setStatusNotice("Нельзя менять карточку, пока идет проверка админом!");
      setTimeout(() => setStatusNotice(""), 3000);
      return;
    }

    try {
      const grid = to4x4Grid(myTeamData?.card);
      grid[rIdx][cIdx].title = "";
      grid[rIdx][cIdx].checked = false;
      await restPut(`gameState/bingo/teams/${currentTeamIdx}/card`, grid);
    } catch (e) {
      console.error("Error clearing cell:", e);
    }
  };

  const handleSubmitForReview = async (type: "line" | "full") => {
    if (user.isAdmin || myTeamData?.submittedForReview || roundOver) return;
    try {
      await restPatch(`gameState/bingo/teams/${teamIdx}`, {
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

  const safeGrid = myTeamData ? to4x4Grid(myTeamData.card) : [];
  const flatCard = safeGrid.flat();
  const cardEvaluation = evaluateBingoCard(flatCard as any);
  const usedAnimeTitles = new Set(flatCard.map(c => c.title).filter(Boolean));

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
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

      {/* Header Info Bar */}
      <div className="bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-indigo-950/90 p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                Раунд 8 • {isGame2 ? "Партия 2 из 2" : "Партия 1 из 2"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Соберите 4 в ряд (строка или столбец) — <span className="text-amber-400 font-bold">+12 б.</span> | Все ячейки поля — <span className="text-pink-400 font-bold">+24 б.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
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
        </div>
      </div>

      {lastRevealed.length > 0 && !roundOver && (
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
              <span key={i} className="bg-pink-500/20 border border-pink-400/40 text-pink-200 px-3 py-1.5 rounded-xl font-black text-sm shadow-md">
                {title}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Admin Controls */}
      {user.isAdmin && (
        <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900/90 p-4 rounded-3xl border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase font-black text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Управление выдачей аниме (Партия {currentQIdx + 1})</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Каждое нажатие выдает 2 новых тайтла. Все нерасставленные тайтлы у команд сгорают!
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!roundOver && (
              <button
                onClick={() => {
                  if(window.confirm("Остановить текущую партию досрочно и перейти к проверке?")) {
                    restPatch("gameState/bingo", { roundOver: true });
                  }
                }}
                className="bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                Завершить партию
              </button>
            )}

            {!roundOver && (
              <button
                onClick={handleRevealNextTwo}
                disabled={isProcessing || revealedCount >= pool32.length}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                {revealedCount >= pool32.length
                  ? "Все 32 аниме открыты"
                  : `Выдать следующие 2 аниме (${revealedCount + 2}/32)`}
              </button>
            )}

            {roundOver && !isGame2 && (
              <button
                onClick={handleStartGame2}
                disabled={isProcessing}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 animate-pulse cursor-pointer"
              >
                <span>Начать 2-ю партию Бинго</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
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
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
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

      {/* === ДИНАМИЧЕСКИЙ ЭКРАН === */}
      {!user.isAdmin && roundOver ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-12 mt-8 bg-amber-500/20 border-2 border-amber-500/40 rounded-[2.5rem] text-center shadow-2xl backdrop-blur-md"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl font-bold mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            ⏳
          </div>
          <h3 className="text-3xl font-black text-white mb-3">
            {isGame2 ? "Партия 2 завершена!" : "Партия 1 завершена! Идёт проверка..."}
          </h3>
          <p className="text-lg text-amber-200/80 max-w-2xl mx-auto font-medium">
            {isGame2 
              ? "Раунд Бинго окончен! Ведущий проверяет результаты и подводит итоги." 
              : "Карточки Бинго временно заблокированы. Ведущий проверяет результаты и начисляет баллы. Пожалуйста, подождите. Сразу после проверки начнется Партия 2 с новыми карточками!"}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 4x4 Card */}
          <div className="lg:col-span-8 space-y-4">
            {myTeamData && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Карточка: Команда {currentTeamIdx + 1}</span>
                    {myTeamData?.submittedForReview && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                        ⏳ На проверке
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
                  {safeGrid.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const flatIdx = rIdx * 4 + cIdx;
                      const isHighlighted = cardEvaluation.highlightedIndices.has(flatIdx);
                      const isSelectedError = user.isAdmin && adminSelectedErrorCells.includes(flatIdx);
                      const isRevealedByHost = cell.title ? revealedAnimeSet.has(cell.title.toLowerCase().trim()) : false;
                      const isChecked = !!cell.checked;

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          className={`min-h-[110px] sm:min-h-[125px] p-3 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer group ${
                            isSelectedError
                              ? "bg-rose-950/90 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] ring-2 ring-rose-500 scale-[1.02]"
                              : isHighlighted
                                ? "bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:border-emerald-300"
                                : cell.title
                                  ? user.isAdmin 
                                    ? "bg-purple-950/40 border-purple-500/40 hover:border-rose-400/80" 
                                    : "bg-purple-950/40 border-purple-500/40 hover:border-purple-400"
                                  : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-gray-500">
                              #{flatIdx + 1}
                            </span>
                            {cell.title && !user.isAdmin && !roundOver && (
                              <button
                                onClick={(e) => handleDeleteCellAnime(e, rIdx, cIdx)}
                                className="opacity-70 group-hover:opacity-100 hover:text-red-400 p-1 hover:bg-red-500/20 rounded-md transition-all text-gray-400 cursor-pointer"
                                title="Удалить аниме из ячейки"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {cell.title ? (
                            <div className="mt-1 pt-1.5 border-t border-white/10">
                              <div className={`text-[11px] sm:text-xs font-black leading-tight truncate ${
                                isSelectedError ? "text-rose-300 line-through" : "text-amber-300"
                              }`}>
                                {cell.title}
                              </div>
                              <div className="text-[9px] mt-0.5 flex items-center gap-1 font-bold opacity-70">
                                {isRevealedByHost ? "✓ Совпало" : "❌ Ошибка!"}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 pt-1 border-t border-dashed border-white/10 text-[9px] text-gray-500 italic">
                              + Нажмите для выбора
                            </div>
                          )}

                          {user.isAdmin && isSelectedError && (
                            <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1 shadow-md">
                              <span>❌ Ошибка (-3)</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {!user.isAdmin && !roundOver && (
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

                    {!myTeamData?.firstLineApproved && (
                      <button
                        onClick={() => handleSubmitForReview("line")}
                        disabled={!cardEvaluation.hasBingo || myTeamData?.submittedForReview}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                          myTeamData?.submittedForReview
                            ? "bg-amber-600/50 text-white cursor-default"
                            : cardEvaluation.hasBingo
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer"
                              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        {myTeamData?.submittedForReview ? "ЗАЯВКА НА ПРОВЕРКЕ..." : "ЗАЯВИТЬ БИНГО (+12 б.)"}
                      </button>
                    )}

                    {myTeamData?.firstLineApproved && !myTeamData?.fullApproved && (
                      <button
                        onClick={() => handleSubmitForReview("full")}
                        disabled={!cardEvaluation.allCompleted || myTeamData?.submittedForReview}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                          myTeamData?.submittedForReview
                            ? "bg-amber-600/50 text-white cursor-default"
                            : cardEvaluation.allCompleted
                              ? "bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white shadow-amber-500/30 animate-pulse cursor-pointer"
                              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        {myTeamData?.submittedForReview ? "ФУЛЛ НА ПРОВЕРКЕ..." : "ФУЛЛ КАРТОЧКА (+24 б.)"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Admin specific Verification Panel */}
            {user.isAdmin && myTeamData && (
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Панель Верификации: Команда {adminSelectedTeam + 1}</span>
                      {myTeamData?.submittedForReview && (
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
                            className="text-[11px] text-gray-400 hover:text-white underline cursor-pointer"
                          >
                            Сбросить выбор
                          </button>
                        </div>
                      ) : (
                        <span>Нажмите на ошибочные ячейки на карточке выше, чтобы отметить их.</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    Штрафов команды: <span className="text-red-400 font-bold">-{myTeamData?.penaltyTotal || 0} б.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAdminApprove}
                    disabled={isProcessing || !myTeamData?.submittedForReview}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {myTeamData?.submissionType === "full" ? "ЗАЧЕСТЬ ВСЁ ПОЛЕ (+24 б.)" : "ЗАЧЕСТЬ БИНГО (+12 б.)"}
                  </button>

                  <button
                    onClick={handleAdminReject}
                    disabled={isProcessing || adminSelectedErrorCells.length === 0}
                    className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-40 py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                    {adminSelectedErrorCells.length > 0
                      ? `ОТКЛОНИТЬ ВЫБРАННЫЕ (-${adminSelectedErrorCells.length * 3} б.)`
                      : "ВЫБЕРИТЕ ОШИБОЧНЫЕ ЯЧЕЙКИ"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dock */}
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

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 text-xs font-bold">
                <button
                  onClick={() => setDockTab("current")}
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    dockTab === "all"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Все тайтлы ({revealedAnime.length})</span>
                </button>
              </div>

              {selectedAnime ? (
                <div className="p-3 bg-purple-600/30 border border-purple-400/50 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-black text-purple-300">Выбран тайтл:</div>
                    <div className="text-sm font-black text-white truncate">{selectedAnime}</div>
                    <div className="text-[10px] text-purple-200 mt-0.5">Нажмите на пустую ячейку слева</div>
                  </div>
                  <button
                    onClick={() => setSelectedAnime(null)}
                    className="text-xs text-purple-300 hover:text-white bg-white/10 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="text-center py-1 text-xs text-gray-500 italic">
                  (Нажмите на аниме ниже для выбора)
                </div>
              )}

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
                          
                          // Найти индекс, если уже размещено
                          const foundIndex = flatCard.findIndex(c => c.title === title);
                          const cellNum = foundIndex >= 0 ? foundIndex : null;

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (isUsed || roundOver) return;
                                setSelectedAnime(title);
                              }}
                              className={`p-3.5 rounded-2xl border transition-all text-xs font-bold ${roundOver && !isUsed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} relative ${
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
                                {!isUsed && !isCurrentSelection && !roundOver && (
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
                        const foundIndex = flatCard.findIndex(c => c.title === title);
                        const cellNum = foundIndex >= 0 ? foundIndex : null;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (roundOver) return;
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
      )}

      <BingoRulesModal
        isOpen={showRulesModal}
        onClose={handleCloseRules}
      />
    </div>
  );
}
