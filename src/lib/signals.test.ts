import { describe, expect, it } from "vitest";
import { classifyEvent, computeSignal, outcome, parseFigure, type NewsEvent } from "./signals";

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

describe("calendar parsing", () => {
  it("parses figures with units", () => {
    expect(parseFigure("0.3%")).toEqual({ value: 0.3, unit: "%" });
    expect(parseFigure("225K")).toEqual({ value: 225, unit: "K" });
    expect(parseFigure("")).toEqual({ value: null, unit: "" });
  });
  it("jobless claims are inverse, CPI is heavy", () => {
    expect(classifyEvent("Unemployment Claims").sensitivity.XAUUSD).toBe(1);
    expect(classifyEvent("CPI m/m").weight).toBe(3);
  });
});

describe("outcome", () => {
  it("BUY wins when price rises, SELL wins when price falls", () => {
    expect(outcome("BUY", 100, 101)).toBe("win");
    expect(outcome("SELL", 100, 101)).toBe("loss");
    expect(outcome("SELL", 100, 99)).toBe("win");
  });
  it("NEUTRAL is not scored and missing price is pending", () => {
    expect(outcome("NEUTRAL", 100, 101)).toBe("skip");
    expect(outcome("BUY", 100, null)).toBe("pending");
  });
});
