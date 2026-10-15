import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = "http://localhost:3000";
const BACKEND_HEALTH_URL = "http://localhost:8000/api/health";
const SERVER_START_TIMEOUT_MS = 180_000;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: isCi ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    locale: "pl-PL",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "uv run uvicorn app.main:app --port 8000",
      cwd: "../backend",
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: !isCi,
      timeout: SERVER_START_TIMEOUT_MS,
    },
    {
      command: isCi ? "npm run build && npm run start" : "npm run dev",
      url: FRONTEND_URL,
      reuseExistingServer: !isCi,
      timeout: SERVER_START_TIMEOUT_MS,
    },
  ],
});
