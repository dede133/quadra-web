"use server";

import { redirect } from "next/navigation";
import type { AvailabilityStatus } from "@/domain/plan/types";
import {
  confirmPlanSlot,
  createPlan,
  type CreatePlanInput,
} from "@/server/plans";
import {
  getParticipantAvailability,
  saveParticipantAvailability,
} from "@/server/participants";

export async function createPlanAction(input: CreatePlanInput) {
  const { adminToken } = await createPlan(input);
  redirect(`/manage/${adminToken}`);
}

export async function saveAvailabilityAction(input: {
  slug: string;
  displayName: string;
  editToken?: string;
  availability: { slotId: string; status: AvailabilityStatus }[];
}) {
  return saveParticipantAvailability(input);
}

export async function getMyAvailabilityAction(slug: string, editToken: string) {
  return getParticipantAvailability(slug, editToken);
}

export async function confirmSlotAction(token: string, slotId: string) {
  await confirmPlanSlot(token, slotId);
}
