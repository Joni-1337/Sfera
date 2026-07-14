import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import React from "react";
import { renderSferaIcon } from "../src/lib/sfera-icon-image";

async function writeIcon(size: number, filePath: string) {
  const response = await renderSferaIcon(size);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
  console.log(`Wrote ${filePath} (${buffer.length} bytes)`);
}

async function main() {
  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  await writeIcon(120, join(publicDir, "favicon.ico"));
  await writeIcon(180, join(publicDir, "apple-touch-icon.png"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
