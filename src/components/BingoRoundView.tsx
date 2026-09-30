import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, CheckCircle2, XCircle, AlertTriangle, 
  Sparkles, RefreshCw, Send, Eye, ShieldAlert, ArrowRight, Play, Loader2
} from "lucide-react";
import { generateBingoPool32, generateTeamBingoCard } from "../data/bingoData";

const TOTAL_TEAMS = 10;

interface BingoCell {
  title: string;
  checked?: boolean;
  id?: string | number;
}

// Извлечение чистого названия аниме в виде строки
function getAnimeTitle(item: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return item.title || item.name || item.anime || "";
  }
  return String(item);
}

// Защищенный конвертер карточки в 4x4 сетку (не падает ни от объектов, ни от 1D/2D массивов)
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

interface BingoRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
}

export default function BingoRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
}: BingoRoundViewProps) {
  const currentQIdx = gameState?.currentQuestion ?? 0;
  const isGame2 = currentQIdx === 1;

  const bingoState = gameState?.bingo || {};
  
  // Безопасное чтение пула 32 тайтлов
  const rawPool = bingoState.pool32;
  const poolList: any[] = Array.isArray(rawPool) 
    ? rawPool 
    : (rawPool && typeof rawPool === 'object' ? Object.values(rawPool) : []);
  const pool32: string[] = poolList.map(getAnimeTitle).filter(Boolean);

  const revealedCount = Math.min(32, Math.max(0, Number(bingoState.revealedCount) || 0));

  // Безопасное чтение последних открытых тайтлов
  const rawLast = bingoState.lastRevealed;
  const lastList: any[] = Array.isArray(rawLast)
    ? rawLast
    : (rawLast && typeof rawLast === 'object' ? Object.values(rawLast) : []);
  const lastRevealed: string[] = lastList.map(getAnimeTitle).filter(Boolean);

  const roundOver: boolean = !!bingoState.roundOver;
  const teamsData: Record<string, any> = bingoState.teams || {};

  const teamIdx = user.isAdmin ? 0 : (user.team ?? 0);
  const myTeamData = teamsData[teamIdx] || null;

  const [adminViewTeam, setAdminViewTeam] = useState<number>(0);

  // Множество названий выпавших тайтлов в нижнем регистре
  const revealedAnimeSet = new Set(
    pool32.slice(0, revealedCount).map((s) => s.toLowerCase().trim())
  );

  // Авто-инициализация, если данных в Firebase ещё нет
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

  // Выдать следующие 2 аниме
  const handleRevealNextTwo = async () => {
    if (!user.isAdmin || roundOver) return;
    const nextCount = Math.min(32, revealedCount + 2);
    const newRevealed = pool32.slice(revealedCount, nextCount);
    await restPatch("gameState/bingo", {
      revealedCount: nextCount,
      lastRevealed: newRevealed,
    });
  };

  // Завершить партию для перехода к проверке
  const handleEndCurrentGame = async () => {
    if (!user.isAdmin) return;
    await restPatch("gameState/bingo", { roundOver: true });
  };

  // ЗАПУСК 2-Й ПАРТИИ БИНГО (Генерация новых карточек и пула)
  const handleStartGame2 = async () => {
    if (!user.isAdmin) return;
    if (!window.confirm("Все результаты 1-й партии проверены? Начать 2-ю партию с новыми карточками?")) return;

    const newPool = generateBingoPool32();
    const newTeams: Record<string, any> = {};
    for (let t = 0; t < TOTAL_TEAMS; t++) {
      newTeams[t] = {
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

    await restPatch("gameState", {
      currentQuestion: 1,
      roundFinished: false,
      showAnswer: false,
      bingo: {
        gameIndex: 1,
        pool32: newPool,
        revealedCount: 0,
        lastRevealed: [],
        teams: newTeams,
        roundOver: false,
      },
    });
  };

  // Одобрение заявки ведущим
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
  };

  // Штраф (-3 балла)
  const handleRejectSubmissionWithPenalty = async (targetTeamIdx: number) => {
    if (!user.isAdmin) return;
    const scoreKey = `bingo_q${currentQIdx}_penalty_${Date.now()}`;

    const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === targetTeamIdx);
    for (const [pId] of teamPlayers) {
      await restPut(`players/${pId}/scores/${scoreKey}`, -3);
    }

    const prevPenalty = teamsData[targetTeamIdx]?.penaltyTotal || 0;
    await restPatch(`gameState/bingo/teams/${targetTeamIdx}`, {
      submittedForReview: false,
      penaltyTotal: prevPenalty - 3,
      lastPenaltyNotice: `❌ Ведущий отклонил заявку: ошибка в ячейках (-3 балла)!`,
    });
  };

  // Клик по ячейке игроком
  const handleCellClick = async (rIdx: number, cIdx: number) => {
    if (user.isAdmin || roundOver || !myTeamData) return;
    const grid = to4x4Grid(myTeamData.card);
    if (!grid[rIdx] || !grid[rIdx][cIdx]) return;

    grid[rIdx][cIdx].checked = !grid[rIdx][cIdx].checked;
    await restPut(`gameState/bingo/teams/${teamIdx}/card`, grid);
  };

  // Отправка заявки на проверку
  const handleSubmitForReview = async (type: "line" | "full") => {
    if (user.isAdmin || roundOver || !myTeamData) return;

    await restPatch(`gameState/bingo/teams/${teamIdx}`, {
      submittedForReview: true,
      submissionType: type,
      submittedAt: Date.now(),
    });
  };

  // Подсчёт совпадений карточки команды
  const calculateCardMatchStats = (tIdx: number) => {
    const tData = teamsData[tIdx];
    if (!tData?.card) return { checkedCount: 0, validMatches: 0, invalidMatches: 0 };
    const grid = to4x4Grid(tData.card);
    let checkedCount = 0;
    let validMatches = 0;
    let invalidMatches = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.checked) {
          checkedCount++;
          const titleLower = cell.title.toLowerCase().trim();
          if (titleLower && revealedAnimeSet.has(titleLower)) {
            validMatches++;
          } else {
            invalidMatches++;
          }
        }
      });
    });
    return { checkedCount, validMatches, invalidMatches };
  };

  // Если данные ещё загружаются
  if (!gameState?.bingo?.teams && !user.isAdmin) {
    return (
      <div className="glass p-12 rounded-[2.5rem] border border-white/10 text-center space-y-4 max-w-md mx-auto">
        <Loader2 className="w-10 h-10 text-purple-400 mx-auto animate-spin" />
        <h3 className="text-xl font-black text-white">Загрузка раунда Бинго...</h3>
        <p className="text-gray-400 text-xs">Ведущий подготавливает карточки тайтлов для команд.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ==================== ШАПКА РАУНДА ==================== */}
      <div className="bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-indigo-950/90 p-5 rounded-3xl border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Раунд 8 • {isGame2 ? "Партия 2 из 2" : "Партия 1 из 2"}
              </span>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Линия: +12 б. • Всё поле: +24 б.
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>{isGame2 ? "🔥 Финальная битва Бинго (Партия 2)" : "🎯 Аниме-Бинго (Партия 1)"}</span>
              {roundOver && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                  Проверка результатов
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/50 border border-white/10 px-5 py-2.5 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Открыто тайтлов</span>
              <span className="text-2xl font-black text-purple-300 font-mono">
                {revealedCount} / 32
              </span>
            </div>
          </div>
        </div>

        {/* Последние открытые 2 тайтла */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-[11px] font-black uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" /> Последние открытые тайтлы ведущим:
          </div>
          {lastRevealed.length === 0 ? (
            <div className="text-xs text-gray-500 italic">Ведущий ещё не открыл первые тайтлы...</div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {lastRevealed.map((tName, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-purple-600/30 border border-purple-400/50 px-4 py-2 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-[11px] font-black flex items-center justify-center">
                    ✓
                  </span>
                  <span>«{tName}»</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== СООБЩЕНИЕ ИГРОКАМ ВО ВРЕМЯ ПРОВЕРКИ ==================== */}
      {!user.isAdmin && roundOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-center space-y-2 shadow-2xl backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-lg font-bold">
            ⏳
          </div>
          <h3 className="text-xl font-black text-white">
            {isGame2 ? "Партия 2 завершена!" : "Партия 1 завершена! Ведущий проверяет результаты команд"}
          </h3>
          <p className="text-sm text-amber-200/80 max-w-lg mx-auto">
            {isGame2 
              ? "Ведущий подводит итоги 8-го раунда. Скоро перейдём к следующему раунду!" 
              : "Отдыхайте и ждите объявления результатов. Сразу после проверки ведущий запустит 2-ю партию с новыми карточками!"}
          </p>
        </motion.div>
      )}

      {/* ==================== ИНТЕРФЕЙС ИГРОКА (КАРТОЧКА 4X4) ==================== */}
      {!user.isAdmin && myTeamData && (
        <div className="bg-slate-900/90 border-2 border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                Ваша карточка команды #{teamIdx + 1}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                Нажимайте на ячейку, когда ведущий объявляет выпавшее аниме!
              </p>
            </div>

            <div className="flex items-center gap-2">
              {myTeamData.firstLineApproved && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-black">
                  ✓ Линия зачтена (+12 б.)
                </span>
              )}
              {myTeamData.fullApproved && (
                <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1 rounded-full text-xs font-black">
                  🏆 Всё поле зачтено (+24 б.)
                </span>
              )}
            </div>
          </div>

          {/* Безопасный рендер сетки 4x4 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {to4x4Grid(myTeamData.card).map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isRevealedByHost = cell.title ? revealedAnimeSet.has(cell.title.toLowerCase().trim()) : false;
                const isChecked = !!cell.checked;

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={roundOver}
                    className={`min-h-[75px] p-3 rounded-2xl text-xs font-bold text-left transition-all border-2 flex flex-col justify-between cursor-pointer ${
                      isChecked
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40 scale-[1.02]"
                        : isRevealedByHost
                          ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 hover:bg-emerald-900/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                    } disabled:cursor-not-allowed`}
                  >
                    <span className="leading-snug line-clamp-2">{cell.title || "—"}</span>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                      <span>{isChecked ? "✅ Отмечено" : isRevealedByHost ? "🔔 Выпало!" : ""}</span>
                      <span className="opacity-50">#{rIdx * 4 + cIdx + 1}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {!roundOver && (
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSubmitForReview("line")}
                disabled={myTeamData.submittedForReview || myTeamData.firstLineApproved}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                {myTeamData.submittedForReview && myTeamData.submissionType === "line"
                  ? "Линия на проверке у ведущего... ⏳"
                  : "Собрали 4 в ряд? Отправить Линию (+12 б.)"}
              </button>
              <button
                onClick={() => handleSubmitForReview("full")}
                disabled={myTeamData.submittedForReview || myTeamData.fullApproved}
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                {myTeamData.submittedForReview && myTeamData.submissionType === "full"
                  ? "Поле на проверке у ведущего... ⏳"
                  : "Закрыли всё поле? Отправить на 24 б. 🏆"}
              </button>
            </div>
          )}

          {myTeamData.lastPenaltyNotice && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs font-bold text-center">
              {myTeamData.lastPenaltyNotice}
            </div>
          )}
        </div>
      )}

      {/* ==================== ПАНЕЛЬ УПРАВЛЕНИЯ ВЕДУЩЕГО ==================== */}
      {user.isAdmin && (
        <div className="bg-slate-900/95 p-6 rounded-3xl border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>👑 Ведущий • Управление Бинго ({isGame2 ? "Партия 2" : "Партия 1"})</span>
              </h3>
              <p className="text-xs text-gray-400">
                {roundOver
                  ? "Партия остановлена. Проверьте карточки команд и начислите баллы перед стартом следующей партии!"
                  : "Выдавайте по 2 аниме за клик. Команды заполняют карточки в реальном времени."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!roundOver && revealedCount < 32 && (
                <button
                  onClick={handleRevealNextTwo}
                  className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" /> Выдать 2 аниме (+2)
                </button>
              )}

              {!roundOver && (
                <button
                  onClick={handleEndCurrentGame}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Завершить выдачу и проверить заявки
                </button>
              )}

              {!isGame2 && (
                <button
                  onClick={handleStartGame2}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <span>Начать 2-ю партию Бинго (Новые карточки)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Список команд */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">
              Команды и поданные заявки на проверку:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Array.from({ length: TOTAL_TEAMS }).map((_, idx) => {
                const tData = teamsData[idx];
                const isSelected = adminViewTeam === idx;
                const stats = calculateCardMatchStats(idx);
                const isPending = !!tData?.submittedForReview;

                return (
                  <button
                    key={idx}
                    onClick={() => setAdminViewTeam(idx)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-purple-600 border-purple-400 text-white shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                    } ${isPending ? "ring-2 ring-amber-400 animate-pulse" : ""}`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-black uppercase">
                      <span>Команда #{idx + 1}</span>
                      {isPending && <span className="text-amber-400 font-bold">🔔 ЗАЯВКА</span>}
                      {tData?.firstLineApproved && <span className="text-emerald-400">✓ 12</span>}
                      {tData?.fullApproved && <span className="text-yellow-400">🏆 24</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Отмечено: {stats.checkedCount}/16 ({stats.validMatches} совпало)
                    </div>
                    {tData?.penaltyTotal < 0 && (
                      <div className="text-[10px] text-red-400 font-bold">Штраф: {tData.penaltyTotal} б.</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Детальный просмотр карточки команды */}
          {teamsData[adminViewTeam] && (
            <div className="p-5 bg-black/40 rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-white text-sm uppercase">
                    Карточка Команды #{adminViewTeam + 1}
                  </h4>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Зелёный = отмечено верно (выпадало) • Красный = отмечено ошибочно (не выпадало)
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleApproveSubmission(adminViewTeam, "line")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    ✓ Зачесть Линию (+12 б.)
                  </button>
                  <button
                    onClick={() => handleApproveSubmission(adminViewTeam, "full")}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    🏆 Зачесть Всё поле (+24 б.)
                  </button>
                  <button
                    onClick={() => handleRejectSubmissionWithPenalty(adminViewTeam)}
                    className="bg-red-600/30 hover:bg-red-600 border border-red-500/50 text-red-200 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Штраф за ошибку (-3 б.)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {to4x4Grid(teamsData[adminViewTeam].card).map((row, rI) =>
                  row.map((cell, cI) => {
                    const isRevealed = cell.title ? revealedAnimeSet.has(cell.title.toLowerCase().trim()) : false;
                    const isChecked = !!cell.checked;
                    const isCorrectMatch = isChecked && isRevealed;
                    const isFalseMark = isChecked && !isRevealed;

                    return (
                      <div
                        key={`${rI}-${cI}`}
                        className={`p-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                          isCorrectMatch
                            ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                            : isFalseMark
                              ? "bg-red-950/80 border-red-500 text-red-200 animate-pulse"
                              : isRevealed
                                ? "bg-white/10 border-white/20 text-gray-300"
                                : "bg-black/30 border-white/5 text-gray-500"
                        }`}
                      >
                        <div className="font-bold truncate" title={cell.title}>{cell.title || "—"}</div>
                        <div className="text-[9px] mt-1 opacity-70">
                          {isCorrectMatch ? "✓ Совпало" : isFalseMark ? "❌ Ошибка!" : isRevealed ? "Выпадало" : "Не выпадало"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
