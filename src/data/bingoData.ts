
export interface BingoCriterion {
  id: number;
  text: string;
  category?: string;
}

export interface BingoCell {
  id: number;
  criterion: string;
  placedAnime: string | null;
  hasError?: boolean;
}

// 50 сбалансированных критериев для аниме-бинго 4x4
export const BINGO_CRITERIA_BANK: string[] = [
  "Главный герой школьник / студент",
  "Есть магия или сверхспособности",
  "Главный герой — девушка / женщина",
  "Смерть важного персонажа",
  "Действие в другом мире (исекай) или космосе",
  "Мехи, киборги или гигантские роботы",
  "Спортивная тема или турнирная арка",
  "Тайтл длиннее 50 серий",
  "Один сезон (до 26 серий)",
  "Романтическая линия или любовный интерес",
  "Аниме вышло до 2012 года (классика)",
  "Аниме вышло после 2020 года",
  "Студия MAPPA, ufotable, Wit Studio или Madhouse",
  "Детектив, расследование или битва умов",
  "Главный герой имба / сильнейший боец",
  "Есть говорящее животное, маскот или питомец",
  "Главный герой сражается мечом / клинком",
  "Постапокалипсис, выживание или антиутопия",
  "Комедия или выраженная пародия",
  "Главный злодей был другом, союзником или наставником",
  "Есть путешествия во времени или временные петли",
  "Сверхъестественные существа: демоны, вампиры, призраки",
  "Главный герой изначально слабак / неудачник",
  "Предательство или неожиданный твист",
  "Действие в школе или академии",
  "У тайтла есть полнометражный фильм",
  "Мрачная атмосфера / темное фэнтези / триллер",
  "Главный герой носит очки, маску или повязку",
  "В сюжете есть боги, синигами или высшие сущности",
  "Культовый опенинг или саундтрек (Sawano / Penkin)",
  "Главный герой спасает мир или всё человечество",
  "В сюжете есть гильдия, клан, банда или организация",
  "Персонажи используют огнестрельное оружие",
  "Главный герой сирота или без родителей",
  "Главный герой гений или хитрый стратег",
  "Есть гигантские монстры, чудовища или кайдзю",
  "Еда, готовка или застолья играют роль",
  "Киберпанк, высокие технологии или виртуальная реальность",
  "Главный герой одержим местью",
  "Музыка, рок-группа или айдолы в центре сюжета",
  "Главный герой скрывает свою личность / альтер-эго",
  "Эпическая дуэль или дуэль 1 на 1",
  "Трогательный или слезливый финал",
  "Есть персонаж с белыми или серебряными волосами",
  "Военный конфликт или масштабная война армий",
  "Смертельная игра на выживание",
  "Главный герой не человек (монстр, демон, андроид, дух)",
  "Главный герой имеет мудрого эксцентричного наставника",
  "Трансформация или пробуждение внутренней силы",
  "Параллельные миры, альтернативные реальности или порталы"
];

// Пул из 95 популярных тайтлов
export const BINGO_ANIME_POOL: string[] = [
  "Атака титанов",
  "Тетрадь смерти",
  "Наруто",
  "Клинок, рассекающий демонов",
  "Магическая битва",
  "Ван-Пис",
  "Стальной алхимик: Братство",
  "Код Гиас",
  "Хантер х Хантер",
  "Евангелион",
  "Блич",
  "Человек-бензопила",
  "Токийский гуль",
  "Врата Штейна",
  "Моя геройская академия",
  "Невероятные приключения ДжоДжо",
  "Семья шпиона",
  "Моб Психо 100",
  "Гуррен-Лаганн",
  "Вайолет Эвергарден",
  "Созданный в Бездне",
  "Сага о Винланде",
  "Волейбол!!",
  "Баскетбол Куроко",
  "Твое имя",
  "Унесенные призраками",
  "Ходячий замок",
  "Доктор Стоун",
  "Реинкарнация бездомного",
  "Re:Zero (Жизнь с нуля)",
  "Восхождение героя щита",
  "О моём перерождении в слизь",
  "Паразит: Учение о жизни",
  "Госпожа Кагуя: В любви как на войне",
  "Бездомный бог",
  "Хвост Феи",
  "Класс убийц",
  "Обещанный Неверленд",
  "Синий экзорцист",
  "Темный дворецкий",
  "Дороро",
  "Монстр",
  "Берсерк",
  "Психопаспорт",
  "Ковбой Бибоп",
  "Гинтама",
  "Черный клевер",
  "Одинокий рокер!",
  "Фрирен, провожающая в последний путь",
  "Звездное дитя",
  "Дандадан",
  "Адский рай",
  "Семь смертных грехов",
  "Токийские мстители",
  "Эхо террора",
  "Сатана на подработке!",
  "Нет игры — нет жизни",
  "Убийца Акаме!",
  "Шарлотта",
  "Ангельские ритмы!",
  "Город, в котором меня нет",
  "Девочка-волшебница Мадока",
  "Убийца гоблинов",
  "Ванпанчмен",
  "Киберпанк: Бегущие по краю",
  "Хеллсинг Ultimate",
  "Акира",
  "Призрак в доспехах",
  "Инуяся",
  "Фейт/Зеро (Fate/Zero)",
  "Фейт: Ночь схватки (Fate/stay night)",
  "Может, я встречу тебя в подземелье? (DanMachi)",
  "Драгонболл Зет (Dragon Ball Z)",
  "Пожиратель душ (Soul Eater)",
  "Инициал Ди (Initial D)",
  "Великий из бродячих псов",
  "Синяя тюрьма: Блю Лок",
  "Боец Баки",
  "Кэнган Асура",
  "Дорохедоро",
  "Форма голоса",
  "Дитя погоды",
  "Необъятный океан",
  "Хоримия",
  "Золотое божество",
  "Эрго Прокси",
  "Повар-боец Сома",
  "Пираты «Черной лагуны»",
  "Башня Бога",
  "Добро пожаловать в класс превосходства",
  "Тетрадь дружбы Нацумэ",
  "Сейлор Мун",
  "Пламенная бригада пожарных",
  "Корона грешника",
  "Паприка"
];

