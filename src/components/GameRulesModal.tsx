import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Trophy, Crown, Users, Star, Sparkles, CheckCircle2, 
  HelpCircle, AlertTriangle, ShieldCheck, Flame, Medal, Clock, 
  Volume2, Eye, Brain, Bot, Grid3X3, MessageSquare, X, ChevronRight,
  Radio, Shuffle, Award
} from "lucide-react";

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onBroadcastToggle?: (showForAll: boolean) => void;
  isBroadcasted?: boolean;
}

export default function GameRulesModal({
  isOpen,
  onClose,
  isAdmin,
  onBroadcastToggle,
  isBroadcasted
}: GameRulesModalProps) {
  const [activeTab, setActiveTab] = useState<"team_system" | "all_rounds" | "special_mechanics">("all_rounds");
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | "all">("all");

  if (!isOpen) return null;

  const roundsInfo = [
    {
      roundNum: 0,
      title: "Разминка: Тестовый раунд",
      type: "test_round",
      icon: <Volume2 className="w-5 h-5 text-indigo-400" />,
      time: "15 сек на вопрос (8 вопросов + финальный 60 сек)",
      points: "+1 балл за проверку",
      description: "Тестовая проверка видеопотока, звука, экранов участников и готовности оборудования перед началом игры.",
      rules: [
        "Проверка видео и кадров у всех команд.",
        "Капитан команды проверяет возможность отправки ответов.",
        "Участники проверяют звук кнопкой «ТЕСТ ЗВУКА» в шапке.",
        "Финальная проверка связи длится 60 секунд перед переходом к Раунду 1."
      ]
    },
    {
      roundNum: 1,
      title: "Раунд 1: Три персонажа",
      type: "three_characters",
      icon: <Users className="w-5 h-5 text-purple-400" />,
      time: "45 сек на вопрос (10 вопросов)",
      points: "До +5 баллов (2 за аниме + по 1 за каждого персонажа)",
      description: "На экране появляется 1 кадр из аниме и 3 силуэта/карточки персонажей из этого же тайтла.",
      rules: [
        "Необходимо назвать название аниме (+2 балла) и имена всех 3 персонажей (+1 балл за каждого, максимум +5 баллов за вопрос).",
        "Капитан вводит названия в специальные поля: поле аниме и 3 поля персонажей.",
        "Сокомандники могут писать свои догадки, которые мгновенно отображаются у капитана на экране с никнеймом автора.",
        "По окончании раунда ведущий проверяет ответы команд в специальной детальной панели проверки."
      ]
    },
    {
      roundNum: 2,
      title: "Раунд 2: Тест-викторина (Романтика)",
      type: "quiz_six",
      icon: <Flame className="w-5 h-5 text-pink-400" />,
      time: "40 сек на вопрос (10 вопросов)",
      points: "+4 балла за правильный выбор",
      description: "10 глубоких сюжетных вопросов по романтическим шедеврам аниме с 6 вариантами ответов (A, B, C, D, E, F).",
      rules: [
        "Только 1 вариант из 6 является истинно верным.",
        "Игроки команды обсуждают вопрос и предлагают варианты своему капитану.",
        "Капитан выбирает итоговый вариант в один клик и отправляет официальный ответ команды.",
        "Система автоматически проверяет совпадение с верным ответом сразу по истечении времени вопроса."
      ]
    },
    {
      roundNum: 3,
      title: "Раунд 3: Что это за звук?",
      type: "audio_guess",
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
      time: "50 сек на звук (10 звуков)",
      points: "+2 балла за угаданный звук",
      description: "10 легендарных аудиодорожек: культовые фразы, крики боли и ярости, звуки активации способностей («Za Warudo», «I am Atomic», взрыв Мегумин), опенинги и боевые саундтреки.",
      rules: [
        "Звук воспроизводится синхронно у всех участников (нажмите «ТЕСТ ЗВУКА» в шапке, если не слышите).",
        "Команда должна распознать аниме, персонажа или контекст сцены.",
        "Капитан вводит ответ. Сокомандники набрасывают догадки, которые капитан может вставить в поле кликом.",
        "Ведущий оценивает точность ответа."
      ]
    },
    {
      roundNum: 4,
      title: "Раунд 4: Фото-память (Запоминание предметов)",
      type: "memory_items",
      icon: <Brain className="w-5 h-5 text-amber-400" />,
      time: "15 сек на запоминание + по 15 сек на 4 вопроса",
      points: "+5 баллов за каждый вопрос (до 20 баллов за картину!)",
      description: "Испытание на фотографическую память: 3 сложнейшие детальные картины с кучей мелких предметов.",
      rules: [
        "Фаза 1 — ЗАПОМИНАНИЕ (15 сек): на экране открывается изображение. Вся команда внимательно запоминает всё: цвета предметов, надписи, еду, оружие, одежду, количество объектов.",
        "Фаза 2 — ВОПРОСЫ ПО ПАМЯТИ: картина скрывается! Задаются 4 вопроса по памяти подряд (по 15 сек на каждый).",
        "Каждый верный ответ приносит щедрые +5 баллов в копилку команды.",
        "Официальный ответ отправляет капитан команды, опираясь на память и подсказки товарищей."
      ]
    },
    {
      roundNum: 5,
      title: "Раунд 5: 3 факта об аниме",
      type: "three_facts",
      icon: <Eye className="w-5 h-5 text-cyan-400" />,
      time: "50 сек на вопрос (10 вопросов)",
      points: "5, 4 или 3 балла в зависимости от скорости",
      description: "Факты об одном загаданном аниме появляются по очереди с интервалом: 1-й факт -> 2-й факт -> 3-й факт.",
      rules: [
        "Убывающая шкала баллов: чем раньше команда отгадает аниме, тем больше очков получает!",
        "Если ответ сдан на 1-м факте: +5 БАЛЛОВ!",
        "Если ответ сдан на 2-м факте: +4 БАЛЛА!",
        "Если ответ сдан на 3-м факте: +3 БАЛЛА!",
        "Если капитан поторопился и ответил неверно — попытка на вопрос сгорает, поэтому важно советоваться с командой."
      ]
    },
    {
      roundNum: 6,
      title: "Раунд 6: Что было ДО / ПОСЛЕ?",
      type: "before_after",
      icon: <Sparkles className="w-5 h-5 text-violet-400" />,
      time: "40 сек на вопрос (5 вопросов)",
      points: "+4 балла за верный ответ",
      description: "На экране отображается стоп-кадр из культовой сцены аниме. Задача команды — вспомнить и описать, что произошло непосредственно ДО или сразу ПОСЛЕ этого момента!",
      rules: [
        "Внимательно изучите кадр и задание: «Что произошло ДО этого кадра?» или «Что произошло ПОСЛЕ этого кадра?».",
        "Капитан вводит ответ команды с описанием ключевого сюжетного поворота.",
        "Сокомандники предлагают свои варианты в реальном времени.",
        "За правильный ответ начисляется +4 балла в копилку команды."
      ]
    },
    {
      roundNum: 7,
      title: "Раунд 7: ИИ-Акинатор",
      type: "akinator",
      icon: <Bot className="w-5 h-5 text-fuchsia-400" />,
      time: "1.5 минуты на вопрос (3 секретных аниме)",
      points: "+5 баллов за угадывание каждого аниме",
      description: "Нейросеть загадывает секретное аниме. Команда задаёт вопросы боту («Это сёнэн?», «Герой школьник?», «Тайтл выходил до 2015 года?»), а бот отвечает «Да», «Нет», «Возможно», «Не знаю».",
      rules: [
        "ОСОБАЯ РОТАЦИЯ ИГРОКОВ: на каждом из 3 вопросов играет свой участник команды!",
        "• Вопрос 1 — играет Игрок №1 команды.",
        "• Вопрос 2 — играет Игрок №2 команды.",
        "• Вопрос 3 — играет Игрок №3 команды.",
        "• Если в команде 2 человека: Игрок 1 играет 1-й и 3-й вопросы, Игрок 2 играет 2-й вопрос.",
        "• Если в команде 1 человек: он играет все 3 вопроса.",
        "Сокомандники на своих экранах могут набросать идеи вопросов и догадок — активный игрок видит их и может кликом подставить себе в поле!",
        "Ограниченное число попыток догадок (до 3 попыток на команду). Победа приносит +5 баллов."
      ]
    },
    {
      roundNum: 8,
      title: "Раунд 8: Аниме-Бинго (4×4)",
      type: "bingo",
      icon: <Grid3X3 className="w-5 h-5 text-emerald-400" />,
      time: "Без таймера (играется до закрытия)",
      points: "+12 баллов за линию / +24 балла за фулл-карту",
      description: "3 партии азартного командного Бинго на поле 4×4 из 16 карточек с уникальными критериями (например: «Мрачная атмосфера», «Есть боги», «Один сезон», «Студия MAPPA»).",
      rules: [
        "Команды вычеркивают ячейки, подбирая подходящие под критерий реальные аниме из общего пула 32 тайтлов.",
        "Линия из 4 ячеек (по горизонтали, вертикали или диагонали) = 12 баллов!",
        "Полное закрытие всех 16 ячеек поля (фулл-хаус) = 24 балла!",
        "ОСТОРОЖНО — ШТРАФЫ: капитан отправляет карту на проверку ведущему. Если команда указала тайтл, не соответствующий критерию, ведущий начисляет штраф -3 балла за ошибку!",
        "Баллы за все 3 партии суммируются в командный счёт."
      ]
    },
    {
      roundNum: 9,
      title: "Раунд 9: Вопросы от друзей (Шуточный)",
      type: "friends_jokes",
      icon: <Award className="w-5 h-5 text-yellow-400" />,
      time: "Свободный темп под контролем ведущего (10 вопросов)",
      points: "Индивидуальные баллы + Золотая медаль симпатий",
      description: "10 авторских вопросов, каверов и загадок от друзей с юмором (Шинсу, Длань Господня, Индра, Койот Старрк, Рип ван Винкль, Некома, Made in Abyss, Покемоны).",
      rules: [
        "ИНДИВИДУАЛЬНАЯ ИГРА: в этом раунде нет разделения на команды и капитанов — абсолютно каждый игрок играет сам за себя и вводит свой ответ!",
        "ОЦЕНКА ВОПРОСОВ (1–10 ЗВЁЗД): под каждым вопросом каждый участник выставляет свою оценку от 1 до 10 звёзд тому, насколько вопрос крутой, смешной или остроумный.",
        "ПРИЗ ЗРИТЕЛЬСКИХ СИМПАТИЙ: в финале раунда объявляется Топ-1 вопрос, набравший наивысший средний балл среди всех игроков, с торжественной золотой медалькой 🎖️!",
        "Ведущий оценивает ответы игроков индивидуально (+2, +1, 0 баллов)."
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_30%,#9333ea_0%,transparent_75%)]" />
        </div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900/95 via-purple-950/90 to-slate-950/95 border-2 border-purple-500/50 rounded-[2.5rem] shadow-2xl p-5 sm:p-8 md:p-10 flex flex-col max-h-[92vh] overflow-hidden backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                  Энциклопедия правил • Аниме Викторина 2026
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  Полный свод правил викторины
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {isAdmin && onBroadcastToggle && (
                <button
                  onClick={() => onBroadcastToggle(!isBroadcasted)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer ${
                    isBroadcasted
                      ? "bg-pink-600 border-pink-400 text-white shadow-lg shadow-pink-600/30 animate-pulse"
                      : "bg-white/10 hover:bg-white/20 text-gray-200 border-white/20"
                  }`}
                  title="Открыть эти правила на экранах всех подключенных игроков"
                >
                  <Radio className="w-4 h-4 text-pink-300" />
                  <span>{isBroadcasted ? "Показывается всем игрокам" : "Показать правила всем"}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer"
                title="Закрыть правила"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-4 pb-2 border-b border-white/5 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab("all_rounds")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                activeTab === "all_rounds"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg shadow-purple-600/30"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 border-white/10"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Все 10 раундов</span>
            </button>

            <button
              onClick={() => setActiveTab("team_system")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                activeTab === "team_system"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg shadow-purple-600/30"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 border-white/10"
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Капитаны и командная игра</span>
            </button>

            <button
              onClick={() => setActiveTab("special_mechanics")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                activeTab === "special_mechanics"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg shadow-purple-600/30"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 border-white/10"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Особые механики и нюансы</span>
            </button>
          </div>

          {/* Tab Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
            {/* ==================== ТАБ 1: ВСЕ 10 РАУНДОВ ==================== */}
            {activeTab === "all_rounds" && (
              <div className="space-y-6">
                {/* Round Quick Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedRoundFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 border ${
                      selectedRoundFilter === "all"
                        ? "bg-purple-600 border-purple-400 text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    Все раунды (0–9)
                  </button>
                  {roundsInfo.map((r) => (
                    <button
                      key={r.roundNum}
                      onClick={() => setSelectedRoundFilter(r.roundNum)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 border ${
                        selectedRoundFilter === r.roundNum
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {r.roundNum === 0 ? "Тест" : `Р${r.roundNum}`}
                    </button>
                  ))}
                </div>

                {/* Cards List */}
                <div className="grid grid-cols-1 gap-5">
                  {roundsInfo
                    .filter((r) => selectedRoundFilter === "all" || selectedRoundFilter === r.roundNum)
                    .map((r) => (
                      <div
                        key={r.roundNum}
                        className="bg-black/40 border border-purple-500/30 rounded-3xl p-6 space-y-4 hover:border-purple-500/60 transition-all shadow-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0">
                              {r.icon}
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">
                                {r.roundNum === 0 ? "Разминочный этап" : `Официальный Раунд #${r.roundNum}`}
                              </span>
                              <h3 className="text-lg sm:text-xl font-black text-white">
                                {r.title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-gray-300 font-mono flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-purple-400" />
                              {r.time}
                            </span>
                            <span className="bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-xl text-amber-300 font-black">
                              {r.points}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                          {r.description}
                        </p>

                        <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl p-4 space-y-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 block">
                            Как играть и главные правила:
                          </span>
                          <ul className="space-y-1.5 text-xs text-gray-300">
                            {r.rules.map((rule, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-400 font-black mt-0.5">•</span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ==================== ТАБ 2: КАПИТАНЫ И КОМАНДНАЯ ИГРА ==================== */}
            {activeTab === "team_system" && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-amber-500/10 via-purple-950/40 to-indigo-950/40 border-2 border-amber-500/40 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-amber-400" />
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        Система капитана и сокомандников
                      </h3>
                      <p className="text-xs text-amber-300">
                        Основа командной викторины: слаженная работа, подсказки в реальном времени и принятие решений.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Карточка 1: Роль Капитана */}
                  <div className="bg-black/40 border border-purple-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span>Обязанности и права Капитана:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-gray-300 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Настройка команды:</strong> капитан загружает уникальную аватарку команды со своего компьютера или телефона и задаёт боевой дух.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Официальный ответ:</strong> только капитан отправляет финальный зачтённый ответ команды в командных раундах (1–6, 8).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Интеграция подсказок:</strong> над полем ввода капитана в реальном времени появляются плашки с догадками сокомандников. Капитан может в 1 клик подставить любой вариант игрока в поле ответа!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Передача капитанства:</strong> в любой момент в «Штабе команды» или на экране подготовки капитан может передать корону любому товарищу по команде.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Карточка 2: Роль Сокомандников */}
                  <div className="bg-black/40 border border-purple-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-black text-sm uppercase">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span>Роль и сила Сокомандников:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-gray-300 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Поле подсказок:</strong> на каждом вопросе у каждого игрока открыто личное поле «Предложить вариант капитану». Напишите туда свою версию и нажмите «Отправить».</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Авторство и доверие:</strong> капитан видит ваш никнейм рядом с подсказкой. Если вы уверены в тайтле — помогите капитану быстро выбрать верный ответ!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Свободный капитан:</strong> если у команды нет капитана, любой игрок может нажать кнопку «Занять лидера команды» в шапке или штабе.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Личный вклад:</strong> в 7 раунде (Акинатор) каждый игрок получает свой персональный вопрос, а в 9 раунде каждый играет полностью индивидуально!</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Баннер о лимите участников */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-300">
                    👥 В викторине поддерживается <strong>до 10 команд</strong>, в каждой из которых может быть <strong>до 3 участников</strong> (максимум 30 игроков одновременно).
                  </p>
                </div>
              </div>
            )}

            {/* ==================== ТАБ 3: ОСОБЫЕ МЕХАНИКИ И СЕКРЕТЫ ==================== */}
            {activeTab === "special_mechanics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Механика Акинатора */}
                  <div className="bg-black/40 border border-fuchsia-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-fuchsia-300 font-black text-sm uppercase">
                      <Bot className="w-5 h-5 text-fuchsia-400" />
                      <span>Ротация игроков в 7 раунде (Акинатор):</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      В 7 раунде реализована честная ротация ходов:
                    </p>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      <li>• <strong>Вопрос 1:</strong> играет и задаёт вопросы Игрок #1 команды.</li>
                      <li>• <strong>Вопрос 2:</strong> очередь переходит к Игроку #2.</li>
                      <li>• <strong>Вопрос 3:</strong> играет Игрок #3 команды.</li>
                      <li>• <strong>Для команды из 2 человек:</strong> 1-й игрок берёт 1-й и 3-й вопросы, 2-й игрок берёт 2-й вопрос.</li>
                      <li>• <strong>Подсказки от сокомандников:</strong> остальные участники могут предлагать вопросы боту и варианты отгадок прямо на экране!</li>
                    </ul>
                  </div>

                  {/* Механика Бинго */}
                  <div className="bg-black/40 border border-emerald-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-black text-sm uppercase">
                      <Grid3X3 className="w-5 h-5 text-emerald-400" />
                      <span>Штрафы и стратегия Бинго (8 раунд):</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      В Бинго важна не только скорость, но и точность:
                    </p>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      <li>• Собрать 4 в ряд = <strong>+12 баллов</strong>.</li>
                      <li>• Собрать всю карту 4х4 = <strong>+24 балла</strong>.</li>
                      <li>• ⚠️ <strong>Штраф -3 балла:</strong> если при проверке судьёй тайтл не подходит под критерий ячейки, ведущий начисляет штраф! Не рискуйте непроверенными тайтлами.</li>
                    </ul>
                  </div>

                  {/* Механика 9 раунда (Симпатии) */}
                  <div className="bg-black/40 border border-amber-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-sm uppercase">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>Приз зрительских симпатий (9 раунд):</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      В 9 раунде участники голосуют за лучший вопрос:
                    </p>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      <li>• Под каждым вопросом есть кнопки от <strong>1 до 10 звёзд</strong>.</li>
                      <li>• Каждый игрок ставит оценку тому, насколько вопрос крутой и остроумный.</li>
                      <li>• По окончании викторины выводится золотая карточка победителя <strong>«Приз зрительских симпатий»</strong> 🎖️ с вопросом, занявшим 1 место по среднему баллу!</li>
                    </ul>
                  </div>

                  {/* Механика скрытия счёта */}
                  <div className="bg-black/40 border border-indigo-500/30 rounded-3xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 font-black text-sm uppercase">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Интрига счёта команд:</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Чтобы сохранять спортивную интригу до самого финала:
                    </p>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      <li>• По умолчанию баллы команд скрыты за символом <strong>«❓»</strong>.</li>
                      <li>• Ведущий может в любой момент нажать кнопку «Показать счёт всем», открыв общую таблицу лидеров для всех участников.</li>
                      <li>• Вверху экрана игроки могут нажать «Счёт команд», когда ведущий разрешает просмотр.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-gray-400 text-center sm:text-left">
              Желаем приятной игры, честного соперничества и ярких эмоций! 🎉
            </span>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95"
            >
              Всё понятно, к игре! 🚀
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
