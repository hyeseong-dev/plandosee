import fs from "node:fs/promises";
import path from "node:path";

const { SpreadsheetFile, Workbook } = await import(
  "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs"
);

const root = "D:/projects/plandosee";
const outputDir = path.join(root, "outputs", "01a08aec-efc7-7340-b823-2e03084046dd");
const outputPath = path.join(outputDir, "plandosee-test-evidence.xlsx");
const previewDir = path.join(outputDir, "previews");
await fs.mkdir(previewDir, { recursive: true });

const workbook = Workbook.create();
const summary = workbook.worksheets.add("요약");
const cases = workbook.worksheets.add("테스트 케이스");
const trace = workbook.worksheets.add("요구사항 추적");
const history = workbook.worksheets.add("실행 이력");

const font = "Arial";
const navy = "#24344D";
const mint = "#DDF4E7";
const cream = "#FFF9F1";
const green = "#237A57";
const amber = "#9A6700";
const gray = "#667085";
const border = "#D7DEE8";

function baseSheet(sheet, populatedRange) {
  sheet.showGridLines = false;
  sheet.getRange(populatedRange).format.font = { name: font, size: 10, color: "#273142" };
  sheet.getRange(populatedRange).format.verticalAlignment = "center";
}

function title(sheet, text, subtitle, endColumn) {
  sheet.getRange(`A2:${endColumn}2`).merge();
  sheet.getRange("A2").values = [[text]];
  sheet.getRange("A2").format.font = { name: font, size: 16, bold: true, color: navy };
  sheet.getRange(`A3:${endColumn}3`).merge();
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange("A3").format.font = { name: font, size: 10, italic: true, color: gray };
  sheet.getRange(`A4:${endColumn}4`).format.borders = { bottom: { style: "thin", color: navy } };
}

function tableHeader(range) {
  range.format = {
    fill: navy,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { insideVertical: { style: "thin", color: "#FFFFFF" } },
  };
  range.format.rowHeight = 28;
}

baseSheet(summary, "A1:H20");
title(summary, "PlanDoSee 테스트 근거", "로컬 및 운영 검증 결과 · Asia/Seoul · 2026-09-10", "H");
summary.getRange("A6:B10").values = [
  ["구분", "값"],
  ["전체 케이스", null],
  ["통과", null],
  ["실패", null],
  ["대기", null],
];
tableHeader(summary.getRange("A6:B6"));
summary.getRange("B7").formulas = [["=COUNTA('테스트 케이스'!$A$7:$A$200)"]];
summary.getRange("B8").formulas = [["=COUNTIF('테스트 케이스'!$H$7:$H$200,\"통과\")"]];
summary.getRange("B9").formulas = [["=COUNTIF('테스트 케이스'!$H$7:$H$200,\"실패\")"]];
summary.getRange("B10").formulas = [["=COUNTIF('테스트 케이스'!$H$7:$H$200,\"대기\")"]];
summary.getRange("A7:A10").format.fill = cream;
summary.getRange("B7:B10").format.font = { name: font, size: 14, bold: true, color: navy };
summary.getRange("A12:H15").values = [
  ["환경", "실행 시각", "명령/대상", "단위", "브라우저", "결과", "통과", "비고"],
    ["로컬", "2026-09-10 23:00 KST", "pnpm test:all", "8 unit + 6 E2E", "Chromium", "모두 통과", 14, "린트·타입·빌드 포함"],
  ["운영", "배포 후 갱신", "Vercel URL", "익명 스모크", "Chromium", "대기", 0, "시크릿 컨텍스트"],
  ["근거", "2026-09-10", "Playwright JSON + 명령 출력", "자동화", "-", "보존", null, "상세는 테스트 케이스/실행 이력"],
];
tableHeader(summary.getRange("A12:H12"));
summary.getRange("A13:H15").format.borders = { insideHorizontal: { style: "thin", color: border } };
summary.getRange("A18:H20").values = [
  ["판정", "핵심 확인", null, null, null, null, null, null],
  ["로컬 통과", "요구사항 집계, 새로고침 복원, 중복 완료 방지, XSS 안전 표시, 반응형·접근성, 전체 내보내기를 자동 검증했습니다.", null, null, null, null, null, null],
  ["운영 대기", "Vercel 배포와 익명 운영 검증 후 동일 파일을 갱신합니다.", null, null, null, null, null, null],
];
summary.getRange("A18:H18").merge();
summary.getRange("A18").format = { fill: mint, font: { name: font, size: 11, bold: true, color: green } };
summary.getRange("B19:H19").merge();
summary.getRange("B20:H20").merge();
summary.getRange("A19").format.font = { name: font, size: 11, bold: true, color: green };
summary.getRange("A20").format.font = { name: font, size: 11, bold: true, color: amber };
summary.getRange("B19:H20").format.wrapText = true;
summary.getRange("A1:H20").format.verticalAlignment = "center";
summary.getRange("A:A").format.columnWidth = 17;
summary.getRange("B:B").format.columnWidth = 22;
summary.getRange("C:C").format.columnWidth = 26;
summary.getRange("D:D").format.columnWidth = 20;
summary.getRange("E:E").format.columnWidth = 16;
summary.getRange("F:F").format.columnWidth = 15;
summary.getRange("G:G").format.columnWidth = 10;
summary.getRange("H:H").format.columnWidth = 27;
summary.getRange("19:20").format.rowHeight = 34;
summary.tabColor = navy;

