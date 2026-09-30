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
import ThreeFactsRoundView from './components/ThreeFactsRoundView';
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

    if (round.type === "three_facts") {
      newState.factsRevealed = 1; // Start with Fact 1 (5 pts)
    }

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
              if (round.type === "three_facts") {
                updateData.factsRevealed = 1; // Reset facts revealed to 1 for the new question
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
    } else if (round.points !== undefined) {
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
            
            {roundsData[gameState.currentRound]?.type === "three_facts" && (
              <div className="max-w-3xl mx-auto space-y-4 text-left">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-purple-400">Факты:</h4>
                  {roundsData[gameState.currentRound].questions[gameState.currentQuestion].facts?.map((f: string, i: number) => (
                    <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 text-sm text-gray-200">
                      <span className="font-bold text-purple-300 mr-2">#{i + 1}:</span> {f}
                    </div>
                  ))}
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
                {roundsData[gameState.currentRound]?.questions[gameState.currentQuestion]?.correctAnswer}
              </p>
            </motion.div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                key={`timer-${gameState.currentQuestion}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 14, ease: "linear" }}
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
              return <div className="text-center py-20">Вопрос не найден...</div>;
            }

            return (
              <div className="bg-black/40 p-6 rounded-3xl">
                {round.type !== "memory_items" && round.type !== "akinator" && round.type !== "bingo" && round.type !== "three_facts" && (
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-red-400">{round.name}</h2>
                    <div className="text-3xl font-mono text-yellow-500 bg-black/50 px-4 py-2 rounded-xl">
                      {timeLeft}s
                    </div>
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

                {/* Round 5: Three Facts */}
                {round.type === "three_facts" && (
                  <ThreeFactsRoundView
                    user={user}
                    gameState={gameState}
                    players={players}
                    restPatch={restPatch}
                    restPut={restPut}
                    timeLeft={timeLeft}
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
                    timeLeft={timeLeft}
                    globalPause={globalPause}
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
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl flex justify-between items-center group cursor-pointer"
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

              {/* Main Answers Queue */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase">Очередь ответов (Раунд {gameState?.currentRound + 1}):</h4>
                <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
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

                    let questionBadge = `Вопрос ${qIdx + 1}`;
                    let correctAns = roundsData[gameState.currentRound]?.questions[qIdx]?.correctAnswer;

                    if (currentRType === "three_facts") {
                      const qData = ROUND5_QUESTIONS[qIdx];
                      correctAns = qData?.animeTitle || correctAns;
                      const factAt = ans?.factsRevealedAtAnswer || 1;
                      questionBadge = `В${qIdx + 1} • ${factAt}-й факт`;
                    }

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
                      : (currentRType === "memory_items" ? 5 : (ans.potentialPoints ?? roundsData[gameState.currentRound]?.points ?? 2));

                    return (
                      <div key={`${id}-${qKey}`} className="bg-white/5 p-3 rounded-lg flex justify-between items-center border-l-4 border-purple-500">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{p.nickname}</span>
                            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">К{p.team + 1}</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-mono font-bold">
                              {questionBadge}
                            </span>
                          </div>
                          <p className="text-sm text-blue-300 mt-1">Ответ игрока: <span className="font-bold">{ans.answer}</span></p>
                          <p className="text-[10px] text-green-400 mt-0.5 uppercase tracking-wider">
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
