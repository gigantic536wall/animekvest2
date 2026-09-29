/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Volume1, Volume, Bell, Crown, Settings, Play, Pause, SkipForward, Trash2, RotateCcw, CheckCircle2, XCircle, Users, Eye } from 'lucide-react';
import { AudioPlayer } from './components/AudioPlayer';
import { AKINATOR_ANIME_LIST } from './data/akinatorAnime';
import AkinatorRoundView from './components/AkinatorRoundView';
import BingoRoundView from './components/BingoRoundView';
import MemoryItemsRoundView from './components/MemoryItemsRoundView';
import ThreeCharactersReviewCard from './components/ThreeCharactersReviewCard';
import { generateBingoPool32, generateTeamBingoCard } from './data/bingoData';
import { ROUND4_STAGES } from './data/round4Data';

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
          "https://iili.io/n7PxWKB.jpg",
          "https://iili.io/n7PxiRn.jpg",
          "https://iili.io/n7PxLDG.png"
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
          "https://iili.io/n7PxZxf.png",
          "https://iili.io/n7Pxmf2.png",
          "https://iili.io/n7PxplS.png"
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
          "https://iili.io/n7PzHJ9.png",
          "https://iili.io/n7PzJRe.png",
          "https://iili.io/n7Pz2Db.png"
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
          "https://iili.io/n7PzfiQ.jpg",
          "https://iili.io/n7PzC0B.png",
          "https://iili.io/n7PznUP.png"
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
          "https://iili.io/n7Pzz5F.png",
          "https://iili.io/n7PzIOg.png",
          "https://iili.io/n7PzAzJ.jpg"
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
          "https://iili.io/n7PzRWv.jpg",
          "https://iili.io/n7Pza0N.jpg",
          "https://iili.io/n7Pz0Jt.jpg"
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
          "https://iili.io/n7PzVzG.png",
          "https://iili.io/n7PzXs4.png",
          "https://iili.io/n7Pzw12.png"
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
          "https://iili.io/n7Pzed7.png",
          "https://iili.io/n7Pzvee.png",
          "https://iili.io/n7PzgXj.png"
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
          "https://iili.io/n7Pz6qQ.jpg",
          "https://iili.io/n7PzP1V.png",
          "https://iili.io/n7PzQ71.png"
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
          "https://iili.io/n7PxSPp.png",
          "https://iili.io/n7PxgKN.png",
          "https://iili.io/n7Px4St.png"
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
      {
        text: "Звук 1: Музыка первых серий",
        audio: "/audio4/r3-1.mp3",
        correctAnswer: "Реинкарнация безработного"
      },
      {
        text: "Звук 2: Отчаянный крик персонажа",
        audio: "/audio4/r3-2.mp3",
        correctAnswer: "Охотник х Охотник (Крик Гона)"
      },
      {
        text: "Звук 3: Саундтрек битвы (с 24 секунды)",
        audio: "/audio4/r3-3.mp3",
        correctAnswer: "Блич (Bleach — On the Precipice of Defeat)"
      },
      {
        text: "Звук 4: Культовая способность / фраза",
        audio: "/audio4/r3-4.mp3",
        correctAnswer: "Невероятные приключения ДжоДжо (The World / Za Warudo)"
      },
      {
        text: "Звук 5: Коронная фраза на английском",
        audio: "/audio4/r3-5.mp3",
        correctAnswer: "Восхождение в тени (I am Atomic)"
      },
      {
        text: "Звук 6: Взрывное заклинание волшебницы",
        audio: "/audio4/r3-6.mp3",
        correctAnswer: "Этот замечательный мир! / Коносуба (Взрыв Мегумин)"
      },
      {
        text: "Звук 7: Опенинг аниме",
        audio: "/audio4/r3-7.mp3",
        correctAnswer: "Хоримия"
      },
      {
        text: "Звук 8: Расширение территории",
        audio: "/audio4/r3-8.mp3",
        correctAnswer: "Магическая битва (Расширение территории Сатору Годзё)"
      },
      {
        text: "Звук 9: Музыка / саундтрек",
        audio: "/audio4/r3-9.mp3",
        correctAnswer: "Киберпанк: Бегущие по краю (Cyberpunk: Edgerunners)"
      },
      {
        text: "Звук 10: Звуки битвы",
        audio: "/audio4/r3-10.mp3",
        correctAnswer: "Человек-бензопила"
      }
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
      { 
        text: "Картинка 1: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", 
        correctAnswer: "Картинка 1",
        answerTime: 15 
      },
      { 
        text: "Картинка 2: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", 
        correctAnswer: "Картинка 2",
        answerTime: 15 
      },
      { 
        text: "Картинка 3: 4 вопроса по памяти (15 сек на запоминание, +5 баллов за вопрос)", 
        correctAnswer: "Картинка 3",
        answerTime: 15 
      }
    ]
  },
  {
    type: "mixed_text",
    name: "Раунд 5: Раунд ребусов",
    answerTime: 45,
    pauseDuration: 10,
    questions: [
      { text: "Ребус 1", image: "/foto5/image3-5-1-1.png", correctAnswer: "Паразит" },
      { text: "Ребус 2", image: "/foto5/image3-5-2-2.png", correctAnswer: "Черный Клевер" },
      { text: "Ребус 3", image: "/foto5/image3-5-3-3.png", correctAnswer: "Рейтинг Короля" },
      { text: "Ребус 4", image: "/foto5/image3-5-4-4.png", correctAnswer: "Кланнад" },
      { text: "Ребус 5", image: "/foto5/image3-5-5-5.png", correctAnswer: "Розовая Пора Моей Школьной Жизни Сплошной Обман" },
      { text: "Ребус 6", image: "/foto5/image3-5-6-6.png", correctAnswer: "Синий Экзорцист" },
      { text: "Ребус 7", image: "/foto5/image3-5-7-7.png", correctAnswer: "Магическая Битва" },
      { text: "Ребус 8", image: "/foto5/image3-5-8-8.png", correctAnswer: "Моб Психо 100" },
      { text: "Ребус 9", image: "/foto5/image3-5-9-9.png", correctAnswer: "О моем перерождении в слизь" },
      { text: "Ребус 10", image: "/foto5/image3-5-10-10.png", correctAnswer: "Созданный в Бездне" }
    ]
  },
  {
    type: "quiz_six",
    name: "Раунд 6: Тест-викторина",
    answerTime: 40,
    pauseDuration: 10,
    questions: [
      {
        text: "«Атака титанов»: К какому именно типу титанов относился Род Райс после того, как вколол себе поврежденную сыворотку в пещере под церковью?",
        options: [
          "Девять титанов (Основатель)",
          "Ненормальный (Аномальный) чистый титан",
          "Колоссальный чистый титан",
          "Звероподобный титан (прототип)",
          "Скрытый титан стен",
          "Обычный статический титан"
        ],
        correctAnswer: "Ненормальный (Аномальный) чистый титан"
      },
      {
        text: "«Магическая битва»: Какое точное условие (небесное проклятие) наложено на Кокити Муту (Мехамару) в обмен на его колоссальный запас проклятой энергии?",
        options: [
          "Полная слепота, глухота и немота при рождении",
          "Отсутствие кожи ниже шеи, правая рука недееспособна, постоянная боль",
          "Невозможность покидать пределы барьера школы Токио",
          "Потеря пяти лет жизни за каждую активацию марионетки",
          "Отсутствие ног, замена органов механизмами, светобоязнь",
          "Паралич всего тела, отсутствие правой руки, кожа чувствительна к любому свету"
        ],
        correctAnswer: "Паралич всего тела, отсутствие правой руки, кожа чувствительна к любому свету"
      },
      {
        text: "«Тетрадь смерти»: Какое правило Тетради смерти является ложным, поскольку его лично вписал Рюк по приказу Лайта, чтобы запутать L и следствие?",
        options: [
          "Если имя человека будет написано четыре раза с ошибками, Тетрадь станет недействительна для него.",
          "Если написана причина смерти, у человека есть 6 минут и 40 часов на описание деталей.",
          "Если тот, кто использует Тетрадь, не запишет в неё ни одного имени в течение 13 дней, он умрет.",
          "Человек, коснувшийся Тетради смерти, сможет видеть и слышать Бога Смерти, даже не будучи владельцем.",
          "Тетрадь смерти станет неактивной, если её страницы закончатся или будут сожжены.",
          "Если владелец Тетради потеряет её, он забудет все воспоминания, связанные с ней."
        ],
        correctAnswer: "Если тот, кто использует Тетрадь, не запишет в неё ни одного имени в течение 13 дней, он умрет."
      },
      {
        text: "«Хантер х Хантер»: Какое истинное имя носит Пятый принц Какинской Империи, участвующий в смертельной Битве на выживание на борту корабля «Черный Кит»?",
        options: [
          "Сале-сале",
          "Цуерридрих",
          "Лузурус",
          "Камилла",
          "Тью tube (Тюбэппа)",
          "Халкенбург"
        ],
        correctAnswer: "Тью tube (Тюбэппа)"
      },
      {
        text: "«Евангелион»: Какой именно объект или сущность официально классифицируется Нарвским институтом (NERV) как «Первый Ангел»?",
        options: [
          "Лилит",
          "Сахиил",
          "Адам",
          "Ева-01",
          "Каору Нагиса",
          "Копье Лонгиния"
        ],
        correctAnswer: "Адам"
      },
      {
        text: "«Клинок, рассекающий демонов»: Кто из перечисленных персонажей НЕ является прямым создателем или уникальным пользователем собственного, лично разработанного Дыхания (ответвления от базовых)?",
        options: [
          "Мицури Канроджи (Дыхание любви)",
          "Обанай Игуро (Дыхание змеи)",
          "Тэнген Узуй (Дыхание звука)",
          "Шинобу Кочо (Дыхание насекомого)",
          "Муичиро Токито (Дыхание тумана)",
          "Канао Цуюри (Дыхание цветка)"
        ],
        correctAnswer: "Канао Цуюри (Дыхание цветка)"
      },
      {
        text: "«Стальной алхимик: Братство»: Чьи именно глаза (зрительный нерв) забрала Истина в качестве «платы» за проход через Врата во время принудительной человеческой трансмутации?",
        options: [
          "Роя Мустанга",
          "Изуми Кёртис",
          "Альфонса Элрика",
          "Эдварда Элрика",
          "Ван Хоэнхайма",
          "Шрама"
        ],
        correctAnswer: "Роя Мустанга"
      },
      {
        text: "«Созданный в Бездне»: Какое официальное название носит Пятый уровень Бездны, где находится исследовательская база Бондрюда — «Идофронт»?",
        options: [
          "Море трупов",
          "Озеро призраков",
          "Чаша скверны",
          "Сады слез",
          "Пропасть молчания",
          "Море пепла"
        ],
        correctAnswer: "Море трупов"
      },
      {
        text: "«Вайолет Эвергарден»: Какую фразу (последний приказ) произнес майор Гилберт Бугенвиллея перед тем, как Вайолет потеряла сознание и их разделила война?",
        options: [
          "«Ты должна жить дальше и стать свободной»",
          "«Я искренне люблю тебя»",
          "«Оставь меня и уходи, это приказ»",
          "«Найди свое истинное призвание»",
          "«Твои руки созданы не для оружия»",
          "«Позаботься о моей семье»"
        ],
        correctAnswer: "«Я искренне люблю тебя»"
      },
      {
        text: "«Ковбой Бибоп» (Cowboy Bebop): Какое реальное и крайне необычное земное блюдо Спайк Шпигель и Джет Блэк постоянно едят в первой серии («Потерявшие надежду в блюзе»), жалуясь на отсутствие в нем мяса?",
        options: [
          "Мисо-суп без тофу",
          "Плов со специями без баранины",
          "Тушеная говядина без говядины (зеленый перец с соусом)",
          "Лапша удон без бульона",
          "Жареный рис без яиц",
          "Карри со свининой без свинины"
        ],
        correctAnswer: "Тушеная говядина без говядины (зеленый перец с соусом)"
      }
    ]
  },
  {
    type: "akinator",
    name: "Раунд 7: Акинатор (Угадай аниме с ИИ)",
    answerTime: 90,
    pauseDuration: 10,
    questions: [
      { 
        text: "Вопрос 1: ИИ загадал секретное аниме для каждой команды. Задавайте вопросы на «Да/Нет/Частично» и угадайте его за 1.5 минуты!", 
        correctAnswer: "Аниме угадано" 
      },
      { 
        text: "Вопрос 2: Новый раунд вопросов! ИИ загадал следующее секретное аниме. Задавайте вопросы и успейте угадать за 1.5 минуты!", 
        correctAnswer: "Аниме угадано" 
      },
      { 
        text: "Вопрос 3: Финальный вопрос Акинатора! Задавайте вопросы и отгадайте третье секретное аниме за 1.5 минуты!", 
        correctAnswer: "Аниме угадано" 
      }
    ]
  },
  {
    type: "bingo",
    name: "Раунд 8: Аниме-Бинго (4×4)",
    answerTime: 0,
    questions: [
      {
        text: "Бинго-раунд! Ведущий выдает по 2 аниме за клик из 32 случайных тайтлов. Команды заполняют уникальную карточку 4×4. Собрали 4 в ряд (строка или столбец) — отправляйте на проверку админу за 12 баллов (первая линия)! Закрыли всё поле — 24 балла! Ошибка в ячейке карается штрафом -3 балла.",
        correctAnswer: "Бинго завершено"
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
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [isDoubleChoice, setIsDoubleChoice] = useState(false);
  const [preloaderStatus, setPreloaderStatus] = useState("");

  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);
  const [isTestingSound, setIsTestingSound] = useState(false);

  // ==================== VOLUME LOGIC ====================
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
    if (testAudioRef.current) {
      testAudioRef.current.volume = volume;
      testAudioRef.current.muted = isMuted;
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
        const [resState, resPause, resReview, resGPause, resPlayers, resKey] = await Promise.all([
          restGet('gameState'),
          restGet('gameState/pause'),
          restGet('gameState/answersReview'),
          restGet('gameState/globalPause'),
          restGet('players'),
          restGet('appConfig/geminiApiKey')
        ]);

        const state = resState.data || {};
        const pause = resPause.data;
        const review = resReview.data;
        const gPause = resGPause.data;
        const allPlayers = resPlayers.data;
        const serverTime = resState.serverTime;
        const remoteApiKey = resKey?.data;
        if (remoteApiKey && typeof remoteApiKey === "string") {
          state.geminiApiKey = remoteApiKey;
        }

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
      if (user.isAdmin && diff <= 0 && !gameState.revealMode && currentRType !== "da_net" && currentRType !== "bingo" && (gameState.endTime > 0)) {
        startPauseBetweenQuestions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [gameState?.active, gameState?.currentRound, gameState?.currentQuestion, gameState?.endTime, gameState?.timeLeft, globalPause?.active, pauseState?.active, gameState?.roundFinished, user?.isAdmin]);

  // ==================== ANSWER CHECK LOGIC ====================
  useEffect(() => {
    if (!gameState?.active || !user || user.isAdmin) return;
    
    setHasAnswered(false);
    setAnswerText("");
    setCharGuesses(["", "", ""]);
    
    const qIdx = gameState.currentQuestion ?? 0;
    const checkAnswered = async () => {
      try {
        const { data: ans } = await restGet(`players/${user.id}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
        if (ans?.answered) {
          setHasAnswered(true);
          setAnswerText(ans.answer || "");
          if (Array.isArray(ans.characters)) {
            setCharGuesses([ans.characters[0] || "", ans.characters[1] || "", ans.characters[2] || ""]);
          }
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
    setTimeout(() => setPreloaderStatus("✅ Ресурсы готовы"), 2000);
  };

  const handleJoin = async () => {
    if (!nickname) { setError("Введите никнейм"); return; }
    
    const id = isChangingTeam && user ? user.id : `${nickname}_${Date.now()}`;
    const newUser = { nickname, team: selectedTeam, isAdmin: false, id };
    
    await restPut(`players/${id}`, { nickname, team: selectedTeam, score: (isChangingTeam ? getPlayerScore(players[user?.id]) : 0), isAdmin: false });
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

  const resetGame = async () => {
    if (!confirm("Вы уверены, что хотите полностью сбросить игру? Все баллы и ответы будут удалены!")) return;
    
    const resetPlayers = { ...players };
    Object.keys(resetPlayers).forEach(id => {
      resetPlayers[id].score = 0;
      resetPlayers[id].scores = {};
      resetPlayers[id].roundAnswers = {};
    });
    
    await restPut('players', resetPlayers);
    
    await restPut('gameState', {
      active: false,
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

  const toggleLeaderboard = async () => {
    await restPatch('gameState', { showLeaderboard: !gameState?.showLeaderboard });
  };

  const startRevealMode = async (idx: number) => {
    const round = roundsData[idx];
    isDrivingReveal.current = true;
    await restPatch('gameState', { revealMode: true, currentQuestion: 0, active: true, currentRound: idx, showLeaderboard: false, endTime: null });
    
    if (round.type === "akinator") {
      for (let i = 0; i < round.questions.length; i++) {
        setGameState((prev: any) => ({ ...prev, currentQuestion: i }));
        await restPatch('gameState', { currentQuestion: i });
        await new Promise(r => setTimeout(r, 12000));
      }
      await restPatch('gameState', { revealMode: false, active: false, roundFinished: true });
      isDrivingReveal.current = false;
      return;
    }

    if (round.type === "bingo") {
      setGameState((prev: any) => ({ ...prev, currentQuestion: 0 }));
      await restPatch('gameState', { currentQuestion: 0 });
      await new Promise(r => setTimeout(r, 8000));
      await restPatch('gameState', { revealMode: false, active: false, roundFinished: true });
      isDrivingReveal.current = false;
      return;
    }

    for (let i = 0; i < round.questions.length; i++) {
      setGameState((prev: any) => ({ ...prev, currentQuestion: i }));
      await restPatch('gameState', { currentQuestion: i });
      const duration = round.type === "video" ? 19000 : 14000;
      await new Promise(r => setTimeout(r, duration));
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
      reset: false
    };

    if (round.type === "da_net") {
      newState.currentTeamTurn = 0;
      newState.liesLeft = 3;
      newState.endTime = 0;
    }

    if (round.type === "bingo") {
      newState.endTime = 0;
      newState.timeLeft = 0;
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
    const finalAnswer = typeof overrideAnswer === "string" ? overrideAnswer : answerText;
    const round = roundsData[gameState.currentRound];
    if (hasAnswered) return;

    if (round.type === "three_characters") {
      if (!finalAnswer.trim() && !charGuesses.some(g => g.trim())) return;
    } else {
      if (!finalAnswer.trim()) return;
    }

    let potentialPoints = round.points !== undefined ? round.points : 2;
    
    if (round.points !== undefined) {
      potentialPoints = round.points;
    } else if (round.type === "test_round") {
      potentialPoints = 2;
    } else if (round.type === "anime_info") {
      potentialPoints = 3;
    } else if (round.type === "audio_guess") {
      potentialPoints = gameState.currentRound === 3 ? 2 : 3;
    }

    if (round.type === "quiz_six") {
      potentialPoints = 4;
    }

    if (round.type === "mixed_text") {
      if (gameState.currentRound === 4) {
        potentialPoints = 3;
      } else if (gameState.currentRound === 5) {
        potentialPoints = 5;
      } else {
        potentialPoints = 2;
      }
    }

    if (round.type === "personal") {
      potentialPoints = 1;
    }

    if (round.type === "emoji_guess") {
      potentialPoints = 2;
    }

    if (round.type === "character_guess" || round.type === "description_guess") {
      potentialPoints = 2;
    }

    if (round.type === "rebus") {
      potentialPoints = 5;
    }

    if (round.type === "three_characters") {
      potentialPoints = 5;
    } else if (round.type === "image_sequence") {
      potentialPoints = 2;
    }

    const currentQIdx = gameState.currentQuestion ?? 0;
    const currentQuestion = round.questions[currentQIdx];

    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    const payload: any = { 
      answered: true, 
      answer: finalAnswer, 
      timestamp: Date.now(),
      potentialPoints,
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
          if (basePoints > 0) {
            finalPoints = basePoints * 2;
          } else {
            finalPoints = -2;
          }
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
        alert("Ошибка при сохранении оценки. Попробуйте еще раз.");
      }
    }
  };

  const markThreeCharactersAnswer = async (
    playerId: string,
    roundIdx: number,
    qKey: string,
    details: {
      animeCorrect: boolean;
      charsCorrect: boolean[];
    }
  ) => {
    const p = players[playerId];
    if (!p) return;
    const scoreKey = `${roundIdx}_${qKey}`;
    try {
      const answerData = p.roundAnswers?.[roundIdx]?.[qKey] || {};
      let basePoints = details.animeCorrect ? 2 : 0;
      details.charsCorrect.forEach(c => {
        if (c) basePoints += 1;
      });

      let finalPoints = basePoints;
      if (answerData.isDouble) {
        if (basePoints > 0) {
          finalPoints = basePoints * 2;
        } else {
          finalPoints = -2;
        }
      }

      await restPut(`players/${playerId}/scores/${scoreKey}`, finalPoints);
      await restPatch(`players/${playerId}/roundAnswers/${roundIdx}/${qKey}`, {
        checked: true,
        animeApproved: details.animeCorrect,
        charApproved: details.charsCorrect,
        awardedPoints: finalPoints
      });

      const res = await restGet('players');
      if (res.data) setPlayers(res.data);
    } catch (e) {
      console.error("Error marking three characters answer:", e);
      alert("Ошибка при сохранении оценки. Попробуйте еще раз.");
    }
  };

  // ==================== RENDER ====================
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
                {Array.from({ length: TOTAL_TEAMS }, (_, i) => i).map(t => (
                  <button 
                    key={t}
                    className={`py-3 rounded-xl font-bold transition-all border-2 ${
                      selectedTeam === t 
                        ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/20 scale-105' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedTeam(t)}
                  >
                    #{t + 1}
                  </button>
                ))}
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
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 glass p-8 rounded-[2.5rem] neon-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Аниме Викторина</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">{user.nickname}</span>
                {user.isAdmin ? (
                  <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-yellow-500/30 uppercase tracking-widest">Админ</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">Команда #{user.team + 1}</span>
                    {!gameState?.active && (
                      <button 
                        onClick={() => {
                          setSelectedTeam(user.team);
                          setNickname(user.nickname);
                          setIsChangingTeam(true);
                        }}
                        className="text-[10px] text-gray-400 hover:text-white underline uppercase tracking-widest"
                      >
                        Сменить команду
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
          </div>
        </header>

      <audio 
        ref={testAudioRef} 
        src={getAssetPath("test_sound.mp3")} 
        onEnded={() => setIsTestingSound(false)}
      />

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
                .sort((a, b) => getPlayerScore(b[1]) - getPlayerScore(a[1]))
                .map(([id, p]: [string, any], idx, arr) => {
                  const isWinner = idx === 0;
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
                          {idx + 1}
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
                        {user.isAdmin && (
                          <>
                            <div className={`text-4xl font-black ${isWinner ? 'text-yellow-500' : 'text-blue-400'}`}>
                              {getPlayerScore(p)}
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">баллов</p>
                          </>
                        )}
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
          <div className="absolute top-8 right-8 z-[110] flex items-center gap-4 glass px-6 py-3 rounded-full border border-white/10">
            <div onClick={() => setIsMuted(!isMuted)} className="cursor-pointer hover:scale-110 transition-transform">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-purple-400" />}
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-32 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="max-w-4xl w-full space-y-8 text-center" key={gameState.currentQuestion}>
            <h2 className="text-3xl font-black text-purple-400 uppercase tracking-widest mb-8">Правильные ответы</h2>
            
            {roundsData[gameState.currentRound]?.type === "test_round" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20">
                  <video 
                    ref={videoRef}
                    key={roundsData[gameState.currentRound].questions[gameState.currentQuestion].video}
                    src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].video || "")} 
                    autoPlay 
                    muted={isMuted}
                    className="w-full h-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {roundsData[gameState.currentRound].questions[gameState.currentQuestion].images?.map((img, i) => (
                    <img key={i} src={getAssetPath(img)} className="rounded-xl aspect-video object-cover border border-white/20" />
                  ))}
                </div>
              </div>
            )}

            {(roundsData[gameState.currentRound]?.type === "three_characters" || roundsData[gameState.currentRound]?.type === "image_sequence") && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {roundsData[gameState.currentRound].questions[gameState.currentQuestion].images?.map((img, i) => (
                    <div key={`${gameState.currentQuestion}-${i}`} className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 relative shadow-xl bg-black/40 group">
                      <img
                        src={getAssetPath(img)}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/char${gameState.currentQuestion}_${i}/400/550`;
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-white/10 shadow-md">
                        {roundsData[gameState.currentRound].questions[gameState.currentQuestion].characterNames?.[i] || `Персонаж #${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
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
              <div className="max-w-4xl mx-auto space-y-6">
                {roundsData[gameState.currentRound].questions[gameState.currentQuestion].image && (
                  <div className="max-w-md mx-auto">
                    <img 
                      key={gameState.currentQuestion}
                      src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].image || "")} 
                      className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[40vh] mx-auto" 
                    />
                  </div>
                )}
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <p className="text-xl italic text-gray-300 leading-relaxed">
                    "{roundsData[gameState.currentRound].questions[gameState.currentQuestion].description}"
                  </p>
                </div>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "quiz_six" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl text-center">
                  <h3 className="text-3xl font-bold leading-normal text-white">
                    {roundsData[gameState.currentRound].questions[gameState.currentQuestion].text}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundsData[gameState.currentRound].questions[gameState.currentQuestion].options?.map((opt: string, idx: number) => {
                    const isCorrect = opt === roundsData[gameState.currentRound].questions[gameState.currentQuestion].correctAnswer;
                    return (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl text-left font-medium border-2 transition-all ${
                          isCorrect 
                            ? 'bg-green-600/30 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                            : 'bg-white/5 border-white/10 text-gray-400 opacity-60'
                        }`}
                      >
                        <span className="font-mono text-sm mr-2 text-white/40">{idx + 1}.</span> {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "rebus" && (
              <div className="max-w-2xl mx-auto">
                <img 
                  key={gameState.currentQuestion}
                  src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].image || "")} 
                  className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[50vh] mx-auto" 
                />
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "description_guess" && (
              <div className="max-w-3xl mx-auto bg-white/5 p-8 rounded-3xl border border-white/10">
                <p className="text-xl italic text-gray-300 leading-relaxed">
                  "{roundsData[gameState.currentRound].questions[gameState.currentQuestion].description}"
                </p>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "emoji_guess" && (
              <div className="text-6xl md:text-8xl tracking-widest py-8">
                {roundsData[gameState.currentRound].questions[gameState.currentQuestion].emojis}
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "personal" && (
              <div className="max-w-3xl mx-auto bg-white/5 p-12 rounded-3xl border border-white/10 shadow-2xl">
                <p className="text-3xl font-bold text-white leading-tight">
                  {roundsData[gameState.currentRound].questions[gameState.currentQuestion].text}
                </p>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "mixed_text" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <p className="text-2xl font-bold text-white leading-tight">
                    {roundsData[gameState.currentRound].questions[gameState.currentQuestion].text}
                  </p>
                </div>
                {roundsData[gameState.currentRound].questions[gameState.currentQuestion].image && (
                  <div className="max-w-2xl mx-auto">
                    <img 
                      src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].image || "")} 
                      className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[40vh] mx-auto" 
                    />
                  </div>
                )}
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "anime_info" && (
              <div className="space-y-6 max-w-4xl mx-auto text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">📂 Производство</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Год:</span> <span className="text-white font-semibold">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].year}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Жанр:</span> <span className="text-pink-300 font-medium">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].genre}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Режиссер:</span> <span className="text-white">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].director}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Композитор:</span> <span className="text-white">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].composer}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Художник:</span> <span className="text-white">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].painter}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Монтаж:</span> <span className="text-white">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].editor}</span></div>
                    </div>
                  </div>
                  <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">📺 Выпуск</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Премьера:</span> <span className="text-white font-semibold">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].premiere}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Возраст:</span> <span className="text-red-400 font-bold">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].ageRating}</span></div>
                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-400">Сезоны:</span> <span className="text-amber-300 font-bold">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].seasons}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Серии:</span> <span className="text-teal-300 font-bold">{roundsData[gameState.currentRound].questions[gameState.currentQuestion].episodes}</span></div>
                      </div>
                    </div>
                    <div className="mt-4 bg-purple-900/20 p-4 rounded-2xl border border-purple-500/20">
                      <p className="text-xs text-purple-300 uppercase font-black tracking-widest mb-1">💡 Описание:</p>
                      <p className="text-sm text-white italic">"{roundsData[gameState.currentRound].questions[gameState.currentQuestion].info}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "audio_guess" && (
              <div className="max-w-xl mx-auto space-y-6">
                {roundsData[gameState.currentRound].questions[gameState.currentQuestion]?.text && (
                  <h3 className="text-xl md:text-2xl font-bold text-white text-center bg-white/5 py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md">
                    {roundsData[gameState.currentRound].questions[gameState.currentQuestion].text}
                  </h3>
                )}
                <AudioPlayer 
                  src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].audio || "")}
                  isMuted={isMuted}
                  volume={volume}
                />
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "akinator" && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                  <h3 className="text-2xl font-black text-purple-400 mb-2 uppercase tracking-widest text-center">
                    ИТОГИ: ВОПРОС {(gameState.currentQuestion ?? 0) + 1} ИЗ {roundsData[gameState.currentRound]?.questions?.length || 3} (АКИНАТОР)
                  </h3>
                  <p className="text-sm text-gray-300 text-center">
                    Загаданные тайтлы и результаты команд для этого вопроса
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: TOTAL_TEAMS }).map((_, i) => {
                    const qKey = `q${gameState?.currentQuestion ?? 0}`;
                    const tData = gameState?.akinator?.[qKey]?.teams?.[i] || gameState?.akinator?.teams?.[i];
                    return (
                      <div key={i} className="glass p-4 rounded-2xl border border-white/10 text-left">
                        <div className="text-[10px] font-black uppercase text-purple-400 mb-1">Команда {i + 1}</div>
                        <div className="text-base font-black text-white">{tData?.animeTitle || "—"}</div>
                        {tData?.originalOrEn && (
                          <div className="text-[11px] text-gray-400 italic mt-0.5 truncate">{tData.originalOrEn}</div>
                        )}
                        <div className="mt-3 pt-2 border-t border-white/10 text-[11px] flex justify-between">
                          <span className="text-gray-400">Вопросов:</span>
                          <span className="font-bold text-white">{tData?.questions?.length || 0}</span>
                        </div>
                        <div className="mt-1 text-[11px] flex justify-between">
                          <span className="text-gray-400">Статус:</span>
                          <span className={`font-bold ${tData?.guessed ? 'text-green-400' : 'text-yellow-400'}`}>
                            {tData?.guessed ? `+${tData.pointsAwarded || 10} б.` : "Не угадано"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "bingo" && (
              <div className="max-w-4xl mx-auto space-y-6 text-center">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                  <h3 className="text-3xl font-black text-amber-400 mb-3 uppercase tracking-wider">
                    РАУНД 8: АНИМЕ-БИНГО 4×4
                  </h3>
                  <p className="text-base text-gray-300 max-w-2xl mx-auto">
                    Пул из 32 популярных тайтлов. Команды собирали уникальные линии (+12 баллов) и закрывали всё поле (+24 балла). Проверьте баллы команд в таблице лидеров!
                  </p>
                </div>
              </div>
            )}

            {roundsData[gameState.currentRound]?.type === "da_net" && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                  <h3 className="text-2xl font-black text-purple-400 mb-4 uppercase tracking-widest text-center">ПРАВИЛА РАУНДА</h3>
                  <p className="text-lg text-gray-300 leading-relaxed italic text-center">
                    "{roundsData[gameState.currentRound].questions[0].text}"
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: TOTAL_TEAMS }).map((_, i) => {
                    const isActive = gameState.currentTeamTurn === i;
                    const teamPlayers = Object.values(players).filter((p: any) => p.team === i);
                    if (teamPlayers.length === 0) return null;
                    
                    return (
                      <motion.div 
                        key={i}
                        animate={{ 
                          scale: isActive ? 1.1 : 1,
                          borderColor: isActive ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all ${isActive ? 'bg-purple-900/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5'}`}
                      >
                        <div className={`text-[10px] font-black mb-2 uppercase tracking-tighter ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>Команда {i + 1}</div>
                        <div className="space-y-1">
                          {teamPlayers.map((p: any) => (
                            <div key={p.uid} className={`text-sm font-bold truncate ${isActive ? 'text-white underline underline-offset-4 decoration-purple-500' : 'text-gray-400'}`}>
                              {p.nickname}
                            </div>
                          ))}
                        </div>
                        {isActive && (
                            <div className="mt-2 text-[8px] font-black bg-purple-500 text-white px-2 py-0.5 rounded-full inline-block animate-pulse">ВАШ ХОД!</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
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
              {(roundsData[gameState.currentRound]?.type === "character_guess" || roundsData[gameState.currentRound]?.type === "quiz_six") && (
                <p className="text-xl text-purple-200 italic max-w-2xl mx-auto">
                  "{roundsData[gameState.currentRound].questions[gameState.currentQuestion].description || roundsData[gameState.currentRound].questions[gameState.currentQuestion].text}"
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
                  {/* Answer Queue during Reveal */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col min-h-[16rem] max-h-96">
                    <h4 className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3 text-purple-400" /> Очередь ответов (Раунд {gameState?.currentRound + 1}):
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                      {Object.entries(players).flatMap(([id, p]: [string, any]) => {
                        const roundAnswers = p.roundAnswers?.[gameState?.currentRound] || {};
                        return Object.entries(roundAnswers)
                          .filter(([_, ans]: [any, any]) => !ans.checked)
                          .map(([qKey, ans]: [string, any]) => ({ id, p, qKey, ans }));
                      })
                      .sort((a, b) => (a.ans.timestamp || 0) - (b.ans.timestamp || 0))
                      .map(({ id, p, qKey, ans }) => {
                        const qIdx = parseInt(qKey.replace('q',''));
                        const currentRType = roundsData[gameState.currentRound]?.type;
                        if (currentRType === "three_characters") {
                          const qData = roundsData[gameState.currentRound]?.questions[qIdx];
                          return (
                            <ThreeCharactersReviewCard
                              key={`${id}-${qKey}`}
                              playerId={id}
                              player={p}
                              qKey={qKey}
                              qIdx={qIdx}
                              questionData={qData || {}}
                              answerData={ans}
                              isCompact={true}
                              onSave={(details) => markThreeCharactersAnswer(id, gameState.currentRound, qKey, details)}
                            />
                          );
                        }

                        let questionBadge = `В${qIdx + 1}`;
                        let correctAns = roundsData[gameState.currentRound]?.questions[qIdx]?.correctAnswer;
                        if (qKey.startsWith("stage")) {
                          const match = qKey.match(/stage(\d+)_q(\d+)/);
                          if (match) {
                            const sIdx = parseInt(match[1]);
                            const sqIdx = parseInt(match[2]);
                            questionBadge = `Фото ${sIdx + 1} • В${sqIdx + 1}`;
                            const subQ = ROUND4_STAGES[sIdx]?.subQuestions[sqIdx];
                            if (subQ) {
                              correctAns = subQ.correctAnswer;
                            }
                          }
                        }

                        const isRound3 = gameState.currentRound === 3;
                        const hasDouble = !isRound3 && !!ans.isDouble;
                        const basePts = isRound3 
                          ? 2 
                          : (currentRType === "memory_items" ? 5 : (roundsData[gameState.currentRound]?.points ?? ans.potentialPoints ?? 2));
                        
                        return (
                          <div key={`${id}-${qKey}`} className="bg-white/5 p-3 rounded-xl flex justify-between items-center border-l-4 border-purple-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">{p.nickname}</span>
                                <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase">К{p.team + 1}</span>
                                <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-black">{questionBadge}</span>
                                {hasDouble && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">💎 ДАБЛ</span>}
                              </div>
                              <p className="text-xs text-purple-200 mt-1">Ответ: <span className="font-bold">{ans.answer}</span></p>
                              <p className="text-[10px] text-green-400 mt-0.5 uppercase tracking-wider">
                                Правильный: <span className="font-bold">{correctAns || "—"}</span>
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => markAnswer(id, gameState.currentRound, qKey, basePts)} 
                                className="p-1.5 hover:bg-green-500 rounded-lg text-green-400 hover:text-white transition-all flex flex-col items-center cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[8px] font-bold">+{hasDouble ? basePts * 2 : basePts}</span>
                              </button>
                              <button 
                                onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                                className="p-1.5 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all flex flex-col items-center cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                <span className="text-[8px] font-bold">{hasDouble ? -2 : 0}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {Object.values(players).every((p: any) => !p.roundAnswers?.[gameState?.currentRound] || Object.values(p.roundAnswers[gameState.currentRound]).every((a: any) => a.checked)) && (
                        <p className="text-center text-gray-500 py-4 text-[10px] italic uppercase tracking-widest">Нет новых ответов</p>
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
                <p className="text-xl">Слайд {reviewState.currentSlide + 1} из {reviewState.totalSlides}</p>
              </div>
            );
          }

          if (pauseState?.active) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl font-bold text-yellow-500 mb-4 animate-pulse">⏸️ ПАУЗА</div>
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
              return <div className="text-center py-20">Вопрос не найден...</div>;
            }

            return (
              <div className="bg-black/40 p-6 rounded-3xl">
                {round.type !== "memory_items" && round.type !== "akinator" && round.type !== "bingo" && (
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-400">{round.name}</h2>
                    <div className="text-3xl font-mono text-yellow-500 bg-black/50 px-4 py-2 rounded-xl">
                      {timeLeft}s
                    </div>
                  </div>
                )}

                {/* Test Round */}
                {round.type === "test_round" && (
                  <div className="space-y-8 w-full">
                    <div className="glass p-8 rounded-3xl neon-border text-center">
                      <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-tighter">{currentQuestion.text}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      <div className="lg:col-span-8 glass-dark rounded-[2.5rem] overflow-hidden border-2 border-white/10 aspect-video flex items-center justify-center relative shadow-2xl">
                        {currentQuestion.video ? (
                          <video 
                            ref={videoRef}
                            key={currentQuestion.video}
                            src={getAssetPath(currentQuestion.video)} 
                            autoPlay 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn("Test video failed to load");
                            }}
                          />
                        ) : (
                          <div className="text-gray-500 text-xl font-medium italic">Видео не задано</div>
                        )}
                        <div className="absolute top-6 left-6 glass px-4 py-2 rounded-full text-xs font-black text-white uppercase tracking-widest">Тест видео</div>
                      </div>

                      <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                        {currentQuestion.images?.map((img, idx) => (
                          <div key={`${gameState.currentQuestion}_${idx}`} className="aspect-video rounded-3xl overflow-hidden border border-white/10 glass-dark relative group">
                            <img 
                              src={getAssetPath(img)} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/test${idx}/400/300`;
                              }}
                            />
                            <div className="absolute bottom-3 right-3 glass px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Фото {idx + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto flex gap-3">
                        <input 
                          type="text"
                          className="answer-input flex-1"
                          placeholder="Проверка ввода..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitAnswer();
                          }}
                          disabled={hasAnswered}
                          maxLength={50}
                        />
                        <button 
                          onClick={submitAnswer}
                          disabled={hasAnswered}
                          className={`px-6 py-3 rounded-xl font-bold transition-all ${hasAnswered ? 'bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                          {hasAnswered ? 'OK' : 'ТЕСТ'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Round 1: Guess Anime by 3 Characters */}
                {(round.type === "three_characters" || round.type === "image_sequence") && (
                  <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center shadow-lg">
                      <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-1">
                        Вопрос {currentQIdx + 1} из {round.questions.length} • Правильный ответ: +2 балла
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Угадайте аниме по трем персонажам:
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      {currentQuestion.images?.slice(0, 3).map((img, idx) => {
                        const charName = currentQuestion.characterNames?.[idx];
                        return (
                          <motion.div 
                            key={`${gameState.currentQuestion}_${idx}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="glass-dark rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl relative group flex flex-col"
                          >
                            <div className="aspect-[3/4] w-full overflow-hidden bg-black/40 relative">
                              <img 
                                key={img}
                                src={getAssetPath(img)} 
                                alt={`Персонаж ${idx + 1}`} 
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => { 
                                  console.warn(`Failed to load character image: ${img}`);
                                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/char${currentQIdx}_${idx}/400/550`; 
                                }}
                              />
                              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-purple-300 border border-purple-500/30 shadow-lg">
                                Персонаж #{idx + 1}
                              </div>
                            </div>

                            {!user.isAdmin && (
                              <div className="p-3.5 bg-slate-900/95 border-t border-purple-500/30 space-y-1.5 flex-1 flex flex-col justify-end">
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                                  <span className="text-purple-300">Имя персонажа:</span>
                                  <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 text-[10px]">
                                    +1 балл
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder={`Имя героя (+1 б.)...`}
                                  value={charGuesses[idx] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value.slice(0, 40);
                                    setCharGuesses(prev => {
                                      const next = [...prev];
                                      next[idx] = val;
                                      return next;
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitAnswer();
                                  }}
                                  disabled={hasAnswered}
                                  maxLength={40}
                                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 disabled:opacity-75 disabled:bg-purple-950/20 transition-all font-medium"
                                />
                                {hasAnswered && charGuesses[idx] && (
                                  <div className="text-[10px] text-gray-400 font-medium truncate pt-0.5">
                                    Ваш вариант: <span className="text-purple-200 font-bold">{charGuesses[idx]}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {gameState.showAnswer && charName && (
                              <div className="p-3.5 bg-purple-950/80 border-t border-purple-500/40 text-center">
                                <p className="text-[10px] text-purple-400 uppercase font-black tracking-wider mb-0.5">Имя персонажа:</p>
                                <span className="text-sm font-black text-green-300 leading-tight block">{charName}</span>
                              </div>
                            )}

                            {user.isAdmin && !gameState.showAnswer && charName && (
                              <div className="p-3 bg-purple-950/90 border-t border-purple-500/40 text-center">
                                <p className="text-[10px] text-purple-300 uppercase font-black tracking-wider mb-0.5">Персонаж #{idx + 1} (+1 б.):</p>
                                <span className="text-xs font-black text-amber-300 leading-snug block">{charName}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {!user.isAdmin && (
                      <div className="max-w-xl mx-auto space-y-3">
                        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-wider text-purple-300">
                              Название аниме:
                            </label>
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              +2 балла
                            </span>
                          </div>
                          <input 
                            type="text"
                            className="answer-input w-full"
                            placeholder="Введите название тайтла (+2 балла)..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitAnswer();
                            }}
                            disabled={hasAnswered}
                            maxLength={50}
                          />
                          <button 
                            onClick={submitAnswer}
                            disabled={hasAnswered || (!answerText.trim() && !charGuesses.some(g => g.trim()))}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                              hasAnswered 
                                ? 'bg-green-600/80 text-white cursor-default' 
                                : 'bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:to-purple-700 active:scale-95 text-white disabled:opacity-40 cursor-pointer'
                            }`}
                          >
                            {hasAnswered ? 'ОТВЕТЫ ПРИНЯТЫ ✅ (ЖДИТЕ ПРОВЕРКИ)' : 'ОТПРАВИТЬ ОТВЕТЫ (+2 б. за аниме, +1 б. за каждого героя)'}
                          </button>
                        </div>
                      </div>
                    )}

                    {user.isAdmin && (
                      <div className="mt-8 bg-slate-900/90 p-5 rounded-3xl border border-purple-500/30 space-y-4 shadow-2xl">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <span>📋 Проверка ответов игроков (Вопрос {currentQIdx + 1})</span>
                              <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                                {Object.values(players).filter((p: any) => p.roundAnswers?.[gameState.currentRound]?.[`q${currentQIdx}`]?.answered).length} отв.
                              </span>
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Аниме: +2 балла • Каждый персонаж: +1 балл • Максимум: +5 баллов
                            </p>
                          </div>
                          <div className="text-xs text-purple-300 font-bold bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20">
                            Правильный тайтл: <span className="text-green-400">{currentQuestion.correctAnswer}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {Object.entries(players)
                            .filter(([_, p]: [string, any]) => p.roundAnswers?.[gameState.currentRound]?.[`q${currentQIdx}`]?.answered)
                            .map(([pId, p]: [string, any]) => {
                              const ansData = p.roundAnswers[gameState.currentRound][`q${currentQIdx}`];
                              return (
                                <ThreeCharactersReviewCard
                                  key={pId}
                                  playerId={pId}
                                  player={p}
                                  qKey={`q${currentQIdx}`}
                                  qIdx={currentQIdx}
                                  questionData={currentQuestion}
                                  answerData={ansData}
                                  onSave={(details) => markThreeCharactersAnswer(pId, gameState.currentRound, `q${currentQIdx}`, details)}
                                />
                              );
                            })}
                          {Object.values(players).every((p: any) => !p.roundAnswers?.[gameState.currentRound]?.[`q${currentQIdx}`]?.answered) && (
                            <p className="text-xs text-gray-400 italic py-6 text-center">
                              Игроки пока не отправили ответы на этот вопрос. Как только ответ будет отправлен, он мгновенно появится здесь для проверки.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 p-5 rounded-2xl border border-green-500/50 text-center max-w-xl mx-auto shadow-xl"
                      >
                        <p className="text-gray-400 text-xs uppercase tracking-widest font-black mb-1">Правильный ответ (+2 балла):</p>
                        <h3 className="text-2xl md:text-3xl font-black text-green-400">{currentQuestion.correctAnswer}</h3>
                        {currentQuestion.characterNames && (
                          <p className="text-xs text-green-200/80 mt-2 font-medium">
                            Персонажи: {currentQuestion.characterNames.join(" • ")}
                          </p>
                        )}
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
                        key={currentQuestion.video}
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
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitAnswer();
                          }}
                          disabled={hasAnswered}
                          maxLength={50}
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

                {/* Round 6: quiz_six Content */}
                {round.type === "quiz_six" && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center shadow-lg">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-widest font-bold">Вопрос {currentQIdx + 1}:</p>
                      <h3 className="text-xl md:text-2xl leading-relaxed font-bold text-white">
                        {currentQuestion.text}
                      </h3>
                    </div>
                    
                    {!user.isAdmin && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options?.map((opt: string, idx: number) => {
                          const isSelected = answerText === opt;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (hasAnswered || user.isAdmin) return;
                                setAnswerText(opt);
                                submitAnswer(opt);
                              }}
                              disabled={hasAnswered || user.isAdmin}
                              className={`p-5 rounded-2xl text-left font-medium text-base transition-all border-2 flex items-start gap-3 group relative ${
                                hasAnswered && isSelected 
                                  ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                  : hasAnswered 
                                    ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed opacity-50'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-gray-200 active:scale-[0.98]'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-xs select-none shrink-0 ${
                                hasAnswered && isSelected 
                                  ? 'border-purple-400 bg-purple-500 text-white' 
                                  : 'border-white/20 group-hover:border-white/40 text-gray-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className="leading-tight">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {user.isAdmin && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                        {currentQuestion.options?.map((opt: string, idx: number) => {
                          const isCorrect = opt === currentQuestion.correctAnswer;
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl text-left font-medium border-2 flex items-start gap-3 ${
                                isCorrect 
                                  ? 'bg-green-600/20 border-green-500 text-green-300' 
                                  : 'bg-white/5 border-white/10 text-gray-400'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[10px] shrink-0 ${
                                isCorrect ? 'border-green-400 bg-green-500 text-white' : 'border-white/20'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className="leading-tight">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center"
                      >
                        <p className="text-xs uppercase tracking-widest text-green-400 mb-1 font-bold">Правильный ответ:</p>
                        <h4 className="text-2xl font-black text-green-400">
                          {currentQuestion.correctAnswer}
                        </h4>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 5: Rebus */}
                {round.type === "rebus" && (
                  <div className="space-y-6">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-white">{currentQuestion.text}</h3>
                    </div>
                    <div className="max-w-3xl mx-auto">
                      <img 
                        key={gameState.currentQuestion}
                        src={getAssetPath(currentQuestion.image || "")} 
                        alt="Rebus" 
                        className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/10"
                        onError={(e) => { 
                          console.warn(`Failed to load image: ${currentQuestion.image}`);
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/rebus${currentQIdx}/800/600`; 
                        }}
                      />
                    </div>
                    
                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Ваш ответ..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-3xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 6: Description Guess */}
                {round.type === "description_guess" && (
                  <div className="space-y-8 max-w-4xl mx-auto">
                    <motion.div 
                      key={gameState.currentQuestion}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl"
                    >
                      <p className="text-gray-400 text-sm mb-4 uppercase tracking-widest font-bold">Описание аниме:</p>
                      <p className="text-2xl leading-relaxed italic text-white font-medium">
                        "{currentQuestion.description}"
                      </p>
                    </motion.div>
                    
                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Название аниме..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-3xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 7: Emoji Guess */}
                {round.type === "emoji_guess" && (
                  <div className="space-y-8 max-w-4xl mx-auto text-center">
                    <motion.div 
                      key={gameState.currentQuestion}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white/5 p-12 rounded-3xl border border-white/10 shadow-2xl"
                    >
                      <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest font-bold">Угадай аниме по эмодзи:</p>
                      <div className="text-6xl md:text-8xl tracking-[0.2em] leading-relaxed drop-shadow-lg">
                        {currentQuestion.emojis}
                      </div>
                    </motion.div>
                    
                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Название аниме..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-3xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 8: Personal Questions */}
                {round.type === "personal" && (
                  <div className="space-y-8 max-w-4xl mx-auto text-center">
                    <motion.div 
                      key={gameState.currentQuestion}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 p-12 rounded-3xl border border-white/10 shadow-2xl"
                    >
                      <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest font-bold">Вопрос от Назара:</p>
                      <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                        {currentQuestion.text}
                      </h3>
                    </motion.div>
                    
                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Ваш ответ..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-blue-500/20 p-6 rounded-2xl border border-blue-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Вердикт:</p>
                        <h3 className="text-2xl font-bold text-blue-400">Слушайте Назара!</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 2: Mixed Text/Image */}
                {round.type === "mixed_text" && (
                  <div className="space-y-8 max-w-4xl mx-auto text-center">
                    <motion.div 
                      key={gameState.currentQuestion}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl"
                    >
                      <p className="text-gray-400 text-sm mb-4 uppercase tracking-widest font-bold">Вопрос:</p>
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {currentQuestion.text}
                      </h3>
                    </motion.div>

                    {currentQuestion.image && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto"
                      >
                        <img 
                          src={getAssetPath(currentQuestion.image)} 
                          alt="Question Hint" 
                          className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/10"
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/mixed${currentQIdx}/800/600`; 
                          }}
                        />
                      </motion.div>
                    )}
                    
                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        {roundsData[gameState.currentRound]?.name.includes("Дабл-раунд") && !hasAnswered && (
                          <button
                            onClick={() => setIsDoubleChoice(!isDoubleChoice)}
                            className={`w-full py-3 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                              isDoubleChoice 
                                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                                : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {isDoubleChoice ? '💎 ДАБЛ АКТИВЕН' : '💎 АКТИВИРОВАТЬ ДАБЛ'}
                          </button>
                        )}
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Ваш ответ..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 2: Anime Info (Guess by Metadata) */}
                {round.type === "anime_info" && (
                  <div className="space-y-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
                        <h4 className="text-sm font-black text-purple-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">📂 <span>Производство</span></h4>
                        
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Год производства</span>
                            <span className="text-base text-white font-semibold">{currentQuestion.year}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Жанр</span>
                            <span className="text-sm text-pink-300 font-medium">{currentQuestion.genre}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Режиссер</span>
                            <span className="text-sm text-white font-medium">{currentQuestion.director}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Композитор</span>
                            <span className="text-sm text-white font-medium">{currentQuestion.composer}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/5 pb-2">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Художник</span>
                            <span className="text-sm text-white font-medium">{currentQuestion.painter}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Монтаж</span>
                            <span className="text-sm text-white font-medium">{currentQuestion.editor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 flex flex-col justify-between">
                        <div className="space-y-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
                          <h4 className="text-sm font-black text-purple-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">📺 <span>Выпуск</span></h4>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Премьера в мире</span>
                              <span className="text-sm text-white font-semibold">{currentQuestion.premiere}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Возраст</span>
                              <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-black border border-red-500/20">{currentQuestion.ageRating}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Сезоны</span>
                              <span className="text-sm text-amber-300 font-bold">{currentQuestion.seasons}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Серии</span>
                              <span className="text-sm text-teal-300 font-bold">{currentQuestion.episodes}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-6 rounded-3xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col justify-center">
                          <p className="text-xs text-purple-300 uppercase font-bold tracking-widest mb-2">💡 Описание аниме:</p>
                          <p className="text-lg md:text-xl font-medium text-white italic leading-relaxed">
                            "{currentQuestion.info}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {!user.isAdmin && (
                      <div className="max-w-md mx-auto space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full"
                          placeholder="Название аниме..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
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
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-bold text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Audio Guess */}
                {round.type === "audio_guess" && (
                  <div className="space-y-8 max-w-xl mx-auto text-center">
                    {currentQuestion.text && (
                      <h3 className="text-xl md:text-2xl font-bold text-white bg-white/5 py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md">
                        {currentQuestion.text}
                      </h3>
                    )}
                    <AudioPlayer 
                      src={getAssetPath(currentQuestion.audio || "")}
                      isMuted={isMuted}
                      volume={volume}
                    />

                    {!user.isAdmin && (
                      <div className="space-y-4">
                        <input 
                          type="text"
                          className="answer-input w-full text-center"
                          placeholder="Ваш ответ (название аниме)..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
                          disabled={hasAnswered}
                          maxLength={50}
                        />
                        <button 
                          onClick={submitAnswer}
                          disabled={hasAnswered}
                          className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                            hasAnswered 
                              ? 'bg-green-600/80 cursor-default text-white' 
                              : 'bg-red-500 hover:bg-red-600 active:scale-95 text-white'
                          }`}
                        >
                          {hasAnswered ? 'ОТВЕТ ПРИНЯТ ✅' : 'ОТПРАВИТЬ ОТВЕТ'}
                        </button>
                      </div>
                    )}

                    {gameState.showAnswer && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/20 p-6 rounded-2xl border border-green-500/50 text-center max-w-md mx-auto"
                      >
                        <p className="text-gray-400 text-sm uppercase mb-1">Правильный ответ:</p>
                        <h3 className="text-2xl font-black text-green-400">{currentQuestion.correctAnswer}</h3>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Round 4: Memory Items */}
                {round.type === "memory_items" && (
                  <MemoryItemsRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    restPatch={restPatch}
                    restPut={restPut}
                    serverOffset={serverOffset}
                    globalPause={globalPause}
                  />
                )}

                {/* Round 7: Akinator (AI) */}
                {round.type === "akinator" && (
                  <AkinatorRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    restPatch={restPatch}
                    restPut={restPut}
                  />
                )}

                {/* Round 8: Bingo */}
                {round.type === "bingo" && (
                  <BingoRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    restPatch={restPatch}
                    restPut={restPut}
                  />
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
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full">
                {Array.from({ length: TOTAL_TEAMS }, (_, i) => i).map(t => {
                  const teamPlayers = Object.values(players).filter((p: any) => p.team === t).map((p: any) => p.nickname);
                  const score = Object.values(players).filter((p: any) => p.team === t).reduce((acc: number, p: any) => acc + getPlayerScore(p), 0);
                  return (
                    <div key={t} className="glass p-6 rounded-3xl border-t-4 border-purple-500 shadow-xl transition-all hover:translate-y-[-4px]">
                      <div className="text-xs text-gray-400 mb-2 font-black uppercase tracking-widest">Команда {t + 1}</div>
                      {user.isAdmin && <div className="text-3xl font-black text-purple-400 mb-2">{score}</div>}
                      <div className="mt-2 text-[10px] text-gray-500 font-medium leading-relaxed">{teamPlayers.join(', ') || <span className="italic opacity-30">пусто</span>}</div>
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
                  onClick={async () => {
                    if (confirm("Сбросить игру?")) {
                      await Promise.all([
                        restPut('gameState', { reset: true, active: false }),
                        restDelete('players')
                      ]);
                      await new Promise(r => setTimeout(r, 1500));
                      await restPatch('gameState', { reset: false });
                      localStorage.removeItem('quizUser');
                      window.location.reload();
                    }
                  }}
                  className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> СБРОС
                </button>
              </div>

              {roundsData[gameState?.currentRound]?.type === "akinator" && (
                <div className="mt-8 bg-purple-900/20 p-6 rounded-3xl border border-purple-500/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-purple-400 uppercase tracking-widest text-sm">
                      Управление Раундом Акинатора (Вопрос {(gameState?.currentQuestion ?? 0) + 1} из {roundsData[gameState?.currentRound]?.questions?.length || 3})
                    </h4>
                    <span className="text-xs text-purple-300 font-bold">⏱️ 1.5 мин (90 сек)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                      Быстрое начисление победных очков (+10 баллов за текущий вопрос):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Array.from({ length: TOTAL_TEAMS }).map((_, i) => {
                        const hasPlayers = Object.values(players).some((p: any) => p.team === i);
                        const qIdx = gameState?.currentQuestion ?? 0;
                        const qKey = `q${qIdx}`;
                        const tData = gameState?.akinator?.[qKey]?.teams?.[i] || gameState?.akinator?.teams?.[i];
                        const teamPath = gameState?.akinator?.[qKey]?.teams 
                          ? `gameState/akinator/${qKey}/teams/${i}` 
                          : `gameState/akinator/teams/${i}`;
                        return (
                          <button 
                            key={i}
                            onClick={async () => {
                              const teamPlayers = Object.entries(players).filter(([_, p]: [any, any]) => p.team === i);
                              for (const [pId] of teamPlayers) {
                                await restPut(`players/${pId}/scores/akinator_win_q${qIdx}`, 10);
                              }
                              await restPatch(teamPath, {
                                guessed: true,
                                guessedBy: "Ведущий",
                                pointsAwarded: 10
                              });
                            }}
                            className={`py-2 px-1 rounded-xl text-[11px] font-black shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center ${
                              tData?.guessed 
                                ? 'bg-green-600/50 text-white border border-green-500/50' 
                                : hasPlayers 
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                  : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                            }`}
                            title={hasPlayers ? undefined : "В этой команде пока нет подключенных игроков"}
                          >
                            <span>КОМАНДА {i + 1} {tData?.guessed ? '✅' : ''}</span>
                            <span className="text-[9px] font-normal opacity-70">
                              {hasPlayers ? (tData?.guessed ? 'Угадано' : 'В игре') : '0 игр.'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-500/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>🤖 Gemini API Ключ для ИИ:</span>
                          <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">
                            {gameState?.geminiApiKey ? "✓ Подключен (из базы)" : "✓ Подключен (активен)"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          ИИ автоматически подключен и отвечает на вопросы. При желании здесь можно сохранить свой личный ключ.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          if (!window.confirm("Очистить историю вопросов и попыток для ВСЕХ 10 команд в текущем раунде?")) return;
                          const qIdx = gameState?.currentQuestion ?? 0;
                          const qKey = `q${qIdx}`;
                          const basePath = gameState?.akinator?.[qKey]?.teams ? `gameState/akinator/${qKey}/teams` : `gameState/akinator/teams`;
                          for (let t = 0; t < TOTAL_TEAMS; t++) {
                            await restPut(`${basePath}/${t}/questions`, []);
                            await restPut(`${basePath}/${t}/attempts`, []);
                            await restPatch(`${basePath}/${t}`, { guessed: false, pointsAwarded: 0 });
                          }
                          alert("История вопросов всех команд очищена!");
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                      >
                        🗑️ Очистить вопросы всех 10 команд
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        placeholder="Заменить Gemini API Key (AIzaSy...)"
                        className="flex-1 bg-black/40 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                      />
                      <button
                        onClick={async () => {
                          const k = geminiKeyInput.trim();
                          if (!k) return;
                          setIsSavingKey(true);
                          try {
                            await restPut("appConfig/geminiApiKey", k);
                            await restPut("gameState/geminiApiKey", k);
                            try { localStorage.setItem("gemini_api_key", k); } catch {}
                            setKeySavedMsg("Ключ успешно сохранен в базе!");
                            setGeminiKeyInput("");
                            setTimeout(() => setKeySavedMsg(""), 4000);
                          } catch (e: any) {
                            setKeySavedMsg("Ошибка сохранения ключа");
                          } finally {
                            setIsSavingKey(false);
                          }
                        }}
                        disabled={isSavingKey || !geminiKeyInput.trim()}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                      >
                        {isSavingKey ? "Сохранение..." : "Сохранить ключ"}
                      </button>
                    </div>
                    {keySavedMsg && (
                      <p className="text-[11px] text-green-400 font-bold">{keySavedMsg}</p>
                    )}
                  </div>
                </div>
              )}

              {roundsData[gameState?.currentRound]?.type === "bingo" && (
                <div className="mt-8 bg-purple-900/20 p-6 rounded-3xl border border-purple-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h4 className="font-bold text-amber-400 uppercase tracking-widest text-sm flex items-center gap-2">
                        <span>Управление Бинго (8 Раунд)</span>
                      </h4>
                      <p className="text-xs text-gray-400">
                        Выдача по 2 аниме за нажатие. Пул: 32 случайных тайтла.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Открыто тайтлов:</span>
                      <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-black font-mono">
                        {gameState?.bingo?.revealedCount || 0} / 32
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={async () => {
                        const pool = gameState?.bingo?.pool32 || [];
                        const currentCount = gameState?.bingo?.revealedCount || 0;
                        if (currentCount >= pool.length) {
                          alert("Все 32 аниме уже открыты!");
                          return;
                        }
                        const nextCount = Math.min(currentCount + 2, pool.length);
                        const newlyRevealed = pool.slice(currentCount, nextCount);
                        await restPatch("gameState/bingo", {
                          revealedCount: nextCount,
                          lastRevealed: newlyRevealed
                        });
                      }}
                      disabled={(gameState?.bingo?.revealedCount || 0) >= (gameState?.bingo?.pool32?.length || 32)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 py-4 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/30 cursor-pointer"
                    >
                      <SkipForward className="w-5 h-5" />
                      {(gameState?.bingo?.revealedCount || 0) >= 32
                        ? "ВСЕ 32 АНИМЕ ОТКРЫТЫ"
                        : `ВЫДАТЬ СЛЕДУЮЩИЕ 2 АНИМЕ (${(gameState?.bingo?.revealedCount || 0) + 2}/32)`}
                    </button>

                    <button 
                      onClick={async () => {
                        if (!window.confirm("Перегенерировать пул из 32 тайтлов и выдать новые уникальные карточки всем 10 командам?")) return;
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
                        await restPatch("gameState/bingo", {
                          pool32: pool,
                          revealedCount: 0,
                          lastRevealed: [],
                          teams: initialTeams,
                          roundOver: false
                        });
                        alert("Новый пул и карточки сгенерированы!");
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> ПЕРЕГЕНЕРИРОВАТЬ РАУНД
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <span>Завершение раунда:</span>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Завершить раунд Бинго?")) return;
                        await restPatch("gameState", { roundFinished: true, showAnswer: true });
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Завершить раунд Бинго
                    </button>
                  </div>
                </div>
              )}

              {roundsData[gameState?.currentRound]?.type === "da_net" && (
                <div className="mt-8 bg-purple-900/20 p-6 rounded-3xl border border-purple-500/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-purple-400 uppercase tracking-widest text-sm">Управление Ходом (9 Раунд)</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">Лжи осталось:</span>
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full font-black">{gameState?.liesLeft || 0}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={nextRound9Team}
                      className="bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/30 cursor-pointer"
                    >
                      <SkipForward className="w-5 h-5" /> СЛЕД. КОМАНДА
                    </button>
                    <button 
                      onClick={useRound9Lie}
                      disabled={(gameState?.liesLeft || 0) <= 0}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/30 cursor-pointer"
                    >
                      <Bell className="w-5 h-5" /> УЧЕСТЬ ЛОЖЬ
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-center mb-2">Начислить +10 баллов за правильный ответ:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Array.from({ length: TOTAL_TEAMS }).map((_, i) => {
                        const hasPlayers = Object.values(players).some((p: any) => p.team === i);
                        if (!hasPlayers) return null;
                        return (
                          <button 
                            key={i}
                            onClick={() => markRound9Correct(i)}
                            className="bg-green-600 hover:bg-green-700 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-900/20 transition-all active:scale-95 cursor-pointer"
                          >
                            КОМАНДА {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4 bg-black/30 rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Сейчас спрашивает:</div>
                    <div className="text-2xl font-black text-purple-400">КОМАНДА {(gameState?.currentTeamTurn || 0) + 1}</div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="mt-8 glass-dark rounded-[2rem] p-8 border border-white/10">
                <h4 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" /> Таблица лидеров:
                </h4>
                <div className="space-y-3">
                  {Object.entries(players)
                    .sort((a, b) => getPlayerScore(b[1]) - getPlayerScore(a[1]))
                    .map(([id, p]: [string, any]) => (
                      <div key={id} className="flex justify-between items-center p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full bg-team-${p.team + 1} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{p.nickname}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Команда {p.team + 1}</span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-xl text-purple-400">{getPlayerScore(p)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Reveal Answers Control */}
              <div className="mt-12">
                <h4 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Eye className="w-5 h-5 text-pink-400" /> Показ ответов:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roundsData.map((round, idx) => (
                    <button 
                      key={idx}
                      onClick={() => startRevealMode(idx)}
                      disabled={gameState?.active}
                      className="glass hover:bg-white/10 disabled:opacity-30 py-4 px-6 rounded-2xl font-black flex items-center justify-between gap-4 border border-white/10 transition-all active:scale-95 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-purple-500/20">{idx + 1}</span>
                        <span className="text-sm uppercase tracking-tight">{round.name}</span>
                      </div>
                      <Eye className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-4 text-center italic font-medium uppercase tracking-widest">
                  *Автоматический показ всех вопросов раунда с ответами
                </p>
              </div>

              {/* Leaderboard & Reset Controls */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={toggleLeaderboard}
                  className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer"
                >
                  <Crown className="w-5 h-5" /> ТАБЛИЦА ЛИДЕРОВ
                </button>
                <button 
                  onClick={resetGame}
                  className="bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" /> СБРОСИТЬ ИГРУ
                </button>
              </div>

              <div className="mt-4">
                <button 
                  onClick={async () => {
                    setPreloaderStatus("🔄 Пересчет баллов...");
                    try {
                      const res = await restGet('players');
                      const allPlayers = res.data || {};
                      
                      const teamTotals: Record<number, number> = {};
                      for (let i = 0; i < TOTAL_TEAMS; i++) teamTotals[i] = 0;
                      
                      Object.values(allPlayers).forEach((p: any) => {
                        const score = getPlayerScore(p);
                        if (typeof p.team === 'number' && teamTotals[p.team] !== undefined) {
                          teamTotals[p.team] += score;
                        }
                      });

                      const summary = Object.entries(teamTotals)
                        .filter(([_, score]) => score > 0)
                        .map(([team, score]) => `К${Number(team)+1}: ${score}`)
                        .join(", ");
                      
                      setPlayers(allPlayers);
                      setPreloaderStatus(`✅ Синхронизировано. Текущие итоги: ${summary || "0 баллов"}`);
                      setTimeout(() => setPreloaderStatus(""), 15000);
                    } catch (e) {
                      setPreloaderStatus("❌ Ошибка синхронизации");
                    }
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Проверить и синхронизировать баллы
                </button>
              </div>

              {/* Main Answers Queue */}
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
                    const currentRType = roundsData[gameState.currentRound]?.type;
                    if (currentRType === "three_characters") {
                      const qData = roundsData[gameState.currentRound]?.questions[qIdx];
                      return (
                        <ThreeCharactersReviewCard
                          key={`${id}-${qKey}`}
                          playerId={id}
                          player={p}
                          qKey={qKey}
                          qIdx={qIdx}
                          questionData={qData || {}}
                          answerData={ans}
                          isCompact={true}
                          onSave={(details) => markThreeCharactersAnswer(id, gameState.currentRound, qKey, details)}
                        />
                      );
                    }

                    const qData = roundsData[gameState.currentRound]?.questions[qIdx];
                    let correctAns = qData?.correctAnswer;
                    if (!correctAns && qData?.character) {
                      correctAns = `${qData.character} (${qData.anime})`;
                    }
                    if (!correctAns && qData?.options && qData?.correct !== undefined) {
                      correctAns = qData.options[qData.correct];
                    }

                    // Для 4-го раунда
                    let questionBadge = `Вопрос ${qIdx + 1}`;
                    if (qKey.startsWith("stage")) {
                      const match = qKey.match(/stage(\d+)_q(\d+)/);
                      if (match) {
                        const sIdx = parseInt(match[1]);
                        const sqIdx = parseInt(match[2]);
                        questionBadge = `Фото ${sIdx + 1} • В${sqIdx + 1}`;
                        const subQ = ROUND4_STAGES[sIdx]?.subQuestions[sqIdx];
                        if (subQ) {
                          correctAns = subQ.correctAnswer;
                        }
                      }
                    }
                    
                    const isRound3 = gameState.currentRound === 3;
                    const hasDouble = !isRound3 && !!ans.isDouble;
                    const basePts = isRound3 
                      ? 2 
                      : (currentRType === "memory_items" ? 5 : (roundsData[gameState.currentRound]?.points ?? ans.potentialPoints ?? 2));

                    return (
                      <div key={`${id}-${qKey}`} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border-l-4 border-blue-500">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.nickname}</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">К{p.team + 1}</span>
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
                              {questionBadge}
                            </span>
                          </div>
                          <p className="text-sm text-blue-300 mt-1">Ответ игрока: <span className="font-bold">{ans.answer}</span></p>
                          <p className="text-[10px] text-green-400 mt-1 uppercase tracking-wider">
                            Правильный: <span className="font-bold">{correctAns || "—"}</span>
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => markAnswer(id, gameState.currentRound, qKey, basePts)} 
                            className="bg-green-600/20 hover:bg-green-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px] cursor-pointer"
                          >
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">+{hasDouble ? basePts * 2 : basePts}</span>
                          </button>
                          <button 
                            onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                            className="bg-red-600/20 hover:bg-red-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px] cursor-pointer"
                          >
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">{hasDouble ? -2 : 0}</span>
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
    </div>
  );
}
