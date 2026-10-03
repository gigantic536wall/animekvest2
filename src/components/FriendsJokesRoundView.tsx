import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Award, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  HelpCircle, Eye, Sparkles, Send, ShieldCheck, Flame, Medal, Crown, MessageSquare, Clock
} from 'lucide-react';
import { ROUND9_QUESTIONS, Round9Question } from '../data/round9Data';

interface FriendsJokesRoundViewProps {
  user: any;
  gameState: any;
  players: Record<string, any>;
  teamsData?: Record<string, any>;
  restPatch: (path: string, data: any) => Promise<any>;
  restPut: (path: string, data: any) => Promise<any>;
}

// ==================== ВИЗУАЛЬНАЯ КАРТОЧКА ИНДРЫ (ВОПРОС 2) ====================
function IndraRiddleCard() {
  return (
    <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl border-4 border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Левая колонка: Клан и Глаза */}
        <div className="flex flex-col items-center justify-center space-y-6 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-6">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">клан</span>
            {/* Герб клана Учиха (веер) */}
            <div className="w-24 h-24 relative mx-auto flex items-center justify-center">
              <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
                {/* Верхняя красная половина */}
                <path d="M 10 50 A 40 40 0 0 1 90 50 Z" fill="#DC2626" stroke="#000" strokeWidth="3" />
                {/* Нижняя белая половина */}
                <path d="M 10 50 A 40 40 0 0 0 90 50 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
                {/* Ручка веера */}
                <rect x="44" y="85" width="12" height="30" fill="#FFFFFF" stroke="#000" strokeWidth="3" rx="2" />
              </svg>
            </div>
            <p className="text-[11px] text-slate-600 italic mt-3 max-w-[200px]">
              «Их конфликт продолжался через поколения...»
            </p>
          </div>

          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">глаза</span>
            {/* Спиральный Мангекё Шаринган Индры */}
            <div className="w-24 h-24 rounded-full bg-red-600 border-4 border-black relative mx-auto flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                {/* Спиральный узор */}
                <path 
                  d="M 50 50 
                     m 0 -40 
                     a 40 40 0 0 1 0 80 
                     a 32 32 0 0 1 0 -64 
                     a 24 24 0 0 1 0 48 
                     a 16 16 0 0 1 0 -32 
                     a 8 8 0 0 1 0 16 
                     Z" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth="5" 
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="5" fill="#000" />
              </svg>
            </div>
          </div>
        </div>

        {/* Правая колонка: Мысли, Способности, Эмодзи, История */}
        <div className="space-y-5 text-left">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">МЫСЛИ</span>
            <p className="text-base font-bold text-slate-900 mt-1 italic">
              «Почему мой младший брат получил то, чего заслуживал я?»
            </p>
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">что умел</span>
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
              Обладал огромным талантом к ниндзюцу и унаследовал сильную чакру.
            </p>
          </div>

          <div className="py-1 text-center bg-slate-100 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">ЭМОДЗИ</span>
            <span className="text-3xl">🌙</span>
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">история</span>
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
              Его история связана с противостоянием двух братьев, которое позже продолжилось через реинкарнации.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== ВИЗУАЛЬНАЯ КАРТОЧКА РИП ВАН ВИНКЛЬ (ВОПРОС 7) ====================
function HellsingSniperCard() {
  return (
    <div className="relative bg-gradient-to-br from-slate-950 via-purple-950 to-red-950 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl text-center overflow-hidden">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4">
        <Sparkles className="w-3.5 h-3.5" /> Кадр из аниме • Вампирский снайпер
      </div>
      
      {/* Иллюстрация персонажа в стиле Hellsing */}
      <div className="w-full h-56 sm:h-64 rounded-2xl bg-black/80 border border-red-500/30 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
        <div className="text-6xl mb-2 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">🎯 🦇</div>
        <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          «Волшебный стрелок»
        </h4>
        <p className="text-xs text-gray-400 max-w-sm mt-2 leading-relaxed">
          Девушка с длинными черными волосами, круглыми очками, клыкастой улыбкой, в розовой рубашке с галстуком и длинным старинным кремнёвым мушкетом с искрами.
        </p>
        <span className="text-[11px] text-red-400 font-mono mt-3 uppercase tracking-wider">
          Организация «Миллениум» • Старший лейтенант
        </span>
      </div>
      <p className="text-xs text-gray-300 mt-4 italic">
        «Кто эта героиня или из какого она легендарного аниме?»
      </p>
    </div>
  );
}

// ==================== ВИЗУАЛЬНАЯ КАРТОЧКА КОЙОТА СТАРРКА (ВОПРОС 8) ====================
function BleachEspadaCard() {
  return (
    <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl text-center overflow-hidden">
      <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4">
        <Flame className="w-3.5 h-3.5 text-sky-400" /> Кадр из аниме • Блич / Bleach
      </div>
      
      <div className="w-full h-56 sm:h-64 rounded-2xl bg-black/80 border border-sky-500/30 flex flex-col items-center justify-center p-4 relative">
        <span className="text-xs font-black uppercase text-sky-300 tracking-widest mb-1">
          Как зовут персонажа? (полное имя)
        </span>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="text-5xl">⚔️</span>
          <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-sky-400 flex items-center justify-center text-4xl font-black text-sky-300 font-mono shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            1
          </div>
        </div>
        <p className="text-xs text-gray-300 max-w-sm mt-2">
          Брюнет в белом плаще арранкара, прикрывающий лицо рукой с черной татуировкой цифры <strong>«1»</strong> на тыльной стороне ладони.
        </p>
        <span className="text-[10px] text-gray-400 font-mono mt-2">
          Примера Эспада • Аспект смерти: Одиночество
        </span>
      </div>
      <p className="text-xs text-gray-300 mt-4 italic">
        «Назовите его полное имя (Имя и Фамилия)!»
      </p>
    </div>
  );
}

export default function FriendsJokesRoundView({
  user,
  gameState,
  players,
  teamsData,
  restPatch,
  restPut
}: FriendsJokesRoundViewProps) {
  const currentQIdx = gameState?.currentQuestion ?? 0;
  const currentQuestion: Round9Question = ROUND9_QUESTIONS[currentQIdx] || ROUND9_QUESTIONS[0];
  
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [autoGrading, setAutoGrading] = useState<Record<string, boolean>>({});

  // Получаем рейтинг текущего вопроса
  const ratingsMap = gameState?.round9Ratings?.[`q${currentQIdx}`] || {};
  const allRatings: number[] = Object.values(ratingsMap);
  const averageRating = allRatings.length > 0 
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;
  const myRating: number | undefined = user ? ratingsMap[user.id] : undefined;

  // Ответ текущего игрока
  const myStoredAnswer = user ? gameState?.round9Answers?.[`q${currentQIdx}`]?.[user.id] : null;
  const hasUserAnswered = !!myStoredAnswer;

  // Оценка вопроса игроком (1..10)
  const handleRateQuestion = async (score: number) => {
    if (!user) return;
    try {
      await restPut(`gameState/round9Ratings/q${currentQIdx}/${user.id}`, score);
      await restPut(`players/${user.id}/round9Ratings/q${currentQIdx}`, score);
    } catch (e) {
      console.error("Error rating question:", e);
    }
  };

  // Отправка ответа игроком (каждый играет сам за себя!)
  const handleSubmitAnswer = async (customAnswer?: string) => {
    const finalAns = (customAnswer || answerInput).trim();
    if (!finalAns || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        answer: finalAns,
        nickname: user.nickname,
        team: user.team,
        timestamp: Date.now()
      };

      // 1. В общую ветку раунда для ведущего
      await restPut(`gameState/round9Answers/q${currentQIdx}/${user.id}`, payload);

      // 2. В профиль игрока
      await restPut(`players/${user.id}/roundAnswers/9/q${currentQIdx}`, {
        answered: true,
        answer: finalAns,
        pointsAwarded: 0
      });

      setAnswerInput("");
    } catch (e) {
      console.error("Error submitting answer:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Оценка ответа игрока ведущим (+2, +1, 0)
  const handleGradePlayer = async (playerId: string, points: number) => {
    try {
      const scoreKey = `9_q${currentQIdx}`;
      await restPut(`players/${playerId}/scores/${scoreKey}`, points);
      await restPatch(`players/${playerId}/roundAnswers/9/q${currentQIdx}`, {
        checked: true,
        pointsAwarded: points
      });
      await restPatch(`gameState/round9Answers/q${currentQIdx}/${playerId}`, {
        checked: true,
        pointsAwarded: points
      });
    } catch (e) {
      console.error("Error grading player:", e);
    }
  };

  // Переключение вопросов ведущим
  const handleNextQuestion = async () => {
    if (!user?.isAdmin) return;
    const nextQ = currentQIdx + 1;
    if (nextQ < ROUND9_QUESTIONS.length) {
      await restPatch('gameState', {
        currentQuestion: nextQ,
        showAnswer: false
      });
    } else {
      await restPatch('gameState', {
        roundFinished: true,
        showAudienceAward: true
      });
    }
  };

  const handlePrevQuestion = async () => {
    if (!user?.isAdmin) return;
    const prevQ = Math.max(0, currentQIdx - 1);
    await restPatch('gameState', {
      currentQuestion: prevQ,
      showAnswer: false
    });
  };

  // Расчёт Приза зрительских симпатий по всем 10 вопросам
  const calculateAudienceAwards = () => {
    const results = ROUND9_QUESTIONS.map((q, idx) => {
      const qRatings: number[] = Object.values(gameState?.round9Ratings?.[`q${idx}`] || {});
      const avg = qRatings.length > 0
        ? qRatings.reduce((a, b) => a + b, 0) / qRatings.length
        : 0;
      return {
        question: q,
        qIdx: idx,
        average: avg,
        votesCount: qRatings.length
      };
    });

    results.sort((a, b) => b.average - a.average || b.votesCount - a.votesCount);
    return results;
  };

  const rankedQuestions = calculateAudienceAwards();
  const topQuestion = rankedQuestions[0];
  const isAwardOpen = showAwardModal || !!gameState?.showAudienceAward;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* ==================== ВЕРХНЯЯ ПАНЕЛЬ РАУНДА ==================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-pink-950/80 p-6 rounded-[2.5rem] border-2 border-purple-500/40 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 px-3 py-0.5 rounded-full border border-pink-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
              Раунд 9 • Индивидуальный зачёт всех игроков
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Вопросы от друзей (Шуточный раунд)
            </h2>
          </div>
        </div>

        {/* Кнопка открытия Приза зрительских симпатий */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAwardModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer active:scale-95"
            title="Посмотреть приз зрительских симпатий"
          >
            <Medal className="w-4 h-4 fill-black" />
            <span>Приз симпатий 🎖️</span>
          </button>
        </div>
      </div>

      {/* ==================== РОСТЕР 10 ВОПРОСОВ (ИНДИКАТОР ШАГОВ) ==================== */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 px-1">
        {ROUND9_QUESTIONS.map((q, idx) => {
          const isCurrent = currentQIdx === idx;
          const qR: number[] = Object.values(gameState?.round9Ratings?.[`q${idx}`] || {});
          const avg = qR.length > 0 ? (qR.reduce((a, b) => a + b, 0) / qR.length).toFixed(1) : null;

          return (
            <button
              key={q.id}
              onClick={() => {
                if (user?.isAdmin) {
                  restPatch('gameState', { currentQuestion: idx, showAnswer: false });
                }
              }}
              disabled={!user?.isAdmin}
              className={`flex-1 min-w-[55px] p-2 rounded-2xl border text-center transition-all ${
                isCurrent
                  ? 'bg-gradient-to-b from-purple-600 to-pink-600 border-pink-400 text-white shadow-lg shadow-pink-500/30 scale-105'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:border-purple-500/40'
              } ${user?.isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-[10px] font-mono block opacity-70">#{idx + 1}</span>
              <span className="text-xs font-black block">В{idx + 1}</span>
              {avg && (
                <span className="text-[9px] font-bold text-amber-300 block font-mono">
                  ⭐{avg}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== КАРТОЧКА ТЕКУЩЕГО ВОПРОСА ==================== */}
      <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Заголовок вопроса */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider">
              {currentQuestion.title}
            </span>
            <span className="text-xs text-gray-400">
              Тайтл: <span className="text-gray-200 font-bold">{currentQuestion.sourceAnime}</span>
            </span>
          </div>

          {/* Текущий средний рейтинг вопроса */}
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-gray-300">Оценка игроков:</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {averageRating ? `${averageRating} / 10` : "пока нет"}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              ({allRatings.length} {allRatings.length === 1 ? "голос" : "голосов"})
            </span>
          </div>
        </div>

        {/* Текст вопроса */}
        <div className="text-center py-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug max-w-3xl mx-auto">
            {currentQuestion.text}
          </h3>
        </div>

        {/* Визуальные материалы по картинкам (вопросы 2, 7, 8) */}
        {currentQuestion.imageType === "indra_riddle" && <IndraRiddleCard />}
        {currentQuestion.imageType === "hellsing_sniper" && <HellsingSniperCard />}
        {currentQuestion.imageType === "bleach_espada" && <BleachEspadaCard />}

        {/* Варианты ответов для Вопроса 5 (ДжоДжо Столпы) */}
        {currentQuestion.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-2">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = myStoredAnswer?.answer === opt;
              return (
                <button
                  key={i}
                  onClick={() => handleSubmitAnswer(opt)}
                  disabled={hasUserAnswered}
                  className={`p-4 rounded-2xl text-left font-bold text-sm sm:text-base border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-102'
                      : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-purple-500/40 cursor-pointer'
                  } ${hasUserAnswered ? 'opacity-80' : ''}`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ==================== БЛОК ОЦЕНКИ ВОПРОСА (1 .. 10 ЗВЁЗД) ==================== */}
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-pink-950/40 border border-amber-500/30 rounded-3xl p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Оцените этот вопрос от друзей (от 1 до 10):</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
              const isRated = myRating === num;
              return (
                <button
                  key={num}
                  onClick={() => handleRateQuestion(num)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all border flex items-center justify-center cursor-pointer active:scale-95 ${
                    isRated
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-black border-amber-300 shadow-lg shadow-amber-500/40 scale-110'
                      : 'bg-white/5 hover:bg-white/15 text-gray-300 border-white/10 hover:border-amber-400/40 hover:text-white'
                  }`}
                  title={`Поставить оценку ${num} из 10`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-gray-400">
            {myRating ? (
              <span className="text-amber-300 font-bold">
                ⭐ Ваша оценка: {myRating} из 10 (можно изменить в любой момент)
              </span>
            ) : (
              <span>Нажмите на цифру, чтобы проголосовать за лучший вопрос викторины!</span>
            )}
          </div>
        </div>

        {/* ==================== ИНДИВИДУАЛЬНЫЙ ВВОД ОТВЕТА ИГРОКА ==================== */}
        {!user?.isAdmin && !currentQuestion.options && (
          <div className="p-6 bg-purple-950/40 border border-purple-500/30 rounded-3xl space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Твой личный ответ:
              </span>
              {hasUserAnswered && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ответ принят
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitAnswer();
                }}
                disabled={hasUserAnswered}
                placeholder={hasUserAnswered ? `Вы ответили: ${myStoredAnswer?.answer}` : "Напишите ответ..."}
                className="flex-1 bg-black/60 border border-purple-500/40 focus:border-purple-400 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all disabled:opacity-70"
              />
              <button
                onClick={() => handleSubmitAnswer()}
                disabled={hasUserAnswered || !answerInput.trim() || isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-black text-xs uppercase px-5 py-3 rounded-2xl cursor-pointer transition-all shadow-lg active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Отправить</span>
              </button>
            </div>

            {hasUserAnswered && (
              <p className="text-xs text-center text-gray-400">
                Ваш ответ: <strong className="text-white">«{myStoredAnswer?.answer}»</strong> • Баллы начислит ведущий после проверки.
              </p>
            )}
          </div>
        )}

        {/* ==================== ПРАВИЛЬНЫЙ ОТВЕТ (ДЛЯ ВЕДУЩЕГО ИЛИ ПРИ ПОКАЗЕ) ==================== */}
        {(user?.isAdmin || gameState?.showAnswer) && (
          <div className="p-5 bg-emerald-950/70 border-2 border-emerald-500/50 rounded-3xl text-center space-y-2">
            <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Правильный ответ:
            </span>
            <p className="text-xl font-black text-white">{currentQuestion.correctAnswer}</p>
            <p className="text-xs text-emerald-300/80 max-w-lg mx-auto">{currentQuestion.hint}</p>
          </div>
        )}

        {/* ==================== УПРАВЛЕНИЕ ВЕДУЩЕГО (ОТВЕТЫ ИГРОКОВ И ПЕРЕКЛЮЧЕНИЕ) ==================== */}
        {user?.isAdmin && (
          <div className="pt-6 border-t border-white/10 space-y-6">
            {/* Панель переключения вопросов ведущим */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQIdx === 0}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-lg transition-all"
                >
                  <span>{currentQIdx < ROUND9_QUESTIONS.length - 1 ? "Следующий вопрос" : "Завершить раунд"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => restPatch('gameState', { showAnswer: !gameState?.showAnswer })}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all border ${
                    gameState?.showAnswer 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                  }`}
                >
                  {gameState?.showAnswer ? "Скрыть ответ" : "Показать ответ всем"}
                </button>
                <button
                  onClick={async () => {
                    const newVal = !gameState?.showAudienceAward;
                    await restPatch('gameState', { showAudienceAward: newVal });
                    setShowAwardModal(newVal);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Medal className="w-4 h-4 fill-black" />
                  <span>{gameState?.showAudienceAward ? "Скрыть приз симпатий" : "Показать приз всем"}</span>
                </button>
              </div>
            </div>

            {/* Ответы игроков на этот вопрос для быстрой оценки */}
            <div className="bg-black/50 p-5 rounded-3xl border border-white/10 space-y-3">
              <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Ответы участников на вопрос №{currentQIdx + 1}:
              </h4>

              {(() => {
                const answersMap = gameState?.round9Answers?.[`q${currentQIdx}`] || {};
                const playerIds = Object.keys(answersMap);

                if (playerIds.length === 0) {
                  return (
                    <p className="text-xs text-gray-500 italic py-2">
                      Пока никто из игроков не отправил ответ на этот вопрос...
                    </p>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {playerIds.map((pId) => {
                      const pAns = answersMap[pId];
                      const pObj = players[pId];
                      const currentPts = pObj?.scores?.[`9_q${currentQIdx}`] ?? pAns?.pointsAwarded ?? 0;
                      const isAutoCorrect = currentQuestion.acceptableAnswers.some(
                        (a) => pAns.answer?.toLowerCase().includes(a.toLowerCase())
                      );

                      return (
                        <div
                          key={pId}
                          className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white truncate">
                                {pAns.nickname || pObj?.nickname || "Игрок"}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                (К#{Number(pAns.team || 0) + 1})
                              </span>
                              {isAutoCorrect && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                                  похоже на верный
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-200 mt-1 break-words">
                              «{pAns.answer}»
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleGradePlayer(pId, 2)}
                              className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                currentPts === 2 
                                  ? 'bg-emerald-500 text-black border-emerald-300' 
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-800/40'
                              }`}
                              title="+2 балла (верно)"
                            >
                              +2
                            </button>
                            <button
                              onClick={() => handleGradePlayer(pId, 1)}
                              className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                currentPts === 1 
                                  ? 'bg-amber-500 text-black border-amber-300' 
                                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-800/40'
                              }`}
                              title="+1 балл (частично)"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleGradePlayer(pId, 0)}
                              className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                currentPts === 0 
                                  ? 'bg-red-500 text-white border-red-300' 
                                  : 'bg-red-950/40 text-red-300 border-red-500/30 hover:bg-red-800/40'
                              }`}
                              title="0 баллов (неверно)"
                            >
                              0
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ==================== МОДАЛЬНОЕ ОКНО: ПРИЗ ЗРИТЕЛЬСКИХ СИМПАТИЙ ==================== */}
      <AnimatePresence>
        {isAwardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 border-2 border-amber-500/60 rounded-[3rem] p-6 sm:p-10 max-w-2xl w-full shadow-2xl space-y-6 text-center max-h-[90vh] overflow-y-auto"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
                <Medal className="w-10 h-10 text-black fill-black" />
              </div>

              <div>
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest bg-amber-500/20 border border-amber-500/30 px-3.5 py-1 rounded-full">
                  Голосование игроков
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-2">
                  Приз зрительских симпатий!
                </h3>
                <p className="text-xs text-gray-300 mt-1 max-w-md mx-auto">
                  Самый высокооценённый и полюбившийся вопрос 9 раунда по мнению всех игроков!
                </p>
              </div>

              {/* Топ-1 победитель */}
              {topQuestion && topQuestion.average > 0 ? (
                <div className="p-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm uppercase">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span>1 МЕСТО • ПОБЕДИТЕЛЬ ГОЛОСОВАНИЯ</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {topQuestion.question.text}
                  </h4>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      ⭐ {topQuestion.average.toFixed(1)} / 10
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      ({topQuestion.votesCount} {topQuestion.votesCount === 1 ? "голос" : "голосов"})
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 italic">
                    Ответ: <strong className="text-white">{topQuestion.question.correctAnswer}</strong>
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-gray-400 text-sm">
                  Игроки ещё не успели оценить вопросы (или оценки пока не выставлены). Выставляйте оценки от 1 до 10 на карточках вопросов!
                </div>
              )}

              {/* Рейтинг всех 10 вопросов */}
              <div className="space-y-3 text-left pt-2">
                <h4 className="text-xs font-black text-gray-300 uppercase tracking-wider text-center">
                  Полный рейтинг всех 10 вопросов:
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {rankedQuestions.map((item, idx) => (
                    <div
                      key={item.question.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                        idx === 0
                          ? 'bg-amber-500/20 border-amber-400/50 text-white'
                          : idx === 1
                          ? 'bg-slate-700/30 border-slate-400/40 text-gray-200'
                          : idx === 2
                          ? 'bg-amber-900/30 border-amber-700/40 text-gray-200'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm font-black w-6 text-center shrink-0">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <div className="min-w-0 truncate">
                          <span className="text-xs font-bold block truncate">
                            В{item.question.id}: {item.question.text}
                          </span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {item.question.sourceAnime}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-300 font-mono shrink-0">
                        ⭐ {item.average > 0 ? item.average.toFixed(1) : "—"} ({item.votesCount})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопка трансляции и закрытия */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {user?.isAdmin && (
                  <button
                    onClick={async () => {
                      const newBroadcast = !gameState?.showAudienceAward;
                      await restPatch('gameState', { showAudienceAward: newBroadcast });
                    }}
                    className={`font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 border ${
                      gameState?.showAudienceAward
                        ? 'bg-pink-600 border-pink-400 text-white shadow-pink-600/40 animate-pulse'
                        : 'bg-amber-500 hover:bg-amber-400 text-black border-amber-400 shadow-amber-950/40'
                    }`}
                  >
                    {gameState?.showAudienceAward ? '📢 Закрыть у всех игроков' : '📢 Показать всем игрокам на экран'}
                  </button>
                )}
                <button
                  onClick={async () => {
                    setShowAwardModal(false);
                    if (user?.isAdmin && gameState?.showAudienceAward) {
                      await restPatch('gameState', { showAudienceAward: false });
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
