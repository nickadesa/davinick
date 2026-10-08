import { describe, expect, it } from "vitest";
import { classifyEvent, computeSignal, fibLevels, lotSize, outcome, parseFigure, tradePnl, type NewsEvent } from "./signals";

const cpi = (actual: number | null): NewsEvent => ({
  id: "cpi", time: "", title: "CPI", currency: "USD", actual, forecast: 0.3, previous: 0.2, unit: "%",
  sensitivity: { XAUUSD: -1 }, weight: 3, note: "",
});

describe("computeSignal", () => {
  it("hot CPI gives SELL on gold", () => {
    expect(computeSignal([cpi(0.4)], "XAUUSD").action).toBe("SELL");
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

describe("desk tools", () => {
  it("fib 61.8% and 78.6% in an up-swing from 4000 to 4100", () => {
    const f = fibLevels(4100, 4000, "up");
    expect(f.f618).toBeCloseTo(4038.2);
    expect(f.f786).toBeCloseTo(4021.4);
  });
  it("fib levels in a down-swing sit above the low", () => {
    expect(fibLevels(4100, 4000, "down").f618).toBeCloseTo(4061.8);
  });
  it("lot size: $10,000 at 1% risk with a $10 stop = 0.10 lots", () => {
    expect(lotSize(10000, 1, 10)).toBe(0.1);
  });
  it("PnL: 0.1 lot BUY from 4000 to 4010 = $100, SELL loses $100", () => {
    expect(tradePnl("BUY", 4000, 4010, 0.1)).toBe(100);
    expect(tradePnl("SELL", 4000, 4010, 0.1)).toBe(-100);
  });
});
