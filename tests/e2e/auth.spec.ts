import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { randomBytes } from "node:crypto";

const runtimePassword = () => `${randomBytes(18).toString("base64url")}aA1`;
const runtimeEmail = () => `test-${randomBytes(8).toString("hex")}@plandosee.local`;

async function account(browser: Browser, baseURL: string, label: string) {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const credentials = { displayName: label, email: runtimeEmail(), password: runtimePassword() };
  const signup = await context.request.post("/api/auth/signup", { data: credentials });
  expect(signup.status()).toBe(201);
  return { context, credentials };
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
        successCriteria: "계정 소유권 경계를 검증한다.",
        estimatedSeconds: 600,
      },
    },
  });
  expect(response.ok()).toBe(true);
  const body = await response.json();
  return body.plans.find((plan: { title: string }) => plan.title === title).id as string;
}

test("비로그인 첫 화면과 자료 API는 로그인 경계로 보호된다", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "다시 만나서 반가워요" })).toBeVisible();
  expect((await context.request.get("/api/workspace")).status()).toBe(401);
  expect((await context.request.get("/api/export")).status()).toBe(401);
  await context.close();
});

test("가입·중복 방지·로그인 오류 동일화·로그아웃과 세션 만료 정보", async ({ browser, baseURL }) => {
  const { context, credentials } = await account(browser, baseURL!, "계정흐름");
  const duplicate = await context.request.post("/api/auth/signup", { data: credentials });
  expect(duplicate.status()).toBe(409);
  const active = await context.request.get("/api/workspace");
  expect(active.status()).toBe(200);
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === "pds_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(session?.expires).toBeGreaterThan(Date.now() / 1000 + 6 * 86400);
  expect(new URL(active.url()).search).toBe("");
  await context.request.post("/api/auth/logout");
  expect((await context.request.get("/api/workspace")).status()).toBe(401);

  const wrongPassword = await context.request.post("/api/auth/login", {
    data: { email: credentials.email, password: runtimePassword() },
  });
  const missingEmail = await context.request.post("/api/auth/login", {
    data: { email: runtimeEmail(), password: runtimePassword() },
  });
  expect(wrongPassword.status()).toBe(401);
  expect((await wrongPassword.json()).error).toBe((await missingEmail.json()).error);
  const login = await context.request.post("/api/auth/login", {
    data: { email: credentials.email, password: credentials.password },
  });
  expect(login.ok()).toBe(true);
  await context.close();
});

test("두 계정은 서로의 계획을 읽기·수정·삭제할 수 없다", async ({ browser, baseURL }) => {
  const a = await account(browser, baseURL!, "사용자A");
  const b = await account(browser, baseURL!, "사용자B");
  const planA = await createPlan(a.context, "A만의 계획");
  const planB = await createPlan(b.context, "B만의 계획");
  const beforeA = await (await a.context.request.get("/api/workspace")).json();
  const beforeB = await (await b.context.request.get("/api/workspace")).json();
  const replacement = {
    title: "침범 시도", startDate: "2026-09-11", endDate: "2026-09-15",
    priority: "HIGH", successCriteria: "바뀌면 안 된다.", estimatedSeconds: 1,
  };
  for (const [attacker, target] of [[a.context, planB], [b.context, planA]] as const) {
    expect((await attacker.request.get(`/api/plans/${target}`)).status()).toBe(404);
    expect((await attacker.request.patch(`/api/plans/${target}`, { data: replacement })).status()).toBe(404);
    expect((await attacker.request.delete(`/api/plans/${target}`)).status()).toBe(404);
  }
  const spoofed = await a.context.request.get("/api/workspace?userId=other", {
    headers: { "x-user-id": "other", "x-account": b.credentials.email },
  });
  const spoofedBody = await spoofed.json();
  expect(spoofedBody.plans.some((plan: { id: string }) => plan.id === planB)).toBe(false);
  expect((await (await a.context.request.get("/api/workspace")).json()).plans.length).toBe(beforeA.plans.length);
  expect((await (await b.context.request.get("/api/workspace")).json()).plans.length).toBe(beforeB.plans.length);
  await a.context.close(); await b.context.close();
});

test("비밀번호 변경은 이전에 발급된 다른 세션을 폐기한다", async ({ browser, baseURL }) => {
  const first = await account(browser, baseURL!, "세션변경");
  const second = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  expect((await second.request.post("/api/auth/login", {
    data: { email: first.credentials.email, password: first.credentials.password },
  })).ok()).toBe(true);
  expect((await second.request.get("/api/workspace")).status()).toBe(200);
  const newPassword = runtimePassword();
  expect((await first.context.request.post("/api/auth/password", {
    data: { currentPassword: first.credentials.password, newPassword },
  })).ok()).toBe(true);
  expect((await second.request.get("/api/workspace")).status()).toBe(401);
  expect((await first.context.request.get("/api/workspace")).status()).toBe(200);
  await first.context.close(); await second.close();
});
