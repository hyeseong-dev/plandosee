import fs from "node:fs/promises";
import path from "node:path";

const { FileBlob, SpreadsheetFile } = await import(
  "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs"
);

const root = "D:/projects/plandosee";
const outputDir = path.join(root, "outputs", "01a08aec-efc7-7340-b823-2e03084046dd");
const outputPath = path.join(outputDir, "plandosee-test-evidence.xlsx");
const previewDir = path.join(outputDir, "previews");
const productionUrl = "https://plandosee-chi.vercel.app";

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const summary = workbook.worksheets.getItem("요약");
const cases = workbook.worksheets.getItem("테스트 케이스");
const trace = workbook.worksheets.getItem("요구사항 추적");
const history = workbook.worksheets.getItem("실행 이력");

summary.getRange("A3").values = [["로컬 및 운영 검증 결과 · Asia/Seoul · 2026-09-11"]];
summary.getRange("A14:H14").values = [[
  "운영",
  "2026-09-11 09:44 KST",
  productionUrl,
  "4 E2E",
  "Chromium",
  "모두 통과",
  4,
  "익명·DB·복원·보안",
]];
summary.getRange("A20").values = [["운영 통과"]];
summary.getRange("A20").format.font = { name: "Arial", size: 11, bold: true, color: "#237A57" };
summary.getRange("B20").values = [["Vercel 익명 URL에서 실데이터·집계·복원·내보내기·보안 검증 4건이 모두 통과했습니다."]];

cases.getRange("G17:I20").values = [
  ["익명 표시·모바일·axe 심각 위반 0", "통과", "Playwright JSON"],
  ["계획 1·할 일 7·실행 기록 3, 집계 근거 일치", "통과", "Playwright JSON"],
  ["ID·날짜·초 단위·JSON 보존", "통과", "Playwright JSON"],
  ["비밀 노출 0·콘솔 오류 0", "통과", "Playwright JSON"],
];

const traceIds = trace.getRange("A7:A50").values;
const traceEvidence = trace.getRange("B7:B50").values;
trace.getRange("C7:C50").values = traceIds.map((row, index) => {
  if (!row[0]) return [null];
  return [String(traceEvidence[index][0] ?? "").includes("P-") ? "로컬·운영 통과" : "로컬 통과"];
});

history.getRange("A12:G17").values = [
  [6, "2026-09-11 09:27", "운영", "pnpm test:e2e:production", "실패", "화면 locator·비동기 대기·내보내기 필드 경로 불일치", "검증 코드 3건 수정"],
  [7, "2026-09-11 09:32", "운영", "pnpm test:e2e:production", "통과", "운영 E2E 4건 통과", "운영 기준선 확정"],
  [8, "2026-09-11 09:40", "운영", "Vercel Git 자동 배포", "실패", "깨끗한 체크아웃에 Prisma 생성 클라이언트 없음", "빌드 앞에 prisma generate 추가"],
  [9, "2026-09-11 09:42", "로컬", "pnpm build", "통과", "Prisma 생성 후 Next.js 프로덕션 빌드 성공", "clean-build 수정 검증"],
  [10, "2026-09-11 09:43", "운영", "Vercel Git 자동 배포", "통과", "GitHub main 커밋 자동 배포 READY", "공개 별칭 최신화"],
  [11, "2026-09-11 09:44", "운영", "pnpm test:e2e:production", "통과", "최신 자동 배포에서 E2E 4건 통과", "최종 운영 기준선 확정"],
];
history.getRange("A12:G17").format.borders = { insideHorizontal: { style: "thin", color: "#D7DEE8" } };
history.getRange("D12:G17").format.wrapText = true;
history.getRange("12:17").format.rowHeight = 34;

workbook.recalculate();
const inspect = await workbook.inspect({ kind: "workbook,sheet,formula", maxChars: 8000, tableMaxRows: 20, tableMaxCols: 10 });
await fs.writeFile(path.join(outputDir, "inspection.txt"), inspect.ndjson ?? String(inspect), "utf8");
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 4000,
});
await fs.writeFile(path.join(outputDir, "formula-errors.txt"), errors.ndjson ?? String(errors), "utf8");

for (const sheetName of ["요약", "테스트 케이스", "요구사항 추적", "실행 이력"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, productionUrl, sheets: 4 }));
