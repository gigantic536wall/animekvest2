/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Volume1, Volume, Bell, Crown, Settings, Play, Pause, SkipForward, Trash2, RotateCcw, CheckCircle2, XCircle, Users, Eye } from 'lucide-react';

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
    answerTime: 36, // 8+8+8+12
    questions: [
      { images: ["foto1/image1.png", "foto1/image2.png", "foto1/image3.png", "foto1/image4.png"], correctAnswer: "Реинкарнация безработного" },
      { images: ["foto1/image1маг.png", "foto1/image2маг.png", "foto1/image3маг.png", "foto1/image4маг.png"], correctAnswer: "Магическая битва " },
      { images: ["foto1/image1невест.png", "foto1/image2невест.png", "foto1/image3невест.png", "foto1/image4невест.png"], correctAnswer: "Пять невест" },
      { images: ["foto1/images1джо.jpg", "foto1/images2джо.jpg", "foto1/images3джо.jpg", "foto1/images4джо.jpg"], correctAnswer: "ДжоДжо" },
      { images: ["foto1/image1angel.png", "foto1/image2angel.png", "foto1/image3angel.png", "foto1/image4angel.png"], correctAnswer: "Ангел по соседству меня балует" },
      { images: ["foto1/image1грех.png", "foto1/image2грех.png", "foto1/image3грех.png", "foto1/image4грех.png"], correctAnswer: "Семь смертных грехов" },
      { images: ["foto1/image1лейм.png", "foto1/image2лейм.png", "foto1/image3лейм.png", "foto1/image4лейм.png"], correctAnswer: "Эксперименты Лэйн" },
      { images: ["foto1/image1ток.png", "foto1/image2ток.png", "foto1/image3ток.png", "foto1/image4ток.png"], correctAnswer: "Токийский гуль" },
      { images: ["foto1/image1цвет.png", "foto1/image2цвет.png", "foto1/image3цвет.png", "foto1/image4цвет.png"], correctAnswer: "Благоухающий цветок расцветает с достоинством" },
      { images: ["foto1/image1тит.png", "foto1/image2тит.png", "foto1/image3тит.png", "foto1/image4тит.png"], correctAnswer: "Атака титанов" }
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
      { video: "video3/bleach1.mp4", correctAnswer: "Блич" },
      { video: "video3/moidevushka2.mp4", correctAnswer: "Моя девушка не только милая" },
      { video: "video3/devushkitank3.mp4", correctAnswer: "Девушки и танки" },
      { video: "video3/voshoshdenievteni4.mp4", correctAnswer: "Восхождение в тени" },
      { video: "video3/feriteil5.mp4", correctAnswer: "Фейри Тейл" },
      { video: "video3/mbvstrichy6.mp4", correctAnswer: "Межвидовые рецензенты" },
      { video: "video3/angelofdeth7.mp4", correctAnswer: "Ангел кровопролития" },
      { video: "video3/stranachudes8.mp4", correctAnswer: "Страна чудес смертников" },
      { video: "video3/monolog9.mp4", correctAnswer: "Монолог фармацевта" },
      { video: "video3/patriotism10.mp4", correctAnswer: "Патриотизм Мориарти" }
    ],
    pauseDuration: 10
  },
  {
    type: "character_guess",
    name: "Раунд 4: Угадай персонажа по описанию и ИИ-картинке",
    answerTime: 25,
    pauseDuration: 10,
    questions: [
      { character: "Тинацу Кан", anime: "Голубая шкатулка", description: "Талантливая баскетболистка, старшеклассница, в которую влюблен главный герой.", image: "foto4/шкатул.png" },
      { character: "Кейна Кагами", anime: "Мир Лидейл", description: "Девушка, очнувшаяся в мире своей любимой VRMMO через 200 лет после того, как перестала играть.", image: "foto4/Магическаябашнявлесу.png" },
      { character: "Pochita", anime: "Человек-бензопила", description: "Маленький оранжевый демон-собака с бензопилой на голове.", image: "foto4/Кроваваяпилавтемномпереулке.png" },
      { character: "Принцесса рёвозавров (Код 001)", anime: "DARLING in the FRANXX", description: "Последняя из своего рода, управляет рёвозаврами и имеет синюю кожу.", image: "foto4/милыйвофранксе.jpg" },
      { character: "Нао Томори", anime: "Шарлотта", description: "Президент школьного совета, способна становиться невидимой для одного человека.", image: "foto4/sharlotta.jpg" },
      { character: "Виллибальд", anime: "Сага о Винланде", description: "Молодой священник, который ищет истинное значение любви в мире викингов.", image: "foto4/saga.jpg" },
      { character: "Лорд Демонов Диабло", anime: "О моем перерождении в слизь", description: "Один из Первородных демонов, фанатично преданный Римуру Темпесту.", image: "foto4/pereroshdenie.jpg" },
      { character: "Сатоко Ходжо", anime: "Когда плачут цикады", description: "Девочка, любящая ставить ловушки, чья судьба трагически переплетена с циклом смертей в деревне.", image: "foto4/kogdaplachut.jpg" },
      { character: "Рика Кава", anime: "Приоритет чудо-яйца", description: "Бывшая модель, которая присоединяется к группе девочек, сражающихся в мире снов.", image: "foto4/prioritet.jpg" },
      { character: "Анри Сонохара", anime: "Дюрарара", description: "Тихая девушка в очках, которая является носителем проклятого меча Сайка.", image: "foto4/дюрара.jpg" },
      { character: "Naoyuki Andō", anime: "Инуяшики", description: "Лучший друг главного героя, который помогает ему освоиться с новым механическим телом.", image: "foto4/iunashiki.jpg" },
      { character: "Нидзика Идзити", anime: "Одинокий рокер", description: "Энергичная барабанщица группы Kessoku Band, которая пригласила Хитори в группу.", image: "foto4/roker.jpg" },
      { character: "Кохаку Итимура", anime: "Прекрасная вечерняя луна", description: "Девушка, которую часто принимают за парня из-за её внешности и манер.", image: "foto4/luna.jpg" },
      { character: "Канамэ Судо", anime: "Игра Дарвина", description: "Игрок, втянутый в смертельную игру через мобильное приложение.", image: "foto4/darvina.jpg" },
      { character: "Асакадзэ", anime: "Sonny Boy", description: "Парень, обладающий способностью управлять гравитацией в странном пустом мире.", image: "foto4/sonnyboy.jpg" },
      { character: "Сион Караномори", anime: "Психопаспорт", description: "Аналитик Бюро Общественной Безопасности, 'латентный преступник'.", image: "foto4/pasport.jpg" },
      { character: "Амамия", anime: "Рон Камонохаси: Невменяемый детектив", description: "Полицейский, который становится напарником гениального, но странного детектива.", image: "foto4/ronkamonohashi.jpg" },
      { character: "Сюити Кагая", anime: "Глейпнир", description: "Парень, способный превращаться в огромный костюм собаки с молнией на спине.", image: "foto4/glepnir.jpg" },
      { character: "Рин Окумура", anime: "Синий экзорцист", description: "Сын Сатаны, который решил стать экзорцистом, чтобы победить своего отца.", image: "foto4/sinieecz.jpg" },
      { character: "Крул Цепеш", anime: "Последний серафим", description: "Королева вампиров Японии, третья среди Основателей.", image: "foto4/krull.jpg" }
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
  const [showRevealMode, setShowRevealMode] = useState(false);
  const [revealIdx, setRevealIdx] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const isDrivingReveal = useRef(false);

  // ==================== REVEAL MODE LOGIC ====================
  useEffect(() => {
    if (!gameState?.revealMode || !gameState?.active) {
      setShowRevealMode(false);
      return;
    }
    setShowRevealMode(true);
    setRevealIdx(gameState.currentQuestion || 0);
  }, [gameState?.revealMode, gameState?.currentQuestion, gameState?.active]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [preloaderStatus, setPreloaderStatus] = useState("");

  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ==================== VOLUME LOGIC ====================
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, gameState?.currentQuestion, gameState?.revealMode]);

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

        if (user?.isAdmin && isDrivingReveal.current) {
          // Don't overwrite currentQuestion/currentRound while we are in the middle of a reveal loop
          setGameState((prev: any) => ({
            ...state,
            currentQuestion: prev?.currentQuestion,
            currentRound: prev?.currentRound,
            revealMode: true
          }));
        } else {
          setGameState(state);
        }
        setPauseState(pause);
        setReviewState(review);
        setGlobalPauseState(gPause);
        setPlayers(allPlayers || {});

        if (state?.reset && user && !user.isAdmin) {
          localStorage.removeItem('quizUser');
          setUser(null);
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
    if (!gameState?.active || !user || gameState.roundFinished) {
      setTimeLeft(0);
      return;
    }

    if (globalPause?.active || pauseState?.active) {
      // If paused, we show the frozen timeLeft from the database
      if (gameState.timeLeft !== undefined) setTimeLeft(gameState.timeLeft);
      return;
    }

    // Calculate time based on endTime
    const updateTimer = () => {
      if (!gameState.endTime) {
        if (gameState.timeLeft !== undefined) setTimeLeft(gameState.timeLeft);
        return;
      }
      const diff = Math.max(0, Math.ceil((gameState.endTime - Date.now()) / 1000));
      setTimeLeft(diff);

      // Admin handles the transition when time runs out
      if (user.isAdmin && diff <= 0 && !gameState.revealMode) {
        startPauseBetweenQuestions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500); // More frequent update for smoothness
    return () => clearInterval(interval);
  }, [gameState?.active, gameState?.endTime, gameState?.timeLeft, globalPause?.active, pauseState?.active, gameState?.roundFinished, user?.isAdmin]);

  // ==================== ANSWER CHECK LOGIC ====================
  useEffect(() => {
    if (!gameState?.active || !user || user.isAdmin) return;
    
    const qIdx = gameState.currentQuestion ?? 0;
    const checkAnswered = async () => {
      try {
        const ans = await restGet(`players/${user.id}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
        if (ans?.answered) {
          setHasAnswered(true);
          setAnswerText(ans.answer || "");
        } else {
          setHasAnswered(false);
          setAnswerText("");
        }
      } catch (e) {
        console.error("Error checking answer:", e);
      }
    };
    checkAnswered();
  }, [gameState?.currentQuestion, gameState?.currentRound, gameState?.active, user?.id, user?.isAdmin]);
  // ==================== HELPERS ====================
  const getAssetPath = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base : base + "/";
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return cleanBase + cleanPath;
  };

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

  const resetGame = async () => {
    if (!confirm("Вы уверены, что хотите полностью сбросить игру? Все баллы будут удалены!")) return;
    
    // Reset scores for all players
    const resetPlayers = { ...players };
    Object.keys(resetPlayers).forEach(id => {
      resetPlayers[id].score = 0;
    });
    await restPut('players', resetPlayers);
    
    // Reset game state
    await restPut('gameState', {
      active: false,
      currentRound: 0,
      currentQuestion: 0,
      roundFinished: false,
      revealMode: false,
      showLeaderboard: false
    });
    
    // Clear queue
    await restDelete('review');
    await restDelete('pause');
  };

  const toggleLeaderboard = async () => {
    await restPatch('gameState', { showLeaderboard: !gameState?.showLeaderboard });
  };

  const startRevealMode = async (idx: number) => {
    const round = roundsData[idx];
    isDrivingReveal.current = true;
    await restPatch('gameState', { revealMode: true, currentQuestion: 0, active: true, currentRound: idx, showLeaderboard: false, endTime: null });
    
    for (let i = 0; i < round.questions.length; i++) {
      // Update local state immediately to prevent flicker
      setGameState((prev: any) => ({ ...prev, currentQuestion: i }));
      await restPatch('gameState', { currentQuestion: i });
      const duration = round.type === "video" ? 19000 : 14000;
      await new Promise(r => setTimeout(r, duration));
    }
    await restPatch('gameState', { revealMode: false, active: false, roundFinished: true });
    isDrivingReveal.current = false;
  };

  const startRound = async (idx: number) => {
    const duration = roundsData[idx].answerTime || 25;
    await restPatch('gameState', {
      active: true,
      currentRound: idx,
      currentQuestion: 0,
      roundFinished: false,
      timeLeft: duration,
      endTime: Date.now() + duration * 1000,
      showAnswer: false,
      reset: false
    });
  };

  const startPauseBetweenQuestions = async () => {
    if (pauseState?.active) return; // Prevent double trigger
    const round = roundsData[gameState.currentRound];
    const duration = round.pauseDuration || 10;
    const endTime = Date.now() + duration * 1000;
    await restPut('gameState/pause', { active: true, endTime, skip: false });
    await restPatch('gameState', { showAnswer: false, endTime: null }); 

    const checkPause = setInterval(async () => {
      const p = await restGet('gameState/pause');
      if (!p || p.skip || Date.now() >= p.endTime) {
        clearInterval(checkPause);
        await restDelete('gameState/pause');
        const nextQ = gameState.currentQuestion + 1;
        if (nextQ < round.questions.length) {
          const qDuration = round.answerTime || 25;
          await restPatch('gameState', { 
            currentQuestion: nextQ, 
            timeLeft: qDuration,
            endTime: Date.now() + qDuration * 1000
          });
        } else {
          await restPatch('gameState', { active: false, roundFinished: true });
        }
      }
    }, 1000);
  };

  const submitAnswer = async () => {
    if (hasAnswered || !answerText.trim()) return;
    const round = roundsData[gameState.currentRound];
    let potentialPoints = 2; // Default
    
    if (round.type === "image_sequence") {
      // 36s total: 36-29 (4), 28-21 (3), 20-13 (2), 12-0 (1)
      if (timeLeft > 28) potentialPoints = 4;
      else if (timeLeft > 20) potentialPoints = 3;
      else if (timeLeft > 12) potentialPoints = 2;
      else potentialPoints = 1;
    }

    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    await restPut(path, { 
      answered: true, 
      answer: answerText, 
      timestamp: Date.now(),
      potentialPoints 
    });
    setHasAnswered(true);
  };

  const toggleShowAnswer = async () => {
    await restPatch('gameState', { showAnswer: !gameState.showAnswer });
  };

  const markAnswer = async (playerId: string, qKey: string, points: number) => {
    const p = players[playerId];
    if (p) {
      await restPatch(`players/${playerId}`, { score: (p.score || 0) + points });
      // Mark as checked instead of deleting to keep history
      await restPatch(`players/${playerId}/roundAnswers/${gameState.currentRound}/${qKey}`, { checked: true });
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

      {/* Leaderboard Overlay */}
      {gameState?.showLeaderboard && (
        <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b0764_0%,transparent_70%)]" />
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 max-w-4xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="inline-block bg-purple-500/20 px-6 py-2 rounded-full border border-purple-500/30 mb-4"
              >
                <span className="text-purple-400 font-black uppercase tracking-widest text-sm">Финальные результаты</span>
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic">Таблица Лидеров</h2>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {Object.entries(players)
                .sort((a, b) => ((a[1] as any).score || 0) - ((b[1] as any).score || 0)) // Lowest to Highest
                .map(([id, p]: [string, any], idx, arr) => {
                  const isWinner = idx === arr.length - 1;
                  return (
                    <motion.div 
                      key={id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                        isWinner 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/10' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                          isWinner ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50'
                        }`}>
                          {arr.length - idx}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-bold text-white">{p.nickname}</h3>
                            {isWinner && <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Команда #{p.team}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-black ${isWinner ? 'text-yellow-500' : 'text-blue-400'}`}>
                          {p.score || 0}
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">баллов</p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {user?.isAdmin && (
              <button 
                onClick={toggleLeaderboard}
                className="mt-12 w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-white transition-all uppercase tracking-widest border border-white/10"
              >
                Закрыть таблицу
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* Reveal Mode Overlay */}
      {gameState?.revealMode && (
        <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-8 ${user?.isAdmin ? 'pb-80' : ''}`}>
          <div className="max-w-4xl w-full space-y-8 text-center" key={gameState.currentQuestion}>
            <h2 className="text-3xl font-black text-purple-400 uppercase tracking-widest mb-8">Правильные ответы</h2>
            
            {roundsData[gameState.currentRound]?.type === "image_sequence" && (
              <div className="grid grid-cols-2 gap-4">
                {roundsData[gameState.currentRound].questions[gameState.currentQuestion].images?.map((img, i) => (
                  <img key={`${gameState.currentQuestion}-${i}`} src={getAssetPath(img)} className="rounded-xl aspect-video object-cover border-2 border-white/20" />
                ))}
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "video" && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20">
                <video 
                  ref={videoRef}
                  key={gameState.currentQuestion}
                  src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].video || "")} 
                  autoPlay 
                  muted={isMuted}
                  className="w-full h-full"
                />
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "character_guess" && (
              <div className="max-w-md mx-auto">
                <img 
                  key={gameState.currentQuestion}
                  src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].image || "")} 
                  className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[40vh] mx-auto" 
                />
              </div>
            )}

            <motion.div 
              key={`ans-${gameState.currentQuestion}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/10 p-8 rounded-3xl border border-white/20"
            >
              <p className="text-gray-400 uppercase text-sm font-bold mb-2">Верный ответ:</p>
              <p className="text-5xl font-black text-white drop-shadow-lg mb-4">
                {roundsData[gameState.currentRound]?.type === "character_guess" 
                  ? `${roundsData[gameState.currentRound].questions[gameState.currentQuestion].character} (${roundsData[gameState.currentRound].questions[gameState.currentQuestion].anime})`
                  : roundsData[gameState.currentRound].questions[gameState.currentQuestion].correctAnswer
                }
              </p>
              {roundsData[gameState.currentRound]?.type === "character_guess" && (
                <p className="text-xl text-purple-200 italic max-w-2xl mx-auto">
                  "{roundsData[gameState.currentRound].questions[gameState.currentQuestion].description}"
                </p>
              )}
            </motion.div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                key={`timer-${gameState.currentQuestion}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: roundsData[gameState.currentRound]?.type === "video" ? 19 : 14, ease: "linear" }}
                className="bg-purple-500 h-full"
              />
            </div>
          </div>

          {/* Admin Controls during Reveal */}
          {user?.isAdmin && (
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-6 z-[101]">
              <div className="max-w-6xl mx-auto flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" /> Панель управления показом
                  </h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={resetGame}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition-all font-bold text-sm uppercase tracking-widest flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Сбросить игру
                    </button>
                    <button 
                      onClick={() => restPatch('gameState', { revealMode: false, active: false })}
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl border border-white/10 transition-all font-bold text-sm uppercase tracking-widest"
                    >
                      Остановить показ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Question Status */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Проверка ответов игроков:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(players).map(([id, p]: [string, any]) => {
                        const qKey = `r${gameState.currentRound}_q${gameState.currentQuestion}`;
                        const ans = p.answers?.[qKey];
                        if (!ans) return null;
                        return (
                          <div key={id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-sm font-medium text-white">{p.nickname} (К#{p.team})</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                                (roundsData[gameState.currentRound]?.type === "character_guess" 
                                  ? (ans.text.toLowerCase() === (roundsData[gameState.currentRound].questions[gameState.currentQuestion].character || "").toLowerCase())
                                  : (ans.text.toLowerCase() === (roundsData[gameState.currentRound].questions[gameState.currentQuestion].correctAnswer || "").toLowerCase())
                                ) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {ans.text}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => markAnswer(id, qKey, ans.potentialPoints || 2)} className="p-1 hover:bg-green-500 rounded text-green-400 hover:text-white transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                <button onClick={() => markAnswer(id, qKey, 0)} className="p-1 hover:bg-red-500 rounded text-red-400 hover:text-white transition-colors"><XCircle className="w-4 h-4" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {Object.values(players).every((p: any) => !p.answers?.[`r${gameState.currentRound}_q${gameState.currentQuestion}`]) && (
                        <p className="text-xs text-gray-500 italic text-center py-4">Нет ответов на этот вопрос</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Вопрос</p>
                        <p className="text-2xl font-black text-white">{gameState.currentQuestion + 1} / {roundsData[gameState.currentRound].questions.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Раунд</p>
                        <p className="text-2xl font-black text-purple-400">{gameState.currentRound + 1}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            const currentQIdx = gameState.currentQuestion ?? 0;
            const currentQuestion = round.questions[currentQIdx];

            if (!currentQuestion) {
              return <div className="text-center py-20">Вопрос не найден...</div>;
            }

            return (
              <div className="bg-black/40 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-red-400">{round.name}</h2>
                  <div className="text-3xl font-mono text-yellow-500 bg-black/50 px-4 py-2 rounded-xl">
                    {timeLeft}s
                  </div>
                </div>

                {/* Round 1: Image Sequence */}
                {round.type === "image_sequence" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {currentQuestion.images?.map((img, idx) => {
                        // Logic: 36-29 (img 1), 28-21 (img 2), 20-13 (img 3), 12-0 (img 4)
                        const show = (idx === 0) || 
                                     (idx === 1 && timeLeft <= 28) || 
                                     (idx === 2 && timeLeft <= 20) || 
                                     (idx === 3 && timeLeft <= 12);
                        
                        return (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
                            className="relative aspect-video overflow-hidden rounded-xl border-2 border-white/10"
                          >
                            {show && (
                              <img 
                                src={getAssetPath(img)} 
                                alt={`Hint ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => { 
                                  console.warn(`Failed to load image: ${img}`);
                                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/anime${currentQIdx}_${idx}/400/300`; 
                                }}
                              />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {!user.isAdmin && (
                      <div className="flex gap-4">
                        <input 
                          type="text"
                          className="answer-input flex-1"
                          placeholder="Ваш ответ..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          disabled={hasAnswered}
                        />
                        <button 
                          onClick={submitAnswer}
                          disabled={hasAnswered}
                          className={`px-8 py-4 rounded-full font-bold transition-all ${hasAnswered ? 'bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                          {hasAnswered ? 'ОТПРАВЛЕНО' : 'ОТПРАВИТЬ'}
                        </button>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 p-4 rounded-2xl border border-green-500/50 text-center"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 2: Quiz */}
                {round.type === "quiz" && (
                  <div className="space-y-8 py-10">
                    <h3 className="text-3xl font-bold text-center mb-10">{currentQuestion.text}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options?.map((opt, idx) => {
                        const isCorrect = idx === currentQuestion.correct;
                        return (
                          <button
                            key={idx}
                            onClick={async () => {
                              if (hasAnswered || user.isAdmin) return;
                              setAnswerText(opt);
                              const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${currentQIdx}`;
                              await restPut(path, { answered: true, answer: opt, isCorrect, timestamp: Date.now() });
                              setHasAnswered(true);
                            }}
                            className={`p-6 rounded-2xl text-xl font-semibold transition-all border-2 ${
                              hasAnswered && answerText === opt 
                                ? 'bg-blue-600 border-blue-400' 
                                : gameState.showAnswer && isCorrect
                                  ? 'bg-green-600 border-green-400'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                            disabled={hasAnswered || user.isAdmin}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Round 3: Video */}
                {round.type === "video" && (
                  <div className="space-y-6">
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                      <video 
                        ref={videoRef}
                        src={getAssetPath(currentQuestion.video || "")}
                        className="w-full h-full"
                        controls={user.isAdmin}
                        autoPlay
                        muted={isMuted}
                      />
                    </div>

                    {!user.isAdmin && (
                      <div className="flex gap-4">
                        <input 
                          type="text"
                          className="answer-input flex-1"
                          placeholder="Название аниме..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          disabled={hasAnswered}
                        />
                        <button 
                          onClick={submitAnswer}
                          disabled={hasAnswered}
                          className={`px-8 py-4 rounded-full font-bold transition-all ${hasAnswered ? 'bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                          {hasAnswered ? 'ОТПРАВЛЕНО' : 'ОТПРАВИТЬ'}
                        </button>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 p-4 rounded-2xl border border-green-500/50 text-center"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 4 Content */}
                {round.type === "character_guess" && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="relative group">
                        <img 
                          src={getAssetPath(currentQuestion.image || "")} 
                          alt="Character" 
                          className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/10"
                          onError={(e) => { 
                            console.warn(`Failed to load image: ${currentQuestion.image}`);
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/anime${currentQIdx}/800/600`; 
                          }}
                        />
                        <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-sm">Вопрос {currentQIdx + 1}</div>
                      </div>
                      <div className="space-y-4">
                        <div className="char-description">
                          <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">Описание персонажа:</p>
                          <p className="text-lg leading-relaxed italic">
                            "{currentQuestion.description}"
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
                              {currentQuestion.character}
                            </h3>
                            <p className="text-gray-300">Аниме: <span className="text-white font-semibold">{currentQuestion.anime}</span></p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                    if (active) {
                      // Resuming: set new endTime based on remaining timeLeft
                      const newEndTime = Date.now() + (gameState.timeLeft || 0) * 1000;
                      await restPatch('gameState', { endTime: newEndTime });
                    } else {
                      // Pausing: save current timeLeft to DB
                      await restPatch('gameState', { timeLeft: timeLeft });
                    }
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
                      // 1. Wipe everything from database
                      // Using restPut on 'gameState' clears all its sub-nodes (pause, globalPause, etc.)
                      await Promise.all([
                        restPut('gameState', { reset: true, active: false }),
                        restDelete('players')
                      ]);
                      
                      // 2. Wait to ensure all clients' pollers catch the 'reset: true' signal
                      await new Promise(r => setTimeout(r, 1500));
                      
                      // 3. Clear the reset flag so the next session can start fresh
                      await restPatch('gameState', { reset: false });
                      
                      // 4. Local cleanup and reload
                      localStorage.removeItem('quizUser');
                      window.location.reload();
                    }
                  }}
                  className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-full font-bold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> СБРОС
                </button>
              </div>

              {/* Leaderboard Table */}
              <div className="mt-8 bg-black/40 rounded-xl p-4 border border-white/10">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center gap-2">
                  <Users className="w-4 h-4" /> Таблица лидеров:
                </h4>
                <div className="space-y-2">
                  {Object.entries(players)
                    .sort((a, b) => ((b[1] as any).score || 0) - ((a[1] as any).score || 0))
                    .map(([id, p]: [string, any]) => (
                      <div key={id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full bg-team-${p.team + 1}`} />
                          <span className="font-medium">{p.nickname}</span>
                          <span className="text-[10px] text-gray-500 uppercase">Команда {p.team + 1}</span>
                        </div>
                        <span className="font-mono font-bold text-blue-400">{p.score || 0}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reveal Answers Control */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Показ ответов:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {roundsData.map((round, idx) => (
                    <button 
                      key={idx}
                      onClick={() => startRevealMode(idx)}
                      disabled={gameState?.active}
                      className="bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-50 py-3 px-4 rounded-xl font-bold flex items-center justify-between gap-2 border border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                        <span className="text-sm">{round.name}</span>
                      </div>
                      <Eye className="w-4 h-4 opacity-50" />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                  *Автоматический показ всех вопросов раунда с ответами
                </p>
              </div>

              {/* Leaderboard & Reset Controls */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={toggleLeaderboard}
                  className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <Crown className="w-5 h-5" /> ТАБЛИЦА ЛИДЕРОВ
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                >
                  <RotateCcw className="w-5 h-5" /> СБРОСИТЬ ИГРУ
                </button>
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase">Очередь ответов (Раунд {gameState?.currentRound + 1}):</h4>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {Object.entries(players).flatMap(([id, p]: [string, any]) => {
                    const roundAnswers = p.roundAnswers?.[gameState?.currentRound] || {};
                    return Object.entries(roundAnswers)
                      .filter(([_, ans]: [any, any]) => !ans.checked)
                      .map(([qKey, ans]: [string, any]) => ({ id, p, qKey, ans }));
                  })
                  .sort((a, b) => (a.ans.timestamp || 0) - (b.ans.timestamp || 0))
                  .map(({ id, p, qKey, ans }) => {
                    const qIdx = parseInt(qKey.replace('q',''));
                    const correctAns = roundsData[gameState.currentRound]?.questions[qIdx]?.correctAnswer;
                    
                    return (
                      <div key={`${id}-${qKey}`} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border-l-4 border-blue-500">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.nickname}</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">К{p.team + 1}</span>
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">Вопрос {qIdx + 1}</span>
                          </div>
                          <p className="text-sm text-blue-300 mt-1">Ответ игрока: <span className="font-bold">{ans.answer}</span></p>
                          <p className="text-[10px] text-green-400 mt-1 uppercase tracking-wider">Правильный: {correctAns}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => markAnswer(id, qKey, ans.potentialPoints || 2)} 
                            className="bg-green-600/20 hover:bg-green-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px]"
                          >
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">+{ans.potentialPoints || 2}</span>
                          </button>
                          <button 
                            onClick={() => markAnswer(id, qKey, -1)} 
                            className="bg-red-600/20 hover:bg-red-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px]"
                          >
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">-1</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(players).every((p: any) => !p.roundAnswers?.[gameState?.currentRound] || Object.values(p.roundAnswers[gameState.currentRound]).every((a: any) => a.checked)) && (
                    <p className="text-center text-gray-500 py-4 italic">Нет новых ответов</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
