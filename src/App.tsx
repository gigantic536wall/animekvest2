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
    type: "image_sequence",
    name: "Раунд 1: Облик истории",
    answerTime: 36,
    questions: [
      { images: ["/foto1/image3-1-1-1.png", "/foto1/image3-1-1-2.png", "/foto1/image3-1-1-3.png", "/foto1/image3-1-1-4.png"], correctAnswer: "Атака титанов" },
      { images: ["/foto1/image3-1-2-1.png", "/foto1/image3-1-2-2.png", "/foto1/image3-1-2-3.png", "/foto1/image3-1-2-4.png"], correctAnswer: "Крутой учитель Онидзука" },
      { images: ["/foto1/image3-1-3-1.png", "/foto1/image3-1-3-2.png", "/foto1/image3-1-3-3.png", "/foto1/image3-1-3-4.png"], correctAnswer: "Код Гиас" },
      { images: ["/foto1/image3-1-4-1.png", "/foto1/image3-1-4-2.png", "/foto1/image3-1-4-3.png", "/foto1/image3-1-4-4.png"], correctAnswer: "Берсерк" },
      { images: ["/foto1/image3-1-5-1.png", "/foto1/image3-1-5-2.png", "/foto1/image3-1-5-3.png", "/foto1/image3-1-5-4.png"], correctAnswer: "Блич" },
      { images: ["/foto1/image3-1-6-1.png", "/foto1/image3-1-6-2.png", "/foto1/image3-1-6-3.png", "/foto1/image3-1-6-4.png"], correctAnswer: "Звёздное Дитя" },
      { images: ["/foto1/image3-1-7-1.png", "/foto1/image3-1-7-2.png", "/foto1/image3-1-7-3.png", "/foto1/image3-1-7-4.png"], correctAnswer: "Сага О Винланде" },
      { images: ["/foto1/image3-1-8-1.png", "/foto1/image3-1-8-2.png", "/foto1/image3-1-8-3.png", "/foto1/image3-1-8-4.png"], correctAnswer: "Твоя Апрельская Ложь" },
      { images: ["/foto1/image3-1-9-1.png", "/foto1/image3-1-9-2.png", "/foto1/image3-1-9-3.png", "/foto1/image3-1-9-4.png"], correctAnswer: "Рубеж Шангри-Ла" },
      { images: ["/foto1/image3-1-10-1.png", "/foto1/image3-1-10-2.png", "/foto1/image3-1-10-3.png", "/foto1/image3-1-10-4.png"], correctAnswer: "Шаман Кинг" }
    ]
  },
  {
    type: "anime_info",
    name: "Раунд 2: Сведения об аниме",
    answerTime: 50,
    pauseDuration: 10,
    questions: [
      {
        year: "2013– 2014",
        genre: "аниме, мультфильм, мелодрама, комедия, drama",
        director: "Тиаки Кон",
        composer: "Юкари Хасимото",
        painter: "Икуко Ирохакава",
        editor: "Сигэру Нисияма",
        premiere: "3 октября 2013",
        ageRating: "16+",
        seasons: "1 сезон",
        episodes: "24 серии",
        info: "Студент с амнезией строит новую жизнь и встречает безумную красавицу.",
        correctAnswer: "Золотая пора"
      },
      {
        year: "2015 – 2016",
        genre: "аниме, мультфильм, фантастика, драма, комедия",
        director: "Ёсиюки Асаи",
        composer: "Дзюн Маэда",
        painter: "Кадзуки Хигасидзи",
        editor: "Аюму Такахаси",
        premiere: "5 июля 2015",
        ageRating: "16+",
        seasons: "1 сезон",
        episodes: "13 серий (+ 1 спецвыпуск)",
        info: "Подростки со скрытыми сверхспособностями спасают друг друга от опасных ученых.",
        correctAnswer: "Шарлотта"
      },
      {
        year: "2013, 2022, 2023",
        genre: "аниме, мультфильм, фэнтези, комедия, повседневность",
        director: "Наото Хосода",
        composer: "Рёсукэ Наканиси",
        painter: "Ёсито Такаминэ",
        editor: "Икуё Фудзита",
        premiere: "4 апреля 2013",
        ageRating: "16+",
        seasons: "3 сезона",
        episodes: "37 серий",
        info: "Владыка тьмы попадает в Токио и ищет себе работу.",
        correctAnswer: "Сатана на подработке"
      },
      {
        year: "2017, 2019 (спин-офф — 2022)",
        genre: "аниме, мультфильм, триллер, драма, детектив",
        director: "Юитиро Хаяси",
        composer: "Тэцуя Такахаси",
        painter: "Масанобу Номура",
        editor: "Киёси Хиросэ",
        premiere: "1 июля 2017",
        ageRating: "18+",
        seasons: "2 сезона (плюс спин-офф )",
        episodes: "24 серии (+ 6 серий спин-оффа)",
        info: "Безумная школьница разрушает систему школы, выстроенную за долгое время учениками, советом и учителями.",
        correctAnswer: "Безумный азарт"
      },
      {
        year: "2019, 2020, 2021, 2022, 2025",
        genre: "аниме, мультфильм, мелодрама, комедия",
        director: "Мамору Хатакэяма",
        composer: "Кэй Ханэока",
        painter: "Риса Вакабаяси",
        editor: "Риэ Мацубара",
        premiere: "12 января 2019",
        ageRating: "16+",
        seasons: "3 сезона (плюс полнометражный фильм и спецвыпуск)",
        episodes: "37 серий (+ 1 OVA и фильм)",
        info: "Два гения ведут психологическую войну, чтобы заставить друг друга сделать то, что они хотят.",
        correctAnswer: "Госпожа Кагуя: в любви как на войне"
      },
      {
        year: "2015, 2016, 2017, 2018, 2019, 2020",
        genre: "аниме, мультфильм, комедия, драма, готовка.",
        director: "Ёситомо Ёнитани",
        composer: "Тацуя Като",
        painter: "Коитиро Бизэн",
        editor: "Юдзи Кондо",
        premiere: "4 апреля 2015",
        ageRating: "16+",
        seasons: "5 сезонов",
        episodes: "86 серий (+ 5 OVA)",
        info: "Аниме завязано на том, что главный герой попадает в элитную академию, где ему надо сразиться с профессионалами своего дела.",
        correctAnswer: "Повар-боец Сома"
      },
      {
        year: "2023",
        genre: "аниме, мультфильм, фэнтези, мелодрама, приключения",
        director: "Ёхэй Судзуки",
        composer: "Хинако Цубакияма",
        painter: "Акихиро Судзуки",
        editor: "Сигэру Нисияма",
        premiere: "6 января 2023",
        ageRating: "16+",
        seasons: "2 сезона",
        episodes: "24 серии",
        info: "Юная кондитерка и её дерзкий телохранитель-фея идут к мечте.",
        correctAnswer: "Сказка о сахарном яблоке"
      },
      {
        year: "2006, 2010 – 2011",
        genre: "аниме, мультфильм, боевик, триллер, криминал, пираты.",
        director: "Сунао Катабути",
        composer: "Эдисон",
        painter: "Хидэмаса Канэко",
        editor: "Касико Кимура",
        premiere: "8 апреля 2006",
        ageRating: "18+",
        seasons: "2 сезона (плюс OVA-сериал из 5 эпизодов)",
        episodes: "24 серии (+ 5 OVA)",
        info: "Обычный клерк становится безжалостным наемником среди криминального города.",
        correctAnswer: "Пираты «Черной лагуны»"
      },
      {
        year: "2020, 2024",
        genre: "аниме, мультфильм, фэнтези, боевик, детектив",
        director: "Такаси Сано",
        composer: "Кевин Пенкин",
        painter: "Кэйитиро Синиси",
        editor: "Ёсиаки Ёситакэ",
        premiere: "1 апреля 2020",
        ageRating: "16+",
        seasons: "2 сезона",
        episodes: "39 серий",
        info: "Мальчик штурмует опасную магическую башню ради достижения своей цели.",
        correctAnswer: "Башня Бога"
      },
      {
        year: "2013, 2016",
        genre: "аниме, мультфильм, детектив, триллер, ужасы",
        director: "Сэйдзи Киси",
        composer: "Масафуми Такада",
        painter: "Кадзуто Кусиро",
        editor: "Мари Хонда",
        premiere: "4 июля 2013",
        ageRating: "16+",
        seasons: "2 основных ТВ-сезона (Школа отчаяния + Конец школы отчаяния)",
        episodes: "37 серий (+ 1 OVA)",
        info: "Школьники заперты игрушкой-психопатом и вынуждены убивать ради выживания.",
        correctAnswer: "Данганронпа"
      }
    ]
  },
  {
    type: "video",
    name: "Раунд 3: Видео раунд",
    answerTime: 25,
    pauseDuration: 10,
    questions: [
      { text: "Вопрос по видео ", video: "/video3/vidio3-3-1-1.mp4", correctAnswer: "Ответ 1" },
      { text: "Вопрос по видео ", video: "/video3/vidio3-3-2-2.mp4.mp4", correctAnswer: "Ответ 2" },
      { text: "Вопрос по видео ", video: "/video3/vidio3-3-3-3.mp4.mp4", correctAnswer: "Ответ 3" },
      { text: "Вопрос по видео ", video: "/video3/vidio3-3-4-4.mp4", correctAnswer: "Ответ 4" },
      { text: "Вопрос по видео ", video: "/video3/vidio3-3-5-5.mp4.mp4", correctAnswer: "Ответ 5" }
    ]
  },
  {
    type: "audio_guess",
    name: "Раунд 4: Музыкальный раунд",
    answerTime: 40,
    pauseDuration: 10,
    questions: [
      { audio: "/audio4/aly.mp3", correctAnswer: "Аля иногда кокетничает со мной по-русски" },
      { audio: "/audio4/basketbol.mp3", correctAnswer: "Баскетбол Куроко" },
      { audio: "/audio4/bleach.mp3", correctAnswer: "Блич" },
      { audio: "/audio4/ditz.mp3", correctAnswer: "Звёздное Дитя" },
      { audio: "/audio4/goul.mp3", correctAnswer: "Токийский гуль" },
      { audio: "/audio4/hanter.mp3", correctAnswer: "Охотник х Охотник" },
      { audio: "/audio4/kaguy.mp3", correctAnswer: "Госпожа Кагуя" },
      { audio: "/audio4/mily.mp3", correctAnswer: "Милый во Франксе" },
      { audio: "/audio4/nadzuna.mp3", correctAnswer: "Песнь ночных сов" },
      { audio: "/audio4/ten.mp3", correctAnswer: "Тетрадь Смерти" }
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
    type: "mixed_text",
    name: "Раунд 8: Общие знания (💎 Дабл-раунд)",
    answerTime: 35,
    pauseDuration: 10,
    questions: [
      { text: "Высшая форма техники Годжо («Синий» + «Красный») в «Магической битве»?", correctAnswer: "Фиолетовый" },
      { text: "Какой особый тип меча использует Зоро в One Piece, который пожирает Хаки владельца?", correctAnswer: "Энма" },
      { text: "Как называется древнее запечатанное оружие, которое пробудил Гаара во время экзамена на чунина?", correctAnswer: "Шукаку" },
      { text: "Навык Наофуми («Герой щита»), который калечит его тело при активации?", correctAnswer: "Кровавая жертва" },
      { text: "Кто биологический компонент для картриджей в «Созданном в Бездне»?", correctAnswer: "Любящий ребенок" },
      { text: "Как называется финальный меч Клауда Страйфа, собранный из шести отдельных клинков в «Последняя фантазия VII: Дети пришествия»?", correctAnswer: "Пожиратель Первого Рода" },
      { text: "Чье имя присвоил себе главный герой «Темного дворецкого»?", correctAnswer: "Сиэль Фантомхайв" },
      { text: "Каким способом гомункул Зависть погибает в «Стальном алхимике»?", correctAnswer: "Самоубийство" },
      { text: "Сколько лет примерно Имир лепила титанов из песка в измерении Путей?", correctAnswer: "2000 лет" },
      { text: "Под каким женским именем Йохан Либерт учился в Мюнхене («Монстр»)?", correctAnswer: "Анна Либерт" },
      { text: "Точный процент на дивергентометре Окабе для линии «Врата Штейна»?", correctAnswer: "1.048596%" },
      { text: "Какой цветок на эмблеме 3-го отряда Готей-13 означает «Отчаяние»?", correctAnswer: "Календула" },
      { text: "Какое кодовое имя носил Лелуш Ламперуж, когда командовал Орденом Черных Рыцарей?", correctAnswer: "Зеро" },
      { text: "Какое имя носит Истинный Банкай Главнокомандующего Ямамото в аниме «Блич»?", correctAnswer: "Занка но Тачи" },
      { text: "Как называется техника Сукуны в «Магической битве», разрезающая цель на основе её прочности?", correctAnswer: "Рассечение" },
      { text: "С каким объект заключил контракт Эмия Широ, чтобы стать Арчером в Fate?", correctAnswer: "Алайя" },
      { text: "Какая игрушка Цукико породила «Парня с битой» в «Агенте Паранойи»?", correctAnswer: "Мароми" },
      { text: "Какую часть личности теряет Мелиодас после каждого воскрешения?", correctAnswer: "Эмоции" },
      { text: "Как называется виртуальный мир-симулятор, в котором заперты персонажи аниме «Кибервиток»?", correctAnswer: "Киберпространство" },
      { text: "Как звали Спирального Короля, загнавшего людей под землю в «Гуррен-Лаганн»?", correctAnswer: "Лордгеном" }
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
  const [serverOffset, setServerOffset] = useState(0);
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
  const [isDoubleChoice, setIsDoubleChoice] = useState(false); // To toggle double points
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
        const [resState, resPause, resReview, resGPause, resPlayers] = await Promise.all([
          restGet('gameState'),
          restGet('gameState/pause'),
          restGet('gameState/answersReview'),
          restGet('gameState/globalPause'),
          restGet('players')
        ]);

        const state = resState.data;
        const pause = resPause.data;
        const review = resReview.data;
        const gPause = resGPause.data;
        const allPlayers = resPlayers.data;
        const serverTime = resState.serverTime;

        if (serverTime) {
          setServerOffset(serverTime - Date.now());
        }

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
      // If paused, we show the frozen timeLeft from the database
      if (gameState.timeLeft !== undefined) setTimeLeft(gameState.timeLeft);
      return;
    }

    // Calculate time based on local elapsed or fallback to endTime
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

      // Admin handles the transition when time runs out
      if (user.isAdmin && diff <= 0 && !gameState.revealMode) {
        startPauseBetweenQuestions();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200); // 200ms for extra precision
    return () => clearInterval(interval);
  }, [gameState?.active, gameState?.currentRound, gameState?.currentQuestion, gameState?.endTime, gameState?.timeLeft, globalPause?.active, pauseState?.active, gameState?.roundFinished, user?.isAdmin]);

  // ==================== ANSWER CHECK LOGIC ====================
  useEffect(() => {
    if (!gameState?.active || !user || user.isAdmin) return;
    
    // Clear locally immediately to avoid stale data from previous question while fetching
    setHasAnswered(false);
    setAnswerText("");
    
    const qIdx = gameState.currentQuestion ?? 0;
    const checkAnswered = async () => {
      try {
        const { data: ans } = await restGet(`players/${user.id}/roundAnswers/${gameState.currentRound}/q${qIdx}`);
        if (ans?.answered) {
          setHasAnswered(true);
          setAnswerText(ans.answer || "");
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
    
    // If we are changing team, use same ID
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
    
    // Reset scores and answers for all players
    const resetPlayers = { ...players };
    Object.keys(resetPlayers).forEach(id => {
      resetPlayers[id].score = 0;
      resetPlayers[id].scores = {};
      resetPlayers[id].roundAnswers = {};
    });
    
    await restPut('players', resetPlayers);
    
    // Reset game state and trigger a global reset for clients
    await restPut('gameState', {
      active: false,
      currentRound: 0,
      currentQuestion: 0,
      roundFinished: false,
      revealMode: false,
      showLeaderboard: false,
      reset: true // Trigger client-side reload
    });
    
    // Clear queue and other states
    await restDelete('gameState/pause');
    await restDelete('gameState/answersReview');
    await restDelete('gameState/globalPause');

    // Turn off reset flag after a short delay
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
      newState.currentTeamTurn = 0; // Start with Team 1
      newState.liesLeft = 3;
      newState.endTime = 0; // No timer
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
    
    // Find next team with players
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
    if (isStartingPauseRef.current || pauseState?.active) return; // Prevent double trigger
    isStartingPauseRef.current = true;

    try {
      const currentGameState = gameStateRef.current || gameState;
      const round = roundsData[currentGameState.currentRound];
      if (!round) {
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
            // Delete the pause document first from DB to prevent double executing by parallel timers
            await restDelete('gameState/pause');
            isStartingPauseRef.current = false;

            const nextQ = latestGameState.currentQuestion + 1;
            if (nextQ < round.questions.length) {
              const qDuration = round.questions[nextQ].answerTime || round.answerTime || 25;
              const updateData: any = { 
                currentQuestion: nextQ, 
                timeLeft: qDuration,
                endTime: Date.now() + qDuration * 1000,
                pause: null // Atomic removal of the pause state
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
    if (hasAnswered || !finalAnswer.trim()) return;
    const round = roundsData[gameState.currentRound];
    let potentialPoints = 2; // Default
    
    if (round.type === "test_round") {
      potentialPoints = 2;
    }

    if (round.type === "anime_info") {
      potentialPoints = 3;
    }

    if (round.type === "audio_guess") {
      potentialPoints = 3;
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

    if (round.type === "image_sequence") {
      // 36s total: 36-29 (4), 28-21 (3), 20-13 (2), 12-0 (1)
      if (timeLeft > 28) potentialPoints = 4;
      else if (timeLeft > 20) potentialPoints = 3;
      else if (timeLeft > 12) potentialPoints = 2;
      else potentialPoints = 1;
    }

    const currentQIdx = gameState.currentQuestion ?? 0;
    const currentQuestion = round.questions[currentQIdx];

    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    const payload: any = { 
      answered: true, 
      answer: finalAnswer, 
      timestamp: Date.now(),
      potentialPoints,
      isDouble: isDoubleChoice 
    };

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
    setIsDoubleChoice(false); // Reset for next question
  };

  const toggleShowAnswer = async () => {
    await restPatch('gameState', { showAnswer: !gameState.showAnswer });
  };

  const markAnswer = async (playerId: string, roundIdx: number, qKey: string, basePoints: number) => {
    const p = players[playerId];
    if (p) {
      // Use a sub-path for each question to avoid race conditions on the total score
      const scoreKey = `${roundIdx}_${qKey}`;
      try {
        const answerData = p.roundAnswers?.[roundIdx]?.[qKey] || {};
        let finalPoints = basePoints;

        if (answerData.isDouble) {
          if (basePoints > 0) {
            finalPoints = basePoints * 2;
          } else {
            finalPoints = -2;
          }
        }

        await restPut(`players/${playerId}/scores/${scoreKey}`, finalPoints);
        // Mark as checked instead of deleting to keep history
        await restPatch(`players/${playerId}/roundAnswers/${roundIdx}/${qKey}`, { checked: true });
        
        // Force an immediate refresh of the players list in local state for the admin
        const res = await restGet('players');
        if (res.data) setPlayers(res.data);
      } catch (e) {
        console.error("Error marking answer:", e);
        alert("Ошибка при сохранении оценки. Попробуйте еще раз.");
      }
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
          {/* Volume Control for Reveal Mode */}
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
                  {Array.from({ length: 5 }).map((_, i) => {
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
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col h-48">
                    <h4 className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3 text-purple-400" /> Очередь ответов (Раунд {gameState?.currentRound + 1}):
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
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
                          <div key={`${id}-${qKey}`} className="bg-white/5 p-3 rounded-xl flex justify-between items-center border-l-4 border-purple-500">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs">{p.nickname}</span>
                                <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase">К{p.team + 1}</span>
                                <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-black">В{qIdx + 1}</span>
                                {ans.isDouble && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse">💎 ДАБЛ</span>}
                              </div>
                              <p className="text-xs text-purple-200 mt-1">Ответ: <span className="font-bold">{ans.answer}</span></p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => markAnswer(id, gameState.currentRound, qKey, ans.potentialPoints || 2)} 
                                className="p-1.5 hover:bg-green-500 rounded-lg text-green-400 hover:text-white transition-all flex flex-col items-center"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[8px] font-bold">+{ans.isDouble ? (ans.potentialPoints || 2) * 2 : (ans.potentialPoints || 2)}</span>
                              </button>
                              <button 
                                onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                                className="p-1.5 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all flex flex-col items-center"
                              >
                                <XCircle className="w-4 h-4" />
                                <span className="text-[8px] font-bold">{ans.isDouble ? -2 : 0}</span>
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
                  {Math.max(0, Math.ceil((pauseState.endTime - (Date.now() + serverOffset)) / 1000))}
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

                {/* Test Round */}
                {round.type === "test_round" && (
                  <div className="space-y-8 w-full">
                    <div className="glass p-8 rounded-3xl neon-border text-center">
                      <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-tighter">{currentQuestion.text}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Video Section */}
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

                      {/* Images Grid Section */}
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
                            key={`${gameState.currentQuestion}_${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
                            className="relative aspect-video overflow-hidden rounded-xl border-2 border-white/10"
                          >
                            {show && (
                              <img 
                                key={img}
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
                      {/* Left Column: Technical and Production Details */}
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

                      {/* Right Column: Release details and Plot description */}
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

                        {/* General description */}
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

                {/* Round 4: Audio Guess */}
                {round.type === "audio_guess" && (
                  <div className="space-y-8 max-w-xl mx-auto text-center">
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
                  onClick={skipQuestion}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-bold flex items-center gap-2"
                >
                  <SkipForward className="w-4 h-4" /> ПРОПУСТИТЬ ВОПРОС
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
                        if (!hasPlayers) return null;
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
                            className={`py-2 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 ${
                              tData?.guessed ? 'bg-green-600/50 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            КОМАНДА {i + 1} {tData?.guessed ? '✅' : ''}
                          </button>
                        );
                      })}
                    </div>
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
                      className="bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/30"
                    >
                      <SkipForward className="w-5 h-5" /> СЛЕД. КОМАНДА
                    </button>
                    <button 
                      onClick={useRound9Lie}
                      disabled={(gameState?.liesLeft || 0) <= 0}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-30 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/30"
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
                            className="bg-green-600 hover:bg-green-700 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-900/20 transition-all active:scale-95"
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
                      className="glass hover:bg-white/10 disabled:opacity-30 py-4 px-6 rounded-2xl font-black flex items-center justify-between gap-4 border border-white/10 transition-all active:scale-95 group"
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

              <div className="mt-4">
                <button 
                  onClick={async () => {
                    setPreloaderStatus("🔄 Пересчет баллов...");
                    try {
                      const res = await restGet('players');
                      const allPlayers = res.data || {};
                      
                      // Calculate team scores for verification
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
                  className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> Проверить и синхронизировать баллы
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
                    const qData = roundsData[gameState.currentRound]?.questions[qIdx];
                    let correctAns = qData?.correctAnswer;
                    if (!correctAns && qData?.character) {
                      correctAns = `${qData.character} (${qData.anime})`;
                    }
                    if (!correctAns && qData?.options && qData?.correct !== undefined) {
                      correctAns = qData.options[qData.correct];
                    }
                    
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
                            onClick={() => markAnswer(id, gameState.currentRound, qKey, ans.potentialPoints || 2)} 
                            className="bg-green-600/20 hover:bg-green-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px]"
                          >
                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">+{ans.isDouble ? (ans.potentialPoints || 2) * 2 : (ans.potentialPoints || 2)}</span>
                          </button>
                          <button 
                            onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                            className="bg-red-600/20 hover:bg-red-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px]"
                          >
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">{ans.isDouble ? -2 : 0}</span>
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
