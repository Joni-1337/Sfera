export const EXCEL_TEMPLATE_URL = "/api/template/questions";

/** Описание колонок для подсказок в интерфейсе */
export const EXCEL_COLUMNS = [
  {
    key: "тип",
    alt: "type",
    label: "Тип задания",
    required: false,
    hint: "multiple_choice · gap_fill · text. Если пусто — выбор из вариантов",
    example: "multiple_choice",
  },
  {
    key: "вопрос",
    alt: "prompt",
    label: "Текст вопроса",
    required: true,
    hint: "Формулировка задания для ученика",
    example: "В каком слове пропущена буква И?",
  },
  {
    key: "варианты_ответов",
    alt: "answer_options",
    label: "Варианты ответов",
    required: false,
    hint: "Только для multiple_choice. В одной ячейке через | (можно с пробелами)",
    example: "пр...лестный | об...дать | п...сать",
  },
  {
    key: "правильный",
    alt: "correct",
    label: "Правильный ответ",
    required: true,
    hint: "Для выбора: текст верного варианта или A, B, C… Для остальных — буква или слово",
    example: "п...сать",
  },
  {
    key: "пояснение",
    alt: "explanation",
    label: "Пояснение",
    required: false,
    hint: "Разбор — показывается ученику после сдачи",
    example: "Писать — проверочное «пишет»",
  },
] as const;

export const EXCEL_TYPE_HINTS = [
  {
    id: "multiple_choice",
    label: "Ученик выбирает один из вариантов",
    correctExample: "п...сать или A, B, C",
    optionsNeeded: true,
  },
  {
    id: "gap_fill",
    label: "Ученик вводит одну пропущенную букву",
    correctExample: "ы",
    optionsNeeded: false,
  },
  {
    id: "text",
    label: "Ученик вводит слово или короткую фразу",
    correctExample: "ненастный или вариант1 | вариант2",
    optionsNeeded: false,
  },
] as const;

export const EXCEL_IMPORT_STEPS = [
  {
    step: 1,
    title: "Скачайте шаблон",
    description: "Один лист с примерами и шпаргалкой справа — как в вашем файле",
  },
  {
    step: 2,
    title: "Заполните колонки A–E",
    description: "Шпаргалка справа не мешает — импорт читает только левую часть",
  },
  {
    step: 3,
    title: "Загрузите файл",
    description: "Проверьте предпросмотр и нажмите «Создать»",
  },
] as const;
