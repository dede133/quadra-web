import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ from }) }));
import { confirmPlanSlot, createPlan } from "./plans";
import { saveParticipantAvailability } from "./participants";

function result(data: unknown, error: unknown = null) {
  const query = Object.assign(Promise.resolve({ data, error }), {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    returns: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    single: vi.fn(),
  });
  for (const method of Object.values(query)) method.mockReturnValue(query);
  from.mockReturnValueOnce(query);
  return query;
}

beforeEach(() => from.mockReset());

const response = {
  slug: "PUBLIC",
  displayName: "Ana",
  editToken: "invalid-token",
  availability: [{ slotId: "slot-a", status: "perfect" as const }],
};

it("rejects an invalid edit token without inserting another participant", async () => {
  result({ id: "plan-a", status: "open" });
  result([{ id: "slot-a" }]);
  const participant = result(null);
  await expect(saveParticipantAvailability(response)).rejects.toThrow(
    "edición",
  );
  expect(from).toHaveBeenCalledTimes(3);
  expect(participant.insert).not.toHaveBeenCalled();
  expect(participant.eq).toHaveBeenCalledWith("plan_id", "plan-a");
});

it("rejects availability for another plan's slots", async () => {
  result({ id: "plan-a", status: "open" });
  result([{ id: "slot-b" }]);
  await expect(saveParticipantAvailability(response)).rejects.toThrow(
    "todos los horarios",
  );
  expect(from).toHaveBeenCalledTimes(2);
});

it("does not accept responses after confirmation", async () => {
  result({ id: "plan-a", status: "confirmed" });
  await expect(saveParticipantAvailability(response)).rejects.toThrow(
    "ya no acepta",
  );
  expect(from).toHaveBeenCalledTimes(1);
});

it("does not treat a failed slot query as an empty plan", async () => {
  result({ id: "plan-a", status: "open" });
  result(null, { message: "offline" });
  await expect(
    saveParticipantAvailability({ ...response, availability: [] }),
  ).rejects.toThrow("consultar los horarios");
  expect(from).toHaveBeenCalledTimes(2);
});

it("does not save availability when updating the participant name fails", async () => {
  result({ id: "plan-a", status: "open" });
  result([{ id: "slot-a" }]);
  result({ id: "person-a" });
  result(null, { message: "offline" });
  await expect(saveParticipantAvailability(response)).rejects.toThrow(
    "actualizar tu nombre",
  );
  expect(from).toHaveBeenCalledTimes(4);
});

it("rejects an invalid organizer token before looking up slots", async () => {
  result(null);
  await expect(confirmPlanSlot("wrong", "slot-a")).rejects.toThrow(
    "Acceso inválido",
  );
  expect(from).toHaveBeenCalledTimes(1);
});

it("rejects confirmation of another plan's slot", async () => {
  result({ id: "plan-a" });
  const slot = result(null);
  await expect(confirmPlanSlot("token", "slot-b")).rejects.toThrow(
    "no pertenece",
  );
  expect(slot.eq).toHaveBeenCalledWith("plan_id", "plan-a");
  expect(from).toHaveBeenCalledTimes(2);
});

it.each([true, false])(
  "confirms only an open plan (update succeeds: %s)",
  async (success) => {
    result({ id: "plan-a" });
    result({ id: "slot-a" });
    const update = result(success ? { id: "plan-a" } : null);
    const confirmation = confirmPlanSlot("token", "slot-a");
    if (success) await expect(confirmation).resolves.toBeUndefined();
    else await expect(confirmation).rejects.toThrow("ya está cerrado");
    expect(update.eq).toHaveBeenCalledWith("status", "open");
  },
);

it("rejects impossible dates before accessing the database", async () => {
  await expect(
    createPlan({
      title: "Partido",
      areaLabel: "",
      minParticipants: 10,
      maxParticipants: null,
      durationMinutes: 60,
      windows: [{ date: "2026-02-31", startTime: "19:00", endTime: "21:00" }],
    }),
  ).rejects.toThrow("inválida");
  expect(from).not.toHaveBeenCalled();
});