// Перемешивание Fisher-Yates
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Генерация 32 случайных аниме для раунда
export function generateBingoPool32(): string[] {
  const shuffled = shuffleArray(BINGO_ANIME_POOL);
  return shuffled.slice(0, 32);
}

// Генерация случайной карточки 4x4 (16 уникальных критериев) для команды
export function generateTeamBingoCard(customSeed?: number): BingoCell[] {
  const shuffledCriteria = shuffleArray(BINGO_CRITERIA_BANK);
  const picked16 = shuffledCriteria.slice(0, 16);
  return picked16.map((criterion, idx) => ({
    id: idx,
    criterion,
    placedAnime: null,
    hasError: false
  }));
}

// Проверка линий бинго (только строки и столбцы! Диагонали НЕ считаются)
export interface BingoCheckResult {
  hasRow: boolean;
  hasCol: boolean;
  hasBingo: boolean; // At least one row or column completed
  completedRows: number[]; // 0..3
  completedCols: number[]; // 0..3
  completedLinesCount: number;
  allCompleted: boolean; // All 16 cells filled
  placedCount: number;
  highlightedIndices: Set<number>;
}

export function evaluateBingoCard(card: BingoCell[]): BingoCheckResult {
  if (!card || card.length !== 16) {
    return {
      hasRow: false,
      hasCol: false,
      hasBingo: false,
      completedRows: [],
      completedCols: [],
      completedLinesCount: 0,
      allCompleted: false,
      placedCount: 0,
      highlightedIndices: new Set()
    };
  }

  const completedRows: number[] = [];
  const completedCols: number[] = [];
  const highlighted = new Set<number>();
  let placedCount = 0;

  for (let i = 0; i < 16; i++) {
    if (card[i]?.placedAnime && !card[i]?.hasError) {
      placedCount++;
    }
  }

  // Проверка 4 строк
  for (let r = 0; r < 4; r++) {
    const rowIndices = [r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3];
    const isRowComplete = rowIndices.every(idx => card[idx]?.placedAnime && !card[idx]?.hasError);
    if (isRowComplete) {
      completedRows.push(r);
      rowIndices.forEach(idx => highlighted.add(idx));
    }
  }

  // Проверка 4 столбцов
  for (let c = 0; c < 4; c++) {
    const colIndices = [c, c + 4, c + 8, c + 12];
    const isColComplete = colIndices.every(idx => card[idx]?.placedAnime && !card[idx]?.hasError);
    if (isColComplete) {
      completedCols.push(c);
      colIndices.forEach(idx => highlighted.add(idx));
    }
  }

  const completedLinesCount = completedRows.length + completedCols.length;
  const hasBingo = completedLinesCount > 0;
  const allCompleted = placedCount === 16;

  return {
    hasRow: completedRows.length > 0,
    hasCol: completedCols.length > 0,
    hasBingo,
    completedRows,
    completedCols,
    completedLinesCount,
    allCompleted,
    placedCount,
    highlightedIndices: highlighted
  };
}
