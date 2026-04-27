/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Volume1, Volume, Bell, Crown, Settings, Play, Pause, SkipForward, Trash2, RotateCcw, CheckCircle2, XCircle, Users, Eye } from 'lucide-react';

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
        images: [`test/v${i + 1}_1.jpg`, `test/v${i + 1}_2.jpg`, `test/v${i + 1}_3.jpg`, `test/v${i + 1}_4.jpg`],
        video: `test/v${i + 1}_vid.mp4`,
        correctAnswer: "Проверка"
      })),
      {
        text: "Финальная проверка связи (60 секунд)",
        images: ["test/final_1.jpg", "test/final_2.jpg", "test/final_3.jpg", "test/final_4.jpg"],
        video: "test/final_vid.mp4",
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
      { images: ["foto1/naruto1.png", "foto1/naruto2.png", "foto1/naruto3.png", "foto1/naruto4.png"], correctAnswer: "Наруто" },
      { images: ["foto1/op1.png", "foto1/op2.png", "foto1/op3.png", "foto1/op4.png"], correctAnswer: "Ван Пис" },
      { images: ["foto1/dbz1.png", "foto1/dbz2.png", "foto1/dbz3.png", "foto1/dbz4.png"], correctAnswer: "Драконий жемчуг" },
      { images: ["foto1/hxh1.png", "foto1/hxh2.png", "foto1/hxh3.png", "foto1/hxh4.png"], correctAnswer: "Хантер х Хантер" },
      { images: ["foto1/fmab1.png", "foto1/fmab2.png", "foto1/fmab3.png", "foto1/fmab4.png"], correctAnswer: "Стальной алхимик" },
      { images: ["foto1/dn1.png", "foto1/dn2.png", "foto1/dn3.png", "foto1/dn4.png"], correctAnswer: "Тетрадь смерти" },
      { images: ["foto1/bebop1.png", "foto1/bebop2.png", "foto1/bebop3.png", "foto1/bebop4.png"], correctAnswer: "Ковбой Бибоп" },
      { images: ["foto1/akira1.png", "foto1/akira2.png", "foto1/akira3.png", "foto1/akira4.png"], correctAnswer: "Акира" },
      { images: ["foto1/evangelion1.png", "foto1/evangelion2.png", "foto1/evangelion3.png", "foto1/evangelion4.png"], correctAnswer: "Евангелион" },
      { images: ["foto1/aot1.png", "foto1/aot2.png", "foto1/aot3.png", "foto1/aot4.png"], correctAnswer: "Атака титанов" }
    ]
  },
  { 
    type: "mixed_text", 
    name: "Раунд 2: Общие знания", 
    answerTime: 30,
    pauseDuration: 10,
    questions: [
      { text: "В центре истории — двое парней, Чэн Сяоши и Лу Гуан, которые работают в маленьком фотоателье «Время». Они обладают сверхспособностями, позволяющими им проникать в прошлое через фотографии для выполнения заказов клиентов.", correctAnswer: "Агент времени" },
      { text: "История рассказывает о двух людях, которые случайно оказались в эпицентре инопланетного инцидента в парке. Их тела были уничтожены и воссозданы пришельцами в виде мощных боевых киборгов.", correctAnswer: "Инуясики" },
      { text: "Действие разворачивается в 1998 году в городе Ёмияма. Пятнадцатилетний Коити Сакакибара переводится в класс средней школы, над которым тяготеет проклятие, начавшееся 26 лет назад после загадочной смерти популярной ученицы.", correctAnswer: "Иная" },
      { text: "Главный герой, обычный парень, заводит дружбу с Уми — девушкой в классе. В то время как «первая красавица» всегда находится в центре внимания, Уми предпочитает быть собой только наедине с героем. Их отношения строятся на общих интересах (например, видеоиграх) и уютных посиделках после школы.", correctAnswer: "Низкоуровневый персонаж Томодзаки" },
      { text: "Из какого аниме персонаж? (Заглушка для картинки)", image: "placeholder_char.jpg", correctAnswer: "Уточните у Назара" },
      { text: "Аниме по биографии: 13-летняя девочка, которая приходит в сознание в подвале загадочного здания, не помня, как там оказалась. Постепенно выясняется, что она является Хозяином нижнего этажа B1. Позже раскрывается её истинное прошлое: она дочь культистов, чья настоящая личность скрывается за именем убитой во время ритуала девочки.", correctAnswer: "Ангел кровопролития" },
      { text: "Из какого аниме персонажи? (Заглушка для картинки)", image: "placeholder_group.jpg", correctAnswer: "Уточните у Назара" },
      { text: "По описанию места где проиходят главные события. Империя: Некогда процветающее государство, которое к началу событий погрязло в коррупции и беззаконии. Власть сосредоточена в руках юного императора, однако на деле страной управляет алчный Премьер-министр Онест, манипулирующий правителем в своих интересах.", correctAnswer: "Убийца Акаме" },
      { text: "Назовите аниме по описанию сестры главного героя: Сестра очень нежная, веселая, добрая и по-детски наивная. Она обожает панд и сильно привязана к своему брату.", correctAnswer: "Этот глупый свинья не понимает мечту девочки-зайки" },
      { text: "Назовите аниме по персонажу? (Заглушка для картинки)", image: "placeholder_last.jpg", correctAnswer: "Уточните у Назара" }
    ]
  },
  {
    type: "video",
    name: "Раунд 3: Видео раунд",
    answerTime: 60,
    pauseDuration: 10,
    questions: [
      { text: "Вопрос по видео (Заглушка 1)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Рик Ролл" },
      { text: "Вопрос по видео (Заглушка 2)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 3)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 4)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 5)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 6)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 7)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 8)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 9)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" },
      { text: "Вопрос по видео (Заглушка 10)", video: "https://www.youtube.com/embed/dQw4w9WgXcQ", correctAnswer: "Заглушка" }
    ]
  },
  {
    type: "test_round",
    name: "Раунд 4: Цифровой раунд",
    answerTime: 20,
    pauseDuration: 5,
    questions: [
      { text: "Сколько теней управляет «Садом теней»? (Восхождение в тени)", correctAnswer: "7" },
      { text: "Сколько лет главному герою в «Необъятном океане»? (В начале сериала)", correctAnswer: "20" },
      { text: "Сколько высших драконов было под началом Алтиматии на начало аниме «Рагна Багровый»?", correctAnswer: "6" },
      { text: "Какое число содержит это аниме: (Заглушка для картинки)", image: "digit_placeholder.jpg", correctAnswer: "Уточните у Назара" },
      { text: "Сколько лет Рокси Мигурдии из «Реинкарнация безработного» на момент первого появления в аниме?", correctAnswer: "44" },
      { text: "Сколько золотых зодиакальных ключей в аниме «Фейри Тейл»?", correctAnswer: "12" },
      { text: "За сколько дней Ичиго освоил банкай в аниме «Блич»?", correctAnswer: "3" },
      { text: "Сколько раз Нацуки Субару умер, чтобы победить Белого Кита в аниме «RE:ZERO»?", correctAnswer: "3" },
      { text: "Сколько пальцев Сукуны нашёл Итадори к концу 1-го сезона аниме «Магическая битва»?", correctAnswer: "6" },
      { text: "Сколько членов было в первом составе команды «Соломенная шляпа» (Ист-Блю) в аниме «One Piece»?", correctAnswer: "5" },
      { text: "Сколько миллиардов иен составляет награда за за голову Винсента Воладжу в фильме «Ковбой Бибоп»?", correctAnswer: "300" },
      { text: "Какой номер имеет истинный Клинок Сатаны (Курикара) в аниме «Синий экзорцист»?", correctAnswer: "Уточните у Назара" },
      { text: "Сколько Хашира (Столпов) существует в Корпусе истребителей демонов?", correctAnswer: "9" },
      { text: "Сколько секретных душ нужно собрать для превращения в «Оружие Смерти»? (Soul Eater)", correctAnswer: "99" },
      { text: "Сколько детей было в приюте Грейс Филд в аниме «Обещанный Неверленд»?", correctAnswer: "38" },
      { text: "Какой кодовый номер носит агент Сумрак в аниме «Семья шпиона»?", correctAnswer: "007" },
      { text: "Сколько воинов в матросках входят в группу «Внутренних воинов» (вместе с самой Сейлор Мун)?", correctAnswer: "5" },
      { text: "Сколько сердец у высокоранговых демонов (например, у Десяти заповедей)?", correctAnswer: "7" },
      { text: "Какую по счету часть (сезон) вселенной JoJo занимает «Золотой ветер»?", correctAnswer: "5" },
      { text: "Через сколько лет после падения кометы Таки и Мицуха наконец встречаются в Токио?", correctAnswer: "8" }
    ]
  },
  {
    type: "mixed_text",
    name: "Раунд 5: Раунд ребусов",
    answerTime: 30,
    pauseDuration: 10,
    questions: [
      { text: "Ребус 1 (Заглушка)", image: "rebus1.jpg", correctAnswer: "Заглушка" },
      { text: "Ребус 2 (Заглушка)", image: "rebus2.jpg", correctAnswer: "Заглушка" },
      { text: "Ребус 3 (Заглушка)", image: "rebus3.jpg", correctAnswer: "Заглушка" },
      { text: "Ребус 4 (Заглушка)", image: "rebus4.jpg", correctAnswer: "Заглушка" },
      { text: "Ребус 5 (Заглушка)", image: "rebus5.jpg", correctAnswer: "Заглушка" }
    ]
  },
  {
    type: "character_guess",
    name: "Раунд 6: Угадай аниме по описанию",
    answerTime: 40,
    pauseDuration: 10,
    questions: [
      { description: "Популярная старшеклассница Кёко и нелюдимый Изуми случайно узнают секреты друг друга вне школы. Кёко дома — образцовая домохозяйка, а Изуми — парень с пирсингом и татуировками. Их тайная дружба постепенно перерастает в нечто большее.", correctAnswer: "Хоримия" },
      { description: "В токийском районе Икэбукуро переплетаются судьбы городских легенд, банд и обычных людей. В центре событий — безголовая всадница на чёрном байке, загадочная группировка «Доллары» и информатор, который любит людей, но ненавидит их слабости.", correctAnswer: "Дюрарара!!" },
      { description: "Сверхзастенчивая Хитори Гото мечтает играть в группе. Она часами репетирует дома, надеясь стать популярной, и однажды её приглашают в настоящий коллектив. Теперь 'Тихоне' приходится преодолевать свои страхи ради музыки и новых друзей.", correctAnswer: "Одинокий рокер!" },
      { description: "История о четырех молодых девушках, чьи судьбы переплетаются через любовь к музыке и таинственное радиовещание. Обычный парень становится их проводником в мир шоу-бизнеса, помогая раскрыть таланты каждой под аккорды полуночных мелодий.", correctAnswer: "Полуночный мотив сердца" },
      { description: "Кэйити переезжает в деревню Хинамидзава, где всё кажется мирным. Однако во время фестиваля Ватанагаси начинают происходить загадочные смерти. Герой понимает, что его новые подруги скрывают нечто жуткое, а реальность начинает искажаться в кровавом цикле.", correctAnswer: "Когда плачут цикады" },
      { description: "Парень, мечтающий стать мастером кукол хина, встречает популярную красавицу Марину. Оказывается, она обожает косплей, но совершенно не умеет шить костюмы. Вмезе они погружаются в мир рукоделия, сближаясь через общее хобби.", correctAnswer: "Эта фарфоровая кукла влюбилась" },
      { description: "Эльфийка-маг Фрирен вместе с отрядом героев победила Короля Демонов. Будучи почти бессмертной, она видит, как её товарищи стареют и уходят. Спустя десятилетия она отправляется в новое путешествие, чтобы понять ценность времени и человеческих чувств.", correctAnswer: "Провожающая в последний путь Фрирен" },
      { description: "Бессмертное существо, способное принимающее облик того, что его впечатлило. Начав как камень, оно встречается с людьми, познавая радость и боль земного существования через их потери, мечты и бескочную смену поколений.", correctAnswer: "Для тебя, Бессмертный" },
      { description: "Девочка-детектив из академии в маленьком европейском государстве и японский студент распутывают мрачные тайны и легенды. Она обладает острым умом и живет в библиотеке, окутанная атмосферой готических мифов и заговоров.", correctAnswer: "Готика" },
      { description: "Аля — красавица с русскими корнями, которая часто бормочет свои искренние чувства на русском языке, думая, что её никто не понимает. Но Масачика, сидящий за соседней партой, прекрасно знает русский и слушает её признания втайне.", correctAnswer: "Аля иногда кокетничает со мной по-русски" },
      { description: "Миё Саймори терпит жестокость от мачехи. Её выдают замуж за холодного военного, Кудо Киёка, о котором ходят пугающие слухи. Однако вместо тирана Миё встречает человека, который впервые проявляет к ней истинную заботу.", correctAnswer: "Мой счастливый брак" },
      { description: "Одинокий Аманэ отдает свой зонт красавице Махиру под дождем. В благодарность она начинает помогать ему по дому. Соседи в школе, они скрывают свою необычную дружбу, которая постепенно перерастает в нежное чувство.", correctAnswer: "Ангел по соседству" },
      { description: "Главный герой случайно становится свидетелем истинного лица самой популярной девушки школы. Однако по-настоящему его внимание привлекает её подруга — 'вторая красавица', которая оказывается гораздо ближе ему по духу.", correctAnswer: "Я подружился со второй самой симпатичной девушкой в классе" },
      { description: "Девушка переодевается в парня и поступает в элитную мужскую школу-интернат ради своего кумира, талантливого прыгуна в высоту. Ей нужно скрывать свой пол и одновременно разбираться в хаосе школьной жизни и чувств.", correctAnswer: "Для тебя во всём цвету" },
      { description: "Тысячи игроков оказываются заперты в виртуальном мире MMORPG, где смерть в игре означает смерть в реальности. Одиночка Кирито пытается пройти все 100 этажей парящей крепости Айнкрад, чтобы спасти всех.", correctAnswer: "САО (Sword Art Online)" },
      { description: "Сатору обладает способностью возвращаться в прошлое на несколько минут. Но однажды его переносит на 18 лет назад, чтобы он нашел похитителя детей и предотвратил трагедию, которая разрушила его жизнь и жизни одноклассников.", correctAnswer: "Город, в котором меня нет" },
      { description: "Гон мечтает найти своего отца, величайшего Охотника. Чтобы сделать это, он сам должен сдать сложнейший экзамен и обрести силу. В пути он встречает верных друзей, с которыми сталкивается с опасными преступниками.", correctAnswer: "Хантер х Хантер" },
      { description: "Дэндзи живёт в нищете, охотясь на демонов вместе с псом-бензопилой Почитой. После предательства он сливается со своим питомцем, обретая чудовищную силу. Теперь он работает в правительстве, мечтая о простой жизни и любви.", correctAnswer: "Человек-бензопила" },
      { description: "В японской деревне пропадает парень по имени Хикару. Когда он возвращается через неделю, его лучший друг понимает, что это не Хикару, а нечто иное, занявшее его место. История о мрачной дружбе и скрытых ужасах леса.", correctAnswer: "Лето, когда погас свет" },
      { description: "Шпион, наемная убийца и девочка-телепат создают фиктивную семью для выполнения миссии. Каждый скрывает свою тайную личность, пытаясь поддерживать видимость нормальной жизни ради спасения мира от войны.", correctAnswer: "Семья шпиона" }
    ]
  },
  {
    type: "mixed_text",
    name: "Раунд 7: Угадай по силуэту",
    answerTime: 30,
    pauseDuration: 10,
    questions: [
      { text: "Угадай аниме по силуэту (Заглушка 1)", image: "silhouette1.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 2)", image: "silhouette2.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 3)", image: "silhouette3.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 4)", image: "silhouette4.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 5)", image: "silhouette5.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 6)", image: "silhouette6.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 7)", image: "silhouette7.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 8)", image: "silhouette8.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 9)", image: "silhouette9.jpg", correctAnswer: "Заглушка" },
      { text: "Угадай аниме по силуэту (Заглушка 10)", image: "silhouette10.jpg", correctAnswer: "Заглушка" }
    ]
  },
  {
    type: "mixed_text",
    name: "Раунд 8: Цитаты (💎 Дабл-раунд)",
    answerTime: 40,
    pauseDuration: 10,
    questions: [
      { text: "«Человек, который пытается кому-либо подражать, всё равно делает это по-своему! Никто не может скрыть свою натуру и привычки!»", correctAnswer: "Дюрарара!! (Durarara!!)" },
      { text: "«— Что ты наделал! Во что верить? Как мне теперь жить? Скажи мне! Пожалуйста! — Подумай об этом сама. Встань и иди. Всё время вперёд. В конце концов у тебя есть отличные, здоровые ноги.»", correctAnswer: "Стальной алхимик (Fullmetal Alchemist)" },
      { text: "«Тогда, что есть «победа»? Неважно, сколько очков ты наберешь к концу игры, если ты не счастлив, то это не победа.»", correctAnswer: "Баскетбол Куроко (Kuroko no Basket)" },
      { text: "«В этом мире нет ни правды, ни лжи. Есть только факты. И по ошибке мы верим лишь тем фактам, которые нам нравятся. Другого способа жить мы не знаем.»", correctAnswer: "Блич (Bleach)" },
      { text: "«Любовь — это готовность создать иллюзию, чтобы жить в реальности.»", correctAnswer: "Твоя апрельская ложь (Your Lie in April)" },
      { text: "«Терпеть не могу добрых девушек. Стоит с ней поздороваться, и не идёт из головы, начнёт переписываться, западёт в сердце... Но я уже это проходил.»", correctAnswer: "Как и ожидалось, моя школьная романтическая жизнь не удалась (Oregairu)" },
      { text: "«Выражение «Я боюсь себе даже представить» — в корне неверно. Ведь люди боятся, потому что представляют.»", correctAnswer: "Дюрарара!! (Durarara!!)" },
      { text: "«Книги прекрасны, не так ли? Прочтя всего одно предложение, можно сразу погрязнуть в мечтах. Думаю, читатель видит и чувствует куда больше, чем автор.»", correctAnswer: "Токийский гуль (Tokyo Ghoul)" },
      { text: "«Человек не может жить, когда вокруг нет других людей. Человек не может выжить в одиночестве. Поэтому ты хочешь любви и физического присутствия.»", correctAnswer: "Евангелион (Evangelion)" },
      { text: "«Страх очень важное чувство, но не дай ему поработить тебя. Если твоё тело проиграет, попробуй победить душой.»", correctAnswer: "Фейри Тейл (Fairy Tail)" },
      { text: "«Ошибался не я! Ошибался мир! И мир изменится — его можно изменить.»", correctAnswer: "Код Гиас (Code Geass)" },
      { text: "«Я предпочитаю довериться и пожалеть, чем сомневаться и пожалеть.»", correctAnswer: "Мастера Меча Онлайн (Sword Art Online)" },
      { text: "«Что-то трупы разгулялись. К дождю, наверное.»", correctAnswer: "Гинтама (Gintama)" },
      { text: "«— Если хотят умереть, пусть умирают. — Ну, знаешь ли... Нельзя так говорить! — Душа, способная на самоубийство, уже одержима. Не важно, жив человек или нет, его уже не спасти.»", correctAnswer: "Гинтама (Gintama)" },
      { text: "«Общество состоит из отдельных людей. Правильными поступками вы направите его на правильный путь.»", correctAnswer: "Психопаспорт (Psycho-Pass)" },
      { text: "«Живем один раз, поэтому я не собираюсь бежать, чтобы потом жалеть! Буду смотреть вперед, не оглядываясь назад!»", correctAnswer: "Ван Пис (One Piece)" },
      { text: "«Когда я была маленькой, я думала, что мир исчезнет, если я умру. Какая детская иллюзия. Существование мира, когда меня уже нет, казалось мне непростительным.»", correctAnswer: "Граница пустоты / Kara no Kyoukai (или Харухи Судзумия)" },
      { text: "«Словно в наказание, я продолжаю работать. Бездумно, лишь желая обо всём забыть. Свободное от работы время стало пыткой. Я просаживал деньги, пытаясь забыться. Казалось, всё рухнет, стоит мне оглянуться на окружающую реальность.»", correctAnswer: "Психопаспорт (Psycho-Pass)" },
      { text: "«Ива-чан, напрягать мозг, когда его нет, — плохо, голова может заболеть.»", correctAnswer: "Волейбол!! (Haikyuu!!)" },
      { text: "«Не опускай взгляд. Когда глаза затуманены — душа темнеет, и тогда будущее закрывается от тебя, и ты теряешь причину, чтобы жить дальше. Делая то, что ты считаешь верным, как многого ты добьешься, опустив голову? Выпрямись! Устреми взгляд вперед и добейся своего.»", correctAnswer: "Блич (Bleach)" }
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
      const now = Date.now() + serverOffset;
      const diff = Math.max(0, Math.ceil((gameState.endTime - now) / 1000));
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
    const duration = roundsData[idx].questions[0]?.answerTime || roundsData[idx].answerTime || 25;
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
      const { data: p } = await restGet('gameState/pause');
      if (!p || p.skip || (Date.now() + serverOffset) >= p.endTime) {
        clearInterval(checkPause);
        await restDelete('gameState/pause');
        const nextQ = gameState.currentQuestion + 1;
        if (nextQ < round.questions.length) {
          const qDuration = round.questions[nextQ].answerTime || round.answerTime || 25;
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
    
    if (round.type === "test_round") {
      potentialPoints = 2;
    }

    if (round.type === "mixed_text") {
      potentialPoints = 2;
    }

    if (round.type === "personal") {
      potentialPoints = 1;
    }

    if (round.type === "emoji_guess") {
      potentialPoints = 2;
    }

    if (round.type === "description_guess") {
      potentialPoints = 1;
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

    const path = `players/${user.id}/roundAnswers/${gameState.currentRound}/q${gameState.currentQuestion}`;
    await restPut(path, { 
      answered: true, 
      answer: answerText, 
      timestamp: Date.now(),
      potentialPoints,
      isDouble: isDoubleChoice 
    });
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
                .sort((a, b) => getPlayerScore(a[1]) - getPlayerScore(b[1])) // Lowest to Highest
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
              <div className="max-w-md mx-auto">
                <img 
                  key={gameState.currentQuestion}
                  src={getAssetPath(roundsData[gameState.currentRound].questions[gameState.currentQuestion].image || "")} 
                  className="rounded-2xl border-2 border-white/20 shadow-2xl max-h-[40vh] mx-auto" 
                />
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
                                className="p-1.5 hover:bg-green-500 rounded-lg text-green-400 hover:text-white transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                                className="p-1.5 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-all"
                              >
                                <XCircle className="w-4 h-4" />
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
                          <div key={idx} className="aspect-video rounded-3xl overflow-hidden border border-white/10 glass-dark relative group">
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
                          onChange={(e) => setAnswerText(e.target.value.slice(0, 50))}
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
                        {gameState.currentRound === 7 && !hasAnswered && (
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
                            <span className="text-[10px] font-bold">+{ans.potentialPoints || 2}</span>
                          </button>
                          <button 
                            onClick={() => markAnswer(id, gameState.currentRound, qKey, 0)} 
                            className="bg-red-600/20 hover:bg-red-600/40 p-2 rounded-lg flex flex-col items-center min-w-[45px]"
                          >
                            <XCircle className="text-red-500 w-5 h-5" />
                            <span className="text-[10px] font-bold">0</span>
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
