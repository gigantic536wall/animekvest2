
export interface MemorySubQuestion {
  id: number;
  questionNumber: number; // 1, 2, 3, 4
  text: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  points: number;
  answerTime: number; // 15 sec
}

export interface MemoryStage {
  stageIdx: number; // 0, 1, 2
  title: string;
  image: string;
  memorizeDuration: number; // 15 sec
  subQuestions: MemorySubQuestion[];
}

export const ROUND4_STAGES: MemoryStage[] = [
  {
    stageIdx: 0,
    title: "Картинка 1 из 3",
    image: "/foto4/round4_1.jpg",
    memorizeDuration: 15,
    subQuestions: [
      {
        id: 1,
        questionNumber: 1,
        text: "Сколько всего было предметов на картинке?",
        correctAnswer: "16 предметов",
        acceptableAnswers: ["16", "шестнадцать", "15", "17"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 2,
        questionNumber: 2,
        text: "Сколько книжек было на картинке?",
        correctAnswer: "3 (Тетрадь смерти, том манги Berserk, книга Разведкорпуса)",
        acceptableAnswers: ["3", "три", "2", "две"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 3,
        questionNumber: 3,
        text: "Предметы из какого аниме встречались 2 раза на картинке?",
        correctAnswer: "«Берсерк» (Berserk) — меч Гатса и том манги (или «Наруто»)",
        acceptableAnswers: ["берсерк", "berserk", "наруто", "naruto"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 4,
        questionNumber: 4,
        text: "Из какого аниме бутылек?",
        correctAnswer: "«Доктор Стоун» (Dr. Stone)",
        acceptableAnswers: ["доктор стоун", "dr stone", "dr. stone", "стоун", "doctor stone"],
        points: 5,
        answerTime: 15,
      },
    ],
  },
  {
    stageIdx: 1,
    title: "Картинка 2 из 3",
    image: "/foto4/round4_2.jpg",
    memorizeDuration: 15,
    subQuestions: [
      {
        id: 1,
        questionNumber: 1,
        text: "Назовите любого персонажа, который носил предмет справа от телефона (наушники)",
        correctAnswer: "Любой персонаж в наушниках: Кэн Канеки, Мику Накано, Синдзи Икари, Соул Итер, Ута, Кёка Дзиро, Нэку и др.",
        acceptableAnswers: [
          "канеки", "мику", "синдзи", "икари", "накано", "ута", "соул", "кид", 
          "дзиро", "нэку", "хёдо", "хината", "изуми", "персонаж в наушниках"
        ],
        points: 5,
        answerTime: 15,
      },
      {
        id: 2,
        questionNumber: 2,
        text: "Назовите количество элементов одежды на картинке (не включая наушники)",
        correctAnswer: "5 (Соломенная шляпа, хаори Танджиро, повязка Конохи, маска Зеро, плащ Лелуша)",
        acceptableAnswers: ["5", "пять"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 3,
        questionNumber: 3,
        text: "Количество томов в стопке манги по Наруто",
        correctAnswer: "5 томов (тома с 1 по 5)",
        acceptableAnswers: ["5", "пять", "5 томов", "пять томов"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 4,
        questionNumber: 4,
        text: "Назовите любой очевидный предмет, который не использовался до этого",
        correctAnswer: "Хаори Танджиро / Телефон NERV / Наушники / Стопка манги Наруто / Плащ Зеро / Маска Зеро / Зеленый гримуар / Тетрадь дружбы Нацумэ / УПМ / Катана / Белая пушка",
        acceptableAnswers: [
          "хаори", "танджиро", "телефон", "нерв", "nerv", "наушники", "плащ", 
          "маска зеро", "зеро", "гримуар", "черный клевер", "тетрадь дружбы", "нацумэ", 
          "упм", "привод", "стопка манги", "манга наруто", "катана", "белая пушка", "доминатор"
        ],
        points: 5,
        answerTime: 15,
      },
    ],
  },
  {
    stageIdx: 2,
    title: "Картинка 3 из 3",
    image: "/foto4/round4_3.jpg",
    memorizeDuration: 15,
    subQuestions: [
      {
        id: 1,
        questionNumber: 1,
        text: "Назовите предметы из первого столбца",
        correctAnswer: "Соломенная шляпа (Ван Пис), Тетрадь смерти (Death Note), Трансмутационный круг (Стальной алхимик)",
        acceptableAnswers: [
          "шляпа", "тетрадь смерти", "тетрадка", "круг", "алхимия", 
          "алхимический круг", "трансмутационный круг", "пергамент"
        ],
        points: 5,
        answerTime: 15,
      },
      {
        id: 2,
        questionNumber: 2,
        text: "Какой номер был на футболке?",
        correctAnswer: "10 (Футболка Хинаты Сёё из «Волейбол!!»)",
        acceptableAnswers: ["10", "десять", "номер 10", "десятый"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 3,
        questionNumber: 3,
        text: "Какого цвета был учитель Коро?",
        correctAnswer: "Черный",
        acceptableAnswers: ["черный", "чёрный", "черного", "чёрного", "black"],
        points: 5,
        answerTime: 15,
      },
      {
        id: 4,
        questionNumber: 4,
        text: "Назовите предмет, который встречался на всех картинках (кагуне, повязка наруто, тетрадка смерти, шляпа ванпис, том манги)",
        correctAnswer: "Любой из них: Соломенная шляпа / Тетрадка смерти / Кагуне / Повязка Наруто / Том манги",
        acceptableAnswers: [
          "кагуне", "повязка", "наруто", "повязка наруто", "тетрадка", "тетрадь", 
          "тетрадь смерти", "тетрадка смерти", "шляпа", "шляпа ванпис", "ванпис", 
          "ван пис", "манга", "том манги"
        ],
        points: 5,
        answerTime: 15,
      },
    ],
  },
];
