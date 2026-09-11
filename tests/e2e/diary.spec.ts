import { expect, test } from "@playwright/test";

test("같은 지표·단위로 2일 기록 뒤 규칙을 바꾸고 정확히 5일을 집계한다", async ({ page }) => {
  await page.goto("/");
  const created = await page.request.post("/api/diary", {
    data: {
      action: "createStudy",
      data: {
        question: "가장 중요한 일을 먼저 정하면 하루 집중 시간이 늘어나는가?",
        metricName: "집중 시간",
        unit: "분",
        missingRule: "합계와 평균에서 제외하고 빠진 날로 표시한다.",
        duplicateRule: "같은 날짜의 마지막 저장값으로 교체한다.",
        outlierRule: "제외하지 않고 표시를 붙여 실제 값으로 포함한다.",
        roundingRule: "평균만 소수점 첫째 자리에서 반올림한다.",
      },
    },
  });
  expect(created.ok()).toBe(true);
  const save = (date: string, value: number) => page.request.post("/api/diary", {
    data: { action: "saveEntry", data: { date, value, note: `${date} 실제 관찰` } },
  });
  expect((await save("2026-09-01", 35)).ok()).toBe(true);
  expect((await save("2026-09-02", 50)).ok()).toBe(true);
  expect((await save("2026-09-03", 60)).status()).toBe(400);
  const changed = await page.request.post("/api/diary", {
    data: {
      action: "saveRuleChange",
      data: {
        beforeRule: "아침에 할 일 5개를 정한다.",
        afterRule: "가장 중요한 할 일 3개만 정한다.",
        reason: "첫 이틀에는 우선순위가 흐려져 핵심 작업 시작이 늦었다.",
      },
    },
  });
  expect(changed.ok()).toBe(true);
  expect((await save("2026-09-03", 60)).ok()).toBe(true);
  expect((await save("2026-09-04", 40)).ok()).toBe(true);
  expect((await save("2026-09-05", 65)).ok()).toBe(true);
  const duplicate = await save("2026-09-05", 60);
  expect(duplicate.ok()).toBe(true);

  await page.goto("/");
  await page.getByRole("button", { name: "5일 기록" }).click();
  await expect(page.getByText("5/5", { exact: true })).toBeVisible();
  await expect(page.getByText("245 분", { exact: true })).toBeVisible();
  await expect(page.getByText("49 분", { exact: true })).toBeVisible();
  await expect(page.getByText("2일차 뒤 계획 규칙을 바꿨어요")).toBeVisible();
  const data = await (await page.request.get("/api/diary")).json();
  expect(data.study.entries).toHaveLength(5);
  expect(data.study.ruleChange.sourceEntryIds).toHaveLength(2);
});
