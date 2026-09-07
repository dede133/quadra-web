import { describe, expect, it } from "vitest";
import { rankCandidateSlots } from "./rank-candidate-slots";

const at = (hour: number) =>
  new Date(`2026-08-20T${String(hour).padStart(2, "0")}:00:00Z`);
const rank = (
  slots: {
    id: string;
    hour: number;
    statuses: ("perfect" | "maybe" | "no")[];
  }[],
  max: number | null = 14,
) =>
  rankCandidateSlots({
    minParticipants: 3,
    maxParticipants: max,
    slots: slots.map((slot) => ({
      slotId: slot.id,
      startAt: at(slot.hour),
      statuses: slot.statuses,
    })),
  });

describe("rankCandidateSlots", () => {
  it("classifies ready, possible, and not_ready", () => {
    const results = rank([
      { id: "ready", hour: 10, statuses: ["perfect", "perfect", "perfect"] },
      { id: "possible", hour: 11, statuses: ["perfect", "maybe", "maybe"] },
      { id: "not", hour: 12, statuses: ["perfect", "no"] },
    ]);
    expect(
      Object.fromEntries(results.map((item) => [item.slotId, item.viability])),
    ).toEqual({ ready: "ready", possible: "possible", not: "not_ready" });
  });

  it("orders ready before possible and ranks more perfect first", () => {
    expect(
      rank([
        { id: "possible", hour: 10, statuses: ["perfect", "maybe", "maybe"] },
        {
          id: "ready-low",
          hour: 11,
          statuses: ["perfect", "perfect", "perfect"],
        },
        {
          id: "ready-high",
          hour: 12,
          statuses: ["perfect", "perfect", "perfect", "perfect"],
        },
      ]).map((item) => item.slotId),
    ).toEqual(["ready-high", "ready-low", "possible"]);
  });

  it("uses maybe, then no, then chronological time as tiebreakers", () => {
    expect(
      rank([
        {
          id: "late",
          hour: 12,
          statuses: ["perfect", "perfect", "maybe", "no"],
        },
        {
          id: "early",
          hour: 10,
          statuses: ["perfect", "perfect", "maybe", "no"],
        },
        { id: "fewer-no", hour: 11, statuses: ["perfect", "perfect", "maybe"] },
        {
          id: "more-maybe",
          hour: 13,
          statuses: ["perfect", "perfect", "maybe", "maybe", "no"],
        },
      ]).map((item) => item.slotId),
    ).toEqual(["more-maybe", "fewer-no", "early", "late"]);
  });

  it("reports overflow and handles slots without responses", () => {
    const [overflow, empty] = rank(
      [
        {
          id: "overflow",
          hour: 10,
          statuses: ["perfect", "perfect", "perfect", "perfect"],
        },
        { id: "empty", hour: 11, statuses: [] },
      ],
      3,
    );
    expect(overflow.overflow).toBe(1);
    expect(empty).toMatchObject({
      responseCount: 0,
      perfectCount: 0,
      maybeCount: 0,
      noCount: 0,
      viability: "not_ready",
      missingConfirmed: 3,
      maybeNeeded: 3,
    });
  });
});
