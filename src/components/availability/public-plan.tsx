"use client";

import { useEffect, useMemo, useState } from "react";
import type { AvailabilityStatus } from "@/domain/plan/types";
import { getMyAvailabilityAction, saveAvailabilityAction } from "@/app/actions";
import { PlanSummary } from "@/components/plan/plan-summary";

type Slot = { id: string; start_at: string; end_at: string };
type Plan = {
  title: string;
  area_label: string | null;
  min_participants: number;
  max_participants: number | null;
  duration_minutes: number;
  timezone: string;
  status: "open" | "confirmed" | "cancelled";
  confirmed_slot_id: string | null;
};
const choices: { value: AvailabilityStatus; label: string; color: string }[] = [
  {
    value: "perfect",
    label: "✅ Perfecto",
    color: "bg-emerald-100 text-emerald-900 ring-emerald-500",
  },
  {
    value: "maybe",
    label: "🟡 Podría",
    color: "bg-amber-100 text-amber-900 ring-amber-500",
  },
  {
    value: "no",
    label: "❌ No puedo",
    color: "bg-red-100 text-red-900 ring-red-500",
  },
];

function dayLabel(date: string, timezone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}
function time(date: string, timezone: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(date));
}

export function PublicPlan({
  slug,
  plan,
  slots,
  responseCount,
  confirmedPerfectCount,
}: {
  slug: string;
  plan: Plan;
  slots: Slot[];
  responseCount: number;
  confirmedPerfectCount: number;
}) {
  const storageKey = `quadra:edit-token:${slug}`;
  const [name, setName] = useState("");
  const [responses, setResponses] = useState<
    Record<string, AvailabilityStatus>
  >({});
  const [editToken, setEditToken] = useState<string>();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const token = window.localStorage.getItem(storageKey);
    if (!token) return;
    setEditToken(token);
    void getMyAvailabilityAction(slug, token).then((saved) => {
      if (!saved) return;
      setName(saved.displayName);
      setResponses(
        Object.fromEntries(
          saved.availability.map(
            (entry: { slot_id: string; status: AvailabilityStatus }) => [
              entry.slot_id,
              entry.status,
            ],
          ),
        ),
      );
    });
  }, [slug, storageKey]);
  const groups = useMemo(
    () =>
      Object.values(
        slots.reduce<Record<string, Slot[]>>((all, slot) => {
          const key = new Intl.DateTimeFormat("en-CA", {
            timeZone: plan.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(slot.start_at));
          (all[key] ??= []).push(slot);
          return all;
        }, {}),
      ),
    [slots, plan.timezone],
  );
  const confirmedSlot = slots.find(
    (slot) => slot.id === plan.confirmed_slot_id,
  );
  async function save() {
    setMessage("");
    if (!name.trim()) {
      setMessage("Escribe tu nombre.");
      return;
    }
    if (Object.keys(responses).length !== slots.length) {
      setMessage("Responde todos los horarios antes de guardar.");
      return;
    }
    setPending(true);
    try {
      const saved = await saveAvailabilityAction({
        slug,
        displayName: name,
        editToken,
        availability: slots.map((slot) => ({
          slotId: slot.id,
          status: responses[slot.id],
        })),
      });
      setEditToken(saved.editToken);
      window.localStorage.setItem(storageKey, saved.editToken);
      setMessage("Disponibilidad guardada. ¡Gracias!");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "No se pudo guardar.",
      );
    }
    setPending(false);
  }
  if (plan.status === "cancelled")
    return (
      <section className="card">
        <p className="font-black text-red-700">Este partido se ha cancelado.</p>
      </section>
    );
  return (
    <>
      <header className="mb-6">
        <p className="font-black tracking-tight text-grass">QUADRA ⚽</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {plan.title}
        </h1>
        <PlanSummary
          areaLabel={plan.area_label}
          min={plan.min_participants}
          max={plan.max_participants}
          duration={plan.duration_minutes}
        />
      </header>
      {plan.status === "confirmed" && confirmedSlot ? (
        <section className="card border-grass/25 bg-emerald-50">
          <p className="text-lg font-black text-grass">Partido confirmado ⚽</p>
          <p className="mt-2 text-xl font-bold capitalize">
            {dayLabel(confirmedSlot.start_at, plan.timezone)}
          </p>
          <p className="mt-1 text-lg">
            {time(confirmedSlot.start_at, plan.timezone)}–
            {time(confirmedSlot.end_at, plan.timezone)}
          </p>
          {plan.area_label && <p className="mt-2">📍 {plan.area_label}</p>}
          <p className="mt-4 text-sm font-medium">
            {confirmedPerfectCount} personas marcaron Perfecto para este
            horario.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="card">
            <label className="label" htmlFor="name">
              Tu nombre
            </label>
            <input
              className="field"
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </div>
          <div className="space-y-4">
            {groups.map((group) => (
              <section className="card" key={group[0].id}>
                <h2 className="mb-4 text-lg font-black capitalize">
                  {dayLabel(group[0].start_at, plan.timezone)}
                </h2>
                <div className="space-y-5">
                  {group.map((slot) => (
                    <div key={slot.id}>
                      <p className="mb-2 font-bold">
                        {time(slot.start_at, plan.timezone)}–
                        {time(slot.end_at, plan.timezone)}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {choices.map((choice) => (
                          <button
                            type="button"
                            aria-pressed={responses[slot.id] === choice.value}
                            key={choice.value}
                            onClick={() =>
                              setResponses((all) => ({
                                ...all,
                                [slot.id]: choice.value,
                              }))
                            }
                            className={`min-h-14 rounded-xl border px-1 text-xs font-bold sm:text-sm ${responses[slot.id] === choice.value ? `${choice.color} ring-2` : "bg-white text-ink/60"}`}
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <button
            className="button-primary w-full"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? "Guardando…" : "Guardar disponibilidad"}
          </button>
          {message && (
            <p
              role="status"
              className="rounded-xl bg-white p-3 text-center text-sm font-medium shadow-sm"
            >
              {message}
            </p>
          )}
          <p className="pb-6 text-center text-sm text-ink/60">
            {responseCount}{" "}
            {responseCount === 1 ? "persona ha" : "personas han"} respondido
          </p>
        </section>
      )}
    </>
  );
}
