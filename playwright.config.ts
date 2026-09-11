import { defineConfig, devices } from "@playwright/test";

const production = process.env.TEST_ENV === "production";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: production ? "production.spec.ts" : ["planner.spec.ts", "auth.spec.ts", "diary.spec.ts"],
  globalSetup: production ? undefined : "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: production ? 2 : 0,
  reporter: [["list"], ["json", { outputFile: "test-results/playwright-results.json" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    storageState: production ? undefined : "test-results/auth-state.json",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: production ? undefined : { command: "pnpm exec next start -p 3100", url: `${baseURL}/api/health`, reuseExistingServer: true, timeout: 120_000 },
});
