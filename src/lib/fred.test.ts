import { describe, expect, it } from "vitest";
import { applyTransform, fredRuleFor, isFreshRelease } from "./fred";

describe("fred", () => {
  it("matches core CPI before headline CPI", () => {
    expect(fredRuleFor("Core CPI m/m")?.series).toBe("CPILFESL");
    expect(fredRuleFor("CPI m/m")?.series).toBe("CPIAUCSL");
    expect(fredRuleFor("FOMC Statement")).toBeNull();
  });
  it("computes NFP as monthly change in thousands", () => {
    expect(applyTransform("diff", [159500, 159320])).toBe(180);
  });
  it("computes m/m percent", () => {
    expect(applyTransform("mom", [303, 302.1])).toBe(0.3);
  });
  it("converts claims to K", () => {
    expect(applyTransform("personsToK", [225000])).toBe(225);
  });
  it("rejects stale vintages before the event day (New York)", () => {
    expect(isFreshRelease("2026-10-08", "2026-10-09T12:30:00Z")).toBe(false);
    expect(isFreshRelease("2026-10-09", "2026-10-09T12:30:00Z")).toBe(true);
  });
});
