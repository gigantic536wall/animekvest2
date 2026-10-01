/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Volume1, Volume, Bell, Crown, Settings, 
  Play, Pause, SkipForward, Trash2, RotateCcw, CheckCircle2, 
  XCircle, Users, Eye, HelpCircle, ShieldCheck, Trophy, Upload, ArrowRight,
  ArrowRightLeft, Sparkles, Shield, AlertTriangle, LogOut
} from 'lucide-react';
import { AudioPlayer } from './components/AudioPlayer';
import { AKINATOR_ANIME_LIST } from './data/akinatorAnime';
import AkinatorRoundView from './components/AkinatorRoundView';
import BingoRoundView from './components/BingoRoundView';
import MemoryItemsRoundView from './components/MemoryItemsRoundView';
import ThreeFactsRoundView from './components/ThreeFactsRoundView';
import BeforeAfterRoundView from './components/BeforeAfterRoundView'; // Подключаем новый раунд!
import TeamSetupModal, { compressTeamAvatar } from './components/TeamSetupModal';
import TeamLeaderboardModal from './components/TeamLeaderboardModal';
import TeamHeaderBanner from './components/TeamHeaderBanner';
import { generateBingoPool32, generateTeamBingoCard } from './data/bingoData';
import { ROUND4_STAGES } from './data/round4Data';
import { ROUND5_QUESTIONS } from './data/round5Data';

// ==================== КОНФИГ FIREBASE ====================
const DB_URL = "https://anime-database-7d48e-default-rtdb.europe-west1.firebasedatabase.app";
const TOTAL_TEAMS = 10;

const restGet = async (p: string) => { 
  const r = await fetch(`${DB_URL}/${p}.json`); 
  if (!r.ok) throw new Error(`GET ${p} ${r.status}`); 
  const data = await r.json();
  const serverDate = r.headers.get('Date');
  return { data, serverTime: serverDate ? new Date(serverDate).getTime() : null };
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
  characterNames?: string[];
  correctAnswer?: string;
  video?: string;
  character?: string;
  anime?: string;
  description?: string;
  image?: string;
  emojis?: string;
  answerTime?: number;
  year?: string;
  genre?: string;
  director?: string;
  composer?: string;
  painter?: string;
  editor?: string;
  premiere?: string;
  ageRating?: string;
  seasons?: string;
  episodes?: string;
  info?: string;
  audio?: string;
  facts?: [string, string, string];
}

interface Round {
  type: string;
  name: string;
  questions: Question[];
  pauseDuration?: number;
  answerTime?: number;
  points?: number;
  memorizeDuration?: number;
}

// ==================== ДАННЫЕ ИГРЫ ====================
const roundsData: Round[] = [
  {
    type: "test_round",
    name: "Тестовый раунд",
    answerTime: 15,
    pauseDuration: 5,
    questions: [
      ...Array.from({ length: 8 }, (_, i) => ({
        text: `Проверочный вопрос №${i + 1} (Настройка оборудования)`,
        images: [`/test/v${i + 1}_1.jpg`, `/test/v${i + 1}_2.jpg`, `/test/v${i + 1}_3.jpg`, `/test/v${i + 1}_4.jpg`],
        video: `/test/v${i + 1}_vid.mp4`,
        correctAnswer: "Проверка"
      })),
      {
        text: "Финальная проверка связи (60 секунд)",
        images: ["/test/final_1.jpg", "/test/final_2.jpg", "/test/final_3.jpg", "/test/final_4.jpg"],
        video: "/test/final_vid.mp4",
        correctAnswer: "Готовы к игре",
        answerTime: 60
      }
    ]
  },
  {
    type: "three_characters",
    name: "Раунд 1: Угадай аниме по трем персонажам",
    answerTime: 35,
    pauseDuration: 10,
    questions: [
      {
        images: [
          "/foto1/image4-1-1-1.jpg",
          "/foto1/image4-1-1-2.jpg",
          "/foto1/image4-1-1-3.jpg"
        ],
        characterNames: [
          "Сатору Миками (главный герой до перерождения)",
          "Дриада (Трейни)",
          "Ультима (Виоле)"
        ],
        correctAnswer: "О моём перерождении в слизь"
      },
      {
        images: [
          "/foto1/image4-1-2-1.jpg",
          "/foto1/image4-1-2-2.jpg",
          "/foto1/image4-1-2-3.jpg"
        ],
        characterNames: [
          "Фука Кикути",
          "Ханаби Нацубаяси",
          "Такахиро Мидзусава"
        ],
        correctAnswer: "Низкоуровневый персонаж Томодзаки"
      },
      {
        images: [
          "/foto1/image4-1-3-1.jpg",
          "/foto1/image4-1-3-2.jpg",
          "/foto1/image4-1-3-3.jpg"
        ],
        characterNames: [
          "Юма Куними",
          "Нодока Тоёхама",
          "Каэдэ Адзусагава"
        ],
        correctAnswer: "Этот глупый свин не понимает мечту девочки-зайки"
      },
      {
        images: [
          "/foto1/image4-1-4-1.jpg",
          "/foto1/image4-1-4-2.jpg",
          "/foto1/image4-1-4-3.jpg"
        ],
        characterNames: [
          "Бишамон",
          "Кадзума",
          "Рабо"
        ],
        correctAnswer: "Бездомный бог"
      },
      {
        images: [
          "/foto1/image4-1-5-1.jpg",
          "/foto1/image4-1-5-2.jpg",
          "/foto1/image4-1-5-3.jpg"
        ],
        characterNames: [
          "Тэцу Тоцумура",
          "Масахито Карикири",
          "Токико Хисигата"
        ],
        correctAnswer: "Летнее время"
      },
      {
        images: [
          "/foto1/image4-1-6-1.jpg",
          "/foto1/image4-1-6-2.jpg",
          "/foto1/image4-1-6-3.jpg"
        ],
        characterNames: [
          "Ицуки Сумэраги",
          "Юмэми Юмэмитэ",
          "Джун Киватари"
        ],
        correctAnswer: "Безумный азарт"
      },
      {
        images: [
          "/foto1/image4-1-7-1.jpg",
          "/foto1/image4-1-7-2.jpg",
          "/foto1/image4-1-7-3.jpg"
        ],
        characterNames: [
          "Каэде Акамацу",
          "Кокичи Ома",
          "Цумуги Сироганэ"
        ],
        correctAnswer: "Danganronpa"
      },
      {
        images: [
          "/foto1/image4-1-8-1.jpg",
          "/foto1/image4-1-8-2.jpg",
          "/foto1/image4-1-8-3.jpg"
        ],
        characterNames: [
          "Ёситэру Дзаимокудза",
          "Комати Хикигая",
          "Ироха Иссики"
        ],
        correctAnswer: "Как и ожидал, моя школьная романтическая жизнь не превзошла ожиданий"
      },
      {
        images: [
          "/foto1/image4-1-9-1.jpg",
          "/foto1/image4-1-9-2.jpg",
          "/foto1/image4-1-9-3.jpg"
        ],
        characterNames: [
          "Амира",
          "Хацусэ Ино",
          "Идзуна Хацусэ"
        ],
        correctAnswer: "Нет игры, нет жизни"
      },
      {
        images: [
          "/foto1/image4-1-10-1.jpg",
          "/foto1/image4-1-10-2.jpg",
          "/foto1/image4-1-10-3.jpg"
        ],
        characterNames: [
          "Цукино",
          "Ютори Кокороги",
          "Сихо Савараги"
        ],
        correctAnswer: "Игра друзей"
      }
    ]
  },
  {
    type: "quiz_six",
    name: "Раунд 2: Тест-викторина (Романтика)",
    answerTime: 40,
    pauseDuration: 10,
    questions: [
      {
        text: "«Твоя апрельская ложь»: В чём именно заключалась та самая «ложь в апреле», которую Каори Миядзоно признала в своём посмертном письме к Косэю Ариме?",
        options: [
          "Она солгала, что её любимый композитор — Бетховен, а не Шопен",
          "Она сделала вид, что влюблена в Рёту Ватари, лишь бы приблизиться к Косэю",
          "Она соврала, что операция прошла успешно и она скоро вернётся на сцену",
          "Она скрыла, что потеряла слух так же, как и сам Косэй",
          "Она солгала, что никогда раньше не слышала его игру на рояле в детстве",
          "Она утверждала, что собирается бросить музыку ради учёбы за границей"
        ],
        correctAnswer: "Она сделала вид, что влюблена в Рёту Ватари, лишь бы приблизиться к Косэю"
      },
      {
        text: "«Волчица и пряности»: В каком особенном предмете мудрая волчица Холо постоянно хранит пшеничные колосья, позволяющие ей жить и не исчезнуть вдали от Паслоэ?",
        options: [
          "В серебряном фамильном медальоне с древними рунами Севера",
          "В полой рукояти серебряного кинжала, подаренного Лоуренсом",
          "В небольшом кожаном мешочке, который она носит на шее",
          "В старинном кошельке с золотыми монетами тренни",
          "В хрустальной фляжке из-под южного пряного вина",
          "В деревянном резном футляре в повозке Лоуренса"
        ],
        correctAnswer: "В небольшом кожаном мешочке, который она носит на шее"
      },
      {
        text: "«Милый во Франксе»: Как называлась иллюстрированная мрачная сказка, которую Ноль Два бережно хранила с детства и по мотивам которой строилась её связь с Хиро?",
        options: [
          "«Красная птица и железный рыцарь»",
          "«Одинокий зверь на краю мира»",
          "«Принцесса без крыльев»",
          "«Чудовище и принц» ",
          "«Детство Золотой ветви»",
          "«Слёзы алого дракона»"
        ],
        correctAnswer: "«Чудовище и принц» "
      },
      {
        text: "«Золотая пора»: Какое роковое происшествие на мосту в родном городе привело к падению Банри Тады в реку и полной потере его юношеских воспоминаний?",
        options: [
          "Внезапный обвал старых перил моста во время тайфуна",
          "Драка с хулиганами, столкнувшими его в воду",
          "Он оступился, пытаясь поймать унесённую ветром шляпу Линды",
          "Удар молнии в металлическую конструкцию опоры моста",
          "Его сбил проезжавший мимо скутер (мотороллер), когда он ждал Линду",
          "Лобовое столкновение с велосипедистом на высокой скорости"
        ],
        correctAnswer: "Его сбил проезжавший мимо скутер (мотороллер), когда он ждал Линду"
      },
      {
        text: "«Мастер Меча Онлайн» (Сложный вопрос): Какое легендарное блюдо приготовила Асуна на 22-м этаже из редчайшего мяса Рагу-кролика S-ранга, добытого Кирито?",
        options: [
          "Мясной пирог по древнему рецепту лесных эльфов Айнкрада",
          "Жареный стейк на углях с горчичной заправкой из трав 19-го этажа",
          "Изысканное тушёное рагу с соевым соусом и майонезом, воссозданными кулинарным навыком",
          "Запечённую вырезку под брусничным соусом из ягод лунного дерева",
          "Традиционное японское карри с корнеплодами 20-го этажа",
          "Копчёные ребрышки в глазури из дикого мёда пустошей"
        ],
        correctAnswer: "Изысканное тушёное рагу с соевым соусом и майонезом, воссозданными кулинарным навыком"
      },
      {
        text: "«Кланнад» (Сложный вопрос): Кем на самом деле является собранная из металлолома кукла-робот, сопровождающая маленькую девочку в пустынном Иллюзорном мире?",
        options: [
          "Воплощением коллективной души и древней магии города",
          "Духом покойного отца Нагисы — Акио Фурукавы",
          "Материализованным воспоминанием о первой встрече под сакурой",
          "Томоей Окадзаки, чьё сознание последовало в этот мир за Усио",
          "Нерождённым вторым ребёнком Томои и Нагисы",
          "Овеществлением первой собранной сферы света счастья"
        ],
        correctAnswer: "Томоей Окадзаки, чьё сознание последовало в этот мир за Усио"
      },
      {
        text: "«Монолог фармацевта»: Какое опасное косметическое средство стало причиной гибели младенца наложницы Рифы и её собственного тяжёлого отравления, что первой раскусила Маомао?",
        options: [
          "Эфирное масло для волос с экстрактом ядовитого аконита",
          "Румяна для щёк на основе толчёной киновари (ртути)",
          "Губная помада с добавлением белладонны для расширения зрачков",
          "Ароматические благовония, пропитанные беленым порошком",
          "Белая пудра для лица и тела, содержащая токсичный порошок свинца",
          "Мыло для умывания, сваренное на настое ядовитых грибов"
        ],
        correctAnswer: "Белая пудра для лица и тела, содержащая токсичный порошок свинца"
      },
      {
        text: "«Хоть я и бездарная злодейка»: По какой неожиданной причине хрупкая Корин Хуан искренне обрадовалась, когда завистливая Кэйгэцу Цзинь магией переселила её в своё тело?",
        options: [
          "Она мгновенно получила доступ к тайным императорским архивам",
          "Всю жизнь страдая от слабого здоровья и удушья, она наконец обрела сильное, выносливое тело и перестала задыхаться",
          "Новое тело обладало врождённым абсолютным иммунитетом ко всем дворцовым ядам",
          "Она смогла тайком покинуть Запретный город под видом простой служанки",
          "Наследный принц сразу же обратил на неё внимание из-за боевых навыков",
          "Она избавилась от многомиллионных карточных долгов своей благородной семьи"
        ],
        correctAnswer: "Всю жизнь страдая от слабого здоровья и удушья, она наконец обрела сильное, выносливое тело и перестала задыхаться"
      },
      {
        text: "«Аля иногда кокетничает со мной по-русски» (Сложный вопрос): По какой подлинной причине Масатика Кудзэ с раннего детства свободно понимает русский язык, скрывая это от Али?",
        options: [
          "Его отец дипломат несколько лет работал в консульстве в Санкт-Петербурге",
          "Он углублённо учил язык в спецшколе международных отношений",
          "В детстве в парке он подружился с русской девочкой Машей («Марией») и выучил русский язык, чтобы общаться с ней",
          "Его бабушка по материнской линии была русской дворянкой-эмигранткой",
          "Он самостоятельно изучил язык по старым советским мультфильмам и фильмам о космосе",
          "Он зубрил язык, чтобы читать редкие оригинальные романы русской классики"
        ],
        correctAnswer: "В детстве в парке он подружился с русской девочкой Машей («Марией») и выучил русский язык, чтобы общаться с ней"
      },
      {
        text: "«Твоё имя» (Сложный вопрос): Какая именно временная разница разделяла жизни Таки Татибаны в Токио и Мицухи Миямидзу в Итомори во время их обмена телами?",
        options: [
          "События Мицухи опережали время Таки ровно на 1 год",
          "События Мицухи происходили ровно на 3 года раньше, чем время, в котором жил Таки",
          "Разница составляла ровно 5 лет и 6 месяцев до падения кометы Тиамат",
          "Они жили в один и тот же год, но их воспоминания запаздывали на 30 дней",
          "Временной разрыв составлял ровно 7 лет между падением кометы и встречей на мосту",
          "Они существовали в параллельных ветках без разницы в годах"
        ],
        correctAnswer: "События Мицухи происходили ровно на 3 года раньше, чем время, в котором жил Таки"
      }
    ]
  },
  {
    type: "audio_guess",
    name: "Раунд 3: Что это за звук?",
    answerTime: 50,
    points: 2,
    pauseDuration: 10,
    questions: [
      { text: "Звук 1: Музыка первых серий", audio: "/audio4/r3-1.mp3", correctAnswer: "Реинкарнация безработного" },
      { text: "Звук 2: Отчаянный крик персонажа", audio: "/audio4/r3-2.mp3", correctAnswer: "Охотник х Охотник (Крик Гона)" },
      { text: "Звук 3: Саундтрек битвы (с 24 секунды)", audio: "/audio4/r3-3.mp3", correctAnswer: "Блич (Bleach — On the Precipice of Defeat)" },
      { text: "Звук 4: Культовая способность / фраза", audio: "/audio4/r3-4.mp3", correctAnswer: "Невероятные приключения ДжоДжо (The World / Za Warudo)" },
      { text: "Звук 5: Коронная фраза на английском", audio: "/audio4/r3-5.mp3", correctAnswer: "Восхождение в тени (I am Atomic)" },
      { text: "Звук 6: Взрывное заклинание волшебницы", audio: "/audio4/r3-6.mp3", correctAnswer: "Этот замечательный мир! / Коносуба (Взрыв Мегумин)" },
      { text: "Звук 7: Опенинг аниме", audio: "/audio4/r3-7.mp3", correctAnswer: "Хоримия" },
      { text: "Звук 8: Расширение территории", audio: "/audio4/r3-8.mp3", correctAnswer: "Магическая битва (Расширение территории Сатору Годзё)" },
      { text: "Звук 9: Музыка / саундтрек", audio: "/audio4/r3-9.mp3", correctAnswer: "Киберпанк: Бегущие по краю (Cyberpunk: Edgerunners)" },
      { text: "Звук 10: Звуки битвы", audio: "/audio4/r3-10.mp3", correctAnswer: "Человек-бензопила" }
    ]
  },
  {
    type: "memory_items",
    name: "Раунд 4: Запоминание предметов (Фото-память)",
    memorizeDuration: 15,
    answerTime: 15,
    pauseDuration: 10,
    points: 5,
    questions: [
      { text: "Картинка 1: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", correctAnswer: "Картинка 1", answerTime: 15 },
      { text: "Картинка 2: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", correctAnswer: "Картинка 2", answerTime: 15 },
      { text: "Картинка 3: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", correctAnswer: "Картинка 3", answerTime: 15 }
    ]
  },
  {
    type: "three_facts",
    name: "Раунд 5: 3 факта об аниме",
    answerTime: 50,
    pauseDuration: 10,
    points: 5,
    questions: ROUND5_QUESTIONS.map((q) => ({
      text: `Вопрос №${q.id}`,
      correctAnswer: q.animeTitle,
      facts: q.facts
    }))
  },
  {
    type: "before_after", // НОВЫЙ РАУНД 6
    name: "Раунд 6: Что было ДО / ПОСЛЕ?",
    answerTime: 40,
    pauseDuration: 10,
    points: 4,
    questions: [
      { text: "Что произошло ДО этого кадра?", image: "/foto6/round6_1.jpg" },
      { text: "Что произошло ПОСЛЕ этого кадра?", image: "/foto6/round6_2.jpg" },
      { text: "Что произошло ПОСЛЕ этого кадра?", image: "/foto6/round6_3.jpg" },
      { text: "Что произошло ДО этого кадра?", image: "/foto6/round6_4.jpg" },
      { text: "Что произошло ПОСЛЕ этого кадра?", image: "/foto6/round6_5.jpg" }
    ]
  },
  {
    type: "akinator",
    name: "Раунд 7: Акинатор (Угадай аниме с ИИ)",
    answerTime: 90,
    pauseDuration: 10,
    questions: [
      { text: "Вопрос 1: ИИ загадал секретное аниме для каждой команды. Задавайте вопросы на «Да/Нет/Частично» и угадайте его за 1.5 минуты!", correctAnswer: "Аниме угадано" },
      { text: "Вопрос 2: Новый раунд вопросов! ИИ загадал следующее секретное аниме. Задавайте вопросы и успейте угадать за 1.5 минуты!", correctAnswer: "Аниме угадано" },
      { text: "Вопрос 3: Финальный вопрос Акинатора! Задавайте вопросы и отгадайте третье секретное аниме за 1.5 минуты!", correctAnswer: "Аниме угадано" }
    ]
  },
  {
    type: "bingo",
    name: "Раунд 8: Аниме-Бинго (4×4)",
    answerTime: 0,
    questions: [
      {
        text: "Партия 1 из 3: Соберите 4 в ряд (12 баллов) или всё поле (24 балла). Штраф за ошибку: -3 балла.",
        correctAnswer: "Партия 1 завершена"
      },
      {
        text: "Партия 2 из 3: Новая сетка 4×4 и новый пул тайтлов! Соберите 4 в ряд или всё поле.",
        correctAnswer: "Партия 2 завершена"
      },
      {
        text: "Партия 3 из 3: Финальная партия Бинго! Соберите 4 в ряд или всё поле. Все баллы суммируются в копилку команды!",
        correctAnswer: "Партия 3 завершена"
      }
    ]
  },
  {
    type: "da_net",
    name: "Раунд 9: Да или Нет",
    answerTime: 0,
    questions: [
      { 
        text: "В данном раунде вы будете по очереди по номерам команд задавать вопрос администратору который имеет право отвечать только да или нет так же у него есть возможность солгать 3 раза после того как человек из первой команды спросил ему дали ответ спрашивает человек из 2 команды и так далее когда круг пройдет все начинаеться опять с первой команды пока не угадаете персонажа из аниме.",
        correctAnswer: "Персонаж угадан"
      }
    ]
  }
];

