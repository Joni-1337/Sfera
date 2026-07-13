import fs from "fs";
import path from "path";
import {
  generateCategoryBankWorkbook,
  generateEgeTestWorkbook,
  QUESTION_BANK_CATEGORIES,
} from "../src/lib/excel-import";
import { generateExcelTemplate } from "../src/lib/excel-template-export";

const outDir = path.join(process.cwd(), "templates", "excel-bank");

fs.mkdirSync(outDir, { recursive: true });

void generateExcelTemplate().then((buffer) => {
  fs.writeFileSync(path.join(outDir, "shablon-voprosov.xlsx"), Buffer.from(buffer));
});

for (const category of QUESTION_BANK_CATEGORIES) {
  fs.writeFileSync(
    path.join(outDir, `${category.fileName}.xlsx`),
    Buffer.from(generateCategoryBankWorkbook(category.id))
  );
}

fs.writeFileSync(
  path.join(outDir, "06-ege-test-variant.xlsx"),
  Buffer.from(generateEgeTestWorkbook())
);

console.log(`Generated ${QUESTION_BANK_CATEGORIES.length + 2} files in ${outDir}`);
