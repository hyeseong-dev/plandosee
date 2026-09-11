import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomBytes } from "node:crypto";

type Credentials = { displayName: string; email: string; password: string };
type TestAccount = { context: BrowserContext; credentials: Credentials };

const runtimePassword = () => `${randomBytes(18).toString("base64url")}aA1`;
const runtimeEmail = () => `t07-${Date.now()}-${randomBytes(6).toString("hex")}@example.com`;

async function createAccount(browser: Browser, baseURL: string, displayName: string): Promise<TestAccount> {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const credentials = { displayName, email: runtimeEmail(), password: runtimePassword() };
  const response = await context.request.post("/api/auth/signup", { data: credentials });
  expect(response.status()).toBe(201);
  return { context, credentials };
}

async function deleteAccount(account: TestAccount) {
  const response = await account.context.request.delete("/api/auth/account", {
    data: { password: account.credentials.password },
  });
  expect(response.ok()).toBe(true);
  await account.context.close();
}

async function createPlan(context: BrowserContext, title: string) {
  const response = await context.request.post("/api/workspace", {
    data: {
      action: "createPlan",
      data: {
        title,
        startDate: "2026-09-11",
        endDate: "2026-09-15",
        priority: "MEDIUM",
        successCriteria: "운영 환경 계정 소유권 경계를 검증한다.",
        estimatedSeconds: 600,
      },
    },
  });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  return body.plans.find((plan: { title: string }) => plan.title === title).id as string;
}

test("공개 첫 화면은 로그인이고 비로그인 자료 요청은 거절된다", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "다시 만나서 반가워요" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "가입하기" })).toBeVisible();
  expect((await context.request.get("/api/workspace")).status()).toBe(401);
  expect((await context.request.get("/api/export")).status()).toBe(401);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
  await page.setViewportSize({ width: 360, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await context.close();
});

