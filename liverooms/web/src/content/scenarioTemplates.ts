/** Four didactic scenario templates (C-125) + construction hints (C-126). */

import type { BoardDemo } from './boardDemo';

export type ScenarioTemplateId =
  | 'debates'
  | 'customs'
  | 'interview'
  | 'lexgame';

export interface ScenarioTemplate extends BoardDemo {
  id: ScenarioTemplateId;
  label: string;
  hints: string[];
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'debates',
    label: 'Дебаты',
    topicLabel: 'Шаблон · дебаты',
    headlineHy: '«Ես համաձայն չեմ, որովհետև…»',
    headlinePhonetic: 'Yes hamadzayn chem, vorovhetev…',
    headlineRu: 'Я не согласен, потому что…',
    columns: [
      {
        id: 'for',
        title: 'За',
        tone: 'blue',
        phrases: [
          {
            hy: 'Կարծում եմ',
            phonetic: 'kartsum em',
            ru: 'Я думаю',
            tag: 'мнение',
          },
          {
            hy: 'Օրինակ',
            phonetic: 'orinak',
            ru: 'Например',
            tag: 'аргумент',
          },
        ],
      },
      {
        id: 'against',
        title: 'Против',
        tone: 'amber',
        phrases: [
          {
            hy: 'Բայց',
            phonetic: 'bayts',
            ru: 'Но',
            tag: 'контраст',
          },
          {
            hy: 'Չեմ կարծում',
            phonetic: 'chem kartsum',
            ru: 'Не думаю',
            tag: 'несогласие',
          },
        ],
      },
    ],
    hostNote: 'Каждый: тезис → пример → вопрос оппоненту. Таймер 60 с.',
    hints: [
      'Ես համաձայն եմ / չեմ + որովհետև…',
      'Օրինակ՝ … / Բայց…',
    ],
  },
  {
    id: 'customs',
    label: 'Таможня',
    topicLabel: 'Шаблон · таможня / граница',
    headlineHy: '«Որտեղի՞ց եք գալիս»',
    headlinePhonetic: 'Vorteghits ek galis',
    headlineRu: 'Откуда вы приехали?',
    columns: [
      {
        id: 'officer',
        title: 'Сотрудник',
        tone: 'blue',
        phrases: [
          {
            hy: 'Փաստաթղթերը',
            phonetic: 'pastatghterə',
            ru: 'Документы',
            tag: 'запрос',
          },
          {
            hy: 'Որքա՞ն կմնաք',
            phonetic: 'vorkan kmnak',
            ru: 'Сколько пробудете?',
            tag: 'вопрос',
          },
        ],
      },
      {
        id: 'traveler',
        title: 'Путешественник',
        tone: 'amber',
        phrases: [
          {
            hy: 'Զբոսաշրջիկ եմ',
            phonetic: 'zbosasrdjik em',
            ru: 'Я турист',
            tag: 'ответ',
          },
          {
            hy: 'Մեկ շաբաթ',
            phonetic: 'mek shabat',
            ru: 'Одну неделю',
            tag: 'срок',
          },
        ],
      },
    ],
    hostNote: 'Роли меняются каждые 2 минуты. Вежливость важнее скорости.',
    hints: [
      'Որտեղի՞ց եք / Որքա՞ն…',
      'Ես … եմ · Մեկ շաբաթ',
    ],
  },
  {
    id: 'interview',
    label: 'Собеседование',
    topicLabel: 'Шаблон · собеседование',
    headlineHy: '«Պատմե՛ք ձեր մասին»',
    headlinePhonetic: 'Patmetsek dzer masin',
    headlineRu: 'Расскажите о себе',
    columns: [
      {
        id: 'hr',
        title: 'HR',
        tone: 'blue',
        phrases: [
          {
            hy: 'Ի՞նչ փորձ ունեք',
            phonetic: 'inch portsunek',
            ru: 'Какой у вас опыт?',
            tag: 'вопрос',
          },
          {
            hy: 'Ինչու՞ մեր թիմը',
            phonetic: 'inchu mer timə',
            ru: 'Почему наша команда?',
            tag: 'мотивация',
          },
        ],
      },
      {
        id: 'candidate',
        title: 'Кандидат',
        tone: 'amber',
        phrases: [
          {
            hy: 'Ես աշխատել եմ',
            phonetic: 'yes ashkhatel em',
            ru: 'Я работал(а)',
            tag: 'опыт',
          },
          {
            hy: 'Ուզում եմ սովորել',
            phonetic: 'uzum em sovorel',
            ru: 'Хочу учиться',
            tag: 'цель',
          },
        ],
      },
    ],
    hostNote: 'Ответ STAR: ситуация → действие → результат (коротко).',
    hints: [
      'Ես աշխատել եմ … որպես …',
      'Ուզում եմ … որովհետև …',
    ],
  },
  {
    id: 'lexgame',
    label: 'Лексическая игра',
    topicLabel: 'Шаблон · лексическая игра',
    headlineHy: '«Գտի՛ր բառը»',
    headlinePhonetic: 'Gtir barə',
    headlineRu: 'Найди слово',
    columns: [
      {
        id: 'clue',
        title: 'Подсказка',
        tone: 'blue',
        phrases: [
          {
            hy: 'Սա … է',
            phonetic: 'sa … e',
            ru: 'Это — …',
            tag: 'описание',
          },
          {
            hy: 'Նման է',
            phonetic: 'nman e',
            ru: 'Похоже на',
            tag: 'сравнение',
          },
        ],
      },
      {
        id: 'guess',
        title: 'Отгадка',
        tone: 'amber',
        phrases: [
          {
            hy: 'Դա … է՞',
            phonetic: 'da … e?',
            ru: 'Это …?',
            tag: 'вопрос',
          },
          {
            hy: 'Ճի՛շտ է',
            phonetic: 'chisht e',
            ru: 'Верно',
            tag: 'подтверждение',
          },
        ],
      },
    ],
    hostNote: 'Клик по фразе → Shared Lexicon. Угадал — «В мой SRS».',
    hints: [
      'Սա … է / Նման է …',
      'Դա … է՞ · Ճիշտ է',
    ],
  },
];

export function getScenarioTemplate(
  id: string | null | undefined,
): ScenarioTemplate | null {
  if (!id) return null;
  return SCENARIO_TEMPLATES.find((t) => t.id === id) || null;
}

export function isScenarioTemplateId(id: string): id is ScenarioTemplateId {
  return SCENARIO_TEMPLATES.some((t) => t.id === id);
}
