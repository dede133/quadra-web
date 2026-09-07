import type {
  RankCandidateSlotsInput,
  RankedSlotConsensusResult,
  SlotConsensusResult,
} from "./types";

const viabilityRank = { ready: 0, possible: 1, not_ready: 2 } as const;

/** Pure, generic consensus ranking. It has no knowledge of UI, persistence, or sport. */
export function rankCandidateSlots(
  input: RankCandidateSlotsInput,
): RankedSlotConsensusResult[] {
  return input.slots
    .map((slot) => {
      const perfectCount = slot.statuses.filter(
        (status) => status === "perfect",
      ).length;
      const maybeCount = slot.statuses.filter(
        (status) => status === "maybe",
      ).length;
      const noCount = slot.statuses.filter((status) => status === "no").length;
      const viableCount = perfectCount + maybeCount;
      const viability: SlotConsensusResult["viability"] =
        perfectCount >= input.minParticipants
          ? "ready"
          : viableCount >= input.minParticipants
            ? "possible"
            : "not_ready";

      return {
        slotId: slot.slotId,
        startAt: slot.startAt,
        perfectCount,
        maybeCount,
        noCount,
        responseCount: slot.statuses.length,
        viability,
        missingConfirmed: Math.max(0, input.minParticipants - perfectCount),
        maybeNeeded: Math.max(0, input.minParticipants - perfectCount),
        overflow: input.maxParticipants
          ? Math.max(0, perfectCount - input.maxParticipants)
          : 0,
      };
    })
    .sort((a, b) => {
      return (
        viabilityRank[a.viability] - viabilityRank[b.viability] ||
        b.perfectCount - a.perfectCount ||
        b.maybeCount - a.maybeCount ||
        a.noCount - b.noCount ||
        a.startAt.getTime() - b.startAt.getTime()
      );
    });
}
