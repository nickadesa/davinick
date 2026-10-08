import { describe, expect, it } from "vitest";
import { computeSignal, type NewsEvent } from "./signals";

const cpi = (actual: number | null): NewsEvent => ({
  id: "cpi", time: "", title: "CPI", currency: "USD", actual, forecast: 0.3, previous: 0.2, unit: "%",
  sensitivity: { XAUUSD: -1, NASDAQ: -1 }, weight: 3, note: "",
});

describe("computeSignal", () => {
  it("hot CPI gives SELL on both assets", () => {
    expect(computeSignal([cpi(0.4)], "XAUUSD").action).toBe("SELL");
    expect(computeSignal([cpi(0.4)], "NASDAQ").action).toBe("SELL");
  });
  it("confidence never exceeds 95%", () => {
    expect(computeSignal([cpi(5)], "XAUUSD").confidence).toBe(95);
  });
  it("unreleased news gives NEUTRAL at 50%", () => {
    const s = computeSignal([cpi(null)], "XAUUSD");
    expect(s.action).toBe("NEUTRAL");
    expect(s.confidence).toBe(50);
  });
});
