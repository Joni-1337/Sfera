import { QUESTION_TYPES } from "@/lib/scoring";

export const EXCEL_TEMPLATE_URL = "/api/template/questions";

/** Описание колонок для подсказок в интерфейсе */
export const EXCEL_COLUMNS = [
  {
    key: "тип",
    alt: "type",
    label: "Тип задания",
    required: false,
    hint: "выбор · буква · текст. Если пусто — задание с выбором ответа",
    example: "выбор",
  },
  {
    key: "вопрос",
    alt: "prompt",
    label: "Текст вопроса",
    required: true,
    hint: "Формулировка задания для ученика",
    example: "В каком слове пропущена буква А?",
  },
  {
    key: "варианты",
    alt: "answer_options",
    label: "Варианты ответов",
    required: false,
    hint: "Только для типа «выбор». Все варианты в одной ячейке через | — от 2 до 9 штук",
    example: "слово1|слово2|слово3|слово4",
  },
  {
    key: "правильный",
    alt: "correct",
    label: "Правильный ответ",
    required: true,
    hint: "A = 1-й вариант, B = 2-й… Или буква/слово для других типов",
    example: "A",
  },
  {
    key: "пояснение",
    alt: "explanation",
    label: "Пояснение",
    required: false,
    hint: "Разбор — показывается ученику после сдачи",
    example: "В корне -раст- пишется А",
  },
] as const;

export const EXCEL_TYPE_HINTS = [
  {
    id: "выбор",
    label: "Ученик выбирает один из вариантов",
    correctExample: "A, B, C или 1, 2, 3 (регистр не важен)",
    optionsNeeded: true,
  },
  {
    id: "буква",
    label: "Ученик вводит одну пропущенную букву",
    correctExample: "е (можно несколько через |)",
    optionsNeeded: false,
  },
  {
    id: "текст",
    label: "Ученик вводит слово или короткую фразу",
    correctExample: "безграмотный (можно несколько через |)",
    optionsNeeded: false,
  },
] as const;

export const EXCEL_IMPORT_STEPS = [
  {
    step: 1,
    title: "Скачайте шаблон",
    description: "В файле 14 примеров заданий — можно сразу копировать и менять",
  },
  {
    step: 2,
    title: "Заполните в Excel",
    description: "Одна строка = одно задание. Варианты через | в одной ячейке",
  },
  {
    step: 3,
    title: "Загрузите файл",
    description: "Проверьте предпросмотр и нажмите «Создать»",
  },
] as const;
