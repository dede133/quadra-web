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
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let result = new Date(wallClock - offsetMs(new Date(wallClock), timezone));
  result = new Date(wallClock - offsetMs(result, timezone));
  return result;
}

export function makeSlots(
  windows: LocalWindow[],
  durationMinutes: number,
  timezone: string,
): { startAt: Date; endAt: Date }[] {
  const slots = windows.flatMap((window) => {
    const start = zonedDateTimeToUtc(window.date, window.startTime, timezone);
    const end = zonedDateTimeToUtc(window.date, window.endTime, timezone);
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
