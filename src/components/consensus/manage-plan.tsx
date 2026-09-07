"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSlotAction } from "@/app/actions";
import { PlanSummary } from "@/components/plan/plan-summary";
import { ShareLink } from "@/components/plan/share-link";

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
type Slot = { id: string; start_at: string; end_at: string };
type Ranking = {
  slotId: string;
  startAt: string;
  perfectCount: number;
  maybeCount: number;
  noCount: number;
  responseCount: number;
  viability: "ready" | "possible" | "not_ready";
  missingConfirmed: number;
  maybeNeeded: number;
  overflow: number;
};

function formatSlot(slot: Slot, timezone: string) {
  const date = new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(slot.start_at));
  const time = new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${date} · ${time.format(new Date(slot.start_at))}–${time.format(new Date(slot.end_at))}`;
}
function statusLabel(result: Ranking) {
  if (result.viability === "ready") return "Ya sois suficientes.";
  if (result.viability === "possible")
    return result.maybeNeeded === 1
      ? "Falta 1 confirmación."
      : `Necesitamos que ${result.maybeNeeded} de los posibles puedan finalmente.`;
  return result.missingConfirmed === 1
    ? "Falta 1 jugador."
    : `Faltan ${result.missingConfirmed} jugadores.`;
}

export function ManagePlan({
  token,
  publicUrl,
  plan,
  slots,
  ranking,
  participantCount,
}: {
  token: string;
  publicUrl: string;
  plan: Plan;
  slots: Slot[];
  ranking: Ranking[];
  participantCount: number;
}) {
  const router = useRouter();
  const [pendingSlot, setPendingSlot] = useState<string>();
  const [error, setError] = useState("");
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  async function confirm(slotId: string) {
    setError("");
    setPendingSlot(slotId);
    try {
      await confirmSlotAction(token, slotId);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo confirmar.",
      );
    }
    setPendingSlot(undefined);
  }
  return (
    <>
      <header className="mb-6">
        <p className="font-black tracking-tight text-grass">
          QUADRA · ADMIN ⚽
        </p>
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
      <section className="card mb-5">
        <p className="text-sm font-semibold text-ink/60">Participación</p>
        <p className="mt-1 text-3xl font-black">
          {participantCount}{" "}
          <span className="text-base font-semibold text-ink/60">
            han respondido
          </span>
        </p>
        <div className="mt-5">
          <p className="mb-2 break-all text-sm text-ink/60">{publicUrl}</p>
          <ShareLink url={publicUrl} />
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-black">Mejores opciones</h2>
          {plan.status === "confirmed" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
              Confirmado
            </span>
          )}
        </div>
        <div className="space-y-4">
          {ranking.map((result, index) => {
            const slot = byId.get(result.slotId);
            if (!slot) return null;
            const color =
              result.viability === "ready"
                ? "bg-emerald-100 text-emerald-800"
                : result.viability === "possible"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-slate-100 text-slate-700";
            return (
              <article key={result.slotId} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black capitalize">
                      {index === 0 ? "🏆 " : ""}
                      {formatSlot(slot, plan.timezone)}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${color}`}
                    >
                      {result.viability.replace("_", " ")}
                    </span>
                  </div>
                  {plan.confirmed_slot_id === result.slotId && (
                    <span className="text-2xl" aria-label="Horario confirmado">
                      ⚽
                    </span>
                  )}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                  <p className="rounded-xl bg-emerald-50 p-2 font-bold">
                    ✅ {result.perfectCount}
                    <span className="block text-xs font-medium">Perfecto</span>
                  </p>
                  <p className="rounded-xl bg-amber-50 p-2 font-bold">
                    🟡 {result.maybeCount}
                    <span className="block text-xs font-medium">Podría</span>
                  </p>
                  <p className="rounded-xl bg-red-50 p-2 font-bold">
                    ❌ {result.noCount}
                    <span className="block text-xs font-medium">No</span>
                  </p>
                </div>
                <p className="mt-4 font-medium text-ink/75">
                  {statusLabel(result)}
                </p>
                {result.overflow > 0 && (
                  <p className="mt-1 text-sm text-ink/60">
                    {result.overflow} por encima del máximo indicado.
                  </p>
                )}
                {plan.status === "open" && (
                  <button
                    className="button-primary mt-5 w-full"
                    disabled={Boolean(pendingSlot)}
                    onClick={() => void confirm(result.slotId)}
                  >
                    {pendingSlot === result.slotId
                      ? "Confirmando…"
                      : "Confirmar este horario"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </>
  );
}
