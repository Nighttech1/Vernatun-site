/** Per-room didactic board demos — visual stubs for screenshots. */

export interface BoardPhrase {
  hy: string;
  phonetic: string;
  ru: string;
  tag: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  tone: 'blue' | 'amber';
  phrases: BoardPhrase[];
}

export interface BoardDemo {
  topicLabel: string;
  headlineHy: string;
  headlinePhonetic: string;
  headlineRu: string;
  columns: BoardColumn[];
  hostNote: string;
  /** Optional construction hints for active speaker (C-126). */
  hints?: string[];
}

const OPEN: BoardDemo = {
  topicLabel: 'Тема · открытый диалог',
  headlineHy: '«Լսի՛, մի բան ասեմ…»',
  headlinePhonetic: 'Lsi, mi ban asem…',
  headlineRu: 'Послушай, скажу кое-что…',
  columns: [
    {
      id: 'yerevan',
      title: 'Ереванский вариант',
      tone: 'blue',
      phrases: [
        { hy: 'Ո՞նց ես', phonetic: 'vonts es', ru: 'Как дела?', tag: 'неформально' },
        { hy: 'Արա', phonetic: 'ara', ru: 'Эй / слушай', tag: 'экспрессия' },
      ],
    },
    {
      id: 'gyumri',
      title: 'Гюмрийский колорит',
      tone: 'amber',
      phrases: [
        { hy: 'Ցավդ տանեմ', phonetic: 'tsavd tanem', ru: 'Да заберу я твою боль', tag: 'тепло' },
        { hy: 'Ջան', phonetic: 'jan', ru: 'Душа / ласковое', tag: 'ласка' },
      ],
    },
  ],
  hostNote:
    'Заметка ведущего: «Ջան» часто ставят после имени — это тепло, не фамильярность.',
  hints: ['Ո՞նց ես · Արա…', 'Ցավդ տանեմ · Ջան'],
};

const A1: BoardDemo = {
  topicLabel: 'Тема · A1 · знакомство',
  headlineHy: '«Անունս … է»',
  headlinePhonetic: 'Anuns … e',
  headlineRu: 'Меня зовут …',
  columns: [
    {
      id: 'greet',
      title: 'Приветствия',
      tone: 'blue',
      phrases: [
        { hy: 'Բարև', phonetic: 'barev', ru: 'Привет', tag: 'база' },
        { hy: 'Բարի լույս', phonetic: 'bari luys', ru: 'Доброе утро', tag: 'утро' },
      ],
    },
    {
      id: 'self',
      title: 'О себе',
      tone: 'amber',
      phrases: [
        { hy: 'Ես … եմ', phonetic: 'yes … em', ru: 'Я — …', tag: 'A1' },
        { hy: 'Որտեղի՞ց ես', phonetic: 'vorteghits es', ru: 'Откуда ты?', tag: 'вопрос' },
      ],
    },
  ],
  hostNote: 'Ведущий: говорим медленно, повторяем хором имя и город.',
  hints: ['Բարև · Բարի լույս', 'Ես … եմ · Որտեղի՞ց ես'],
};

const B1: BoardDemo = {
  topicLabel: 'Тема · B1 · планы на выходные',
  headlineHy: '«Ի՞նչ ես անելու»',
  headlinePhonetic: 'Inch es anelu',
  headlineRu: 'Что будешь делать?',
  columns: [
    {
      id: 'plans',
      title: 'Планы',
      tone: 'blue',
      phrases: [
        { hy: 'Կգնամ', phonetic: 'kgnam', ru: 'Пойду', tag: 'будущее' },
        { hy: 'Կմնամ տանը', phonetic: 'kmnam tanə', ru: 'Останусь дома', tag: 'быт' },
      ],
    },
    {
      id: 'invite',
      title: 'Приглашения',
      tone: 'amber',
      phrases: [
        { hy: 'Կուզե՞ս գալ', phonetic: 'kuzes gal', ru: 'Хочешь прийти?', tag: 'приглашение' },
        { hy: 'Իհարկե', phonetic: 'iharke', ru: 'Конечно', tag: 'ответ' },
      ],
    },
  ],
  hostNote: 'Fair meter: каждый говорит минимум 1 план + 1 вопрос соседу.',
  hints: ['Կգնամ / Կմնամ տանը', 'Կուզե՞ս գալ · Իհարկե'],
};

