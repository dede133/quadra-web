import type { AvailabilityStatus } from "@/domain/plan/types";

export type ConsensusSlotInput = {
  slotId: string;
  startAt: Date;
  statuses: AvailabilityStatus[];
};

export type RankCandidateSlotsInput = {
  minParticipants: number;
  maxParticipants: number | null;
  slots: ConsensusSlotInput[];
};

export type SlotConsensusResult = {
  slotId: string;
  perfectCount: number;
  maybeCount: number;
  noCount: number;
  responseCount: number;
  viability: "ready" | "possible" | "not_ready";
  missingConfirmed: number;
  maybeNeeded: number;
  overflow: number;
};

export type RankedSlotConsensusResult = SlotConsensusResult & { startAt: Date };
