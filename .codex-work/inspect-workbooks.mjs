import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputs = process.argv.slice(2);
const outputDir = path.resolve(".codex-work", "workbook-analysis");
await fs.mkdir(outputDir, { recursive: true });

for (const inputPath of inputs) {
  const input = await FileBlob.load(inputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const name = path.basename(inputPath, path.extname(inputPath));

  const summary = await workbook.inspect({
    kind: "workbook,sheet,table,region,definedName,drawing",
    maxChars: 24000,
    tableMaxRows: 12,
    tableMaxCols: 20,
    tableMaxCellChars: 120,
  });
  await fs.writeFile(path.join(outputDir, `${name}.ndjson`), summary.ndjson, "utf8");

  const sheetInfo = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 12000 });
  await fs.writeFile(path.join(outputDir, `${name}-sheets.ndjson`), sheetInfo.ndjson, "utf8");

  const sheetLines = sheetInfo.ndjson.split(/\r?\n/).filter(Boolean);
  for (let index = 0; index < sheetLines.length; index += 1) {
    let record;
    try { record = JSON.parse(sheetLines[index]); } catch { continue; }
    const sheetName = record.name ?? record.sheetName;
    if (!sheetName) continue;
    try {
      const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
      const safeName = sheetName.replace(/[<>:"/\\|?*]/g, "_").slice(0, 80);
      await fs.writeFile(
        path.join(outputDir, `${name}--${String(index + 1).padStart(2, "0")}--${safeName}.png`),
        new Uint8Array(await preview.arrayBuffer()),
      );
    } catch (error) {
      await fs.appendFile(path.join(outputDir, `${name}-render-errors.txt`), `${sheetName}: ${error.message}\n`);
    }
  }
}