const testRows = [
  ["L-001", "로컬", "정적 품질", "ESLint", "pnpm lint", "오류 0건", "오류 0건", "통과", "콘솔 출력"],
  ["L-002", "로컬", "정적 품질", "TypeScript", "pnpm typecheck", "오류 0건", "오류 0건", "통과", "콘솔 출력"],
  ["L-003", "로컬", "단위", "도메인·검증", "pnpm test", "8건 통과", "8건 통과", "통과", "Vitest"],
  ["L-004", "로컬", "빌드", "Next.js 프로덕션", "pnpm build", "빌드 성공", "빌드 성공", "통과", "Next.js 16.3.4"],
  ["L-005", "로컬", "E2E", "공개 안내·반응형·접근성", "첫 화면/360px/axe", "심각 위반 0", "심각 위반 0", "통과", "Playwright JSON"],
  ["L-006", "로컬", "E2E", "검색·필터·집계 근거", "완료 필터와 돌아보기", "5/2/1/2, 90/55/-35분", "일치", "통과", "Playwright JSON"],
  ["L-007", "로컬", "E2E", "할 일 CRUD·복원·XSS", "1초 값과 스크립트형 문자열", "복원 및 문자 표시", "일치", "통과", "Playwright JSON"],
  ["L-008", "로컬", "E2E", "중복 완료 방지", "완료 버튼 빠른 2회", "이벤트 1·완료 수 +1", "일치", "통과", "Playwright JSON"],
  ["L-009", "로컬", "E2E", "계획 이력·돌아보기·전달", "수정/저장/다음 계획", "이전 값 보존·개선점 전달", "일치", "통과", "Playwright JSON"],
  ["L-010", "로컬", "E2E", "전체 자료 내보내기", "JSON 다운로드", "계획·할 일·실행·리뷰 포함", "일치", "통과", "Playwright JSON"],
  ["P-001", "운영", "스모크", "익명 URL·공개 안내", "배포 후 실행", "인증 없이 표시", "미실행", "대기", "운영 배포 후 갱신"],
  ["P-002", "운영", "스모크", "DB 자료·집계 근거", "배포 후 실행", "실제 계획 1·할 일 5·기록 3+", "미실행", "대기", "운영 배포 후 갱신"],
  ["P-003", "운영", "스모크", "새로고침·내보내기", "배포 후 실행", "자료 유지·JSON 정상", "미실행", "대기", "운영 배포 후 갱신"],
  ["P-004", "운영", "보안", "콘솔·응답·공개 소스", "배포 후 실행", "비밀 노출 0", "미실행", "대기", "운영 배포 후 갱신"],
];

baseSheet(cases, "A1:I20");
title(cases, "테스트 케이스", "실행 단위별 기대 결과와 관찰 결과", "I");
cases.getRange("A6:I6").values = [["ID", "환경", "종류", "대상", "절차/명령", "기대 결과", "관찰 결과", "판정", "근거"]];
tableHeader(cases.getRange("A6:I6"));
cases.getRange(`A7:I${6 + testRows.length}`).values = testRows;
cases.getRange(`A7:I${6 + testRows.length}`).format.borders = { insideHorizontal: { style: "thin", color: border } };
cases.getRange(`D7:G${6 + testRows.length}`).format.wrapText = true;
cases.getRange(`H7:H${6 + testRows.length}`).conditionalFormats.add("containsText", { text: "통과", format: { fill: "#E5F6EC", font: { bold: true, color: green } } });
cases.getRange(`H7:H${6 + testRows.length}`).conditionalFormats.add("containsText", { text: "대기", format: { fill: "#FFF2CC", font: { bold: true, color: amber } } });
cases.freezePanes.freezeRows(6);
const caseWidths = [12, 11, 13, 27, 28, 30, 24, 11, 22];
caseWidths.forEach((width, index) => (cases.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width));
cases.getRange(`7:${6 + testRows.length}`).format.rowHeight = 32;
cases.tabColor = "#5B8C7A";

