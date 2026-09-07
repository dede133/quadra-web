import { describe, expect, it } from "vitest";
import { makeSlots, zonedDateTimeToUtc } from "./index";

describe("plan dates", () => {
  it.each([
    ["2026-01-15", "2026-01-15T18:00:00.000Z"],
    ["2026-07-15", "2026-07-15T17:00:00.000Z"],
  ])("converts Madrid time on %s", (date, expected) => {
    expect(
      zonedDateTimeToUtc(date, "19:00", "Europe/Madrid").toISOString(),
    ).toBe(expected);
  });
  it.each([
    ["2026-02-31", "19:00"],
    ["2026-02-29", "19:00"],
    ["2026-13-01", "19:00"],
    ["2026-01-00", "19:00"],
    ["2026-01-01", "25:00"],
    ["2026-01-01", "19:60"],
    ["2026-1-1", "19:00"],
  ])("rejects invalid input %s %s", (date, time) => {
    expect(() => zonedDateTimeToUtc(date, time, "Europe/Madrid")).toThrow(
      "inválida",
    );
  });
  it("accepts leap day and rejects unknown timezones", () => {
    expect(zonedDateTimeToUtc("2028-02-29", "19:00", "UTC").toISOString()).toBe(
      "2028-02-29T19:00:00.000Z",
    );
    expect(() =>
      zonedDateTimeToUtc("2026-01-01", "19:00", "not-a-zone"),
    ).toThrow("zona horaria");
  });
  it.each(["2026-03-29", "2026-10-25"])(
    "rejects missing or ambiguous local time on %s",
    (date) => {
      expect(() => zonedDateTimeToUtc(date, "02:30", "Europe/Madrid")).toThrow(
        "cambio horario",
      );
    },
  );
  it("deduplicates windows and leaves out incomplete slots", () => {
    const window = { date: "2026-09-07", startTime: "19:00", endTime: "21:30" };
    expect(
      makeSlots([window, window], 60, "Europe/Madrid").map((slot) =>
        slot.startAt.toISOString(),
      ),
    ).toEqual(["2026-09-07T17:00:00.000Z", "2026-09-07T18:00:00.000Z"]);
    expect(makeSlots([window], 90, "Europe/Madrid")).toHaveLength(1);
    expect(() => makeSlots([window], 0, "Europe/Madrid")).toThrow("duración");
    expect(() =>
      makeSlots([{ ...window, endTime: "18:00" }], 60, "Europe/Madrid"),
    ).toThrow("posterior");
  });
});
