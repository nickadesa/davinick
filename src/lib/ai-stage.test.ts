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

import { aiIsOutdated } from "./signals";
describe("aiIsOutdated", () => {
  it("is outdated when this week's news isn't in the saved analysis", () => {
    expect(aiIsOutdated(["2026-10-14T12:30:00Z"], ["2026-11-04T13:30:00Z"])).toBe(true);
  });
  it("is current when every calendar event was analysed", () => {
    expect(aiIsOutdated(["2026-11-04T13:30:00.000Z", "2026-11-06T13:30:00Z"], ["2026-11-04T13:30:00Z"])).toBe(false);
  });
});
