import { describe, expect, it } from "vitest";
import { dailyNet, monthGrid, summary, weekdayOf, type Trade } from "./journal";

const t = (date: string, pnl: number): Trade => ({ id: date + pnl, date, instrument: "XAUUSD", side: "BUY", size: 1, entry: 0, exit: 0, pnl, notes: "", source: "Manual" });
const today = new Date(2026, 10, 4); // Wed 4 Nov 2026

describe("journal maths", () => {
  it("sums today, this week (Mon start), this month and trading days", () => {
    const list = [t("2026-11-04", 50), t("2026-11-04", -20), t("2026-11-02", 10), t("2026-11-01", 5), t("2026-10-30", 100)];
    expect(summary(list, today)).toEqual({ today: 30, week: 40, month: 45, tradingDays: 4 });
  });
  it("shows one net figure per day", () => {
    expect(dailyNet([t("2026-11-04", 50), t("2026-11-04", -20)])).toEqual({ "2026-11-04": 30 });
  });
  it("starts the month grid on Monday", () => {
    expect(monthGrid(2026, 10).slice(0, 7)).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(weekdayOf("2026-11-02")).toBe("Mon");
  });
});
