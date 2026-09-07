export type PlanStatus = "open" | "confirmed" | "cancelled";
export type AvailabilityStatus = "perfect" | "maybe" | "no";

export type Plan = {
  id: string;
  publicSlug: string;
  title: string;
  type: "football";
  areaLabel: string | null;
  minParticipants: number;
  maxParticipants: number | null;
  durationMinutes: number;
  timezone: string;
  status: PlanStatus;
  confirmedSlotId: string | null;
  adminTokenHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanSlot = {
  id: string;
  planId: string;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
};

export type Participant = {
  id: string;
  planId: string;
  displayName: string;
  editTokenHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Availability = {
  participantId: string;
  slotId: string;
  status: AvailabilityStatus;
  updatedAt: Date;
};
