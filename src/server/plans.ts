import "server-only";
import { rankCandidateSlots } from "@/domain/consensus/rank-candidate-slots";
import type { AvailabilityStatus } from "@/domain/plan/types";
import { makeSlots, type LocalWindow } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPublicSlug, createToken, hashToken } from "@/lib/tokens";

export type CreatePlanInput = {
  title: string;
  areaLabel: string;
  minParticipants: number;
  maxParticipants: number | null;
  durationMinutes: 60 | 90;
  windows: LocalWindow[];
  timezone?: string;
};

type PlanRow = {
  id: string;
  public_slug: string;
  title: string;
  area_label: string | null;
  min_participants: number;
  max_participants: number | null;
  duration_minutes: number;
  timezone: string;
  status: "open" | "confirmed" | "cancelled";
  confirmed_slot_id: string | null;
};
type SlotRow = {
  id: string;
  plan_id: string;
  start_at: string;
  end_at: string;
};

function validateInput(input: CreatePlanInput): void {
  if (!input.title.trim()) throw new Error("El nombre es obligatorio.");
  if (!Number.isInteger(input.minParticipants) || input.minParticipants <= 0)
    throw new Error("El mínimo debe ser mayor que cero.");
  if (
    input.maxParticipants !== null &&
    (!Number.isInteger(input.maxParticipants) ||
      input.maxParticipants < input.minParticipants)
  )
    throw new Error("El máximo debe ser igual o mayor que el mínimo.");
  if (![60, 90].includes(input.durationMinutes))
    throw new Error("La duración no es válida.");
  if (!input.windows.length) throw new Error("Añade al menos una ventana.");
  for (const window of input.windows) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(window.date) ||
      !/^\d{2}:\d{2}$/.test(window.startTime) ||
      !/^\d{2}:\d{2}$/.test(window.endTime)
    )
      throw new Error("Hay una fecha u hora inválida.");
    if (window.endTime <= window.startTime)
      throw new Error("La hora de fin debe ser posterior a la de inicio.");
  }
}

export async function createPlan(
  input: CreatePlanInput,
): Promise<{ adminToken: string }> {
  validateInput(input);
  const timezone = input.timezone ?? "Europe/Madrid";
  const slots = makeSlots(input.windows, input.durationMinutes, timezone);
  if (!slots.length)
    throw new Error("La duración debe caber en al menos una ventana.");
  const db = supabaseAdmin();
  const adminToken = createToken();
  let publicSlug = createPublicSlug();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await db
      .from("plans")
      .insert({
        public_slug: publicSlug,
        title: input.title.trim(),
        type: "football",
        area_label: input.areaLabel.trim() || null,
        min_participants: input.minParticipants,
        max_participants: input.maxParticipants,
        duration_minutes: input.durationMinutes,
        timezone,
        admin_token_hash: hashToken(adminToken),
      })
      .select("id")
      .single();
    if (!error && data) {
      const { error: slotsError } = await db.from("plan_slots").insert(
        slots.map((slot) => ({
          plan_id: data.id,
          start_at: slot.startAt.toISOString(),
          end_at: slot.endAt.toISOString(),
        })),
      );
      if (slotsError) throw new Error("No se pudieron crear los horarios.");
      return { adminToken };
    }
    if (error?.code !== "23505")
      throw new Error("No se pudo crear el partido.");
    publicSlug = createPublicSlug();
  }
  throw new Error("No se pudo asignar un enlace público. Inténtalo otra vez.");
}

export async function getPublicPlan(slug: string): Promise<{
  plan: PlanRow;
  slots: SlotRow[];
  responseCount: number;
  confirmedPerfectCount: number;
} | null> {
  const db = supabaseAdmin();
  const { data: plan } = await db
    .from("plans")
    .select(
      "id, public_slug, title, area_label, min_participants, max_participants, duration_minutes, timezone, status, confirmed_slot_id",
    )
    .eq("public_slug", slug)
    .maybeSingle<PlanRow>();
  if (!plan) return null;
  const { data: slots } = await db
    .from("plan_slots")
    .select("id, plan_id, start_at, end_at")
    .eq("plan_id", plan.id)
    .order("start_at")
    .returns<SlotRow[]>();
  const { count: responseCount } = await db
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan.id);
  let confirmedPerfectCount = 0;
  if (plan.confirmed_slot_id) {
    const { count } = await db
      .from("availability")
      .select("participant_id", { count: "exact", head: true })
      .eq("slot_id", plan.confirmed_slot_id)
      .eq("status", "perfect");
    confirmedPerfectCount = count ?? 0;
  }
  return {
    plan,
    slots: slots ?? [],
    responseCount: responseCount ?? 0,
    confirmedPerfectCount,
  };
}

export async function getManagedPlan(token: string) {
  const db = supabaseAdmin();
  const { data: plan } = await db
    .from("plans")
    .select(
      "id, public_slug, title, area_label, min_participants, max_participants, duration_minutes, timezone, status, confirmed_slot_id",
    )
    .eq("admin_token_hash", hashToken(token))
    .maybeSingle<PlanRow>();
  if (!plan) return null;
  const [{ data: slots }, { data: rows }, { count: participantCount }] =
    await Promise.all([
      db
        .from("plan_slots")
        .select("id, plan_id, start_at, end_at")
        .eq("plan_id", plan.id)
        .order("start_at")
        .returns<SlotRow[]>(),
      db
        .from("availability")
        .select("slot_id, status, participants!inner(plan_id)")
        .eq("participants.plan_id", plan.id)
        .returns<{ slot_id: string; status: AvailabilityStatus }[]>(),
      db
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan.id),
    ]);
  const slotRows = (slots ?? []) as SlotRow[];
  const availabilityRows = (rows ?? []) as {
    slot_id: string;
    status: AvailabilityStatus;
  }[];
  const statusesBySlot = new Map<string, AvailabilityStatus[]>(
    slotRows.map((slot) => [slot.id, []]),
  );
  for (const row of availabilityRows)
    statusesBySlot.get(row.slot_id)?.push(row.status);
  const ranking = rankCandidateSlots({
    minParticipants: plan.min_participants,
    maxParticipants: plan.max_participants,
    slots: slotRows.map((slot) => ({
      slotId: slot.id,
      startAt: new Date(slot.start_at),
      statuses: statusesBySlot.get(slot.id) ?? [],
    })),
  });
  return {
    plan,
    slots: slotRows,
    ranking,
    participantCount: participantCount ?? 0,
  };
}

export async function confirmPlanSlot(
  token: string,
  slotId: string,
): Promise<void> {
  const db = supabaseAdmin();
  const hash = hashToken(token);
  const { data: plan } = await db
    .from("plans")
    .select("id")
    .eq("admin_token_hash", hash)
    .maybeSingle<{ id: string }>();
  if (!plan) throw new Error("Acceso inválido.");
  const { data: slot } = await db
    .from("plan_slots")
    .select("id")
    .eq("id", slotId)
    .eq("plan_id", plan.id)
    .maybeSingle();
  if (!slot) throw new Error("Ese horario no pertenece al partido.");
  const { data: confirmed, error } = await db
    .from("plans")
    .update({ status: "confirmed", confirmed_slot_id: slotId })
    .eq("id", plan.id)
    .eq("status", "open")
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) throw new Error("No se pudo confirmar el horario.");
  if (!confirmed)
    throw new Error("Este partido ya está cerrado. Recarga la página.");
}
