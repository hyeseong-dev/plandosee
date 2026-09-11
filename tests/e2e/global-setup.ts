import { chromium, type FullConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0]?.use.baseURL);
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const password = `${randomBytes(20).toString("base64url")}A1`;
  const response = await context.request.post("/api/auth/signup", {
    data: {
      displayName: "로컬 검증 사용자",
      email: "owner-test@plandosee.local",
      password,
    },
  });
  if (!response.ok()) throw new Error(`test owner signup failed: ${response.status()}`);
  await context.storageState({ path: "test-results/auth-state.json" });
  await browser.close();
}
