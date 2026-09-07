"use client";

import { useState } from "react";
import { createPlanAction } from "@/app/actions";

type WindowInput = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
};
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export function NewPlanForm() {
  const [windows, setWindows] = useState<WindowInput[]>([
    { id: 1, date: today, startTime: "19:00", endTime: "22:00" },
  ]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const updateWindow = (
    id: number,
    field: keyof Omit<WindowInput, "id">,
    value: string,
  ) =>
    setWindows((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  async function submit(formData: FormData) {
    setError("");
    setPending(true);
    const minParticipants = Number(formData.get("min"));
    const maximum = String(formData.get("max") ?? "").trim();
    const maxParticipants = maximum ? Number(maximum) : null;
    if (
      !windows.length ||
      windows.some(
        (window) =>
          !window.date ||
          !window.startTime ||
          !window.endTime ||
          window.endTime <= window.startTime,
      )
    ) {
      setError(
        "Revisa las ventanas: la hora de fin debe ser posterior a la de inicio.",
      );
      setPending(false);
      return;
    }
    if (
      !Number.isInteger(minParticipants) ||
      minParticipants < 1 ||
      (maxParticipants !== null &&
        (!Number.isInteger(maxParticipants) ||
          maxParticipants < minParticipants))
    ) {
      setError("Revisa el mínimo y máximo de jugadores.");
      setPending(false);
      return;
    }
    try {
      await createPlanAction({
        title: String(formData.get("title") ?? ""),
        areaLabel: String(formData.get("area") ?? ""),
        minParticipants,
        maxParticipants,
        durationMinutes: Number(formData.get("duration")) as 60 | 90,
        windows,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo crear el partido.",
      );
      setPending(false);
    }
  }
  return (
    <form action={submit} className="card space-y-6">
      <div>
        <label className="label" htmlFor="title">
          Nombre
        </label>
        <input
          className="field"
          id="title"
          name="title"
          defaultValue="Partido de fútbol"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="area">
          Zona <span className="font-normal text-ink/50">(opcional)</span>
        </label>
        <input
          className="field"
          id="area"
          name="area"
          placeholder="Barcelona"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="min">
            Mínimo
          </label>
          <input
            className="field"
            id="min"
            name="min"
            type="number"
            min="1"
            defaultValue="10"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="max">
            Máximo
          </label>
          <input
            className="field"
            id="max"
            name="max"
            type="number"
            min="1"
            defaultValue="14"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="duration">
          Duración
        </label>
        <select
          className="field"
          id="duration"
          name="duration"
          defaultValue="60"
        >
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
      </div>
      <fieldset className="space-y-3">
        <legend className="label">Ventanas disponibles</legend>
        {windows.map((window, index) => (
          <div className="rounded-2xl bg-ink/[.035] p-3" key={window.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">Día {index + 1}</span>
              {windows.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setWindows((items) =>
                      items.filter((item) => item.id !== window.id),
                    )
                  }
                  className="text-sm font-semibold text-red-700"
                >
                  Eliminar
                </button>
              )}
            </div>
            <label className="sr-only" htmlFor={`date-${window.id}`}>
              Fecha
            </label>
            <input
              className="field mb-2"
              id={`date-${window.id}`}
              type="date"
              value={window.date}
              onChange={(event) =>
                updateWindow(window.id, "date", event.target.value)
              }
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="sr-only" htmlFor={`start-${window.id}`}>
                  Hora inicio
                </label>
                <input
                  className="field"
                  id={`start-${window.id}`}
                  type="time"
                  value={window.startTime}
                  onChange={(event) =>
                    updateWindow(window.id, "startTime", event.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="sr-only" htmlFor={`end-${window.id}`}>
                  Hora fin
                </label>
                <input
                  className="field"
                  id={`end-${window.id}`}
                  type="time"
                  value={window.endTime}
                  onChange={(event) =>
                    updateWindow(window.id, "endTime", event.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </fieldset>
      <button
        type="button"
        className="button-secondary w-full"
        onClick={() =>
          setWindows((items) => [
            ...items,
            {
              id: Date.now(),
              date: today,
              startTime: "19:00",
              endTime: "22:00",
            },
          ])
        }
      >
        + Añadir otra ventana
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}
      <button
        className="button-primary w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creando…" : "Crear partido"}
      </button>
    </form>
  );
}
