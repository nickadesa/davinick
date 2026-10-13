import { describe, it, expect } from "vitest";
import { aiRefreshPlan } from "./signals";
const now = Date.parse("2026-10-13T12:00:00Z");
const at = (ms: number) => new Date(now + ms).toISOString();
describe("aiRefreshPlan", () => {
  it("refreshes once inside 24h window", () => {
    expect(aiRefreshPlan([at(20 * 3600e3)], now - 10 * 3600e3, now)).toEqual({ refresh: true, stage: "24h" });
    expect(aiRefreshPlan([at(20 * 3600e3)], now - 3600e3, now)).toEqual({ refresh: false, stage: "24h" });
  });
  it("refreshes again 15 min before", () => {
    expect(aiRefreshPlan([at(10 * 60e3)], now - 3600e3, now)).toEqual({ refresh: true, stage: "15m" });
    expect(aiRefreshPlan([at(10 * 60e3)], now - 2 * 60e3, now)).toEqual({ refresh: false, stage: "15m" });
  });
  it("does nothing when next news is more than 24h away", () => {
    expect(aiRefreshPlan([at(30 * 3600e3)], now - 50 * 3600e3, now)).toEqual({ refresh: false, stage: null });
  });
});
