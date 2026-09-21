import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, Send, HelpCircle, CheckCircle2, XCircle, 
  Sparkles, Loader2, Trophy, MessageSquare, AlertCircle, RefreshCw, Eye
} from "lucide-react";
import { AKINATOR_ANIME_LIST } from "../data/akinatorAnime";

interface AkinatorRoundViewProps {
  user: any;
  gameState: any;
  players: any;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
}

export default function AkinatorRoundView({
  user,
  gameState,
  players,
  restPatch,
  restPut,
}: AkinatorRoundViewProps) {
  const [questionInput, setQuestionInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastFailedQuestion, setLastFailedQuestion] = useState("");
  const [wrongGuessAlert, setWrongGuessAlert] = useState("");
  const [adminViewTeam, setAdminViewTeam] = useState<number>(0);

  const qIdx = gameState?.currentQuestion ?? 0;
  const qKey = `q${qIdx}`;
  const teamIdx = user.isAdmin ? adminViewTeam : (user.team ?? 0);
  const akinatorState = gameState?.akinator || {};
  
  const hasQKey = !!akinatorState[qKey]?.teams;
  const teamsData = (hasQKey ? akinatorState[qKey].teams : akinatorState.teams) || {};
  const currentTeamData = teamsData[teamIdx] || null;

  const teamBasePath = hasQKey ? `gameState/akinator/${qKey}/teams/${teamIdx}` : `gameState/akinator/teams/${teamIdx}`;
  const allTeamsBasePath = hasQKey ? `gameState/akinator/${qKey}/teams` : `gameState/akinator/teams`;

  useEffect(() => {
    setQuestionInput("");
    setGuessInput("");
    setErrorMsg("");
    setLastFailedQuestion("");
    setWrongGuessAlert("");
  }, [gameState?.currentQuestion]);

  // Auto-recovery: if team has no secret anime assigned yet, host or player automatically assigns one
  useEffect(() => {
    if (!currentTeamData?.animeTitle && user?.isAdmin) {
      const picked = AKINATOR_ANIME_LIST[Math.floor(Math.random() * AKINATOR_ANIME_LIST.length)];
      restPatch(teamBasePath, {
        animeId: picked.id,
        animeTitle: picked.title,
        originalOrEn: picked.originalOrEn,
        questions: [],
        guessed: false,
        guessedBy: null,
        pointsAwarded: 0,
        attempts: []
      }).catch(console.error);
    }
  }, [currentTeamData?.animeTitle, user?.isAdmin, teamBasePath]);

  const quickQuestions = [
    "Главный герой школьник?",
    "В аниме есть магия или сверхспособности?",
    "Действие происходит в реальном мире?",
    "Это аниме вышло после 2015 года?",
    "Главный герой — парень?",
    "Это сёнэн?",
  ];

  // Helper to re-roll anime for a team or all teams for current question
  const reassignAnime = async (forTeam?: number) => {
    const shuffled = [...AKINATOR_ANIME_LIST].sort(() => 0.5 - Math.random());
    if (forTeam !== undefined) {
      const picked = shuffled[forTeam % shuffled.length];
      await restPatch(teamBasePath, {
        animeId: picked.id,
        animeTitle: picked.title,
        originalOrEn: picked.originalOrEn,
        questions: [],
        guessed: false,
        guessedBy: null,
        pointsAwarded: 0,
        attempts: []
      });
    } else {
      const newTeams: Record<string, any> = {};
      for (let i = 0; i < 10; i++) {
        const picked = shuffled[i % shuffled.length];
        newTeams[i] = {
          animeId: picked.id,
          animeTitle: picked.title,
          originalOrEn: picked.originalOrEn,
          questions: [],
          guessed: false,
          guessedBy: null,
          pointsAwarded: 0,
          attempts: []
        };
      }
      await restPut(allTeamsBasePath, newTeams);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const qText = (customQ || questionInput).trim();
    if (!qText || isAsking) return;
    if (!currentTeamData?.animeTitle) {
      setErrorMsg("Аниме для команды не загружено. Обратитесь к ведущему или обновите страницу.");
      return;
    }

    setErrorMsg("");
    setWrongGuessAlert("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/akinator/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeTitle: currentTeamData.animeTitle,
          question: qText,
        }),
      });

      let aiAnswer = "НЕ ЗНАЮ / НЕПРИМЕНИМО";
      if (res.ok) {
        const data = await res.json();
        aiAnswer = data.answer || "НЕ ЗНАЮ / НЕПРИМЕНИМО";
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn("Akinator ask API response:", errJson);
        const details = errJson?.details || errJson?.error || "";
        if (details.includes("503") || details.includes("demand") || details.includes("UNAVAILABLE")) {
          setLastFailedQuestion(qText);
          setErrorMsg("ИИ временно перегружен запросами. Пожалуйста, нажмите «Повторить вопрос» через несколько секунд.");
          return;
        }
        // Fallback default answer rather than blocking
        aiAnswer = "НЕ ЗНАЮ / НЕПРИМЕНИМО";
      }

      const prevQuestions = currentTeamData.questions || [];
      const newQuestionObj = {
        id: Date.now(),
        question: qText,
        answer: aiAnswer,
        askedBy: user.nickname,
        timestamp: Date.now(),
      };

      const updatedList = [...prevQuestions, newQuestionObj];
      await restPut(`${teamBasePath}/questions`, updatedList);
      setQuestionInput("");
      setLastFailedQuestion("");
    } catch (err: any) {
      console.error("Ask question error:", err);
      setLastFailedQuestion(qText);
      setErrorMsg("Не удалось связаться с ИИ. Нажмите «Повторить вопрос» или задайте другой.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleMakeGuess = async () => {
    const gText = guessInput.trim();
    if (!gText || isGuessing || !currentTeamData?.animeTitle) return;

    setErrorMsg("");
    setWrongGuessAlert("");
    setIsGuessing(true);

    try {
      const res = await fetch("/api/akinator/check-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeTitle: currentTeamData.animeTitle,
          guess: gText,
        }),
      });

      let isCorrect = false;
      if (res.ok) {
        const data = await res.json();
        isCorrect = !!data.correct;
      } else {
        // Fallback to client-side fuzzy match
        const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
        const cg = clean(gText);
        const ct = clean(currentTeamData.animeTitle);
        const co = clean(currentTeamData.originalOrEn || "");
        isCorrect = cg === ct || (cg.length >= 4 && (ct.includes(cg) || co.includes(cg)));
      }

      if (isCorrect) {
        // Calculate points: 1-5 questions: 10pts, 6-10: 8pts, 11-15: 6pts, 16+: 4pts
        const qCount = (currentTeamData.questions || []).length;
        let points = 10;
        if (qCount > 15) points = 4;
        else if (qCount > 10) points = 6;
        else if (qCount > 5) points = 8;

        // Award points to all players in this team for this question
        const scoreKey = `akinator_win_q${qIdx}`;
        const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === teamIdx);
        for (const [pId] of teamPlayers) {
          await restPut(`players/${pId}/scores/${scoreKey}`, points);
        }

        await restPatch(teamBasePath, {
          guessed: true,
          guessedBy: user.nickname,
          pointsAwarded: points,
        });

        setGuessInput("");
      } else {
        const prevAttempts = currentTeamData.attempts || [];
        const newAttempt = {
          guess: gText,
          guessedBy: user.nickname,
          timestamp: Date.now(),
          correct: false,
        };
        await restPut(`${teamBasePath}/attempts`, [...prevAttempts, newAttempt]);
        setWrongGuessAlert(`❌ Неверно! «${gText}» — это не то аниме. Задавайте новые вопросы!`);
        setTimeout(() => setWrongGuessAlert(""), 6000);
      }
    } catch (err: any) {
      console.error("Guess check error:", err);
      // Fallback local match on error
      const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-zа-я0-9]/gi, "").trim();
      const isMatch = clean(gText) === clean(currentTeamData.animeTitle);
      if (isMatch) {
        await restPatch(teamBasePath, {
          guessed: true,
          guessedBy: user.nickname,
          pointsAwarded: 10,
        });
        setGuessInput("");
      } else {
        setErrorMsg("Ошибка связи при проверке. Попробуйте еще раз.");
      }
    } finally {
      setIsGuessing(false);
    }
  };

  const getAnswerBadge = (answer: string) => {
    switch (answer) {
      case "ДА":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> ДА</span>;
      case "НЕТ":
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> НЕТ</span>;
      case "СКОРЕЕ ДА":
        return <span className="bg-lime-500/20 text-lime-300 border border-lime-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5">👍 СКОРЕЕ ДА</span>;
      case "СКОРЕЕ НЕТ":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5">👎 СКОРЕЕ НЕТ</span>;
      case "ЧАСТИЧНО":
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5">⚖️ ЧАСТИЧНО</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-300 border border-gray-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5">❓ НЕ ЗНАЮ / НЕПРИМЕНИМО</span>;
    }
  };

  // If no teams data exists yet (first time launching the round)
  if (!currentTeamData) {
    return (
      <div className="glass p-12 rounded-[2.5rem] border border-white/10 text-center max-w-xl mx-auto space-y-6">
        <Bot className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
        <h3 className="text-2xl font-black text-white">Инициализация раунда Акинатора...</h3>
        <p className="text-gray-400 text-sm">
          ИИ выбирает секретные аниме для каждой команды из пула 50 шедевров.
        </p>
        {user.isAdmin && (
          <button
            onClick={() => reassignAnime()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 mx-auto transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Раздать аниме командам
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Admin Team Switcher */}
      {user.isAdmin && (
        <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-purple-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <span className="text-xs uppercase font-black tracking-widest text-purple-400 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Просмотр команд (Панель Ведущего)
            </span>
            <button
              onClick={() => reassignAnime()}
              className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Перераздать всем командам
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i).map((idx) => {
              const tData = teamsData[idx];
              const isSelected = adminViewTeam === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setAdminViewTeam(idx)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-80 flex items-center justify-between">
                    <span>Команда {idx + 1}</span>
                    {tData?.guessed && <span className="text-green-400 font-bold">✅</span>}
                  </div>
                  <div className="text-xs font-bold truncate mt-0.5">
                    {tData?.animeTitle || "Не задано"}
                  </div>
                  <div className="text-[10px] mt-1 flex items-center justify-between text-gray-400">
                    <span>{tData?.questions?.length || 0} вопр.</span>
                    {tData?.guessed && (
                      <span className="text-green-400 font-bold">+{tData?.pointsAwarded || 10} б.</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secret Card Header */}
      <div className="glass-dark p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <span className="bg-purple-500/25 border border-purple-400/40 text-purple-300 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Вопрос {qIdx + 1} из 3
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                  {user.isAdmin ? `Команда ${teamIdx + 1}` : `Ваша команда (${teamIdx + 1})`}
                </span>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Вопросов: {currentTeamData?.questions?.length || 0}
                </span>
              </div>

              {/* Title display */}
              {user.isAdmin ? (
                <div className="mt-1">
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    🎯 Загадано: <span className="text-pink-400">«{currentTeamData?.animeTitle}»</span>
                  </h3>
                  {currentTeamData?.originalOrEn && (
                    <p className="text-xs text-gray-400 italic">{currentTeamData.originalOrEn}</p>
                  )}
                </div>
              ) : currentTeamData?.guessed ? (
                <div className="mt-1">
                  <h3 className="text-2xl font-black text-green-400">
                    🎉 Вы угадали: «{currentTeamData?.animeTitle}»!
                  </h3>
                  <p className="text-xs text-green-300/80">
                    +{currentTeamData?.pointsAwarded || 10} баллов начислено каждому в команде!
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    ❓ Секретное аниме загадано ИИ
                  </h3>
                  <p className="text-xs text-gray-400">
                    Задавайте вопросы Акинатору на «Да/Нет», чтобы разгадать тайтл из пула 50 лучших аниме!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scoring badge */}
          <div className="glass px-5 py-3 rounded-2xl border border-white/10 text-center shrink-0">
            <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">
              Награда за скорость
            </div>
            <div className="text-lg font-black text-purple-300">
              1-5 вопр: 10б • 6-10: 8б • 11-15: 6б
            </div>
          </div>
        </div>
      </div>

      {/* Victory Banner if already guessed */}
      {currentTeamData?.guessed && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 rounded-3xl bg-gradient-to-r from-green-900/40 via-emerald-900/30 to-slate-900/60 border border-green-500/40 shadow-2xl text-center space-y-3"
        >
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-3xl font-black text-white">Тайтл успешно разгадан!</h3>
          <p className="text-lg text-green-300 font-medium">
            Команда отгадала аниме <span className="font-black text-white">«{currentTeamData.animeTitle}»</span> за{" "}
            {currentTeamData.questions?.length || 0} вопросов!
          </p>
          <div className="inline-block bg-green-500 text-slate-950 font-black px-6 py-2 rounded-full uppercase tracking-wider text-sm shadow-lg shadow-green-500/30">
            +{currentTeamData.pointsAwarded || 10} баллов начислено
          </div>
        </motion.div>
      )}

      {/* Main Dialogue Log */}
      <div className="glass-dark p-6 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              История вопросов и ответов ({currentTeamData.questions?.length || 0})
            </h4>
          </div>
          {currentTeamData.questions?.length > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              Последний вопрос от: {currentTeamData.questions[currentTeamData.questions.length - 1].askedBy}
            </span>
          )}
        </div>

        {/* Questions list */}
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          {(!currentTeamData.questions || currentTeamData.questions.length === 0) ? (
            <div className="text-center py-16 space-y-3">
              <HelpCircle className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-400 font-medium">Вопросов пока нет. Задайте первый вопрос Акинатору!</p>
              <p className="text-xs text-gray-500">Например: «Это сёнэн?» или «Главный герой мужчина?»</p>
            </div>
          ) : (
            currentTeamData.questions.map((q: any, idx: number) => (
              <motion.div
                key={q.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs text-gray-400 font-bold mb-0.5">{q.askedBy}</div>
                      <p className="text-white font-medium text-base leading-snug">«{q.question}»</p>
                    </div>
                  </div>
                  <div className="shrink-0">{getAnswerBadge(q.answer)}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Suggestion Chips (for players only) */}
        {!currentTeamData.guessed && (
          <div className="pt-2 border-t border-white/5">
            <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Быстрые подсказки вопросов:
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(chip)}
                  disabled={isAsking}
                  className="bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/40 border border-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question Input Form */}
        {!currentTeamData.guessed && (
          <div className="pt-2 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAsking) handleAskQuestion();
                  }}
                  placeholder="Задайте вопрос на да/нет (например: «Главный герой блондин?»)..."
                  disabled={isAsking}
                  maxLength={120}
                  className="w-full bg-black/40 border-2 border-white/10 focus:border-purple-500 rounded-2xl px-5 py-4 text-white text-base placeholder-gray-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => handleAskQuestion()}
                disabled={isAsking || !questionInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black px-6 md:px-8 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/30"
              >
                {isAsking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden md:inline">ИИ ДУМАЕТ...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden md:inline">СПРОСИТЬ</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
                {lastFailedQuestion && (
                  <button
                    onClick={() => handleAskQuestion(lastFailedQuestion)}
                    disabled={isAsking}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAsking ? "animate-spin" : ""}`} />
                    Повторить вопрос
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guess Attempt Section */}
      {!currentTeamData.guessed && (
        <div className="glass-dark p-6 md:p-8 rounded-[2.5rem] border-2 border-purple-500/30 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-wider">
                Готовы назвать аниме?
              </h4>
              <p className="text-xs text-gray-400">
                Если команда уверена в ответе — введите название тайтла (на русском или английском).
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGuessing) handleMakeGuess();
              }}
              placeholder="Например: Тетрадь смерти / Death Note..."
              disabled={isGuessing}
              maxLength={80}
              className="flex-1 bg-black/40 border-2 border-white/10 focus:border-yellow-500 rounded-2xl px-5 py-4 text-white text-base placeholder-gray-500 outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={handleMakeGuess}
              disabled={isGuessing || !guessInput.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-black font-black px-6 md:px-8 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
            >
              {isGuessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden md:inline">ПРОВЕРКА...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="hidden md:inline">НАЗВАТЬ АНИМЕ</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {wrongGuessAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-300 font-bold text-sm text-center shadow-lg"
              >
                {wrongGuessAlert}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past wrong attempts */}
          {currentTeamData.attempts && currentTeamData.attempts.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2">
                Неверные попытки:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {currentTeamData.attempts.map((att: any, i: number) => (
                  <span
                    key={i}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-2.5 py-0.5 rounded-lg line-through"
                  >
                    {att.guess} ({att.guessedBy})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
