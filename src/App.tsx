/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Volume1, Volume, Bell, Crown, Settings, Play, Pause, SkipForward, Trash2, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

// ==================== КОНФИГ FIREBASE ====================
const DB_URL = "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app";

const restGet = async (p: string) => { 
  const r = await fetch(`${DB_URL}/${p}.json`); 
  if (!r.ok) throw new Error(`GET ${p} ${r.status}`); 
  return r.json(); 
};

const restPut = async (p: string, d: any) => { 
  const r = await fetch(`${DB_URL}/${p}.json`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(d) 
  }); 
  if (!r.ok) throw new Error(`PUT ${p} ${r.status}`); 
  return r.json(); 
};

const restPatch = async (p: string, d: any) => { 
  const r = await fetch(`${DB_URL}/${p}.json`, { 
    method: 'PATCH', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(d) 
  }); 
  if (!r.ok) throw new Error(`PATCH ${p} ${r.status}`); 
  return r.json(); 
};

const restDelete = async (p: string) => { 
  const r = await fetch(`${DB_URL}/${p}.json`, { method: 'DELETE' }); 
  if (!r.ok) throw new Error(`DELETE ${p} ${r.status}`); 
  return r.json(); 
};

interface Question {
  text?: string;
  options?: string[];
  correct?: number;
  points?: number;
  images?: string[];
  correctAnswer?: string;
  video?: string;
  character?: string;
  anime?: string;
  description?: string;
  image?: string;
}

interface Round {
  type: string;
  name: string;
  questions: Question[];
  pauseDuration?: number;
  answerTime?: number;
}