// ==================== КОМПОНЕНТ КАРТИНКИ ПЕРСОНАЖА ====================
function Round1CharacterCard({
  src,
  charName,
  qIdx,
  cIdx,
  customImage,
  isAdmin,
  onUpload
}: {
  src: string;
  charName?: string;
  qIdx: number;
  cIdx: number;
  customImage?: string;
  isAdmin?: boolean;
  onUpload?: (dataUrl: string) => void;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (customImage) list.push(customImage);
    // В первую очередь проверяем файлы по схеме пользователя в foto1
    list.push(`/foto1/image4-1-${qIdx + 1}-${cIdx + 1}.jpg`);
    list.push(`./foto1/image4-1-${qIdx + 1}-${cIdx + 1}.jpg`);
    list.push(`/foto1/image4-1-${qIdx + 1}-${cIdx + 1}.png`);
    list.push(`./foto1/image4-1-${qIdx + 1}-${cIdx + 1}.png`);
    if (src && !list.includes(src)) {
      list.push(src);
      if (src.includes('.png')) list.push(src.replace('.png', '.jpg'), src.replace('.png', '.jpeg'));
      if (src.includes('.jpg')) list.push(src.replace('.jpg', '.png'));
    }
    return list;
  }, [customImage, src, qIdx, cIdx]);

  useEffect(() => {
    setCandidateIdx(0);
    setAllFailed(false);
  }, [src, customImage, qIdx, cIdx]);

  const currentSrc = candidates[candidateIdx];

  const handleImgError = () => {
    if (candidateIdx < candidates.length - 1) {
      setCandidateIdx((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  if (allFailed || !currentSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-950/70 to-slate-950 text-center space-y-2 border border-purple-500/20">
        <span className="text-3xl">👤</span>
        <div className="text-xs font-bold text-white px-2 leading-tight">
          {charName || `Персонаж #${cIdx + 1}`}
        </div>
        <div className="text-[10px] text-purple-300/80">
          Фото персонажа
        </div>
        {isAdmin && onUpload && (
          <label className="mt-1 px-3 py-1 bg-purple-600/50 hover:bg-purple-600 border border-purple-400/50 rounded-xl text-[10px] font-bold text-white cursor-pointer transition-all">
            Загрузить фото
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) onUpload(ev.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={charName || `Персонаж ${cIdx + 1}`}
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover object-top transition-all"
      onError={handleImgError}
    />
  );
}

// ==================== КОМПОНЕНТ ПРОВЕРКИ 1 РАУНДА (С ВКЛАДКАМИ) ====================
function Round1ReviewPanel({
  roundQuestions,
  players,
  currentLiveQ,
  selectedTab,
  onSelectTab,
  onScoreSave
}: {
  roundQuestions: Question[];
  players: any;
  currentLiveQ: number;
  selectedTab: number | 'all';
  onSelectTab: (tab: number | 'all') => void;
  onScoreSave: (pId: string, qIdx: number, animeApproved: boolean, charApproved: [boolean, boolean, boolean]) => void;
}) {
  return (
    <div className="bg-slate-900/95 p-5 rounded-3xl border border-purple-500/30 space-y-4 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📋 Проверка ответов 1 раунда</span>
            {selectedTab !== 'all' ? (
              <span className="bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                Вопрос {selectedTab + 1}
              </span>
            ) : (
              <span className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                Все вопросы
              </span>
            )}
          </h4>
          <p className="text-[11px] text-gray-400">
            Ответы сохраняются и доступны для проверки на протяжении всей игры!
          </p>
        </div>
        {selectedTab !== 'all' && (
          <span className="text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-xl border border-green-500/20">
            Правильный тайтл: {roundQuestions[selectedTab]?.correctAnswer}
          </span>
        )}
      </div>

      {/* Навигационные вкладки между 10 вопросами */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3">
        {roundQuestions.map((_, qIndex) => {
          const answersCount = Object.values(players).filter((p: any) => 
            p.roundAnswers?.[1]?.[`q${qIndex}`]?.answered
          ).length;
          const hasUnchecked = Object.values(players).some((p: any) => 
            p.roundAnswers?.[1]?.[`q${qIndex}`]?.answered && !p.roundAnswers?.[1]?.[`q${qIndex}`]?.checked
          );
          const isCurrentLive = currentLiveQ === qIndex;
          const isSelected = selectedTab === qIndex;

          return (
            <button
              key={qIndex}
              onClick={() => onSelectTab(qIndex)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected 
                  ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400" 
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
              }`}
            >
              <span>В{qIndex + 1}</span>
              {answersCount > 0 && (
                <span className={`px-1 rounded-full text-[10px] ${isSelected ? 'bg-black/40 text-purple-200' : 'bg-black/30 text-gray-400'}`}>
                  {answersCount}
                </span>
              )}
              {hasUnchecked && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Есть непроверенные ответы" />
              )}
              {isCurrentLive && (
                <span className="text-[9px] text-emerald-400 font-black" title="Идёт сейчас">⏱</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => onSelectTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto ${
            selectedTab === 'all'
              ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400"
              : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
          }`}
        >
          📊 Все вопросы
        </button>
      </div>

      {/* Список ответов */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {(() => {
          const targetQList = selectedTab === 'all' 
            ? Array.from({ length: 10 }, (_, i) => i) 
            : [selectedTab];

          const questionsWithAnswers = targetQList.flatMap((qI) => {
            const qObj = roundQuestions[qI];
            return Object.entries(players)
              .filter(([_, p]: [string, any]) => p.roundAnswers?.[1]?.[`q${qI}`]?.answered)
              .map(([pId, p]: [string, any]) => ({
                pId,
                p,
                qI,
                qObj,
                ansData: p.roundAnswers[1][`q${qI}`],
                scoreKey: `1_q${qI}`,
              }));
          });

          if (questionsWithAnswers.length === 0) {
            return (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                {selectedTab === 'all' 
                  ? "Игроки пока не отправили ответов в 1 раунде." 
                  : `На Вопрос ${selectedTab + 1} ответов пока нет. Выберите вкладку с ответами выше.`}
              </p>
            );
          }

          return questionsWithAnswers.map(({ pId, p, qI, qObj, ansData, scoreKey }) => {
            const awarded = p.scores?.[scoreKey] || ansData.pointsAwarded || 0;
            const isAnimeOk = !!ansData.animeApproved;
            const charOks = ansData.charApproved || [false, false, false];

            return (
              <div key={`${pId}_${qI}`} className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{p.nickname}</span>
                    <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">К#{p.team + 1}</span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">Вопрос {qI + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-emerald-400">
                      Начислено: +{awarded} б.
                    </span>
                  </div>
                </div>

                {/* Аниме */}
                <div className="flex items-center justify-between gap-2 bg-white/5 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400">Тайтл игрока: </span>
                    <span className="font-bold text-white">«{ansData.answer || "не указал"}»</span>
                    <span className="text-[10px] text-gray-400 ml-2">(верно: {qObj.correctAnswer})</span>
                  </div>
                  <button
                    onClick={() => onScoreSave(pId, qI, !isAnimeOk, charOks)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      isAnimeOk ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {isAnimeOk ? '✓ Аниме (+2)' : '+2 за аниме'}
                  </button>
                </div>

                {/* 3 Персонажа */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {[0, 1, 2].map((cIdx) => {
                    const pGuess = ansData.characters?.[cIdx] || "—";
                    const correctCharName = qObj.characterNames?.[cIdx] || `Перс #${cIdx + 1}`;
                    const isCharOk = !!charOks[cIdx];

                    return (
                      <div key={cIdx} className="bg-white/5 p-2.5 rounded-xl flex flex-col justify-between gap-1.5 border border-white/5">
                        <div>
                          <div className="text-[10px] text-gray-400 font-bold truncate" title={correctCharName}>
                            {correctCharName}
                          </div>
                          <div className="text-white font-medium mt-0.5 truncate" title={pGuess}>
                            «{pGuess}»
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newCharOks = [...charOks] as [boolean, boolean, boolean];
                            newCharOks[cIdx] = !isCharOk;
                            onScoreSave(pId, qI, isAnimeOk, newCharOks);
                          }}
                          className={`w-full py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                            isCharOk ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                        >
                          {isCharOk ? `✓ Перс #${cIdx + 1} (+1)` : `+1 за Перс #${cIdx + 1}`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Быстрые кнопки */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold">Быстро:</span>
                  <button 
                    onClick={() => onScoreSave(pId, qI, true, [true, true, true])}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Все верно (+5)
                  </button>
                  <button 
                    onClick={() => onScoreSave(pId, qI, true, [false, false, false])}
                    className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Только аниме (+2)
                  </button>
                  <button 
                    onClick={() => onScoreSave(pId, qI, false, [false, false, false])}
                    className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Обнулить (0)
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

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
  const [charGuesses, setCharGuesses] = useState<string[]>(["", "", ""]);
  const [teammateSentNotice, setTeammateSentNotice] = useState(false);
  const lastQKeyRef = useRef<string>("");
  const suggestionDebounceRef = useRef<any>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySavedMsg, setKeySavedMsg] = useState("");
  const isDrivingReveal = useRef(false);
  const prevQKeyRef = useRef<string | null>(null);
  const localStartTimeRef = useRef<number | null>(null);
  const targetDurationRef = useRef<number>(25);
  const isFreshTransitionRef = useRef<boolean>(false);
  const gameStateRef = useRef<any>(null);
  const isStartingPauseRef = useRef<boolean>(false);

  // Вкладка проверки ответов 1 раунда (0..9 или 'all')
  const [r1ReviewQ, setR1ReviewQ] = useState<number | 'all'>(0);

  // Командные данные (аватарки, лидеры)
  const [teamsData, setTeamsData] = useState<Record<string, any>>({});
  const [isTeamSetupOpen, setIsTeamSetupOpen] = useState(false);
  const [isPlayerLeaderboardOpen, setIsPlayerLeaderboardOpen] = useState(false);
  const fileInputLobbyRef = useRef<HTMLInputElement>(null);
  const [isUploadingLobbyAvatar, setIsUploadingLobbyAvatar] = useState(false);
  const [lobbyStatusNotice, setLobbyStatusNotice] = useState("");

  // Вычисление данных текущей команды и статуса лидера
  const currentTeamId = user && !user.isAdmin && user.team !== undefined && user.team >= 0 ? user.team : null;
  const currentTeamInfo = currentTeamId !== null ? (teamsData[currentTeamId] || teamsData[String(currentTeamId)] || {}) : null;
  const currentTeamLeaderId = currentTeamInfo?.leaderId;
  const currentTeamLeaderName = currentTeamInfo?.leaderNickname;
  const hasTeamLeader = !!currentTeamLeaderId;
  const isCurrentUserLeader = !user?.isAdmin && currentTeamId !== null 
    ? (hasTeamLeader 
        ? (String(currentTeamLeaderId) === String(user?.id) || 
           (!!currentTeamLeaderName && !!user?.nickname && currentTeamLeaderName.trim().toLowerCase() === user.nickname.trim().toLowerCase()))
        : false)
    : false;
  const currentTeamMembers: any[] = currentTeamId !== null 
    ? Object.values(players || {}).filter((p: any) => p.team === currentTeamId) 
    : [];
  const otherTeammates: any[] = currentTeamMembers.filter((p: any) => p.id !== user?.id);
  const isGameStarted = !!gameState?.gameStarted || !!gameState?.teamSetupUnlocked;

  const handleLobbyAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || currentTeamId === null) return;
    if (!isCurrentUserLeader) {
      setLobbyStatusNotice("🔒 Только капитан может менять аватарку команды!");
      setTimeout(() => setLobbyStatusNotice(""), 3500);
      return;
    }
    setIsUploadingLobbyAvatar(true);
    try {
      const compressed = await compressTeamAvatar(file, 256);
      await restPatch(`teams/${currentTeamId}`, { avatar: compressed });
      setTeamsData(prev => ({
        ...prev,
        [currentTeamId]: {
          ...(prev[currentTeamId] || {}),
          avatar: compressed
        }
      }));
      setLobbyStatusNotice("✅ Аватарка команды успешно обновлена!");
      setTimeout(() => setLobbyStatusNotice(""), 3500);
    } catch (err) {
      console.error(err);
      setLobbyStatusNotice("❌ Ошибка при загрузке картинки");
      setTimeout(() => setLobbyStatusNotice(""), 3500);
    } finally {
      setIsUploadingLobbyAvatar(false);
      if (fileInputLobbyRef.current) fileInputLobbyRef.current.value = "";
    }
  };

  const handleClaimLeaderDirect = async () => {
    if (currentTeamId === null || !user) return;
    try {
      await restPatch(`teams/${currentTeamId}`, {
        leaderId: user.id,
        leaderNickname: user.nickname
      });
      setTeamsData(prev => ({
        ...prev,
        [currentTeamId]: {
          ...(prev[currentTeamId] || {}),
          leaderId: user.id,
          leaderNickname: user.nickname
        }
      }));
      setLobbyStatusNotice("👑 Вы стали капитаном команды!");
      setTimeout(() => setLobbyStatusNotice(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferLeaderDirect = async (target: any) => {
    if (currentTeamId === null || !target) return;
    const targetId = target.id || target._id;
    if (!targetId) {
      console.error("Target player has no id:", target);
      return;
    }
    try {
      await restPatch(`teams/${currentTeamId}`, {
        leaderId: targetId,
        leaderNickname: target.nickname
      });
      setTeamsData(prev => ({
        ...prev,
        [currentTeamId]: {
          ...(prev[currentTeamId] || {}),
          leaderId: targetId,
          leaderNickname: target.nickname
        }
      }));
      setLobbyStatusNotice(`👑 Лидерство передано игроку ${target.nickname}!`);
      setTimeout(() => setLobbyStatusNotice(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const syncTeammateSuggestion = (customAnime?: string, customChars?: string[], customOpt?: string) => {
    if (!user || user.isAdmin || currentTeamId === null || isCurrentUserLeader) return;

    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }

    const round = gameState?.currentRound;
    const question = gameState?.currentQuestion ?? 0;
    const animeVal = customAnime !== undefined ? customAnime : answerText;
    const charsVal = customChars !== undefined ? customChars : charGuesses;
    const optVal = customOpt;

    suggestionDebounceRef.current = setTimeout(async () => {
      try {
        const payload: any = {
          userId: user.id,
          nickname: user.nickname || "Игрок",
          avatar: user.avatar || null,
          round,
          question,
          anime: animeVal ? animeVal.trim() : "",
          characters: charsVal ? charsVal.map((c: string) => (c || "").trim()) : ["", "", ""],
          updatedAt: Date.now()
        };
        if (optVal !== undefined) {
          payload.selectedOption = optVal;
        }

        await restPatch(`teams/${currentTeamId}/suggestions/${user.id}`, payload);
      } catch (e) {
        console.error("Error syncing teammate suggestion:", e);
      }
    }, 400);
  };

  const submitTeammateSuggestionDirect = async (options?: {
    customAnime?: string;
    customChars?: string[];
    selectedOption?: string;
  }) => {
    if (!user || user.isAdmin || currentTeamId === null || isCurrentUserLeader) return;
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }

    const round = gameState?.currentRound;
    const question = gameState?.currentQuestion ?? 0;
    const animeVal = options?.customAnime !== undefined ? options.customAnime : answerText;
    const charsVal = options?.customChars !== undefined ? options.customChars : charGuesses;
    const optVal = options?.selectedOption;

    try {
      const payload: any = {
        userId: user.id,
        nickname: user.nickname || "Игрок",
        avatar: user.avatar || null,
        round,
        question,
        anime: animeVal ? animeVal.trim() : "",
        characters: charsVal ? charsVal.map((c: string) => (c || "").trim()) : ["", "", ""],
        updatedAt: Date.now()
      };
      if (optVal !== undefined) {
        payload.selectedOption = optVal;
      }

      await restPatch(`teams/${currentTeamId}/suggestions/${user.id}`, payload);
      setTeammateSentNotice(true);
      setTimeout(() => setTeammateSentNotice(false), 3500);

      // Optimistic update
      setTeamsData(prev => {
        const teamObj = prev[currentTeamId] || {};
        const suggestions = { ...(teamObj.suggestions || {}), [user.id]: payload };
        return {
          ...prev,
          [currentTeamId]: {
            ...teamObj,
            suggestions
          }
        };
      });
    } catch (e) {
      console.error("Error sending teammate suggestion:", e);
    }
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const getPlayerScore = (p: any) => {
    if (!p) return 0;
    let total = 0;
    if (typeof p.score === 'number') total += p.score;
    if (p.scores && typeof p.scores === 'object') {
      Object.values(p.scores).forEach((val: any) => {
        total += (Number(val) || 0);
      });
    }
    return total;
  };

  // Показ лидерборда поверх всего экрана
  const toggleLeaderboard = async () => {
    await restPatch('gameState', { showLeaderboard: !gameState?.showLeaderboard });
  };

  useEffect(() => {
    if (!gameState?.revealMode || !gameState?.active) {
      setShowRevealMode(false);
      return;
    }
    setShowRevealMode(true);
    setRevealIdx(gameState.currentQuestion || 0);
  }, [gameState?.revealMode, gameState?.currentQuestion, gameState?.active]);

  const [hasAnswered, setHasAnswered] = useState(false);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [isDoubleChoice, setIsDoubleChoice] = useState(false);
  const [preloaderStatus, setPreloaderStatus] = useState("");

  const testAudioRef = useRef<HTMLAudioElement>(null);
  const [isTestingSound, setIsTestingSound] = useState(false);

  useEffect(() => {
    if (testAudioRef.current) {
      testAudioRef.current.volume = volume;
      testAudioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

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

  // Синхронизация Firebase
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [resState, resPause, resReview, resGPause, resPlayers, resTeams] = await Promise.all([
          restGet('gameState').catch(e => { console.warn("gameState poll error:", e); return { data: null, serverTime: null }; }),
          restGet('gameState/pause').catch(() => ({ data: null })),
          restGet('gameState/answersReview').catch(() => ({ data: null })),
          restGet('gameState/globalPause').catch(() => ({ data: null })),
          restGet('players').catch(e => { console.warn("players poll error:", e); return { data: null }; }),
          restGet('teams').catch(() => ({ data: null }))
        ]);

        if (resState && resState.data) {
          const state = resState.data || {};
          const serverTime = resState.serverTime;

          if (serverTime) {
            setServerOffset(serverTime - Date.now());
          }

          if (user?.isAdmin && isDrivingReveal.current) {
            setGameState((prev: any) => ({
              ...state,
              currentQuestion: prev?.currentQuestion,
              currentRound: prev?.currentRound,
              revealMode: true
            }));
          } else {
            setGameState(state);
          }

          // ЕСЛИ СБРОС ИГРЫ — СБРАСЫВАЕМ ВСЕХ ИГРОКОВ В ЛОГИН
          if (user && !user.isAdmin && state?.reset) {
            localStorage.removeItem('quizUser');
            setUser(null);
            window.location.reload();
          }
        }

        if (resPause) setPauseState(resPause.data);
        if (resReview) setReviewState(resReview.data);
        if (resGPause) setGlobalPauseState(resGPause.data);

        // Гарантируем, что у каждого игрока всегда проставлен p.id = pId
        if (resPlayers && resPlayers.data !== null && resPlayers.data !== undefined) {
          const allPlayers = resPlayers.data;
          const normalizedPlayers: Record<string, any> = {};
          if (allPlayers && typeof allPlayers === 'object') {
            Object.entries(allPlayers).forEach(([pId, pData]: [string, any]) => {
              if (pData && typeof pData === 'object') {
                normalizedPlayers[pId] = { ...pData, id: pData.id || pId };
              }
            });
          }
          setPlayers(normalizedPlayers);

          // Если игрок был удален из базы администратором (после загрузки реального списка)
          if (user && !user.isAdmin && Object.keys(normalizedPlayers).length > 0 && !normalizedPlayers[user.id]) {
            localStorage.removeItem('quizUser');
            setUser(null);
            window.location.reload();
          }
        }

        // Нормализуем данные команд
        if (resTeams && resTeams.data !== null && resTeams.data !== undefined) {
          const allTeams = resTeams.data;
          const normalizedTeams: Record<string, any> = {};
          if (allTeams) {
            if (Array.isArray(allTeams)) {
              allTeams.forEach((tData, idx) => {
                if (tData) normalizedTeams[String(idx)] = tData;
              });
            } else if (typeof allTeams === 'object') {
              Object.entries(allTeams).forEach(([tKey, tData]) => {
                if (tData) normalizedTeams[tKey] = tData;
              });
            }
          }
          setTeamsData(normalizedTeams);
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Таймер раунда
  useEffect(() => {
    if (!gameState?.active || !user || gameState.roundFinished) {
      setTimeLeft(0);
      isFreshTransitionRef.current = false;
      prevQKeyRef.current = null;
      return;
    }

    const duration = roundsData[gameState.currentRound]?.questions[gameState.currentQuestion]?.answerTime || 
                     roundsData[gameState.currentRound]?.answerTime || 25;

    const qKey = `${gameState.currentRound}-${gameState.currentQuestion}`;
    if (prevQKeyRef.current !== qKey) {
      prevQKeyRef.current = qKey;
      
      const now = Date.now() + serverOffset;
      const serverDiff = gameState.endTime ? Math.max(0, Math.ceil((gameState.endTime - now) / 1000)) : duration;
      const elapsedSinceStart = Math.max(0, duration - serverDiff);
      
      localStartTimeRef.current = Date.now() - (elapsedSinceStart * 1000);
      targetDurationRef.current = duration;
      isFreshTransitionRef.current = true;
    }

    if (globalPause?.active || pauseState?.active) {
      if (gameState.timeLeft !== undefined) setTimeLeft(gameState.timeLeft);
      return;
    }

    const updateTimer = () => {
      let diff = 0;
      if (isFreshTransitionRef.current && localStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - localStartTimeRef.current) / 1000);
        diff = Math.max(0, targetDurationRef.current - elapsed);
      } else {
        if (!gameState.endTime) {
          if (gameState.timeLeft !== undefined) setTimeLeft(gameState.timeLeft);
          return;
        }
        const now = Date.now() + serverOffset;
        diff = Math.max(0, Math.ceil((gameState.endTime - now) / 1000));
      }
      
      setTimeLeft(diff);

      const currentRType = roundsData[gameState.currentRound]?.type;
      if (user.isAdmin && diff <= 0 && !gameState.revealMode && currentRType !== "da_net" && currentRType !== "bingo" && currentRType !== "memory_items" && (gameState.endTime > 0)) {
        startPauseBetweenQuestions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [gameState?.active, gameState?.currentRound, gameState?.currentQuestion, gameState?.endTime, gameState?.timeLeft, globalPause?.active, pauseState?.active, gameState?.roundFinished, user?.isAdmin]);

  // Проверка сданного ответа и сброс полей только при переключении вопроса
  useEffect(() => {
    if (!gameState?.active || !user || user.isAdmin) return;
    
    const qKey = `${gameState.currentRound}_${gameState.currentQuestion}`;
    const isNewQuestion = lastQKeyRef.current !== qKey;

    if (isNewQuestion) {
      lastQKeyRef.current = qKey;
      setHasAnswered(false);
      setAnswerText("");
      setCharGuesses(["", "", ""]);
      setTeammateSentNotice(false);
    }
    
    const qIdx = gameState.currentQuestion ?? 0;
    const checkAnswered = async () => {
      try {
        const teamLeaderId = currentTeamLeaderId;
        const targetId = teamLeaderId || user.id;
        let ansData: any = null;

        // 1. Проверяем командный ответ из teamsData
        const teamAns = currentTeamId !== null
          ? (teamsData?.[currentTeamId]?.answers?.[`r${gameState.currentRound}_q${qIdx}`] || 
             (teamsData?.[currentTeamId]?.lastAnswer?.round === gameState.currentRound && teamsData?.[currentTeamId]?.lastAnswer?.question === qIdx ? teamsData?.[currentTeamId]?.lastAnswer : null))
          : null;

        if (teamAns?.answer) {
          ansData = { answered: true, answer: teamAns.answer, characters: teamAns.characters };
        } else {
          // 2. Проверяем ответы игроков
          const { data: userAns } = await restGet(`players/${user.id}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
          if (userAns?.answered) {
            ansData = userAns;
          } else if (targetId !== user.id) {
            const { data: leaderAns } = await restGet(`players/${targetId}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
            if (leaderAns?.answered) ansData = leaderAns;
          }
        }

        if (ansData?.answered) {
          setHasAnswered(true);
          setAnswerText(ansData.answer || "");
          if (Array.isArray(ansData.characters)) {
            setCharGuesses([ansData.characters[0] || "", ansData.characters[1] || "", ansData.characters[2] || ""]);
          }
        }
      } catch (e) {
        console.error("Error checking answer:", e);
      }
    };
    checkAnswered();
  }, [gameState?.currentQuestion, gameState?.currentRound, gameState?.active, user?.id, user?.isAdmin, currentTeamLeaderId, currentTeamId]);

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
    setTimeout(() => setPreloaderStatus("✅ Ресурсы готовы"), 2000);
  };

  const handleJoin = async () => {
    if (!nickname) { setError("Введите никнейм"); return; }
    
    // Ограничение: максимум 3 человека в команде
    const targetTeamMembers = Object.values(players || {}).filter(
      (p: any) => p.team === selectedTeam && p.id !== (user?.id)
    );
    if (targetTeamMembers.length >= 3) {
      setError("В этой команде уже 3 игрока (максимум)! Пожалуйста, выберите другую команду.");
      return;
    }

    const id = isChangingTeam && user ? user.id : `${nickname}_${Date.now()}`;
    const newUser = { nickname, team: selectedTeam, isAdmin: false, id };
    
    await restPut(`players/${id}`, { id, nickname, team: selectedTeam, score: (isChangingTeam ? getPlayerScore(players[user?.id]) : 0), isAdmin: false });
    setUser(newUser);
    localStorage.setItem('quizUser', JSON.stringify(newUser));
    setIsChangingTeam(false);
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

  // Выход на главную страницу (для админа и игроков)
  const handleLogout = async (skipConfirm: boolean = false) => {
    if (!skipConfirm && !user?.isAdmin) {
      if (!confirm("Вы уверены, что хотите выйти на главную страницу выбора команды / ника?")) return;
    }
    // Если выходит обычный игрок, удаляем его из базы Firebase, чтобы освободить место в команде
    if (user && !user.isAdmin && user.id) {
      try {
        await restDelete(`players/${user.id}`);
      } catch (e) {
        console.warn("Error removing player on logout:", e);
      }
    }
    localStorage.removeItem('quizUser');
    setUser(null);
    setIsChangingTeam(false);
  };

  // ПОЛНЫЙ СБРОС ИГРЫ: ОЧИЩАЕТ ВСЕХ ИГРОКОВ ВО ВСЕХ КОМАНДАХ
  const resetGame = async () => {
    if (!confirm("Вы уверены, что хотите полностью сбросить игру? Все игроки во всех командах будут удалены!")) return;
    
    // 1. Полностью очищаем ветку игроков и команд в Firebase
    await restDelete('players');
    await restDelete('teams');
    setPlayers({});
    setTeamsData({});

    // 2. Сбрасываем gameState и даем сигнал reset: true
    await restPut('gameState', {
      active: false,
      gameStarted: false,
      teamSetupUnlocked: false,
      currentRound: 0,
      currentQuestion: 0,
      roundFinished: false,
      revealMode: false,
      showLeaderboard: false,
      reset: true
    });
    
    await restDelete('gameState/pause');
    await restDelete('gameState/answersReview');
    await restDelete('gameState/globalPause');

    setTimeout(async () => {
      await restPatch('gameState', { reset: false });
    }, 2000);
  };

  const startRevealMode = async (idx: number) => {
    const round = roundsData[idx];
    isDrivingReveal.current = true;
    await restPatch('gameState', { revealMode: true, currentQuestion: 0, active: true, currentRound: idx, showLeaderboard: false, endTime: null });
    
    if (round.type === "akinator" || round.type === "bingo") {
      for (let i = 0; i < round.questions.length; i++) {
        setGameState((prev: any) => ({ ...prev, currentQuestion: i }));
        await restPatch('gameState', { currentQuestion: i });
        await new Promise(r => setTimeout(r, 10000));
      }
      await restPatch('gameState', { revealMode: false, active: false, roundFinished: true });
      isDrivingReveal.current = false;
      return;
    }

    for (let i = 0; i < round.questions.length; i++) {
      setGameState((prev: any) => ({ ...prev, currentQuestion: i }));
      await restPatch('gameState', { currentQuestion: i });
      await new Promise(r => setTimeout(r, 14000));
    }
    await restPatch('gameState', { revealMode: false, active: false, roundFinished: true });
    isDrivingReveal.current = false;
  };

  const startRound = async (idx: number) => {
    const round = roundsData[idx];
    const duration = round.questions[0]?.answerTime || round.answerTime || 25;
    const newState: any = {
      active: true,
      currentRound: idx,
      currentQuestion: 0,
      roundFinished: false,
      timeLeft: duration,
      endTime: Date.now() + duration * 1000,
      showAnswer: false,
      reset: false,
      gameStarted: true,
      teamSetupUnlocked: true
    };

    if (round.type === "three_facts") {
      newState.factsRevealed = 1;
    }

    if (round.type === "da_net") {
      newState.currentTeamTurn = 0;
      newState.liesLeft = 3;
      newState.endTime = 0;
    }

    // РАУНД 8: БИНГО (ПАРТИЯ 1)
    if (round.type === "bingo") {
      newState.endTime = 0;
      newState.timeLeft = 0;
      newState.currentQuestion = 0; // Начинаем строго с 1-й партии
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
          lastPenaltyNotice: null
        };
      }
      newState.bingo = {
        gameIndex: 0,
        pool32: pool,
        revealedCount: 0,
        lastRevealed: [],
        teams: initialTeams,
        roundOver: false
      };
    }

    if (round.type === "akinator") {
      const shuffled = [...AKINATOR_ANIME_LIST].sort(() => 0.5 - Math.random());
      const akinatorState: Record<string, any> = {
        startedAt: Date.now()
      };
      let ptr = 0;
      for (let q = 0; q < round.questions.length; q++) {
        const qTeams: Record<string, any> = {};
        for (let t = 0; t < TOTAL_TEAMS; t++) {
          const picked = shuffled[ptr % shuffled.length];
          ptr++;
          qTeams[t] = {
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
        akinatorState[`q${q}`] = { teams: qTeams };
      }
      akinatorState.teams = akinatorState.q0.teams;
      newState.akinator = akinatorState;
    }

    if (round.type === "memory_items") {
      newState.memoryStage = 0;
      newState.memorySubQuestion = 0;
      newState.memoryPhase = "memorize";
      newState.memoryEndTime = Date.now() + 15 * 1000;
      newState.memoryTimeLeft = 15;
      newState.timeLeft = 15;
      newState.endTime = Date.now() + 15 * 1000;
    }

    setGameState((prev: any) => ({ ...(prev || {}), ...newState }));
    await restPatch('gameState', newState);
  };

  const skipQuestion = async () => {
    if (!user?.isAdmin || !gameState?.active || pauseState?.active) return;
    await startPauseBetweenQuestions();
  };

  const nextRound9Team = async () => {
    if (!user?.isAdmin || gameState?.currentRound === undefined) return;
    const currentTeam = gameState.currentTeamTurn || 0;
    let nextTeam = (currentTeam + 1) % TOTAL_TEAMS;
    let attempts = 0;
    const teamHasPlayers = (tIdx: number) => Object.values(players).some((p: any) => p.team === tIdx);
    
    while (!teamHasPlayers(nextTeam) && attempts < TOTAL_TEAMS) {
      nextTeam = (nextTeam + 1) % TOTAL_TEAMS;
      attempts++;
    }
    await restPatch('gameState', { currentTeamTurn: nextTeam });
  };

  const markRound9Correct = async (teamIdx: number) => {
    if (!user?.isAdmin) return;
    const scoreKey = `round9_win`;
    const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === teamIdx);
    
    if (teamPlayers.length === 0) {
      alert(`В команде ${teamIdx + 1} нет игроков.`);
      return;
    }

    await Promise.all(teamPlayers.map(([id, _]) => 
      restPut(`players/${id}/scores/${scoreKey}`, 10)
    ));
    
    alert(`Команда ${teamIdx + 1} угадала! +10 баллов начислено.`);
    await restPatch('gameState', { roundFinished: true, showAnswer: true });
  };

  const useRound9Lie = async () => {
    if (!user?.isAdmin || (gameState?.liesLeft || 0) <= 0) return;
    await restPatch('gameState', { liesLeft: (gameState.liesLeft || 0) - 1 });
  };

  const startPauseBetweenQuestions = async () => {
    if (isStartingPauseRef.current || pauseState?.active) return;
    isStartingPauseRef.current = true;

    try {
      const currentGameState = gameStateRef.current || gameState;
      const round = roundsData[currentGameState.currentRound];
      if (!round || round.type === "da_net" || round.type === "bingo" || round.type === "memory_items") {
        isStartingPauseRef.current = false;
        return;
      }
      const duration = round.pauseDuration || 10;
      const endTime = Date.now() + duration * 1000;
      await restPut('gameState/pause', { active: true, endTime, skip: false });
      await restPatch('gameState', { showAnswer: false, endTime: null }); 

      const checkPause = setInterval(async () => {
        try {
          const { data: p } = await restGet('gameState/pause');
          if (!p) {
            clearInterval(checkPause);
            isStartingPauseRef.current = false;
            return;
          }
          const latestGameState = gameStateRef.current || gameState;
          if (p.skip || (Date.now() + serverOffset) >= p.endTime) {
            clearInterval(checkPause);
            await restDelete('gameState/pause');
            isStartingPauseRef.current = false;

            const nextQ = latestGameState.currentQuestion + 1;
            if (nextQ < round.questions.length) {
              const qDuration = round.questions[nextQ].answerTime || round.answerTime || 25;
              const updateData: any = { 
                currentQuestion: nextQ, 
                timeLeft: qDuration,
                endTime: Date.now() + qDuration * 1000,
                pause: null
              };
              if (round.type === "three_facts") {
                updateData.factsRevealed = 1;
              }
              if (round.type === "akinator" && latestGameState.akinator?.[`q${nextQ}`]?.teams) {
                updateData["akinator/teams"] = latestGameState.akinator[`q${nextQ}`].teams;
              }
              await restPatch('gameState', updateData);
            } else {
              await restPatch('gameState', { active: false, roundFinished: true, pause: null });
            }
          }
        } catch (intervalErr) {
          console.error("Error in checkPause interval:", intervalErr);
        }
      }, 1000);
    } catch (err) {
      console.error("Error starting pause:", err);
      isStartingPauseRef.current = false;
    }
  };

  const submitAnswer = async (overrideAnswer?: string) => {
    // Только капитан команды может отправлять ответ!
    if (!user?.isAdmin && currentTeamId !== null && !isCurrentUserLeader) {
      return;
    }

    const finalAnswer = typeof overrideAnswer === "string" ? overrideAnswer : answerText;
    const round = roundsData[gameState.currentRound];
    if (hasAnswered) return;

    if (round.type === "three_characters") {
      if (!finalAnswer.trim() && !charGuesses.some(g => g.trim())) return;
    } else {
      if (!finalAnswer.trim()) return;
    }

    let potentialPoints = round.points !== undefined ? round.points : 2;
    
    if (round.type === "three_facts") {
      const fr = Math.min(3, Math.max(1, gameState.factsRevealed || 1));
      potentialPoints = fr === 1 ? 5 : (fr === 2 ? 4 : 3);
    } else if (round.type === "before_after") {
      potentialPoints = 4; // 6 Раунд = 4 балла
    } else if (round.points !== undefined) {
      potentialPoints = round.points;
    } else if (round.type === "test_round") {
      potentialPoints = 2;
    } else if (round.type === "audio_guess") {
      potentialPoints = gameState.currentRound === 3 ? 2 : 3;
    }

    if (round.type === "quiz_six") {
      potentialPoints = 4;
    }

    if (round.type === "three_characters") {
      potentialPoints = 5;
    }

    const currentQIdx = gameState.currentQuestion ?? 0;
    const currentQuestion = round.questions[currentQIdx];

    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    const payload: any = { 
      answered: true, 
      answer: finalAnswer, 
      timestamp: Date.now(),
      potentialPoints,
      factsRevealedAtAnswer: gameState.factsRevealed || 1,
      isDouble: gameState.currentRound === 3 ? false : isDoubleChoice 
    };

    if (round.type === "three_characters") {
      payload.characters = charGuesses.map(g => g.trim());
    }

    if (round.type === "quiz_six") {
      const isCorrect = currentQuestion.correctAnswer 
        ? finalAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase()
        : false;
      
      payload.checked = true;
      payload.correct = isCorrect;
      
      const scoreKey = `${gameState.currentRound}_q${gameState.currentQuestion}`;
      const finalPoints = isCorrect ? 4 : 0;
      await restPut(`players/${user.id}/scores/${scoreKey}`, finalPoints);
    }

    await restPut(path, payload);
    setHasAnswered(true);
    setIsDoubleChoice(false);

    if (currentTeamId !== null) {
      const teamAnsPayload: any = {
        round: gameState.currentRound,
        question: gameState.currentQuestion,
        answer: finalAnswer,
        timestamp: Date.now(),
        by: user.nickname
      };
      if (round.type === "three_characters") {
        teamAnsPayload.characters = charGuesses.map(g => g.trim());
      }
      if (round.type === "quiz_six") {
        teamAnsPayload.selectedOption = finalAnswer;
      }
      restPatch(`teams/${currentTeamId}`, {
        lastAnswer: teamAnsPayload,
        [`answers/r${gameState.currentRound}_q${gameState.currentQuestion}`]: teamAnsPayload
      }).catch(console.error);

      setTeamsData(prev => ({
        ...prev,
        [currentTeamId]: {
          ...(prev[currentTeamId] || {}),
          lastAnswer: teamAnsPayload,
          answers: {
            ...((prev[currentTeamId] || {}).answers || {}),
            [`r${gameState.currentRound}_q${gameState.currentQuestion}`]: teamAnsPayload
          }
        }
      }));
    }
  };

  const toggleShowAnswer = async () => {
    await restPatch('gameState', { showAnswer: !gameState.showAnswer });
  };

  const markAnswer = async (playerId: string, roundIdx: number, qKey: string, basePoints: number) => {
    const p = players[playerId];
    if (p) {
      const scoreKey = qKey.startsWith("stage") ? `round4_${qKey}` : `${roundIdx}_${qKey}`;
      try {
        const answerData = p.roundAnswers?.[roundIdx]?.[qKey] || {};
        let finalPoints = basePoints;

        if (roundIdx === 3) {
          finalPoints = basePoints > 0 ? 2 : 0;
        } else if (answerData.isDouble) {
          finalPoints = basePoints > 0 ? basePoints * 2 : -2;
        }

        await restPut(`players/${playerId}/scores/${scoreKey}`, finalPoints);
        await restPatch(`players/${playerId}/roundAnswers/${roundIdx}/${qKey}`, { 
          checked: true,
          pointsAwarded: finalPoints
        });
        
        const res = await restGet('players');
        if (res.data) setPlayers(res.data);
      } catch (e) {
        console.error("Error marking answer:", e);
      }
    }
  };

  // Раздельная оценка для 1 раунда (Аниме + 3 персонажа)
  const setDetailedRound1Score = async (
    playerId: string, 
    qIdx: number, 
    animeApproved: boolean, 
    charApproved: [boolean, boolean, boolean]
  ) => {
    const scoreKey = `1_q${qIdx}`;
    let totalPoints = animeApproved ? 2 : 0;
    charApproved.forEach(ok => { if (ok) totalPoints += 1; });

    try {
      await restPut(`players/${playerId}/scores/${scoreKey}`, totalPoints);
      await restPatch(`players/${playerId}/roundAnswers/1/q${qIdx}`, {
        checked: true,
        animeApproved,
        charApproved,
        pointsAwarded: totalPoints
      });
      const res = await restGet('players');
      if (res.data) setPlayers(res.data);
    } catch (e) {
      console.error("Error setting detailed round 1 score:", e);
    }
  };

  // ==================== РЕНДЕР ====================
  if (!user || isChangingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl glass p-12 rounded-[3rem] neon-border text-center">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-tighter"
          >
            {isChangingTeam ? "🎌 Смена команды" : "🎌 Аниме Викторина"}
          </motion.h1>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Твой никнейм</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50" 
                placeholder="Введи имя..." 
                value={nickname}
                disabled={isChangingTeam}
                onChange={(e) => setNickname(e.target.value.slice(0, 50))}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Выбери команду</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: TOTAL_TEAMS }, (_, i) => i).map(t => {
                  const members = Object.values(players || {}).filter((p: any) => p.team === t);
                  const count = members.length;
                  const isFull = isChangingTeam && user?.team === t ? false : count >= 3;
                  const isSelected = selectedTeam === t;
                  const tAvatar = teamsData?.[t]?.avatar;

                  return (
                    <button 
                      key={t}
                      type="button"
                      disabled={isFull}
                      className={`p-3 rounded-2xl font-bold transition-all border-2 flex flex-col items-center justify-center relative ${
                        isFull
                          ? 'bg-white/5 border-red-500/20 text-gray-500 opacity-50 cursor-not-allowed'
                          : isSelected 
                            ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/30 scale-105 cursor-pointer text-white' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer text-white hover:border-purple-500/30'
                      }`}
                      onClick={() => setSelectedTeam(t)}
                    >
                      {tAvatar ? (
                        <img
                          src={tAvatar}
                          alt={`Команда ${t + 1}`}
                          className="w-9 h-9 rounded-full object-cover mb-1 border border-purple-400/50 shadow-md"
                        />
                      ) : (
                        <span className="text-base font-black">#{t + 1}</span>
                      )}
                      <span className={`text-[10px] font-mono mt-0.5 ${count >= 3 ? 'text-red-400 font-bold' : count > 0 ? 'text-purple-300' : 'text-gray-400'}`}>
                        {count}/3
                      </span>
                      {isFull && <span className="text-[8px] uppercase tracking-wider text-red-400 font-bold">Полная</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={handleJoin} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                {isChangingTeam ? "Сохранить" : "Присоединиться"}
              </button>
              {!isChangingTeam && (
                <button onClick={handleAdminLogin} className="sm:w-1/3 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95">
                  Админ
                </button>
              )}
              {isChangingTeam && (
                <button onClick={() => setIsChangingTeam(false)} className="sm:w-1/3 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95">
                  Отмена
                </button>
              )}
            </div>
            {error && <p className="text-red-400 font-medium animate-pulse">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* ПОВЕРХНОСТНАЯ ТАБЛИЦА ЛИДЕРОВ ДЛЯ ВСЕХ */}
      <TeamLeaderboardModal
        isOpen={!!gameState?.showLeaderboard || isPlayerLeaderboardOpen}
        onClose={() => {
          if (user?.isAdmin && gameState?.showLeaderboard) {
            toggleLeaderboard();
          } else {
            setIsPlayerLeaderboardOpen(false);
          }
        }}
        players={players}
        teamsData={teamsData}
        getPlayerScore={getPlayerScore}
        TOTAL_TEAMS={TOTAL_TEAMS}
        isAdmin={user?.isAdmin}
      />

      {/* МОДАЛЬНОЕ ОКНО НАСТРОЙКИ КОМАНДЫ (АВАТАРКА, ЛИДЕР) */}
      <TeamSetupModal
        isOpen={isTeamSetupOpen}
        onClose={() => setIsTeamSetupOpen(false)}
        user={user}
        players={players}
        teamsData={teamsData}
        restPatch={restPatch}
        onLeaderUpdate={(newLeaderId, newLeaderNick) => {
          if (currentTeamId === null) return;
          setTeamsData(prev => ({
            ...prev,
            [currentTeamId]: {
              ...(prev[currentTeamId] || {}),
              leaderId: newLeaderId,
              leaderNickname: newLeaderNick
            }
          }));
        }}
      />

      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 glass p-8 rounded-[2.5rem] neon-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Аниме Викторина</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">{user.nickname}</span>
                {user.isAdmin ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-500/30 uppercase tracking-widest">Админ</span>
                    <button
                      onClick={() => handleLogout(true)}
                      className="text-[11px] bg-red-600/30 hover:bg-red-600/60 text-red-200 hover:text-white border border-red-500/40 px-2.5 py-1 rounded-xl uppercase tracking-wider font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                      title="Выйти из режима админа на главную страницу (для тестирования от лица игрока)"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      Выйти на главную
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">Команда #{user.team + 1}</span>
                    {!gameState?.active && !gameState?.gameStarted && (
                      <button 
                        onClick={() => {
                          setSelectedTeam(user.team);
                          setNickname(user.nickname);
                          setIsChangingTeam(true);
                        }}
                        className="text-[10px] text-gray-400 hover:text-white underline uppercase tracking-widest cursor-pointer"
                      >
                        Сменить команду
                      </button>
                    )}
                    {(user?.isAdmin || !!gameState?.showLeaderboard) && (
                      <button
                        onClick={() => setIsPlayerLeaderboardOpen(true)}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-black flex items-center gap-1 cursor-pointer transition-all"
                        title="Посмотреть текущий счёт всех команд"
                      >
                        <Trophy className="w-3 h-3 text-amber-400" />
                        Счёт команд
                      </button>
                    )}
                    <button
                      onClick={() => setIsTeamSetupOpen(true)}
                      className="text-[10px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-black flex items-center gap-1 cursor-pointer transition-all"
                    >
                      👑 Штаб команды
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full">
              <button 
                onClick={() => {
                  if (testAudioRef.current) {
                    if (isTestingSound) {
                      testAudioRef.current.pause();
                      testAudioRef.current.currentTime = 0;
                      setIsTestingSound(false);
                    } else {
                      testAudioRef.current.play().catch(e => console.warn("Audio play failed:", e));
                      setIsTestingSound(true);
                    }
                  }
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${isTestingSound ? 'bg-green-500 border-green-400 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                {isTestingSound ? 'СТОП ТЕСТ' : 'ТЕСТ ЗВУКА'}
              </button>
              <div className="flex items-center gap-3 ml-2">
                <div onClick={() => setIsMuted(!isMuted)} className="cursor-pointer hover:scale-110 transition-transform">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            <button
              onClick={() => handleLogout(user?.isAdmin ? true : false)}
              className={`px-4 py-2 rounded-full border font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95 ${
                user.isAdmin
                  ? 'bg-red-600/30 hover:bg-red-600/60 text-red-200 hover:text-white border-red-500/50 hover:shadow-red-600/20'
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border-white/10'
              }`}
              title={user.isAdmin ? "Выйти из режима админа на главный экран выбора команды" : "Выйти на главный экран"}
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>{user.isAdmin ? "Выйти из админки" : "На главную"}</span>
            </button>
          </div>
        </header>

      {/* ПАНЕЛЬ БАЛЛОВ ВСЕХ КОМАНД ДЛЯ ВЕДУЩЕГО (Видна всегда) */}
      {user.isAdmin && (
        <div className="mb-6 p-4 md:p-5 rounded-[2rem] bg-gradient-to-r from-purple-950/70 via-slate-900/80 to-indigo-950/70 border border-purple-500/30 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Счёт всех команд:
            </span>
            <span className="text-[11px] text-gray-400">
              Всего игроков: {Object.keys(players).length}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: TOTAL_TEAMS }).map((_, tIdx) => {
              const tPlayers = Object.values(players).filter((p: any) => p.team === tIdx);
              const tScore = tPlayers.reduce((acc: number, p: any) => acc + getPlayerScore(p), 0);
              const tAvatar = teamsData?.[tIdx]?.avatar;
              const tLeader = teamsData?.[tIdx]?.leaderNickname;
              return (
                <div key={tIdx} className="bg-black/50 border border-white/10 rounded-2xl p-2 text-center transition-all hover:border-purple-500/50 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-500/40 bg-purple-950/40 flex items-center justify-center mb-1 shadow-sm">
                    {tAvatar ? (
                      <img src={tAvatar} alt={`К#${tIdx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">К#{tIdx + 1}</div>
                  <div className="text-base font-black text-purple-300">
                    {user?.isAdmin || gameState?.showLeaderboard ? tScore : '❓'}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate max-w-full">
                    {tPlayers.length > 0 ? `${tPlayers.length} игр.` : 'пусто'}
                  </div>
                  {tLeader && (
                    <div className="text-[8px] text-amber-300 font-bold truncate max-w-full" title={`Капитан: ${tLeader}`}>
                      👑 {tLeader}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <audio 
        ref={testAudioRef} 
        src={getAssetPath("test_sound.mp3")} 
        onEnded={() => setIsTestingSound(false)}
      />

      {/* Командный баннер игрока (Аватарка, Капитан, Кнопка настройки) */}
      {!user?.isAdmin && (
        <TeamHeaderBanner
          user={user}
          players={players}
          teamsData={teamsData}
          onOpenTeamSetup={() => setIsTeamSetupOpen(true)}
          onOpenLeaderboard={() => setIsPlayerLeaderboardOpen(true)}
          isTeamSetupUnlocked={!!gameState?.gameStarted || !!gameState?.teamSetupUnlocked}
          isScoreVisible={!!gameState?.showLeaderboard}
          restPatch={restPatch}
          onLeaderUpdate={(newLeaderId, newLeaderNick) => {
            if (currentTeamId === null) return;
            setTeamsData(prev => ({
              ...prev,
              [currentTeamId]: {
                ...(prev[currentTeamId] || {}),
                leaderId: newLeaderId,
                leaderNickname: newLeaderNick
              }
            }));
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="min-h-[500px]">
        {(() => {
          // СПЕЦИАЛЬНО ДЛЯ ВЕДУЩЕГО: ЕСЛИ РАУНД 1 ЗАКОНЧИЛСЯ, ПАНЕЛЬ ПРОВЕРКИ ОСТАЕТСЯ, ПОКА ВЕДУЩИЙ НЕ ЗАПУСТИТ СЛЕДУЮЩИЙ РАУНД!
          const isRound1FinishedWaiting = user?.isAdmin && 
            gameState?.currentRound === 1 && 
            Boolean(gameState?.roundFinished);

          if (isRound1FinishedWaiting) {
            return (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-900/80 via-slate-900/90 to-indigo-900/80 rounded-3xl border border-purple-500/40 text-center shadow-2xl backdrop-blur-md">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Все 10 вопросов 1 раунда завершены!
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Проверьте ответы игроков перед запуском 2-го раунда
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-1 max-w-xl mx-auto">
                    Переключайтесь по вкладкам от В1 до В10 или откройте «Все вопросы». Игроки сейчас находятся на экране ожидания. Когда закончите оценку — нажмите «Раунд 2» в панели управления внизу!
                  </p>
                </div>

                <Round1ReviewPanel
                  roundQuestions={roundsData[1].questions}
                  players={players}
                  currentLiveQ={gameState.currentQuestion ?? 9}
                  selectedTab={r1ReviewQ}
                  onSelectTab={setR1ReviewQ}
                  onScoreSave={(pId, qIdx, animeOk, charOks) => setDetailedRound1Score(pId, qIdx, animeOk, charOks)}
                />
              </div>
            );
          }

          const round = gameState?.active ? roundsData[gameState.currentRound] : null;

          if (pauseState?.active) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl font-bold text-yellow-500 mb-4 animate-pulse">⏸ ПАУЗА</div>
                <div className="text-4xl font-mono bg-black/40 px-8 py-4 rounded-2xl">
                  {Math.max(0, Math.ceil((pauseState.endTime - (Date.now() + serverOffset)) / 1000))}
                </div>
                <p className="mt-6 text-xl text-gray-300">Готовьтесь к следующему вопросу!</p>
                {user.isAdmin && (
                  <button 
                    onClick={() => restPatch('gameState/pause', { skip: true })}
                    className="mt-8 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer"
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
              return <div className="text-center py-20 text-white">Вопрос загружается...</div>;
            }

            return (
              <div className="bg-black/40 p-6 rounded-3xl">
                {round.type !== "memory_items" && round.type !== "akinator" && round.type !== "bingo" && round.type !== "three_facts" && round.type !== "before_after" && (
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-400">{round.name}</h2>
                    <div className="text-3xl font-mono text-yellow-500 bg-black/50 px-4 py-2 rounded-xl">
                      {timeLeft}s
                    </div>
                  </div>
                )}

                {/* Тестовый раунд */}
                {round.type === "test_round" && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center shadow-lg">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-widest font-bold">
                        Тестовый вопрос {currentQIdx + 1} из {round.questions.length}:
                      </p>
                      <h3 className="text-xl md:text-2xl leading-relaxed font-bold text-white">
                        {currentQuestion.text}
                      </h3>
                    </div>

                    {currentQuestion.video && (
                      <div className="rounded-2xl overflow-hidden border border-purple-500/30 bg-black/60 shadow-xl max-w-2xl mx-auto">
                        <video 
                          src={getAssetPath(currentQuestion.video)} 
                          controls 
                          autoPlay 
                          muted 
                          className="w-full max-h-[360px] object-contain mx-auto"
                        />
                      </div>
                    )}

                    {currentQuestion.images && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
                        {currentQuestion.images.map((img: string, i: number) => (
                          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                            <img src={getAssetPath(img)} alt={`Тест ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!user.isAdmin && !isCurrentUserLeader && (
                      <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-2xl text-center space-y-2 max-w-xl mx-auto">
                        <p className="text-sm font-bold text-purple-200">
                          👑 Ответ вводит капитан команды: <strong className="text-white underline">{currentTeamLeaderName || "Не назначен"}</strong>
                        </p>
                        {hasAnswered && answerText ? (
                          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl max-w-md mx-auto shadow-md">
                            <span className="text-xs text-emerald-400 font-black uppercase flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Капитан отправил ответ на проверку:
                            </span>
                            <span className="text-sm font-black text-white mt-0.5 block">
                              «{answerText}»
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            Совещайтесь в голосовом чате — ответ отправляет только капитан!
                          </p>
                        )}
                        {!hasTeamLeader && (
                          <button
                            onClick={handleClaimLeaderDirect}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 mx-auto shadow-lg active:scale-95 cursor-pointer mt-1"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Стать капитаном команды</span>
                          </button>
                        )}
                      </div>
                    )}

                    {!user.isAdmin && (
                      <div className="space-y-4 max-w-xl mx-auto">
                        {/* Подсказки игроков для капитана */}
                        {(() => {
                          const testSuggestions = isCurrentUserLeader && currentTeamId !== null
                            ? Object.values(teamsData?.[currentTeamId]?.suggestions || {})
                                .filter((s: any) => 
                                  s && 
                                  s.round === gameState.currentRound && 
                                  s.question === currentQIdx && 
                                  s.userId !== user?.id && 
                                  s.anime && 
                                  s.anime.trim().length > 0
                                )
                                .map((s: any) => ({
                                  userId: s.userId,
                                  nickname: s.nickname || "Игрок",
                                  avatar: s.avatar,
                                  guess: s.anime.trim()
                                }))
                            : [];

                          if (!isCurrentUserLeader || testSuggestions.length === 0) return null;

                          return (
                            <div className="p-3 bg-purple-950/80 border border-purple-500/40 rounded-2xl space-y-1.5 shadow-md">
                              <div className="text-xs font-black uppercase text-purple-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Варианты сокомандников:</span>
                                </span>
                                <span className="text-[10px] text-gray-400">клик = подставить</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {testSuggestions.map((s, si) => (
                                  <button
                                    key={si}
                                    type="button"
                                    onClick={() => setAnswerText(s.guess)}
                                    className="inline-flex items-center gap-2 bg-black/60 hover:bg-purple-800/60 border border-purple-400/40 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                  >
                                    {s.avatar && <img src={getAssetPath(s.avatar)} alt="" className="w-4 h-4 rounded-full object-cover" />}
                                    <span className="text-gray-300 text-[11px] font-normal">{s.nickname}:</span>
                                    <span className="text-amber-300 font-black">«{s.guess}»</span>
                                    <span className="text-xs text-purple-300">↵</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <input 
                          type="text"
                          className="answer-input w-full text-center"
                          placeholder={isCurrentUserLeader ? "Ваш итоговый тестовый ответ..." : "Предложите тестовый ответ капитану..."}
                          value={answerText}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 50);
                            setAnswerText(val);
                            if (!isCurrentUserLeader) {
                              syncTeammateSuggestion(val);
                            }
                          }}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') {
                              if (isCurrentUserLeader) submitAnswer();
                              else submitTeammateSuggestionDirect();
                            } 
                          }}
                          disabled={hasAnswered}
                          maxLength={50}
                        />

                        {isCurrentUserLeader ? (
                          <button 
                            onClick={() => submitAnswer()}
                            disabled={hasAnswered || !answerText.trim()}
                            className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                              hasAnswered 
                                ? 'bg-green-600/80 cursor-default text-white' 
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {hasAnswered ? 'ОТВЕТ ПРИНЯТ ✅' : 'ОТПРАВИТЬ ПРОВЕРКУ (+2 балла)'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => submitTeammateSuggestionDirect()}
                            disabled={hasAnswered || !answerText.trim()}
                            className="w-full py-3.5 rounded-full font-bold text-base transition-all bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
                          >
                            <span>💡</span>
                            <span>{teammateSentNotice ? 'ВАРИАНТ ОТПРАВЛЕН КАПИТАНУ ✅' : 'ПРЕДЛОЖИТЬ ВАРИАНТ КАПИТАНУ'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {user.isAdmin && (
                      <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center max-w-md mx-auto">
                        <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Ответ ведущему:</span>
                        <p className="text-xl font-black text-white mt-1">{currentQuestion.correctAnswer}</p>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <div className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto">
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-black text-green-400">{currentQuestion.correctAnswer}</h3>
                      </div>
                    )}
                  </div>
                )}

                {/* Раунд 1: Три персонажа (с исправленной загрузкой картинок и отдельной панелью проверки) */}
                {round.type === "three_characters" && (
                  <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center shadow-lg">
                      <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-1">
                        Вопрос {currentQIdx + 1} из {round.questions.length} • Правильный ответ: +2 балла за аниме, +1 за каждого персонажа
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Угадайте аниме по трем персонажам:
                      </h3>
                    </div>

                    {/* Сетка картинок с защитой */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      {currentQuestion.images?.slice(0, 3).map((img, idx) => {
                        const charName = currentQuestion.characterNames?.[idx];
                        const customImg = gameState?.round1Images?.[`${currentQIdx}_${idx}`];

                        return (
                          <div 
                            key={`${currentQIdx}_${idx}`}
                            className="glass-dark rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl relative flex flex-col min-h-[300px]"
                          >
                            <div className="aspect-[3/4] w-full overflow-hidden bg-black/60 relative">
                              <Round1CharacterCard
                                src={getAssetPath(img)}
                                charName={charName}
                                qIdx={currentQIdx}
                                cIdx={idx}
                                customImage={customImg}
                                isAdmin={user.isAdmin}
                                onUpload={async (dataUrl) => {
                                  await restPut(`gameState/round1Images/${currentQIdx}_${idx}`, dataUrl);
                                }}
                              />
                              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-purple-300 border border-purple-500/30 shadow-lg">
                                Персонаж #{idx + 1}
                              </div>
                            </div>

                            {!user.isAdmin && (
                              <div className="p-3.5 bg-slate-900/95 border-t border-purple-500/30 space-y-1.5 flex-1 flex flex-col justify-end">
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                                  <span className="text-purple-300">Имя персонажа #{idx + 1}:</span>
                                  <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 text-[10px]">
                                    +1 балл
                                  </span>
                                </div>

                                {/* Ответы сокомандников над персонажем для капитана */}
                                {(() => {
                                  const charSuggestions = isCurrentUserLeader && currentTeamId !== null
                                    ? Object.values(teamsData?.[currentTeamId]?.suggestions || {})
                                        .filter((s: any) => 
                                          s && 
                                          s.round === gameState.currentRound && 
                                          s.question === currentQIdx && 
                                          s.userId !== user?.id && 
                                          Array.isArray(s.characters) && 
                                          s.characters[idx] && 
                                          s.characters[idx].trim().length > 0
                                        )
                                        .map((s: any) => ({
                                          userId: s.userId,
                                          nickname: s.nickname || "Игрок",
                                          avatar: s.avatar,
                                          guess: s.characters[idx].trim()
                                        }))
                                    : [];

                                  if (!isCurrentUserLeader || charSuggestions.length === 0) return null;

                                  return (
                                    <div className="p-2 bg-purple-950/90 border border-purple-500/40 rounded-xl space-y-1 animate-fade-in shadow-md">
                                      <div className="text-[10px] font-black uppercase text-purple-300 flex items-center justify-between">
                                        <span className="flex items-center gap-1">💬 Ответы игроков:</span>
                                        <span className="text-[9px] text-gray-400 font-normal">клик = подставить</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {charSuggestions.map((s, si) => (
                                          <button
                                            key={si}
                                            type="button"
                                            onClick={() => {
                                              setCharGuesses(prev => {
                                                const next = [...prev];
                                                next[idx] = s.guess;
                                                return next;
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 bg-black/70 hover:bg-purple-800/80 border border-purple-400/50 px-2 py-1 rounded-lg text-xs font-bold text-amber-200 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                            title="Нажмите, чтобы вставить этот вариант"
                                          >
                                            {s.avatar && <img src={getAssetPath(s.avatar)} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
                                            <span className="text-gray-300 text-[10px] font-normal">{s.nickname}:</span>
                                            <span className="text-white font-black underline">«{s.guess}»</span>
                                            <span className="text-[9px] text-purple-300">↵</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                <input
                                  type="text"
                                  placeholder={isCurrentUserLeader ? "Имя героя (ответ команды)..." : "Ваш вариант героя для капитана..."}
                                  value={charGuesses[idx] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value.slice(0, 40);
                                    setCharGuesses(prev => {
                                      const next = [...prev];
                                      next[idx] = val;
                                      return next;
                                    });
                                    if (!isCurrentUserLeader) {
                                      const updatedChars = [...charGuesses];
                                      updatedChars[idx] = val;
                                      syncTeammateSuggestion(undefined, updatedChars);
                                    }
                                  }}
                                  onKeyDown={(e) => { 
                                    if (e.key === 'Enter') {
                                      if (isCurrentUserLeader) submitAnswer();
                                      else submitTeammateSuggestionDirect();
                                    } 
                                  }}
                                  disabled={hasAnswered}
                                  maxLength={40}
                                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 transition-all font-medium"
                                />
                              </div>
                            )}

                            {user.isAdmin && charName && (
                              <div className="p-3 bg-purple-950/90 border-t border-purple-500/40 text-center">
                                <p className="text-[10px] text-purple-300 uppercase font-black tracking-wider mb-0.5">Персонаж #{idx + 1}:</p>
                                <span className="text-xs font-black text-amber-300 leading-snug block">{charName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!user.isAdmin && !isCurrentUserLeader && (
                      <div className="max-w-xl mx-auto p-4 bg-purple-950/50 border border-purple-500/30 rounded-2xl text-center space-y-2">
                        <p className="text-sm font-bold text-purple-200">
                          👑 Итоговые ответы отправляет капитан: <strong className="text-white underline">{currentTeamLeaderName || "Не назначен"}</strong>
                        </p>
                        {hasAnswered && (answerText || charGuesses.some(g => g.trim())) ? (
                          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl text-center space-y-1.5 shadow-lg">
                            <span className="text-xs font-black uppercase text-emerald-400 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Капитан отправил официальные ответы команды:
                            </span>
                            {answerText && (
                              <p className="text-base font-black text-white bg-black/50 py-1.5 px-4 rounded-xl border border-emerald-500/30 inline-block">
                                Тайтл: «{answerText}»
                              </p>
                            )}
                            {charGuesses.some(g => g.trim()) && (
                              <div className="text-xs text-purple-200">
                                <span className="font-bold">Герои: </span>
                                {charGuesses.map((g, i) => g.trim() ? `#${i + 1} ${g.trim()}` : null).filter(Boolean).join(" • ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            💡 Вводите свои догадки в поля героев и тайтла — капитан сразу видит их и выберет итоговые ответы для проверки ведущим!
                          </p>
                        )}
                        {!hasTeamLeader && (
                          <button
                            onClick={handleClaimLeaderDirect}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 mx-auto shadow-lg active:scale-95 cursor-pointer mt-1"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Стать капитаном команды</span>
                          </button>
                        )}
                      </div>
                    )}

                    {!user.isAdmin && (
                      <div className="max-w-xl mx-auto space-y-3">
                        {/* Подсказки игроков над полем ввода аниме ДЛЯ КАПИТАНА */}
                        {(() => {
                          const animeSuggestions = isCurrentUserLeader && currentTeamId !== null
                            ? Object.values(teamsData?.[currentTeamId]?.suggestions || {})
                                .filter((s: any) => 
                                  s && 
                                  s.round === gameState.currentRound && 
                                  s.question === currentQIdx && 
                                  s.userId !== user?.id && 
                                  s.anime && 
                                  s.anime.trim().length > 0
                                )
                                .map((s: any) => ({
                                  userId: s.userId,
                                  nickname: s.nickname || "Игрок",
                                  avatar: s.avatar,
                                  anime: s.anime.trim()
                                }))
                            : [];

                          if (!isCurrentUserLeader || animeSuggestions.length === 0) return null;

                          return (
                            <div className="bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-purple-950/90 border border-purple-500/40 rounded-2xl p-3 shadow-lg space-y-1.5 animate-fade-in">
                              <div className="flex items-center justify-between text-xs font-black uppercase text-purple-300">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Ответы игроков команды на тайтл:</span>
                                </span>
                                <span className="text-[10px] text-gray-400 font-normal">кликните чтобы подставить</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {animeSuggestions.map((s, si) => (
                                  <button
                                    key={si}
                                    type="button"
                                    onClick={() => setAnswerText(s.anime)}
                                    className="inline-flex items-center gap-2 bg-black/60 hover:bg-purple-800/60 border border-purple-400/40 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                    title="Нажмите, чтобы подставить название аниме"
                                  >
                                    {s.avatar && <img src={getAssetPath(s.avatar)} alt="" className="w-4 h-4 rounded-full object-cover" />}
                                    <span className="text-gray-300 text-[11px] font-normal">{s.nickname}:</span>
                                    <span className="text-amber-300 font-black">«{s.anime}»</span>
                                    <span className="text-xs text-purple-300">↵</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-wider text-purple-300">
                              {isCurrentUserLeader ? "Название аниме (ответ команды):" : "Ваш вариант названия аниме:"}
                            </label>
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              +2 балла
                            </span>
                          </div>
                          <input 
                            type="text" 
                            className="answer-input w-full"
                            placeholder={isCurrentUserLeader ? "Введите итоговое название тайтла..." : "Предложите название тайтла капитану..."}
                            value={answerText}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 50);
                              setAnswerText(val);
                              if (!isCurrentUserLeader) {
                                syncTeammateSuggestion(val);
                              }
                            }}
                            onKeyDown={(e) => { 
                              if (e.key === 'Enter') {
                                if (isCurrentUserLeader) submitAnswer();
                                else submitTeammateSuggestionDirect();
                              } 
                            }}
                            disabled={hasAnswered}
                            maxLength={50}
                          />

                          {isCurrentUserLeader ? (
                            <button 
                              onClick={() => submitAnswer()}
                              disabled={hasAnswered || (!answerText.trim() && !charGuesses.some(g => g.trim()))}
                              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                                hasAnswered 
                                  ? 'bg-green-600/80 text-white cursor-default' 
                                  : 'bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:to-purple-700 active:scale-95 text-white disabled:opacity-40 cursor-pointer'
                              }`}
                            >
                              {hasAnswered ? 'ОТВЕТЫ ПРИНЯТЫ ✅' : 'ОТПРАВИТЬ ОТВЕТЫ КОМАНДЫ (+2 б. за аниме, +1 б. за героя)'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => submitTeammateSuggestionDirect()}
                              disabled={hasAnswered || (!answerText.trim() && !charGuesses.some(g => g.trim()))}
                              className="w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-600 hover:to-indigo-500 text-white shadow-lg active:scale-95 cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                            >
                              <span>💡</span>
                              <span>{teammateSentNotice ? 'ВАРИАНТЫ ОТПРАВЛЕНЫ КАПИТАНУ ✅' : 'ПРЕДЛОЖИТЬ ВАРИАНТЫ КАПИТАНУ'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ПАНЕЛЬ ПРОВЕРКИ 1 РАУНДА (ДЛЯ ВЕДУЩЕГО ВО ВРЕМЯ РАУНДА) */}
                    {user.isAdmin && (
                      <Round1ReviewPanel
                        roundQuestions={round.questions}
                        players={players}
                        currentLiveQ={currentQIdx}
                        selectedTab={r1ReviewQ}
                        onSelectTab={setR1ReviewQ}
                        onScoreSave={(pId, qIdx, animeOk, charOks) => setDetailedRound1Score(pId, qIdx, animeOk, charOks)}
                      />
                    )}

                    {gameState.showAnswer && (
                      <div className="bg-green-500/20 p-5 rounded-2xl border border-green-500/50 text-center max-w-xl mx-auto shadow-xl">
                        <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl md:text-3xl font-black text-green-400">{currentQuestion.correctAnswer}</h3>
                      </div>
                    )}
                  </div>
                )}

                {/* Раунд 2 & 6: Тест-викторины (ЗДЕСЬ ТОЛЬКО ИНДЕКС 2) */}
                {round.type === "quiz_six" && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center shadow-lg">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-widest font-bold">Вопрос {currentQIdx + 1}:</p>
                      <h3 className="text-xl md:text-2xl leading-relaxed font-bold text-white">{currentQuestion.text}</h3>
                    </div>
                    
                    {(() => {
                      const captainQuizPick = currentTeamId !== null
                        ? (teamsData?.[currentTeamId]?.selectedQuizOption?.round === gameState.currentRound &&
                           teamsData?.[currentTeamId]?.selectedQuizOption?.question === currentQIdx
                            ? teamsData?.[currentTeamId]?.selectedQuizOption?.opt
                            : (teamsData?.[currentTeamId]?.answers?.[`r${gameState.currentRound}_q${currentQIdx}`]?.answer || answerText || null))
                        : (answerText || null);

                      return (
                        <>
                          {!user.isAdmin && !isCurrentUserLeader && (
                            <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-2xl text-center space-y-2 mb-2">
                              <p className="text-sm font-bold text-purple-200">
                                👑 Итоговый ответ выбирает капитан команды: <strong className="text-white underline">{currentTeamLeaderName || "Не назначен"}</strong>
                              </p>
                              {captainQuizPick ? (
                                <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl max-w-md mx-auto shadow-md">
                                  <span className="text-xs text-emerald-400 font-black uppercase flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    Капитан выбрал официальный ответ:
                                  </span>
                                  <span className="text-sm font-black text-white mt-0.5 block">
                                    «{captainQuizPick}»
                                  </span>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400">
                                  💡 Нажмите на вариант ниже, чтобы проголосовать — ваш выбор увидит только капитан команды!
                                </p>
                              )}
                              {!hasTeamLeader && (
                                <button
                                  onClick={handleClaimLeaderDirect}
                                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 mx-auto shadow-lg active:scale-95 cursor-pointer mt-1"
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                  <span>Стать капитаном команды</span>
                                </button>
                              )}
                            </div>
                          )}

                          {!user.isAdmin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentQuestion.options?.map((opt: string, idx: number) => {
                                const isCaptainChoice = captainQuizPick === opt;
                                const myVote = currentTeamId !== null ? teamsData?.[currentTeamId]?.suggestions?.[user?.id] : null;
                                const isMyVote = !isCurrentUserLeader && myVote && myVote.round === gameState.currentRound && myVote.question === currentQIdx && myVote.selectedOption === opt;

                                // Голоса сокомандников ВИДИТ ТОЛЬКО КАПИТАН!
                                const teammatesWhoVoted = isCurrentUserLeader && currentTeamId !== null
                                  ? Object.values(teamsData?.[currentTeamId]?.suggestions || {}).filter(
                                      (s: any) => s && s.round === gameState.currentRound && s.question === currentQIdx && s.selectedOption === opt && s.userId !== user?.id
                                    )
                                  : [];

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (hasAnswered || user.isAdmin) return;
                                      if (!isCurrentUserLeader) {
                                        submitTeammateSuggestionDirect({ selectedOption: opt });
                                        return;
                                      }

                                      // Капитан выбирает и отправляет официальный ответ
                                      setAnswerText(opt);
                                      if (currentTeamId !== null) {
                                        restPatch(`teams/${currentTeamId}`, {
                                          selectedQuizOption: {
                                            opt,
                                            round: gameState.currentRound,
                                            question: currentQIdx,
                                            timestamp: Date.now()
                                          }
                                        }).catch(console.error);
                                        setTeamsData(prev => ({
                                          ...prev,
                                          [currentTeamId]: {
                                            ...(prev[currentTeamId] || {}),
                                            selectedQuizOption: {
                                              opt,
                                              round: gameState.currentRound,
                                              question: currentQIdx,
                                              timestamp: Date.now()
                                            }
                                          }
                                        }));
                                      }
                                      submitAnswer(opt);
                                    }}
                                    disabled={hasAnswered || user.isAdmin}
                                    className={`p-5 rounded-2xl text-left font-medium text-base transition-all border-2 flex items-start gap-3 cursor-pointer ${
                                      isCaptainChoice
                                        ? 'bg-purple-600/40 border-purple-400 text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.4)] scale-[1.01]' 
                                        : isMyVote
                                        ? 'bg-sky-950/60 border-sky-400 text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-[1.01]'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200 active:scale-95'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs shrink-0 ${
                                      isCaptainChoice 
                                        ? 'bg-purple-500 border-purple-300 text-white font-black' 
                                        : isMyVote
                                        ? 'bg-sky-500 border-sky-300 text-white font-black'
                                        : 'border-white/20'
                                    }`}>
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <span>{opt}</span>
                                      {isCaptainChoice && (
                                        <div className="mt-1 flex items-center gap-1 text-[11px] font-black text-amber-300">
                                          <span>👑</span>
                                          <span>Выбор капитана команды (официальный ответ)</span>
                                        </div>
                                      )}
                                      {isMyVote && !isCaptainChoice && (
                                        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sky-400">
                                          <span>💡</span>
                                          <span>Ваш голос (видит только капитан)</span>
                                        </div>
                                      )}
                                      {/* Голоса сокомандников видит ТОЛЬКО капитан */}
                                      {isCurrentUserLeader && teammatesWhoVoted.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-purple-500/20 flex flex-wrap items-center gap-1.5 animate-fade-in">
                                          <span className="text-[10px] font-black uppercase text-purple-300">
                                            👥 Выбор команды ({teammatesWhoVoted.length}):
                                          </span>
                                          {teammatesWhoVoted.map((v: any, vi: number) => (
                                            <span key={vi} className="inline-flex items-center gap-1 bg-purple-900/80 border border-purple-400/40 text-purple-200 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                                              {v.avatar && <img src={getAssetPath(v.avatar)} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
                                              <span>{v.nickname}</span>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {user.isAdmin && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentQuestion.options?.map((opt: string, idx: number) => {
                            const isCorrect = opt === currentQuestion.correctAnswer;
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
                                  isCorrect 
                                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/30' 
                                    : 'bg-black/30 border-white/10 text-gray-400'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white font-black' : 'border border-white/20'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="text-sm font-medium">
                                  {opt}
                                  {isCorrect && (
                                    <span className="block text-[10px] text-emerald-400 font-black uppercase tracking-wider mt-1">
                                      ✓ Правильный ответ (+4 балла)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                        <p className="text-xs uppercase tracking-widest text-green-400 mb-1 font-bold">Правильный ответ:</p>
                        <h4 className="text-2xl font-black text-green-400">{currentQuestion.correctAnswer}</h4>
                      </div>
                    )}
                  </div>
                )}

                {/* Раунд 3: Аудио */}
                {round.type === "audio_guess" && (
                  <div className="space-y-8 max-w-xl mx-auto text-center">
                    {currentQuestion.text && (
                      <h3 className="text-xl md:text-2xl font-bold text-white bg-white/5 py-3 px-6 rounded-2xl border border-white/10">
                        {currentQuestion.text}
                      </h3>
                    )}
                    
                    <AudioPlayer src={getAssetPath(currentQuestion.audio || "")} isMuted={isMuted} volume={volume} />

                    {!user.isAdmin && !isCurrentUserLeader && (
                      <div className="p-4 bg-purple-950/50 border border-purple-500/30 rounded-2xl text-center space-y-2 mb-2">
                        <p className="text-sm font-bold text-purple-200">
                          👑 Ответ на звук отправляет капитан команды: <strong className="text-white underline">{currentTeamLeaderName || "Не назначен"}</strong>
                        </p>
                        {hasAnswered && answerText ? (
                          <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl max-w-md mx-auto shadow-md">
                            <span className="text-xs text-emerald-400 font-black uppercase flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Капитан отправил официальный ответ:
                            </span>
                            <span className="text-sm font-black text-white mt-0.5 block">
                              «{answerText}»
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">
                            💡 Введите ваш вариант ответа ниже — капитан команды увидит его и сможет отправить на проверку!
                          </p>
                        )}
                        {!hasTeamLeader && (
                          <button
                            onClick={handleClaimLeaderDirect}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 mx-auto shadow-lg active:scale-95 cursor-pointer mt-1"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Стать капитаном команды</span>
                          </button>
                        )}
                      </div>
                    )}

                    {!user.isAdmin && (
                      <div className="space-y-4 max-w-xl mx-auto">
                        {/* Подсказки игроков для капитана */}
                        {(() => {
                          const audioSuggestions = isCurrentUserLeader && currentTeamId !== null
                            ? Object.values(teamsData?.[currentTeamId]?.suggestions || {})
                                .filter((s: any) => 
                                  s && 
                                  s.round === gameState.currentRound && 
                                  s.question === currentQIdx && 
                                  s.userId !== user?.id && 
                                  s.anime && 
                                  s.anime.trim().length > 0
                                )
                                .map((s: any) => ({
                                  userId: s.userId,
                                  nickname: s.nickname || "Игрок",
                                  avatar: s.avatar,
                                  guess: s.anime.trim()
                                }))
                            : [];

                          if (!isCurrentUserLeader || audioSuggestions.length === 0) return null;

                          return (
                            <div className="p-3 bg-purple-950/80 border border-purple-500/40 rounded-2xl space-y-1.5 shadow-md">
                              <div className="text-xs font-black uppercase text-purple-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Варианты сокомандников:</span>
                                </span>
                                <span className="text-[10px] text-gray-400">клик = подставить</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {audioSuggestions.map((s, si) => (
                                  <button
                                    key={si}
                                    type="button"
                                    onClick={() => setAnswerText(s.guess)}
                                    className="inline-flex items-center gap-2 bg-black/60 hover:bg-purple-800/60 border border-purple-400/40 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                  >
                                    {s.avatar && <img src={getAssetPath(s.avatar)} alt="" className="w-4 h-4 rounded-full object-cover" />}
                                    <span className="text-gray-300 text-[11px] font-normal">{s.nickname}:</span>
                                    <span className="text-amber-300 font-black">«{s.guess}»</span>
                                    <span className="text-xs text-purple-300">↵</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <input 
                          type="text" 
                          className="answer-input w-full text-center"
                          placeholder={isCurrentUserLeader ? "Ваш итоговый ответ (название аниме)..." : "Предложите ответ капитану..."}
                          value={answerText}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 50);
                            setAnswerText(val);
                            if (!isCurrentUserLeader) {
                              syncTeammateSuggestion(val);
                            }
                          }}
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') {
                              if (isCurrentUserLeader) submitAnswer();
                              else submitTeammateSuggestionDirect();
                            } 
                          }}
                          disabled={hasAnswered}
                          maxLength={50}
                        />

                        {isCurrentUserLeader ? (
                          <button 
                            onClick={() => submitAnswer()}
                            disabled={hasAnswered || !answerText.trim()}
                            className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                              hasAnswered 
                                ? 'bg-green-600/80 cursor-default text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {hasAnswered ? 'ОТВЕТ ПРИНЯТ ✅' : 'ОТПРАВИТЬ ОТВЕТ КОМАНДЫ'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => submitTeammateSuggestionDirect()}
                            disabled={hasAnswered || !answerText.trim()}
                            className="w-full py-3.5 rounded-full font-bold text-base transition-all bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white cursor-pointer active:scale-95 shadow-lg flex items-center justify-center gap-2"
                          >
                            <span>💡</span>
                            <span>{teammateSentNotice ? 'ВАРИАНТ ОТПРАВЛЕН КАПИТАНУ ✅' : 'ПРЕДЛОЖИТЬ ВАРИАНТ КАПИТАНУ'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {user.isAdmin && (
                      <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center">
                        <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">Ответ ведущему:</span>
                        <p className="text-xl font-black text-white mt-1">{currentQuestion.correctAnswer}</p>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <div className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto">
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-black text-green-400">{currentQuestion.correctAnswer}</h3>
                      </div>
                    )}
                  </div>
                )}

                {/* Раунд 4: Фото-память */}
                {round.type === "memory_items" && (
                  <MemoryItemsRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    teamsData={teamsData}
                    restPatch={restPatch}
                    restPut={restPut}
                    serverOffset={serverOffset}
                    globalPause={globalPause}
                    isLeader={isCurrentUserLeader}
                    leaderNickname={currentTeamLeaderName}
                  />
                )}

                {/* Раунд 5: Три факта */}
                {round.type === "three_facts" && (
                  <ThreeFactsRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    teamsData={teamsData}
                    restPatch={restPatch}
                    restPut={restPut}
                    timeLeft={timeLeft}
                    serverOffset={serverOffset}
                    globalPause={globalPause}
                    isLeader={isCurrentUserLeader}
                    leaderNickname={currentTeamLeaderName}
                  />
                )}

                {/* НОВЫЙ РАУНД 6: ДО И ПОСЛЕ */}
                {round.type === "before_after" && (
                  <BeforeAfterRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    teamsData={teamsData}
                    restPatch={restPatch}
                    restPut={restPut}
                    timeLeft={timeLeft}
                    serverOffset={serverOffset}
                    globalPause={globalPause}
                    isLeader={isCurrentUserLeader}
                    leaderNickname={currentTeamLeaderName}
                  />
                )}

                {/* Раунд 7: Акинатор */}
                {round.type === "akinator" && (
                  <AkinatorRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    teamsData={teamsData}
                    restPatch={restPatch}
                    restPut={restPut}
                    timeLeft={timeLeft}
                    globalPause={globalPause}
                    isLeader={isCurrentUserLeader}
                    leaderNickname={currentTeamLeaderName}
                  />
                )}

                {/* Раунд 8: Бинго */}
                {round.type === "bingo" && (
                  <BingoRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    restPatch={restPatch}
                    restPut={restPut}
                    isLeader={isCurrentUserLeader}
                    leaderNickname={currentTeamLeaderName}
                  />
                )}
              </div>
            );
          }

          const isGameStarted = !!gameState?.gameStarted || !!gameState?.teamSetupUnlocked;

          // ==================== ЭТАП 1: ЛОББИ (СБОР ИГРОКОВ ПО КОМАНДАМ) ====================
          if (!isGameStarted) {
            const allPlayersList: any[] = Object.values(players || {});
            const teamsWithPlayersCount = Array.from({ length: TOTAL_TEAMS }).filter(
              (_, t) => allPlayersList.some((p: any) => p.team === t)
            ).length;

            return (
              <div className="space-y-8 py-4">
                {/* Admin Lobby Banner */}
                {user.isAdmin && (
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-purple-950/90 rounded-[2.5rem] border-2 border-emerald-500/60 shadow-2xl text-center space-y-4 max-w-3xl mx-auto backdrop-blur-xl">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                      <Users className="w-4 h-4" /> Лобби ведущего • {allPlayersList.length} игроков в {teamsWithPlayersCount} командах
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
                      Все игроки зашли по командам?
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                      Дождитесь, пока игроки распределятся по командам (до 3 человек в каждой). Когда все будут готовы — нажмите кнопку ниже! В каждой команде откроется возможность загрузить аватарку команды с файлов ПК и занять лидера команды.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={async () => {
                          setGameState((prev: any) => ({ ...(prev || {}), gameStarted: true, teamSetupUnlocked: true }));
                          await restPatch('gameState', { gameStarted: true, teamSetupUnlocked: true });
                        }}
                        className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-black font-black px-8 py-4 sm:py-5 rounded-2xl text-sm sm:text-base uppercase tracking-widest shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
                      >
                        <Play className="w-5 h-5 fill-black" />
                        <span>🚀 ВСЕ ЗАШЛИ — НАЧАТЬ ИГРУ</span>
                      </button>
                      <button
                        onClick={() => handleLogout(true)}
                        className="bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 hover:text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl active:scale-95"
                        title="Выйти на главную страницу, чтобы войти как обычный игрок и протестировать"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>ТЕСТИРОВАТЬ КАК ИГРОК (НА ГЛАВНУЮ)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Player Lobby Banner */}
                {!user.isAdmin && (
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-slate-900 rounded-[2.5rem] border border-purple-500/40 shadow-2xl text-center space-y-3 max-w-3xl mx-auto backdrop-blur-xl">
                    <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full border border-purple-500/40 text-xs font-black uppercase tracking-wider">
                      <Users className="w-4 h-4" /> Лобби сбора игроков
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      Вы в Команде #{user.team + 1}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Состав вашей команды ({currentTeamMembers.length}/3):</span>
                      {currentTeamMembers.map((m: any) => (
                        <span key={m.id} className="text-xs font-black bg-purple-600/30 border border-purple-500/40 text-purple-200 px-3 py-1 rounded-xl">
                          {m.nickname} {m.id === user.id && "(Вы)"}
                        </span>
                      ))}
                    </div>
                    <div className="p-3 bg-black/40 rounded-2xl border border-white/10 max-w-lg mx-auto text-xs text-gray-300 space-y-1">
                      <p className="font-bold text-amber-300">
                        ⏳ Ожидайте запуска игры ведущим!
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Как только ведущий нажмёт кнопку «Начать игру», в вашей команде откроется возможность загрузить аватарку команды с файлов ПК и занять лидера команды.
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid of all 10 teams in Lobby */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Распределение игроков по командам (максимум 3 в каждой):
                    </h3>
                    <span className="text-xs font-bold text-purple-300">
                      Всего в лобби: {allPlayersList.length} чел.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: TOTAL_TEAMS }, (_, i) => i).map(t => {
                      const tMembers = Object.values(players || {}).filter((p: any) => p.team === t);
                      const isMyTeam = !user?.isAdmin && user?.team === t;
                      const isFull = tMembers.length >= 3;

                      return (
                        <div
                          key={t}
                          className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[170px] shadow-lg relative ${
                            isMyTeam
                              ? 'bg-purple-950/50 border-purple-400 shadow-purple-500/20'
                              : isFull
                              ? 'bg-white/5 border-white/10 opacity-75'
                              : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-black text-xs text-purple-200">
                                #{t + 1}
                              </div>
                              <span className="text-sm font-black text-white">Команда {t + 1}</span>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isFull
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : tMembers.length > 0
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-white/5 text-gray-500'
                              }`}
                            >
                              {tMembers.length}/3
                            </span>
                          </div>

                          <div className="my-2 space-y-1">
                            {tMembers.length === 0 ? (
                              <p className="text-[11px] text-gray-500 italic py-2">Свободно (0 игроков)</p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {tMembers.map((p: any) => (
                                  <span
                                    key={p.id}
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                      p.id === user?.id
                                        ? 'bg-purple-500/30 text-white border-purple-400'
                                        : 'bg-black/40 text-gray-300 border-white/10'
                                    }`}
                                  >
                                    {p.nickname} {p.id === user?.id && "★"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                            {isMyTeam ? (
                              <span className="text-purple-300 font-bold uppercase tracking-wider">Ваша команда</span>
                            ) : isFull ? (
                              <span className="text-red-400 font-bold uppercase tracking-wider">Команда полная</span>
                            ) : (
                              <span className="text-gray-400">Свободно мест: {3 - tMembers.length}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // ==================== ЭТАП 2: ПОДГОТОВКА КОМАНД (АВАТАРКИ И ЛИДЕРЫ) И ОЖИДАНИЕ РАУНДОВ ====================
          return (
            <div className="space-y-8 py-4">
              {/* Hidden file input for team avatar upload */}
              <input
                ref={fileInputLobbyRef}
                type="file"
                accept="image/*"
                onChange={handleLobbyAvatarUpload}
                className="hidden"
              />

              {/* Player Team Preparation Hub Card */}
              {!user.isAdmin && currentTeamId !== null && (
                <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-indigo-950/90 rounded-[2.5rem] border-2 border-purple-500/50 shadow-2xl max-w-4xl mx-auto space-y-6 backdrop-blur-xl">
                  {/* Top Bar: Title & Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      {/* Avatar with click-to-upload */}
                      <div
                        onClick={() => {
                          if (!isCurrentUserLeader) {
                            setLobbyStatusNotice("🔒 Только капитан может менять аватарку команды!");
                            setTimeout(() => setLobbyStatusNotice(""), 3500);
                            return;
                          }
                          fileInputLobbyRef.current?.click();
                        }}
                        className={`w-20 h-20 rounded-2xl overflow-hidden border-2 bg-black/60 shrink-0 flex items-center justify-center shadow-xl relative group transition-all ${
                          isCurrentUserLeader ? "border-purple-400 cursor-pointer hover:scale-105 hover:border-purple-300" : "border-gray-600"
                        }`}
                        title={isCurrentUserLeader ? "Нажмите, чтобы загрузить аватарку команды с вашего ПК" : "Только капитан может менять аватарку"}
                      >
                        {currentTeamInfo?.avatar ? (
                          <img
                            src={currentTeamInfo.avatar}
                            alt={`Аватарка команды ${currentTeamId + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-purple-400 group-hover:text-purple-300">
                            <Shield className="w-8 h-8 mb-0.5" />
                            <span className="text-[10px] font-black">#{currentTeamId + 1}</span>
                          </div>
                        )}
                        {isCurrentUserLeader && (
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-[10px] font-bold">
                            <Upload className="w-5 h-5 mb-0.5" />
                            <span>С ПК</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> Игра начата • Подготовка команды
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                          Команда #{currentTeamId + 1}
                        </h2>
                        <p className="text-xs text-purple-300 mt-0.5">
                          {currentTeamInfo?.avatar ? "✅ Аватарка команды загружена" : "📁 Загрузите аватарку команды с файлов вашего ПК"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isCurrentUserLeader ? (
                        <button
                          onClick={() => fileInputLobbyRef.current?.click()}
                          disabled={isUploadingLobbyAvatar}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{isUploadingLobbyAvatar ? "Загрузка..." : currentTeamInfo?.avatar ? "Сменить аватарку" : "Загрузить аватарку с ПК"}</span>
                        </button>
                      ) : (
                        <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl text-xs text-amber-300 font-bold flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>Только капитан может менять аватарку</span>
                        </div>
                      )}
                      <button
                        onClick={() => setIsTeamSetupOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-purple-300" />
                        <span>Штаб команды</span>
                      </button>
                    </div>
                  </div>

                  {lobbyStatusNotice && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center text-xs font-bold text-emerald-300 animate-pulse">
                      {lobbyStatusNotice}
                    </div>
                  )}

                  {/* Captain Status & Controls */}
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
                          <Crown className="w-4 h-4 text-amber-400" /> Капитан команды (только он отвечает на вопросы!)
                        </span>
                        {hasTeamLeader ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white flex items-center gap-1.5">
                              <span>👑</span> {currentTeamLeaderName}
                            </span>
                            {isCurrentUserLeader ? (
                              <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
                                Это вы
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                (отправляет ответы команды)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
                              <AlertTriangle className="w-4 h-4" /> Капитан ещё не выбран!
                            </p>
                            <p className="text-xs text-gray-400">
                              Без капитана команда не сможет отправлять ответы на вопросы викторины. Займите роль капитана!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div>
                        {!hasTeamLeader && (
                          <button
                            onClick={handleClaimLeaderDirect}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs uppercase px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-amber-900/30 active:scale-95 cursor-pointer"
                          >
                            <Crown className="w-4 h-4" />
                            <span>Занять лидера команды</span>
                          </button>
                        )}

                        {isCurrentUserLeader && otherTeammates.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400">Передать:</span>
                            {otherTeammates.map((m: any) => (
                              <button
                                key={m.id}
                                onClick={() => handleTransferLeaderDirect(m)}
                                className="bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title={`Передать лидерство игроку ${m.nickname}`}
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>{m.nickname}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Members List */}
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Игроки ({currentTeamMembers.length}/3):</span>
                        {currentTeamMembers.map((m: any) => {
                          const isMemLeader = currentTeamLeaderId === m.id;
                          return (
                            <span
                              key={m.id}
                              className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                                isMemLeader
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                                  : 'bg-white/10 text-gray-200 border-white/10'
                              }`}
                            >
                              {isMemLeader && <span>👑</span>}
                              <span>{m.nickname} {m.id === user.id && "(Вы)"}</span>
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-xs text-gray-400">
                        Ожидайте старта очередного раунда ведущим!
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Preparation Overview Banner */}
              {user.isAdmin && (
                <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 rounded-[2.5rem] border border-purple-500/40 shadow-2xl text-center space-y-4 max-w-4xl mx-auto backdrop-blur-xl">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full border border-purple-500/40 text-xs font-black uppercase tracking-wider">
                    <Crown className="w-4 h-4 text-amber-400" /> Подготовка команд открыта
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    Команды настраивают аватарки и лидеров
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto">
                    Ниже в сетке показаны аватарки, капитаны и составы всех команд. Когда будете готовы — выберите раунд в панели управления внизу!
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => startRound(0)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Запустить Тестовый раунд</span>
                    </button>
                    <button
                      onClick={() => startRound(1)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Запустить Раунд 1</span>
                    </button>
                    <button
                      onClick={toggleLeaderboard}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{gameState?.showLeaderboard ? 'Скрыть счёт' : 'Показать счёт всем'}</span>
                    </button>
                    <button
                      onClick={() => handleLogout(true)}
                      className="bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 hover:text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      title="Выйти на главную страницу, чтобы войти под игроком"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span>Выйти на главную (тест)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of all 10 teams with Avatars, Captains and Scores */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Команды викторины (аватарки, капитаны и состав):
                  </h3>
                  {(user?.isAdmin || !!gameState?.showLeaderboard) ? (
                    <button
                      onClick={() => {
                        if (user?.isAdmin) toggleLeaderboard();
                        else setIsPlayerLeaderboardOpen(true);
                      }}
                      className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Открыть полную таблицу счёта</span>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 italic flex items-center gap-1">
                      <span>🔒 Счёт команд скрыт ведущим</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Array.from({ length: TOTAL_TEAMS }, (_, i) => i).map(t => {
                    const tMembers: any[] = Object.values(players || {}).filter((p: any) => p.team === t);
                    const tData = teamsData?.[t] || {};
                    const tScore = tMembers.reduce((acc: number, p: any) => acc + getPlayerScore(p), 0);
                    const isMyTeam = !user?.isAdmin && user?.team === t;
                    const leaderMember: any = tMembers.find((p: any) => p.id === tData.leaderId);
                    const leaderName = tData.leaderNickname || leaderMember?.nickname;

                    return (
                      <div
                        key={t}
                        className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between min-h-[220px] shadow-xl relative ${
                          isMyTeam
                            ? 'bg-gradient-to-b from-purple-950/60 to-slate-900 border-purple-400 shadow-purple-500/20'
                            : 'bg-slate-900/80 border-white/10 hover:border-purple-500/40'
                        }`}
                      >
                        {/* Top: Avatar & Team Name & Score */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-black/60 shrink-0 flex items-center justify-center shadow-md">
                            {tData.avatar ? (
                              <img
                                src={tData.avatar}
                                alt={`Команда ${t + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-purple-400">
                                <Shield className="w-6 h-6" />
                                <span className="text-[9px] font-black">#{t + 1}</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-white uppercase tracking-tight truncate">
                                Команда #{t + 1}
                              </span>
                              <span className="text-base font-black text-purple-300 font-mono">
                                {user?.isAdmin || gameState?.showLeaderboard ? `${tScore}б.` : '❓'}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              Игроков: {tMembers.length}/3
                            </span>
                            {isMyTeam && (
                              <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40">
                                Ваша команда
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Captain row */}
                        <div className="my-2 p-2 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black uppercase text-amber-400 block tracking-wider">
                            Капитан команды:
                          </span>
                          {leaderName ? (
                            <span className="text-xs font-black text-white flex items-center gap-1 mt-0.5 truncate">
                              <span>👑</span> {leaderName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-400 font-medium italic mt-0.5 block">
                              Не выбран
                            </span>
                          )}
                        </div>

                        {/* Player Chips */}
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="flex flex-wrap gap-1">
                            {tMembers.length === 0 ? (
                              <span className="text-[10px] text-gray-500 italic">Нет игроков</span>
                            ) : (
                              tMembers.map((p: any) => {
                                const isMemberCap = tData.leaderId === p.id;
                                return (
                                  <span
                                    key={p.id}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                      isMemberCap
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        : 'bg-white/5 text-gray-300 border-white/10'
                                    }`}
                                  >
                                    {isMemberCap && '👑 '}
                                    {p.nickname}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Панель ведущего */}
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
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl flex justify-between items-center group cursor-pointer"
                  >
                    <span>{i + 1}. {r.name}</span>
                    <SkipForward className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-black/40 p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="w-4 h-4" /> Управление викториной</h3>
              <div className="flex flex-wrap gap-4">
                {!isGameStarted ? (
                  <button 
                    onClick={async () => {
                      setGameState((prev: any) => ({ ...(prev || {}), gameStarted: true, teamSetupUnlocked: true }));
                      await restPatch('gameState', { gameStarted: true, teamSetupUnlocked: true });
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-black px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 text-xs uppercase tracking-wider"
                  >
                    <Play className="w-4 h-4 fill-black" /> НАЧАТЬ ИГРУ (ОТКРЫТЬ ПОДГОТОВКУ)
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      if (confirm("Вернуться в режим лобби сбора игроков?")) {
                        setGameState((prev: any) => ({ ...(prev || {}), gameStarted: false, teamSetupUnlocked: false, active: false }));
                        await restPatch('gameState', { gameStarted: false, teamSetupUnlocked: false, active: false });
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-5 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer text-xs border border-white/10"
                    title="Вернуться в режим ожидания сбора игроков"
                  >
                    <RotateCcw className="w-4 h-4" /> В ЛОББИ СБОРА
                  </button>
                )}
                <button 
                  onClick={toggleLeaderboard}
                  className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all cursor-pointer ${gameState?.showLeaderboard ? 'bg-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.5)]' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  <Trophy className="w-4 h-4" />
                  {gameState?.showLeaderboard ? 'СКРЫТЬ СЧЁТ КОМАНД' : 'ПОКАЗАТЬ СЧЁТ КОМАНД'}
                </button>
                <button 
                  onClick={toggleShowAnswer}
                  className={`px-6 py-3 rounded-full font-bold transition-all cursor-pointer ${gameState?.showAnswer ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {gameState?.showAnswer ? 'СКРЫТЬ ОТВЕТ' : 'ПОКАЗАТЬ ОТВЕТ'}
                </button>
                <button 
                  onClick={async () => {
                    const isCurrentlyPaused = !!globalPause?.active;
                    const currentRType = roundsData[gameState?.currentRound]?.type;
                    const now = Date.now() + serverOffset;

                    if (!isCurrentlyPaused) {
                      const updateData: any = { timeLeft: timeLeft };
                      if (currentRType === "memory_items") {
                        const remMem = gameState.memoryEndTime 
                          ? Math.max(0, Math.ceil((gameState.memoryEndTime - now) / 1000)) 
                          : (gameState.memoryTimeLeft || 15);
                        updateData.memoryTimeLeft = remMem;
                        updateData.timeLeft = remMem;
                      }
                      await restPatch('gameState', updateData);
                      await restPut('gameState/globalPause', { active: true });
                    } else {
                      const remSec = (gameState.timeLeft !== undefined ? gameState.timeLeft : timeLeft) || 0;
                      const updateData: any = { endTime: Date.now() + remSec * 1000 };
                      if (currentRType === "memory_items") {
                        const remMem = gameState.memoryTimeLeft !== undefined ? gameState.memoryTimeLeft : remSec;
                        updateData.memoryEndTime = Date.now() + remMem * 1000;
                      }
                      await restPatch('gameState', updateData);
                      await restPut('gameState/globalPause', { active: false });
                    }
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer"
                >
                  {globalPause?.active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {globalPause?.active ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА'}
                </button>
                <button 
                  onClick={skipQuestion}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" /> ПРОПУСТИТЬ ВОПРОС
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-red-700 hover:bg-red-800 px-6 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> СБРОС ИГРЫ
                </button>
                <button 
                  onClick={() => handleLogout(true)}
                  className="bg-red-950 hover:bg-red-900 border-2 border-red-500/70 text-red-200 hover:text-white px-6 py-3 rounded-full font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/50 active:scale-95 transition-all text-xs uppercase tracking-wider"
                  title="Выйти из режима админа на главный экран выбора ника и команды для тестирования"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> ВЫЙТИ НА ГЛАВНУЮ СТРАНИЦУ
                </button>
              </div>

              {/* Настройка ключей Gemini для Акинатора (GitHub Pages) */}
              <div className="mt-8 bg-slate-900/90 border border-purple-500/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🤖</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      API ключи для Акинатора (GitHub Pages)
                    </h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    gameState?.geminiApiKey ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}>
                    {gameState?.geminiApiKey ? "✅ Ключи подключены" : "⚠️ Ключи не заданы"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Для игры на GitHub Pages вставьте ваши ключи через запятую. Они сохранятся в базе игры и будут ротироваться по очереди (Round-Robin). В открытом репозитории GitHub их не будет!
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="Вставьте ключи через запятую: AQ.Ab8...,AQ.Ab8..."
                    className="flex-1 bg-black/60 border border-purple-500/40 focus:border-purple-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!geminiKeyInput.trim()) return;
                      setIsSavingKey(true);
                      try {
                        await restPut('gameState/geminiApiKey', geminiKeyInput.trim());
                        if (typeof window !== "undefined") {
                          try { localStorage.setItem("gemini_api_key", geminiKeyInput.trim()); } catch {}
                        }
                        setKeySavedMsg("Ключи сохранены в базе и активны! ✅");
                        setTimeout(() => setKeySavedMsg(""), 4000);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsSavingKey(false);
                      }
                    }}
                    disabled={isSavingKey || !geminiKeyInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shrink-0"
                  >
                    <span>{isSavingKey ? "СОХРАНЕНИЕ..." : "💾 СОХРАНИТЬ КЛЮЧИ"}</span>
                  </button>
                </div>
                {keySavedMsg && (
                  <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-bold text-center">
                    {keySavedMsg}
                  </div>
                )}
              </div>

              {/* ОБЩАЯ ОЧЕРЕДЬ ОТВЕТОВ СО ВСЕХ РАУНДОВ (РАУНД 1 ИСКЛЮЧЕН — У НЕГО СВОЯ ПАНЕЛЬ!) */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase">
                  Очередь непроверенных ответов (Все раунды):
                </h4>
                <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                  {Object.entries(players).flatMap(([id, p]: [string, any]) => {
                    const allRoundsAnswers = p.roundAnswers || {};
                    return Object.entries(allRoundsAnswers).flatMap(([rIdxStr, rAnswers]: [string, any]) => {
                      const rIdx = parseInt(rIdxStr);
                      // ИСКЛЮЧАЕМ ТОЛЬКО 1 РАУНД (У НЕГО СВОЯ ПАНЕЛЬ С ДЕТАЛЬНОЙ ПРОВЕРКОЙ ГЕРОЕВ)
                      if (rIdx === 1) return [];
                      if (!rAnswers || typeof rAnswers !== 'object') return [];
                      return Object.entries(rAnswers)
                        .filter(([_, ans]: [any, any]) => ans && ans.answered && !ans.checked)
                        .map(([qKey, ans]: [string, any]) => ({ id, p, roundIdx: rIdx, qKey, ans }));
                    });
                  })
                  .sort((a, b) => (a.ans.timestamp || 0) - (b.ans.timestamp || 0))
                  .map(({ id, p, roundIdx, qKey, ans }) => {
                    const qNumMatch = qKey ? qKey.match(/\d+/) : null;
                    const qIdx = qNumMatch ? parseInt(qNumMatch[0]) : 0;
                    const targetRound = roundsData[roundIdx];
                    const currentRType = targetRound?.type;

                    let questionBadge = `Раунд ${roundIdx + 1} • В${qIdx + 1}`;
                    let correctAns = targetRound?.questions?.[qIdx]?.correctAnswer;

                    if (currentRType === "three_facts") {
                      const qData = ROUND5_QUESTIONS[qIdx];
                      correctAns = qData?.animeTitle || correctAns;
                      questionBadge = `Р5 • В${qIdx + 1} (${ans?.factsRevealedAtAnswer || 1}-й факт)`;
                    }

                    if (qKey.startsWith("stage")) {
                      const match = qKey.match(/stage(\d+)_q(\d+)/);
                      if (match) {
                        const sIdx = parseInt(match[1]);
                        const sqIdx = parseInt(match[2]);
                        questionBadge = `Р4 • Фото ${sIdx + 1} • В${sqIdx + 1}`;
                        const subQ = ROUND4_STAGES[sIdx]?.subQuestions?.[sqIdx];
                        if (subQ) correctAns = subQ.correctAnswer;
                      }
                    }

                    if (!correctAns && targetRound?.questions?.[qIdx]) {
                      const qData = targetRound.questions[qIdx];
                      if (qData.character) {
                        correctAns = `${qData.character}${qData.anime ? ` (${qData.anime})` : ''}`;
                      } else if (qData.options && qData.correct !== undefined) {
                        correctAns = qData.options[qData.correct];
                      }
                    }

                    const isRound3 = roundIdx === 3;
                    const basePts = isRound3 
                      ? 2 
                      : (currentRType === "memory_items" ? 5 : (ans.potentialPoints ?? targetRound?.points ?? 2));

                    return (
                      <div key={`${id}-${roundIdx}-${qKey}`} className="bg-white/5 p-3.5 rounded-xl flex justify-between items-center border-l-4 border-purple-500 shadow-md">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-white">{p.nickname}</span>
                            {p.team !== undefined && p.team !== null && !isNaN(Number(p.team)) ? (
                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-bold text-gray-300">К{Number(p.team) + 1}</span>
                            ) : p.teamName ? (
                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-bold text-gray-300">{p.teamName}</span>
                            ) : null}
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                              {questionBadge}
                            </span>
                          </div>
                          <p className="text-sm text-blue-200 mt-1.5">
                            Ответ игрока: <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded">«{ans.answer}»</span>
                          </p>
                          {currentRType === "three_characters" && (
                            <p className="text-[11px] text-gray-400 mt-1">Персонажи: {(ans.characters || []).join(", ") || "—"}</p>
                          )}
                          <div className="mt-1.5 p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] mr-1">
                              ✓ Правильный ответ:
                            </span>
                            <span className="font-bold text-white text-xs sm:text-sm">{correctAns || "—"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <button 
                            onClick={() => markAnswer(id, roundIdx, qKey, basePts)} 
                            className="bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-white p-2.5 rounded-xl flex flex-col items-center min-w-[48px] cursor-pointer transition-all active:scale-95 border border-green-500/30"
                            title="Принять ответ"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-[10px] font-black mt-0.5">+{basePts}</span>
                          </button>
                          <button 
                            onClick={() => markAnswer(id, roundIdx, qKey, 0)} 
                            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-white p-2.5 rounded-xl flex flex-col items-center min-w-[48px] cursor-pointer transition-all active:scale-95 border border-red-500/30"
                            title="Отклонить ответ"
                          >
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-[10px] font-black mt-0.5">0</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(players).every((p: any) => 
                    !p.roundAnswers || Object.values(p.roundAnswers).every((rAns: any, rI: any) => 
                      rI === 1 || !rAns || Object.values(rAns).every((a: any) => a.checked)
                    )
                  ) && (
                    <p className="text-center text-gray-500 py-4 text-xs italic">Нет непроверенных ответов</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