const SLANG: BoardDemo = {
  topicLabel: 'Тема · сленг · кафе',
  headlineHy: '«Գնա՛նք սուրճ խմենք»',
  headlinePhonetic: 'Gnank surch khmenk',
  headlineRu: 'Пойдём кофе попьём',
  columns: [
    {
      id: 'cafe',
      title: 'В кафе',
      tone: 'blue',
      phrases: [
        { hy: 'Մեկ սուրճ', phonetic: 'mek surch', ru: 'Один кофе', tag: 'заказ' },
        { hy: 'Հաշիվը խնդրեմ', phonetic: 'hashivy khndrem', ru: 'Счёт, пожалуйста', tag: 'вежливо' },
      ],
    },
    {
      id: 'slang',
      title: 'Живая речь',
      tone: 'amber',
      phrases: [
        { hy: 'Հա լավ', phonetic: 'ha lav', ru: 'Ага, ладно', tag: 'сленг' },
        { hy: 'Չէ՛', phonetic: 'che', ru: 'Неа / нет', tag: 'разговорный' },
      ],
    },
  ],
  hostNote: 'Сленг — для узнавания; в формальных местах лучше нейтральные формы.',
  hints: ['Մեկ սուրճ · Հաշիվը խնդրեմ', 'Հա լավ · Չէ՛'],
};

const B2: BoardDemo = {
  topicLabel: 'Тема · B2 · аргументация',
  headlineHy: '«Իմ կարծիքով…»',
  headlinePhonetic: 'Im kartsikhov…',
  headlineRu: 'По моему мнению…',
  columns: [
    {
      id: 'opinion',
      title: 'Мнение',
      tone: 'blue',
      phrases: [
        { hy: 'Կարծում եմ', phonetic: 'kartsum em', ru: 'Я думаю', tag: 'B2' },
        { hy: 'Որովհետև', phonetic: 'vorovhetev', ru: 'Потому что', tag: 'причина' },
      ],
    },
    {
      id: 'soften',
      title: 'Смягчение',
      tone: 'amber',
      phrases: [
        { hy: 'Թերևս', phonetic: 'terevs', ru: 'Возможно', tag: 'hedge' },
        { hy: 'Հասկանում եմ, բայց', phonetic: 'haskanum em, bayts', ru: 'Понимаю, но', tag: 'вежливо' },
      ],
    },
  ],
  hostNote: 'Trust gate: низкий Academic Trust Score не пускает в B2.',
  hints: ['Իմ կարծիքով… որովհետև…', 'Հասկանում եմ, բայց…'],
};

const SMOKE: BoardDemo = {
  topicLabel: 'Тема · smoke-test · звук',
  headlineHy: '«Լսո՞ւմ ես ինձ»',
  headlinePhonetic: 'Lsum es indz',
  headlineRu: 'Ты меня слышишь?',
  columns: [
    {
      id: 'check',
      title: 'Проверка',
      tone: 'blue',
      phrases: [
        { hy: 'Մեկ, երկու', phonetic: 'mek, yerku', ru: 'Раз, два', tag: 'тест' },
        { hy: 'Լսում եմ', phonetic: 'lsum em', ru: 'Слышу', tag: 'ответ' },
      ],
    },
    {
      id: 'mic',
      title: 'Микрофон',
      tone: 'amber',
      phrases: [
        { hy: 'Միացրու միկը', phonetic: 'miatsu mikə', ru: 'Включи микрофон', tag: 'команда' },
        { hy: 'Անջատիր', phonetic: 'anjatir', ru: 'Выключи', tag: 'команда' },
      ],
    },
  ],
  hostNote: 'Smoke: двое говорят одновременно — так проверяем multi-party.',
  hints: ['Մեկ, երկու · Լսում եմ', 'Միացրու միկը · Անջատիր'],
};

const BY_ROOM: Record<string, BoardDemo> = {
  open: OPEN,
  a1: A1,
  b1: B1,
  b2: B2,
  slang: SLANG,
  'vernatun-smoke': SMOKE,
};

/** @deprecated use getBoardDemo(roomId) */
export const BOARD_DEMO = OPEN;

export function getBoardDemo(roomId: string): BoardDemo {
  const key = (roomId || '').trim().toLowerCase();
  return BY_ROOM[key] || OPEN;
}

/** Visual-only demo peers for screenshot density (not LiveKit). */
export const MOCK_AHPERIKS = [
  'ахперик 12',
  'ахперик 27',
  'ахперик 41',
  'ахперик 58',
] as const;
