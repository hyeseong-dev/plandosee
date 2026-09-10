import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const notice = "지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요";

test("익명 첫 화면, 공개 안내, 반응형, 접근성", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  await expect(page.getByText("PlanDoSee 프로젝트 구현·배포", { exact: true })).toBeVisible();
  expect(await page.locator(".todo-row").count()).toBeGreaterThanOrEqual(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("운영 DB에 실제 계획·할 일·실행 기록과 비영 수 집계가 있다", async ({ page, request }) => {
  const response = await request.get("/api/workspace");
  expect(response.ok()).toBe(true);
  const data = await response.json();
  const plan = data.plans.find((item: { id: string }) => item.id === "41000000-0000-4000-8000-000000000001");
  expect(plan).toBeTruthy();
  expect(plan.todos.filter((item: { deletedAt: string | null }) => !item.deletedAt).length).toBeGreaterThanOrEqual(5);
  expect(plan.todos.flatMap((item: { executionLogs: unknown[] }) => item.executionLogs).length).toBeGreaterThanOrEqual(3);
  await page.goto("/");
  await page.getByRole("button", { name: "돌아보기", exact: true }).click();
  const metrics = await page.locator(".metric-card strong").allTextContents();
  expect(metrics.some((value) => Number(value) > 0)).toBe(true);
  await page.locator(".metric-card").first().click();
  await expect(page.locator(".evidence-panel")).toContainText("GitHub 저장소와 초기 구성");
});

test("새로고침과 전체 JSON 내보내기가 ID·날짜·값·단위를 보존한다", async ({ page, request }) => {
  const before = await (await request.get("/api/workspace")).json();
  const original = before.plans.find((item: { id: string }) => item.id === "41000000-0000-4000-8000-000000000001");
  await page.goto("/");
  await page.reload();
  const after = await (await request.get("/api/workspace")).json();
  const restored = after.plans.find((item: { id: string }) => item.id === original.id);
  expect({ id: restored.id, startDate: restored.startDate, estimatedSeconds: restored.estimatedSeconds }).toEqual({ id: original.id, startDate: original.startDate, estimatedSeconds: original.estimatedSeconds });
  const exported = await request.get("/api/export");
  expect(exported.ok()).toBe(true);
  const body = await exported.json();
  expect(body.unit).toBe("seconds");
  expect(body.timezone).toBe("Asia/Seoul");
  expect(body.plans.some((item: { id: string }) => item.id === original.id)).toBe(true);
});

test("운영 응답·콘솔·페이지에 비밀 연결 문자열이 드러나지 않는다", async ({ page, request }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const responses = await Promise.all([request.get("/"), request.get("/api/health"), request.get("/api/workspace")]);
  for (const response of responses) {
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/DATABASE_URL|password=/i);
  }
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
});
