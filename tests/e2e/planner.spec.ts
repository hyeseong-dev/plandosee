import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const notice = "로컬 검증 사용자님의 정원이에요. 이 계정의 계획과 기록만 안전하게 보여 드려요.";

test("개인 자료 안내, 기본 목록, 반응형, 접근성", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  await expect(page.locator(".todo-row")).toHaveCount(5);
  await expect(page.getByText("정렬: 미완료 먼저 → 마감 빠른순 → 높은 우선순위 → 만든 순서", { exact: false })).toBeVisible();
  const desktop = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(desktop).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("검색, 필터, 돌아보기 수치와 근거", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("내용이나 태그 검색").fill("디자인");
  await expect(page.locator(".todo-row")).toHaveCount(1);
  await page.getByPlaceholder("내용이나 태그 검색").fill("");
  await page.getByLabel("상태 필터").selectOption("COMPLETED");
  await expect(page.locator(".todo-row")).toHaveCount(2);
  await page.getByRole("button", { name: "돌아보기", exact: true }).click();
  await expect(page.locator(".metric-card").nth(0).locator("strong")).toHaveText("5");
  await expect(page.locator(".metric-card").nth(1).locator("strong")).toHaveText("2");
  await expect(page.locator(".metric-card").nth(2).locator("strong")).toHaveText("1");
  await expect(page.locator(".metric-card").nth(3).locator("strong")).toHaveText("2");
  await expect(page.locator(".time-summary")).toContainText("1시간 30분");
  await expect(page.locator(".time-summary")).toContainText("55분");
  await expect(page.locator(".time-summary")).toContainText("−35분");
  await page.locator(".metric-card").nth(2).click();
  await expect(page.locator(".evidence-panel")).toContainText("모던하고 귀여운 화면 구현");
});

test("할 일 추가·수정·새로고침 복원·삭제와 XSS 안전 표시", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "할 일 추가" }).click();
  await page.getByLabel("할 일 내용").fill("<img src=x onerror=window.hacked=true> 테스트");
  await page.getByLabel("마감일").fill("2026-09-13");
  await page.getByLabel("예상 시간 (분)").fill("0.0166666667");
  await page.getByLabel("태그 (쉼표로 구분)").fill("보안, 1초");
  await page.getByRole("button", { name: "할 일 저장" }).click();
  await expect(page.getByText("<img src=x onerror=window.hacked=true> 테스트", { exact: true })).toBeVisible();
  await page.reload();
  const row = page.locator(".todo-row").filter({ hasText: "window.hacked" });
  await expect(row).toContainText("2026-09-13");
  await expect(row).toContainText("1초");
  expect(await page.evaluate(() => (window as typeof window & { hacked?: boolean }).hacked)).toBeUndefined();
  await expect(row.locator("img")).toHaveCount(0);
  await row.getByLabel(/수정$/).click();
  await page.getByLabel("할 일 내용").fill("안전 표시 확인 완료");
  await page.getByRole("button", { name: "할 일 저장" }).click();
  await expect(page.getByText("안전 표시 확인 완료", { exact: true })).toBeVisible();
  await page.locator(".todo-row").filter({ hasText: "안전 표시 확인 완료" }).getByLabel(/삭제$/).click();
  await expect(page.getByText("안전 표시 확인 완료", { exact: true })).toHaveCount(0);
});

test("빠른 완료 요청은 완료 이벤트 하나와 완료 수 하나만 늘린다", async ({ page }) => {
  await page.goto("/");
  const button = page.getByLabel("로컬 자동화 테스트 완료로 표시");
  await button.dblclick({ delay: 1 });
  await expect(page.getByLabel("로컬 자동화 테스트 다시 진행 중으로")).toBeVisible();
  const data = await (await page.request.get("/api/workspace")).json();
  const plan = data.plans.find((item: { id: string }) => item.id === "10000000-0000-4000-8000-000000000001");
  const todo = plan.todos.find((item: { id: string }) => item.id === "20000000-0000-4000-8000-000000000004");
  expect(todo.completionEvents).toHaveLength(1);
  expect(plan.todos.filter((item: { deletedAt: string | null; status: string }) => !item.deletedAt && item.status === "COMPLETED")).toHaveLength(3);
});

test("계획 수정 전 값 보존, 돌아보기 저장과 다음 계획 전달", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "계획", exact: true }).click();
  await page.getByRole("button", { name: "계획 수정" }).click();
  await page.getByLabel("계획 이름").fill("PlanDoSee 1차 구현 · 검증");
  await page.getByRole("button", { name: "계획 저장" }).click();
  await expect(page.getByText("수정 전 계획", { exact: true })).toBeVisible();
  await expect(page.getByText(/버전 1/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "계획", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PlanDoSee 1차 구현 · 검증" })).toBeVisible();
  await page.getByRole("button", { name: "돌아보기", exact: true }).click();
  await page.getByLabel("돌아보기").fill("로컬 자동화에서 저장과 집계 흐름을 검증했다.");
  await page.getByLabel("다음에 고칠 점 한 가지").fill("운영 환경에서도 같은 흐름을 다시 확인한다.");
  await page.getByRole("button", { name: "돌아보기 저장" }).click();
  await page.getByLabel("개선점을 받을 다음 계획").selectOption("10000000-0000-4000-8000-000000000002");
  await page.getByRole("button", { name: "전달하기" }).click();
  await page.getByLabel("계획 선택").selectOption("10000000-0000-4000-8000-000000000002");
  await page.getByRole("button", { name: "계획", exact: true }).click();
  await expect(page.getByText("운영 환경에서도 같은 흐름을 다시 확인한다.", { exact: true })).toBeVisible();
});

test("전체 자료를 한 파일로 내보낸다", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.get("/api/export");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-disposition"]).toContain("plandosee-");
  const payload = await response.json();
  expect(payload.schemaVersion).toBe(2);
  expect(payload.durationUnit).toBe("seconds");
  expect(payload.data.account).toEqual(expect.objectContaining({ id: expect.any(String), email: expect.any(String) }));
  expect(payload.data.plans.length).toBeGreaterThanOrEqual(2);
  expect(payload.data.plans.find((plan: { todos: unknown[] }) => plan.todos.length > 0).todos[0]).toHaveProperty("id");
  expect(JSON.stringify(payload)).not.toMatch(/passwordHash|tokenHash|pds_session/);
});
