export type LocalWindow = { date: string; startTime: string; endTime: string };

function offsetMs(date: Date, timezone: string): number {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
      return parts;
    }, {});
  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return localAsUtc - date.getTime();
}

/** Converts date/time entered in the plan's IANA timezone to a UTC Date. */
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("Hay una fecha u hora inválida.");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  const entered = new Date(wallClock);
  if (
    entered.getUTCFullYear() !== year ||
    entered.getUTCMonth() !== month - 1 ||
    entered.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  )
    throw new Error("Hay una fecha u hora inválida.");

  // Check both sides of a clock change; missing or repeated local times need another choice.
  let offsets: Set<number>;
  try {
    offsets = new Set(
      [-86_400_000, 0, 86_400_000].map((delta) =>
        offsetMs(new Date(wallClock + delta), timezone),
      ),
    );
  } catch {
    throw new Error("La zona horaria no es válida.");
  }
  const candidates = [...offsets]
    .map((offset) => new Date(wallClock - offset))
    .filter(
      (candidate) =>
        candidate.getTime() + offsetMs(candidate, timezone) === wallClock,
    );
  if (candidates.length !== 1)
    throw new Error(
      "Esta hora no existe o se repite por el cambio horario. Elige otra.",
    );
  return candidates[0];
}

export function makeSlots(
  windows: LocalWindow[],
  durationMinutes: number,
  timezone: string,
): { startAt: Date; endAt: Date }[] {
  if (![60, 90].includes(durationMinutes))
    throw new Error("La duración no es válida.");
  const slots = windows.flatMap((window) => {
    const start = zonedDateTimeToUtc(window.date, window.startTime, timezone);
    const end = zonedDateTimeToUtc(window.date, window.endTime, timezone);
    if (end <= start)
      throw new Error("La hora de fin debe ser posterior a la de inicio.");
    const durationMs = durationMinutes * 60_000;
    const entries: { startAt: Date; endAt: Date }[] = [];
    for (
      let cursor = start.getTime();
      cursor + durationMs <= end.getTime();
      cursor += durationMs
    ) {
      entries.push({
        startAt: new Date(cursor),
        endAt: new Date(cursor + durationMs),
      });
    }
    return entries;
  });
  const unique = new Map(
    slots.map((slot) => [slot.startAt.toISOString(), slot]),
  );
  return [...unique.values()].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
}

export function formatSlot(
  startAt: string,
  endAt: string,
  timezone: string,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(start);
  const time = new Intl.DateTimeFormat("es-ES", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${date} · ${time.format(start)}–${time.format(end)}`;
}

export function dayKey(startAt: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(startAt));
}
