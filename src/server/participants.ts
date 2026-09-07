import "server-only";
import type { AvailabilityStatus } from "@/domain/plan/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createToken, hashToken } from "@/lib/tokens";

export async function saveParticipantAvailability(input: {
  slug: string;
  displayName: string;
  editToken?: string;
  availability: { slotId: string; status: AvailabilityStatus }[];
}): Promise<{ editToken: string }> {
  if (!input.displayName.trim()) throw new Error("Escribe tu nombre.");
  const db = supabaseAdmin();
  const { data: plan, error: planError } = await db
    .from("plans")
    .select("id, status")
    .eq("public_slug", input.slug)
    .maybeSingle<{ id: string; status: string }>();
  if (planError) throw new Error("No se pudo consultar el partido.");
  if (!plan || plan.status !== "open")
    throw new Error("Este partido ya no acepta disponibilidad.");
  const { data: slots, error: slotsError } = await db
    .from("plan_slots")
    .select("id")
    .eq("plan_id", plan.id)
    .returns<{ id: string }[]>();
  if (slotsError || !slots?.length)
    throw new Error("No se pudieron consultar los horarios.");
  const expected = new Set(
    ((slots ?? []) as { id: string }[]).map((slot) => slot.id),
  );
  if (
    input.availability.length !== expected.size ||
    new Set(input.availability.map((entry) => entry.slotId)).size !==
      expected.size ||
    input.availability.some(
      (entry) =>
        !expected.has(entry.slotId) ||
        !["perfect", "maybe", "no"].includes(entry.status),
    )
  )
    throw new Error("Responde todos los horarios del partido.");

  let participantId: string | undefined;
  let editToken = input.editToken;
  if (editToken) {
    const { data, error } = await db
      .from("participants")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("edit_token_hash", hashToken(editToken))
      .maybeSingle<{ id: string }>();
    if (error) throw new Error("No se pudo consultar tu respuesta.");
    if (!data)
      throw new Error("El enlace de edición no es válido para este partido.");
    participantId = data?.id;
  }
  if (!participantId) {
    editToken = createToken();
    const { data, error } = await db
      .from("participants")
      .insert({
        plan_id: plan.id,
        display_name: input.displayName.trim(),
        edit_token_hash: hashToken(editToken),
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !data)
      throw new Error("No se pudo guardar tu disponibilidad.");
    participantId = data.id;
  } else {
    const { error } = await db
      .from("participants")
      .update({ display_name: input.displayName.trim() })
      .eq("id", participantId);
    if (error) throw new Error("No se pudo actualizar tu nombre.");
  }
  const { error } = await db.from("availability").upsert(
    input.availability.map((entry) => ({
      participant_id: participantId,
      slot_id: entry.slotId,
      status: entry.status,
    })),
    { onConflict: "participant_id,slot_id" },
  );
  if (error) throw new Error("No se pudo guardar tu disponibilidad.");
  return { editToken: editToken! };
}

export async function getParticipantAvailability(
  slug: string,
  editToken: string,
) {
  const db = supabaseAdmin();
  const { data: plan } = await db
    .from("plans")
    .select("id")
    .eq("public_slug", slug)
    .maybeSingle<{ id: string }>();
  if (!plan) return null;
  const { data: participant } = await db
    .from("participants")
    .select("id, display_name")
    .eq("plan_id", plan.id)
    .eq("edit_token_hash", hashToken(editToken))
    .maybeSingle<{ id: string; display_name: string }>();
  if (!participant) return null;
  const { data } = await db
    .from("availability")
    .select("slot_id, status")
    .eq("participant_id", participant.id)
    .returns<{ slot_id: string; status: AvailabilityStatus }[]>();
  return { displayName: participant.display_name, availability: data ?? [] };
}
