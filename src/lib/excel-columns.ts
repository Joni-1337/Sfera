import { QUESTION_TYPES } from "@/lib/scoring";



export const EXCEL_TEMPLATE_URL = "/api/template/questions";



/** Описание колонок для подсказок в интерфейсе */

export const EXCEL_COLUMNS = [

  {

    key: "тип",

    alt: "type",

    label: "Тип вопроса",

    required: false,

    hint: "Если пусто — «выбор из вариантов»",

    example: "multiple_choice",

  },

  {

    key: "вопрос",

    alt: "prompt",

    label: "Текст вопроса",

    required: true,

    hint: "Формулировка задания",

    example: "В каком слове пропущена буква И?",

  },

  {

    key: "варианты_ответов",

    alt: "answer_options",

    label: "Варианты ответов",

    required: false,

    hint: "Только для типа «выбор». Все варианты через | — от 2 до 9 штук",

    example: "пр…лестный|об…дать|с…грать|п…сать|к…рмить",

  },

  {

    key: "правильный",

    alt: "correct",

    label: "Правильный ответ",

    required: true,

    hint: "A/1/А, буква, слово. Несколько допустимых — через |",

    example: "A",

  },

  {

    key: "пояснение",

    alt: "explanation",

    label: "Пояснение",

    required: false,

    hint: "Показывается ученику после сдачи",

    example: "Прелестный — проверочное слово «прелесть»",

  },

] as const;



export const EXCEL_TYPE_HINTS = QUESTION_TYPES.map((t) => ({

  id: t.id,

  label: t.label,

  correctExample:

    t.id === "multiple_choice"

      ? "A, 1, А (регистр и язык не важны)"

      : t.id === "gap_fill"

        ? "е (можно несколько через |)"

        : "безграмотный (можно несколько через |)",

  optionsNeeded: t.id === "multiple_choice",

}));



export const EXCEL_IMPORT_STEPS = [

  {

    step: 1,

    title: "Скачайте шаблон",

    description: "Готовый файл с примерами всех типов вопросов",

  },

  {

    step: 2,

    title: "Заполните в Excel",

    description: "Каждая строка — один вопрос. Варианты ответов разделяйте символом |",

  },

  {

    step: 3,

    title: "Загрузите файл",

    description: "Проверьте предпросмотр и нажмите «Создать»",

  },

] as const;