// ==================== ДАННЫЕ ИГРЫ ====================
const roundsData: Round[] = [
  { 
    type: "image_sequence", 
    name: "Раунд 1: Угадай аниме по картинке", 
    questions: [
      { images: ["images/image1.png", "images/image2.png", "images/image3.png", "images/image4.png"], correctAnswer: "Реинкарнация безработного" },
      { images: ["images/image1маг.png", "images/image2маг.png", "images/image3маг.png", "images/image4маг.png"], correctAnswer: "Магическая битва " },
      { images: ["images/image1невест.png", "images/image2невест.png", "images/image3невест.png", "images/image4невест.png"], correctAnswer: "Пять невест" },
      { images: ["images/images1джо.jpg", "images/images2джо.jpg", "images/images3джо.jpg", "images/images4джо.jpg"], correctAnswer: "ДжоДжо" },
      { images: ["images/image1angel.png", "images/image2angel.png", "images/image3angel.png", "images/image4angel.png"], correctAnswer: "Ангел по соседству меня балует" },
      { images: ["images/image1грех.png", "images/image2грех.png", "images/image3грех.png", "images/image4грех.png"], correctAnswer: "Семь смертных грехов" },
      { images: ["images/image1лейм.png", "images/image2лейм.png", "images/image3лейм.png", "images/image4лейм.png"], correctAnswer: "Эксперименты Лэйн" },
      { images: ["images/image1ток.png", "images/image2ток.png", "images/image3ток.png", "images/image4ток.png"], correctAnswer: "Токийский гуль" },
      { images: ["images/image1цвет.png", "images/image2цвет.png", "images/image3цвет.png", "images/image4цвет.png"], correctAnswer: "Благоухающий цветок расцветает с достоинством" },
      { images: ["images/image1тит.png", "images/image2тит.png", "images/image3тит.png", "images/image4тит.png"], correctAnswer: "Атака титанов" }
    ] 
  },
  { 
    type: "quiz", 
    name: "Раунд 2: Общие знания", 
    questions: Array.from({length:10},(_,i)=>({ 
      text:`Вопрос ${i+1}: Назовите аниме, где главного героя зовут Гоку?`, 
      options:["Наруто","Драгон Болл","Ван Пис","Блич"], 
      correct:1, 
      points:2 
    }))
  },
  { 
    type: "video", 
    name: "Раунд 3: Угадай аниме по отрывку опенинга", 
    questions: [
      { video: "anime3vid/bleach1.mp4", correctAnswer: "Блич" },
      { video: "anime3vid/moidevushka2.mp4", correctAnswer: "Моя девушка не только милая" },
      { video: "anime3vid/devushkitank3.mp4", correctAnswer: "Девушки и танки" },
      { video: "anime3vid/voshoshdenievteni4.mp4", correctAnswer: "Восхождение в тени" },
      { video: "anime3vid/feriteil5.mp4", correctAnswer: "Фейри Тейл" },
      { video: "anime3vid/mbvstrichy6.mp4", correctAnswer: "Межвидовые рецензенты" },
      { video: "anime3vid/angelofdeth7.mp4", correctAnswer: "Ангел кровопролития" },
      { video: "anime3vid/stranachudes8.mp4", correctAnswer: "Страна чудес смертников" },
      { video: "anime3vid/monolog9.mp4", correctAnswer: "Монолог фармацевта" },
      { video: "anime3vid/patriotism10.mp4", correctAnswer: "Патриотизм Мориарти" }
    ],
    pauseDuration: 10
  },
  {
    type: "character_guess",
    name: "Раунд 4: Угадай персонажа по описанию и ИИ-картинке",
    answerTime: 25,
    pauseDuration: 10,
    questions: [
      { character: "Тинацу Кан", anime: "Голубая шкатулка", description: "Талантливая баскетболистка, старшеклассница, в которую влюблен главный герой.", image: "images/round4/1.png" },
      { character: "Кейна Кагами", anime: "Мир Лидейл", description: "Девушка, очнувшаяся в мире своей любимой VRMMO через 200 лет после того, как перестала играть.", image: "images/round4/2.png" },
      { character: "Pochita", anime: "Человек-бензопила", description: "Маленький оранжевый демон-собака с бензопилой на голове.", image: "images/round4/3.png" },
      { character: "Принцесса рёвозавров (Код 001)", anime: "DARLING in the FRANXX", description: "Последняя из своего рода, управляет рёвозаврами и имеет синюю кожу.", image: "images/round4/4.png" },
      { character: "Нао Томори", anime: "Шарлотта", description: "Президент школьного совета, способна становиться невидимой для одного человека.", image: "images/round4/5.png" },
      { character: "Виллибальд", anime: "Сага о Винланде", description: "Молодой священник, который ищет истинное значение любви в мире викингов.", image: "images/round4/6.png" },
      { character: "Лорд Демонов Диабло", anime: "О моем перерождении в слизь", description: "Один из Первородных демонов, фанатично преданный Римуру Темпесту.", image: "images/round4/7.png" },
      { character: "Сатоко Ходжо", anime: "Когда плачут цикады", description: "Девочка, любящая ставить ловушки, чья судьба трагически переплетена с циклом смертей в деревне.", image: "images/round4/8.png" },
      { character: "Рика Кава", anime: "Приоритет чудо-яйца", description: "Бывшая модель, которая присоединяется к группе девочек, сражающихся в мире снов.", image: "images/round4/9.png" },
      { character: "Анри Сонохара", anime: "Дюрарара", description: "Тихая девушка в очках, которая является носителем проклятого меча Сайка.", image: "images/round4/10.png" },
      { character: "Naoyuki Andō", anime: "Инуяшики", description: "Лучший друг главного героя, который помогает ему освоиться с новым механическим телом.", image: "images/round4/11.png" },
      { character: "Нидзика Идзити", anime: "Одинокий рокер", description: "Энергичная барабанщица группы Kessoku Band, которая пригласила Хитори в группу.", image: "images/round4/12.png" },
      { character: "Кохаку Итимура", anime: "Прекрасная вечерняя луна", description: "Девушка, которую часто принимают за парня из-за её внешности и манер.", image: "images/round4/13.png" },
      { character: "Канамэ Судо", anime: "Игра Дарвина", description: "Игрок, втянутый в смертельную игру через мобильное приложение.", image: "images/round4/14.png" },
      { character: "Асакадзэ", anime: "Sonny Boy", description: "Парень, обладающий способностью управлять гравитацией в странном пустом мире.", image: "images/round4/15.png" },
      { character: "Сион Караномори", anime: "Психопаспорт", description: "Аналитик Бюро Общественной Безопасности, 'латентный преступник'.", image: "images/round4/16.png" },
      { character: "Амамия", anime: "Рон Камонохаси: Невменяемый детектив", description: "Полицейский, который становится напарником гениального, но странного детектива.", image: "images/round4/17.png" },
      { character: "Сюити Кагая", anime: "Глейпнир", description: "Парень, способный превращаться в огромный костюм собаки с молнией на спине.", image: "images/round4/18.png" },
      { character: "Рин Окумура", anime: "Синий экзорцист", description: "Сын Сатаны, который решил стать экзорцистом, чтобы победить своего отца.", image: "images/round4/19.png" },
      { character: "Крул Цепеш", anime: "Последний серафим", description: "Королева вампиров Японии, третья среди Основателей.", image: "images/round4/20.png" }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [pauseState, setPauseState] = useState<any>(null);
  const [reviewState, setReviewState] = useState<any>(null);
  const [globalPause, setGlobalPauseState] = useState<any>(null);
  const [players, setPlayers] = useState<any>({});
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [hasAnswered, setHasAnswered] = useState(false);
  const [preloaderStatus, setPreloaderStatus] = useState("");

  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ==================== SESSION RESTORE ====================
  useEffect(() => {
    const saved = localStorage.getItem('quizUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
      } catch (e) {
        localStorage.removeItem('quizUser');
      }
    }
    preloadAssets();
  }, []);

  // ==================== POLLING ====================
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [state, pause, review, gPause, allPlayers] = await Promise.all([
          restGet('gameState'),
          restGet('gameState/pause'),
          restGet('gameState/answersReview'),
          restGet('gameState/globalPause'),
          restGet('players')
        ]);

        setGameState(state);
        setPauseState(pause);
        setReviewState(review);
        setGlobalPauseState(gPause);
        setPlayers(allPlayers || {});

        if (state?.reset && !user?.isAdmin) {
          localStorage.removeItem('quizUser');
          window.location.reload();
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // ==================== TIMER LOGIC ====================
  useEffect(() => {
    if (!gameState?.active || !user) return;

    const round = roundsData[gameState.currentRound];
    if (!round) return;

    if (gameState.roundFinished) {
      setTimeLeft(0);
      return;
    }

    // Handle Round 4 specifically
    if (round.type === "character_guess") {
      const qIdx = gameState.currentQuestion;
      const q = round.questions[qIdx];
      if (!q) return;

      // Check if user already answered this question
      const checkAnswered = async () => {
        if (user.isAdmin) return;
        const ans = await restGet(`players/${user.id}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
        if (ans?.answered) {
          setHasAnswered(true);
          setAnswerText(ans.answer || "");
        } else {
          setHasAnswered(false);
          setAnswerText("");
        }
      };
      checkAnswered();

      let time = gameState.timeLeft || round.answerTime || 25;
      setTimeLeft(time);

      if (user.isAdmin && !globalPause?.active && !pauseState?.active) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(async () => {
          time--;
          if (time <= 0) {
            clearInterval(timerRef.current);
            startPauseBetweenQuestions();
          } else {
            setTimeLeft(time);
            await restPatch('gameState', { timeLeft: time });
          }
        }, 1000);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.currentQuestion, gameState?.currentRound, gameState?.active, globalPause?.active, pauseState?.active]);

  // ==================== HELPERS ====================
  const preloadAssets = () => {
    setPreloaderStatus("🚀 Загрузка ресурсов...");
    // Simple preloader logic
    setTimeout(() => setPreloaderStatus("✅ Ресурсы готовы"), 2000);
  };

  const handleJoin = async () => {
    if (!nickname) { setError("Введите никнейм"); return; }
    const id = `${nickname}_${Date.now()}`;
    const newUser = { nickname, team: selectedTeam, isAdmin: false, id };
    await restPut(`players/${id}`, { nickname, team: selectedTeam, score: 0, isAdmin: false });
    setUser(newUser);
    localStorage.setItem('quizUser', JSON.stringify(newUser));
  };

  const handleAdminLogin = async () => {
    const pwd = prompt("Пароль администратора:");
    if (pwd === "admin123") {
      const id = `admin_${Date.now()}`;
      const newUser = { nickname: "Админ", team: -1, isAdmin: true, id };
      setUser(newUser);
      localStorage.setItem('quizUser', JSON.stringify(newUser));
    } else {
      alert("Неверный пароль");
    }
  };

  const startRound = async (idx: number) => {
    await restPut('gameState', {
      active: true,
      currentRound: idx,
      currentQuestion: 0,
      roundFinished: false,
      timeLeft: roundsData[idx].answerTime || 25,
      showAnswer: false
    });
  };

  const startPauseBetweenQuestions = async () => {
    const round = roundsData[gameState.currentRound];
    const duration = round.pauseDuration || 10;
    const endTime = Date.now() + duration * 1000;
    await restPut('gameState/pause', { active: true, endTime, skip: false });
    await restPatch('gameState', { showAnswer: false }); // Reset showAnswer for next question

    const checkPause = setInterval(async () => {
      const p = await restGet('gameState/pause');
      if (!p || p.skip || Date.now() >= p.endTime) {
        clearInterval(checkPause);
        await restDelete('gameState/pause');
        const nextQ = gameState.currentQuestion + 1;
        if (nextQ < round.questions.length) {
          await restPatch('gameState', { currentQuestion: nextQ, timeLeft: round.answerTime || 25 });
        } else {
          await restPatch('gameState', { active: false, roundFinished: true });
        }
      }
    }, 1000);
  };

  const submitAnswer = async () => {
    if (hasAnswered || !answerText.trim()) return;
    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    await restPut(path, { answered: true, answer: answerText, timestamp: Date.now() });
    setHasAnswered(true);
  };

  const toggleShowAnswer = async () => {
    await restPatch('gameState', { showAnswer: !gameState.showAnswer });
  };

  const markAnswer = async (playerId: string, qIdx: string, points: number) => {
    const p = players[playerId];
    if (p) {
      await restPatch(`players/${playerId}`, { score: (p.score || 0) + points });
      await restPut(`players/${playerId}/checkedAnswers/${gameState.currentRound}/${qIdx}`, { checked: true });
      await restDelete(`players/${playerId}/roundAnswers/${gameState.currentRound}/${qIdx}`);
    }
  };

  // ==================== RENDER ====================
  if (!user) {
    return (
      <div className="container">
        <h1 className="text-3xl font-bold mb-6">🎌 Аниме Викторина</h1>
        <div className="bg-black/40 p-8 rounded-3xl backdrop-blur-md">
          <h2 className="text-xl mb-4">Вход в игру</h2>
          <input 
            type="text" 
            className="nickname-input mb-4" 
            placeholder="Твой никнейм" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <div className="team-buttons mb-6">
            {[0, 1, 2, 3].map(t => (
              <button 
                key={t}
                className={`team-btn ${selectedTeam === t ? 'selected' : ''}`}
                onClick={() => setSelectedTeam(t)}
              >
                Команда {t + 1}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={handleJoin} className="bg-red-500 hover:bg-red-600 px-8 py-3 rounded-full font-bold">Присоединиться</button>
            <button onClick={handleAdminLogin} className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-full font-bold">Админ</button>
          </div>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-black/30 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{user.nickname}</span>
          {user.isAdmin && <Crown className="text-yellow-400 w-5 h-5" />}
          {!user.isAdmin && <span className="bg-blue-500 px-2 py-0.5 rounded-full text-xs">Команда {user.team + 1}</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-[500px]">
        {(() => {
          const round = gameState?.active ? roundsData[gameState.currentRound] : null;

          if (reviewState?.active) {
            return (
              <div className="bg-black/50 p-8 rounded-3xl">
                <h2 className="text-2xl font-bold mb-4">Разбор ответов: {roundsData[reviewState.roundIndex].name}</h2>
                {/* Review content would go here */}
                <p className="text-xl">Слайд {reviewState.currentSlide + 1} из {reviewState.totalSlides}</p>
              </div>
            );
          }

          if (pauseState?.active) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl font-bold text-yellow-500 mb-4 animate-pulse">⏸️ ПАУЗА</div>
                <div className="text-4xl font-mono bg-black/40 px-8 py-4 rounded-2xl">
                  {Math.max(0, Math.ceil((pauseState.endTime - Date.now()) / 1000))}
                </div>
                <p className="mt-6 text-xl text-gray-300">Готовьтесь к следующему вопросу!</p>
                {user.isAdmin && (
                  <button 
                    onClick={() => restPatch('gameState/pause', { skip: true })}
                    className="mt-8 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-2"
                  >
                    <SkipForward className="w-5 h-5" /> Пропустить
                  </button>
                )}
              </div>
            );
          }

          if (gameState?.active && round) {
            return (
              <div className="bg-black/40 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-red-400">{round.name}</h2>
                  <div className="text-3xl font-mono text-yellow-500 bg-black/50 px-4 py-2 rounded-xl">
                    {timeLeft}s
                  </div>
                </div>

                {/* Round 4 Content */}
                {round.type === "character_guess" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="relative group">
                        <img 
                          src={round.questions[gameState.currentQuestion].image} 
                          alt="Character" 
                          className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/10"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/anime${gameState.currentQuestion}/800/600`; }}
                        />
                        <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-sm">Вопрос {gameState.currentQuestion + 1}</div>
                      </div>
                      <div className="space-y-4">
                        <div className="char-description">
                          <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">Описание персонажа:</p>
                          <p className="text-lg leading-relaxed italic">
                            "{round.questions[gameState.currentQuestion].description}"
                          </p>
                        </div>
                        
                        {!user.isAdmin && (
                          <div className="space-y-4">
                            <input 
                              type="text"
                              className="answer-input w-full"
                              placeholder="Имя персонажа..."
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              disabled={hasAnswered}
                            />
                            <button 
                              onClick={submitAnswer}
                              disabled={hasAnswered}
                              className={`w-full py-4 rounded-full font-bold text-lg transition-all ${hasAnswered ? 'bg-green-600 cursor-default' : 'bg-red-500 hover:bg-red-600 active:scale-95'}`}
                            >
                              {hasAnswered ? 'ОТВЕТ ПРИНЯТ ✅' : 'ОТПРАВИТЬ ОТВЕТ'}
                            </button>
                          </div>
                        )}

                        {gameState.showAnswer && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="answer-info"
                          >
                            <h3 className="text-2xl font-bold text-green-400 mb-2">
                              {round.questions[gameState.currentQuestion].character}
                            </h3>
                            <p className="text-gray-300">Аниме: <span className="text-white font-semibold">{round.questions[gameState.currentQuestion].anime}</span></p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other round types would go here */}
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center justify-center py-20 space-y-8">
              <div className="text-center">
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold">Ожидание начала раунда</h2>
                <p className="text-gray-400 mt-2">{preloaderStatus}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                {[0, 1, 2, 3].map(t => {
                  const teamPlayers = Object.values(players).filter((p: any) => p.team === t).map((p: any) => p.nickname);
                  const score = Object.values(players).filter((p: any) => p.team === t).reduce((acc: number, p: any) => acc + (p.score || 0), 0);
                  return (
                    <div key={t} className="bg-black/40 p-4 rounded-2xl border-t-4 border-blue-500">
                      <div className="text-sm text-gray-400 mb-1">Команда {t + 1}</div>
                      <div className="text-xl font-bold text-green-400">{score}</div>
                      <div className="mt-2 text-xs text-gray-500 truncate">{teamPlayers.join(', ') || 'пусто'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </main>

      {/* Admin Panel */}
      {user.isAdmin && (
        <div className="mt-12 pt-8 border-t-2 border-red-500/30">
          <div className="flex items-center gap-2 mb-6 text-red-400">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-bold uppercase tracking-widest">Панель Управления</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-black/40 p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Play className="w-4 h-4" /> Запуск раундов</h3>
              <div className="space-y-3">
                {roundsData.map((r, i) => (
                  <button 
                    key={i}
                    onClick={() => startRound(i)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl flex justify-between items-center group"
                  >
                    <span>{i + 1}. {r.name}</span>
                    <SkipForward className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/40 p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> Управление текущим вопросом</h3>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={toggleShowAnswer}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${gameState?.showAnswer ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {gameState?.showAnswer ? 'СКРЫТЬ ОТВЕТ' : 'ПОКАЗАТЬ ОТВЕТ'}
                </button>
                <button 
                  onClick={async () => {
                    const active = !globalPause?.active;
                    await restPut('gameState/globalPause', { active });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-full font-bold flex items-center gap-2"
                >
                  {globalPause?.active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {globalPause?.active ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА'}
                </button>
                <button 
                  onClick={async () => {
                    if (confirm("Сбросить игру?")) {
                      await restPut('gameState', { reset: true });
                      localStorage.removeItem('quizUser');
                      window.location.reload();
                    }
                  }}
                  className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-full font-bold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> СБРОС
                </button>
              </div>

              {/* Answers Table */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase">Ответы игроков (Раунд {gameState?.currentRound + 1}):</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {Object.entries(players).map(([id, p]: [string, any]) => {
                    const ans = p.roundAnswers?.[gameState?.currentRound]?.[`q${gameState?.currentQuestion}`];
                    if (!ans) return null;
                    return (
                      <div key={id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold">{p.nickname}</span>
                          <span className="text-xs text-gray-500 ml-2">К{p.team + 1}</span>
                          <p className="text-sm text-blue-300">{ans.answer}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => markAnswer(id, `q${gameState.currentQuestion}`, 2)} className="text-green-500 hover:scale-110"><CheckCircle2 /></button>
                          <button onClick={() => markAnswer(id, `q${gameState.currentQuestion}`, -1)} className="text-red-500 hover:scale-110"><XCircle /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