test("가입·중복 방지·동일 로그인 오류·로그아웃·세션 만료가 운영에서 동작한다", async ({ browser, baseURL }) => {
  const account = await createAccount(browser, baseURL!, "운영 인증 점검");
  try {
    expect((await account.context.request.post("/api/auth/signup", { data: account.credentials })).status()).toBe(409);
    const active = await account.context.request.get("/api/workspace");
    expect(active.status()).toBe(200);
    const session = (await account.context.cookies()).find((cookie) => cookie.name === "pds_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.secure).toBe(true);
    expect(session?.sameSite).toBe("Lax");
    expect(session?.expires).toBeGreaterThan(Date.now() / 1000 + 6 * 86400);
    expect(new URL(active.url()).search).toBe("");

    expect((await account.context.request.post("/api/auth/logout")).ok()).toBe(true);
    expect((await account.context.request.get("/api/workspace")).status()).toBe(401);
    const wrongPassword = await account.context.request.post("/api/auth/login", {
      data: { email: account.credentials.email, password: runtimePassword() },
    });
    const missingEmail = await account.context.request.post("/api/auth/login", {
      data: { email: runtimeEmail(), password: runtimePassword() },
    });
    expect(wrongPassword.status()).toBe(401);
    expect((await wrongPassword.json()).error).toBe((await missingEmail.json()).error);
    expect((await account.context.request.post("/api/auth/login", {
      data: { email: account.credentials.email, password: account.credentials.password },
    })).ok()).toBe(true);
  } finally {
    await deleteAccount(account);
  }
});

test("두 운영 계정은 서로의 자료를 양방향으로 읽기·수정·삭제할 수 없다", async ({ browser, baseURL }) => {
  const a = await createAccount(browser, baseURL!, "운영 사용자 A");
  const b = await createAccount(browser, baseURL!, "운영 사용자 B");
  try {
    const planA = await createPlan(a.context, "A 전용 계획");
    const planB = await createPlan(b.context, "B 전용 계획");
    const beforeA = await (await a.context.request.get("/api/workspace")).json();
    const beforeB = await (await b.context.request.get("/api/workspace")).json();
    const replacement = {
      title: "침범 시도",
      startDate: "2026-09-11",
      endDate: "2026-09-15",
      priority: "HIGH",
      successCriteria: "바뀌면 안 된다.",
      estimatedSeconds: 1,
    };
    for (const [attacker, target] of [[a.context, planB], [b.context, planA]] as const) {
      expect((await attacker.request.get(`/api/plans/${target}`)).status()).toBe(404);
      expect((await attacker.request.patch(`/api/plans/${target}`, { data: replacement })).status()).toBe(404);
      expect((await attacker.request.delete(`/api/plans/${target}`)).status()).toBe(404);
    }

    const spoofed = await a.context.request.get(`/api/workspace?userId=${encodeURIComponent(b.credentials.email)}`, {
      headers: { "x-user-id": "other", "x-account": b.credentials.email },
    });
    const spoofedBody = await spoofed.json();
    expect(spoofedBody.plans.some((plan: { id: string }) => plan.id === planB)).toBe(false);
    expect((await (await a.context.request.get("/api/workspace")).json()).plans).toHaveLength(beforeA.plans.length);
    expect((await (await b.context.request.get("/api/workspace")).json()).plans).toHaveLength(beforeB.plans.length);
  } finally {
    await deleteAccount(a);
    await deleteAccount(b);
  }
});

test("비밀번호 변경은 이전 세션을 막고 내보내기에 비밀값이 없다", async ({ browser, baseURL }) => {
  const account = await createAccount(browser, baseURL!, "운영 세션 점검");
  const otherSession = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    expect((await otherSession.request.post("/api/auth/login", { data: {
      email: account.credentials.email,
      password: account.credentials.password,
    } })).ok()).toBe(true);
    const newPassword = runtimePassword();
    expect((await account.context.request.post("/api/auth/password", { data: {
      currentPassword: account.credentials.password,
      newPassword,
    } })).ok()).toBe(true);
    account.credentials.password = newPassword;
    expect((await otherSession.request.get("/api/workspace")).status()).toBe(401);
    expect((await account.context.request.get("/api/workspace")).status()).toBe(200);

    await createPlan(account.context, "세션 변경 후 계획");
    const page = await account.context.newPage();
    await page.goto("/");
    await expect(page.getByLabel("개인 자료 안내")).toContainText("운영 세션 점검님의 정원이에요");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
    await page.getByRole("button", { name: "운영 세션 점검", exact: true }).click();
    await expect(page.getByRole("heading", { name: "내 계정" })).toBeVisible();
    await expect(page.getByText("계정을 지우면 계획, 할 일, 실행 기록, 돌아보기와 5일 기록이 함께 영구 삭제됩니다.")).toBeVisible();
    await page.setViewportSize({ width: 360, height: 780 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    const exported = await account.context.request.get("/api/export");
    expect(exported.ok()).toBe(true);
    const payload = await exported.json();
    expect(payload.schemaVersion).toBe(2);
    expect(payload.timezone).toBe("Asia/Seoul");
    expect(payload.durationUnit).toBe("seconds");
    expect(payload.data.account.email).toBe(account.credentials.email);
    expect(payload.data.plans).toHaveLength(1);
    expect(JSON.stringify(payload)).not.toMatch(/passwordHash|tokenHash|pds_session/);
  } finally {
    await otherSession.close();
    await deleteAccount(account);
  }
});

test("5일 기록과 규칙 변경을 전체 내보내기에 보존한다", async ({ browser, baseURL }) => {
  const account = await createAccount(browser, baseURL!, "운영 5일 점검");
  try {

    expect((await account.context.request.post("/api/diary", { data: {
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
    } })).ok()).toBe(true);
    const save = (date: string, value: number) => account.context.request.post("/api/diary", {
      data: { action: "saveEntry", data: { date, value, note: `${date} 운영 관찰` } },
    });
    expect((await save("2026-09-01", 35)).ok()).toBe(true);
    expect((await save("2026-09-02", 50)).ok()).toBe(true);
    expect((await save("2026-09-03", 60)).status()).toBe(400);
    expect((await account.context.request.post("/api/diary", { data: {
      action: "saveRuleChange",
      data: {
        beforeRule: "아침에 할 일 5개를 정한다.",
        afterRule: "가장 중요한 할 일 3개만 정한다.",
        reason: "첫 이틀에는 우선순위가 흐려져 핵심 작업 시작이 늦었다.",
      },
    } })).ok()).toBe(true);
    expect((await save("2026-09-03", 60)).ok()).toBe(true);
    expect((await save("2026-09-04", 40)).ok()).toBe(true);
    expect((await save("2026-09-05", 65)).ok()).toBe(true);
    expect((await save("2026-09-05", 60)).ok()).toBe(true);

    const diary = await (await account.context.request.get("/api/diary")).json();
    expect(diary.study.entries).toHaveLength(5);
    expect(diary.study.entries.reduce((sum: number, entry: { value: number }) => sum + entry.value, 0)).toBe(245);
    expect(diary.study.ruleChange.sourceEntryIds).toHaveLength(2);
    const exported = await account.context.request.get("/api/export");
    expect(exported.ok()).toBe(true);
    const payload = await exported.json();
    expect(payload.schemaVersion).toBe(2);
    expect(payload.timezone).toBe("Asia/Seoul");
    expect(payload.durationUnit).toBe("seconds");
    expect(payload.data.diaryStudy.entries).toHaveLength(5);
    expect(JSON.stringify(payload)).not.toMatch(/passwordHash|tokenHash|pds_session/);
  } finally {
    await deleteAccount(account);
  }
});

test("운영 응답·콘솔·페이지에 비밀 연결 문자열이 드러나지 않는다", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const responses = await Promise.all([
    context.request.get("/"),
    context.request.get("/api/health"),
    context.request.get("/api/workspace"),
  ]);
  expect(responses.map((response) => response.status())).toEqual([200, 200, 401]);
  for (const response of responses) {
    const body = await response.text();
    expect(body).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(body).not.toMatch(/DATABASE_URL|password=|tokenHash|passwordHash/i);
  }
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
  await context.close();
});