const requirementsText = await fs.readFile(path.join(root, "docs", "REQUIREMENTS.md"), "utf8");
const ids = [...new Set(requirementsText.match(/T06-C\d+/g) ?? [])];
function evidenceFor(id) {
  const n = Number(id.split("C")[1]);
  if (n >= 4 && n <= 8) return "L-009";
  if (n >= 9 && n <= 20) return "L-006, L-007";
  if (n === 21 || n === 22) return "L-008";
  if (n >= 23 && n <= 27) return "L-007, L-009";
  if (n >= 28 && n <= 33) return "L-006, L-008, L-009";
  if (n === 34 || n === 35) return "L-007, L-010";
  if (n === 36) return "L-010";
  if (n === 57) return "L-007";
  if (n === 58) return "L-001, L-004, P-004";
  if (n === 59 || n === 60) return "docs/SUBMISSION.md";
  if (n >= 78 && n <= 81) return "L-005, L-006, P-002";
  if (n === 82) return "L-005, P-001";
  if (n === 83) return "L-006, P-002";
  if (n === 1) return "P-001, P-004";
  return "L-001~L-010";
}
const traceRows = ids.map((id) => [id, evidenceFor(id), evidenceFor(id).includes("P-") ? "로컬 통과·운영 대기" : "로컬 통과", "docs/REQUIREMENTS.md"]);
baseSheet(trace, "A1:D50");
title(trace, "요구사항 추적", `${ids.length}개 원문 ID와 테스트 근거 연결`, "D");
trace.getRange("A6:D6").values = [["요구사항 ID", "근거 ID", "현재 상태", "명세 출처"]];
tableHeader(trace.getRange("A6:D6"));
trace.getRange(`A7:D${6 + traceRows.length}`).values = traceRows;
trace.getRange(`A7:D${6 + traceRows.length}`).format.borders = { insideHorizontal: { style: "thin", color: border } };
trace.getRange("A:A").format.columnWidth = 18;
trace.getRange("B:B").format.columnWidth = 34;
trace.getRange("C:C").format.columnWidth = 24;
trace.getRange("D:D").format.columnWidth = 28;
trace.freezePanes.freezeRows(6);
trace.tabColor = "#D6A55A";

baseSheet(history, "A1:G12");
title(history, "실행 이력", "재현 가능한 명령과 수정·재검증 기록", "G");
history.getRange("A6:G6").values = [["순서", "시각(KST)", "환경", "명령", "결과", "발견 사항", "조치"]];
tableHeader(history.getRange("A6:G6"));
history.getRange("A7:G12").values = [
  [1, "2026-09-10 22:35", "로컬", "pnpm test:all", "실패", "Vitest가 Playwright 파일을 함께 수집", "vitest exclude로 러너 범위 분리"],
  [2, "2026-09-10 22:35", "로컬", "pnpm test:all", "통과", "단위 8·E2E 6 통과", "로컬 기준선 확정"],
  [3, "2026-09-10 22:55", "로컬", "pnpm test:all", "실패", "Codex 작업 종료와 함께 분리 실행한 로컬 DB 프로세스 종료", "DB를 독립 전경 세션으로 재기동"],
  [4, "2026-09-10 22:57", "로컬", "pnpm test:all", "실패", "동일 환경 수명 문제 재현", "새 로컬 DB 생성·마이그레이션·시드"],
  [5, "2026-09-10 23:00", "로컬", "pnpm test:all", "통과", "단위 8·E2E 6, 린트·타입·빌드 통과", "최종 로컬 기준선 확정"],
  [6, "배포 후", "운영", "pnpm test:e2e:production", "대기", "-", "운영 URL 확정 후 실행"],
];
history.getRange("A7:G12").format.borders = { insideHorizontal: { style: "thin", color: border } };
history.getRange("D7:G12").format.wrapText = true;
history.getRange("A:A").format.columnWidth = 10;
history.getRange("B:B").format.columnWidth = 23;
history.getRange("C:C").format.columnWidth = 12;
history.getRange("D:D").format.columnWidth = 29;
history.getRange("E:E").format.columnWidth = 12;
history.getRange("F:F").format.columnWidth = 35;
history.getRange("G:G").format.columnWidth = 31;
history.getRange("7:12").format.rowHeight = 34;
history.tabColor = "#8B6F9F";

workbook.recalculate();
const inspect = await workbook.inspect({ kind: "workbook,sheet,formula", maxChars: 6000, tableMaxRows: 8, tableMaxCols: 10 });
await fs.writeFile(path.join(outputDir, "inspection.txt"), inspect.ndjson ?? String(inspect), "utf8");
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, maxChars: 4000 });
await fs.writeFile(path.join(outputDir, "formula-errors.txt"), errors.ndjson ?? String(errors), "utf8");

for (const sheetName of ["요약", "테스트 케이스", "요구사항 추적", "실행 이력"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(JSON.stringify({ outputPath, previewDir, requirementCount: ids.length, testCaseCount: testRows.length }));
