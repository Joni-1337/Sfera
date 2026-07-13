import ExcelJS from "exceljs";

const COLORS = {
  headerBg: "FF002060",
  headerText: "FFFFFFFF",
  guideHeaderBg: "FFD9E1F2",
  typeBlue: "FF0070C0",
  borderBlack: "FF000000",
  borderGray: "FFB4B4B4",
};

const EXAMPLES = [
  {
    type: "multiple_choice",
    question: "В каком слове пропущена буква И?",
    options: "пр...лестный | об...дать | с...грать | п...сать | к...рмить",
    correct: "п...сать",
    explanation:
      "Прелестный (прелесть — Е), обедать (обед — Е), сиграть (после приставки на согласную И → Ы), писать (пишет — И).",
  },
  {
    type: "gap_fill",
    question: "Вставьте пропущенную букву в слове: ц...плёнок",
    options: "",
    correct: "ы",
    explanation: "Слово «цыплёнок» — исключение из правила «И/Ы после Ц» (Цыган встал на цыпочки и цыкнул цыплёнку: «Цыц!»).",
  },
  {
    type: "text",
    question: "Напишите слово «(не)настный» без скобок, раскрыв орфограмму.",
    options: "",
    correct: "ненастный",
    explanation:
      "Прилагательное «ненастный» без «не» не употребляется, поэтому пишется слитно.",
  },
  {
    type: "text",
    question: "Раскройте скобки: по()одиночке",
    options: "",
    correct: "поодиночке | по одиночке",
    explanation:
      "Наречие «поодиночке» пишется слитно. Система примет оба варианта (слитно и раздельно), если ученик ошибётся в пробеле.",
  },
] as const;

const CHEAT_ROWS = [
  {
    type: "multiple_choice",
    hint: "Тест с выбором ответа. Варианты вносятся в колонку «варианты_ответов» через вертикальную черту с пробелами ( | ). В «правильный» — буква (A), текст варианта или несколько через | (A|B).",
    example: "п...сать",
  },
  {
    type: "gap_fill",
    hint: "Задание на вставку букв. В колонку «правильный» вносится только пропущенная буква (или буквы). Колонку вариантов ответов оставляйте пустой.",
    example: "ы",
  },
  {
    type: "text",
    hint: "Открытый текстовый ответ (слово или фраза). Если допустимо несколько вариантов написания (например, с пробелом или без), укажите их в колонке «правильный» через черту |.",
    example: "ненастный",
  },
] as const;

function border(color: string): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function styleDataCell(cell: ExcelJS.Cell, wrap = true) {
  cell.border = border(COLORS.borderBlack);
  cell.alignment = { vertical: "top", wrapText: wrap };
  cell.font = { name: "Calibri", size: 11 };
}

function styleGuideCell(cell: ExcelJS.Cell, wrap = true) {
  cell.border = border(COLORS.borderGray);
  cell.alignment = { vertical: "top", wrapText: wrap };
  cell.font = { name: "Calibri", size: 11 };
}

export async function generateExcelTemplate(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "СФЕРА";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Шаблон заданий", {
    views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
  });

  sheet.columns = [
    { key: "type", width: 18 },
    { key: "question", width: 44 },
    { key: "options", width: 46 },
    { key: "correct", width: 20 },
    { key: "explanation", width: 42 },
    { key: "sp1", width: 2 },
    { key: "sp2", width: 2 },
    { key: "sp3", width: 2 },
    { key: "guideType", width: 18 },
    { key: "guideHint", width: 54 },
    { key: "sp4", width: 2 },
    { key: "guideExample", width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  ["тип", "вопрос", "варианты_ответов", "правильный", "пояснение"].forEach((title, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = title;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.headerBg },
    };
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.headerText } };
    cell.border = border(COLORS.borderBlack);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  EXAMPLES.forEach((example, index) => {
    const rowNumber = index + 2;
    const row = sheet.getRow(rowNumber);
    row.values = [
      example.type,
      example.question,
      example.options,
      example.correct,
      example.explanation,
    ];
    for (let col = 1; col <= 5; col++) {
      styleDataCell(row.getCell(col));
    }
    row.height = 48;
  });

  sheet.mergeCells("I2:L2");
  const titleCell = sheet.getCell("I2");
  titleCell.value = "Шпаргалка по заполнению шаблона для учителя:";
  titleCell.font = { name: "Calibri", size: 12, bold: true };
  titleCell.alignment = { vertical: "middle", wrapText: true };

  const guideHeaderRow = sheet.getRow(4);
  guideHeaderRow.height = 24;
  [
    { col: 9, value: "тип" },
    { col: 10, value: "Что писать в эту колонку?" },
    { col: 12, value: "Пример" },
  ].forEach(({ col, value }) => {
    const cell = guideHeaderRow.getCell(col);
    cell.value = value;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.guideHeaderBg },
    };
    cell.font = { name: "Calibri", size: 11, bold: true };
    cell.border = border(COLORS.borderGray);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  CHEAT_ROWS.forEach((guide, index) => {
    const rowNumber = 5 + index;
    const row = sheet.getRow(rowNumber);
    row.height = 72;

    const typeCell = row.getCell(9);
    typeCell.value = guide.type;
    typeCell.font = { name: "Calibri", size: 11, color: { argb: COLORS.typeBlue } };
    styleGuideCell(typeCell, false);

    const guideHintCell = row.getCell(10);
    guideHintCell.value = guide.hint;
    styleGuideCell(guideHintCell);

    const exampleCell = row.getCell(12);
    exampleCell.value = guide.example;
    styleGuideCell(exampleCell, false);
  });

  sheet.mergeCells("A6:E6");
  const hintRow = sheet.getRow(6);
  hintRow.height = 36;
  const startHintCell = hintRow.getCell(1);
  startHintCell.value =
    "↓ Замените примеры выше (строки 2–5) или добавляйте новые задания начиная со строки 7. Строка 1 — не трогать.";
  startHintCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF2CC" },
  };
  startHintCell.font = { name: "Calibri", size: 10, italic: true };
  startHintCell.alignment = { vertical: "middle", wrapText: true };
  startHintCell.border = border(COLORS.borderBlack);

  for (let rowNumber = 7; rowNumber <= 20; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    row.height = 28;
    for (let col = 1; col <= 5; col++) {
      styleDataCell(row.getCell(col));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
