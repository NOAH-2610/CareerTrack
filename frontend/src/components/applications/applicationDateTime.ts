// Date/time helpers for Interview API timestamps.
// All helpers return null for empty or invalid input so callers can choose
// their own fallback presentation.

const DATE_TIME_LOCAL_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const ISO_DATE_TIME_WITH_ZONE_PATTERN =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

interface WallClockParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
}

function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

function pad4(value: number): string {
    return String(value).padStart(4, "0");
}

function normalizeFraction(value: string | undefined): number {
    return value ? Number(value.padEnd(3, "0")) : 0;
}

function isValidWallClock(parts: WallClockParts): boolean {
    const probe = new Date(0);

    probe.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    probe.setUTCHours(
        parts.hour,
        parts.minute,
        parts.second,
        parts.millisecond,
    );

    return (
        probe.getUTCFullYear() === parts.year &&
        probe.getUTCMonth() === parts.month - 1 &&
        probe.getUTCDate() === parts.day &&
        probe.getUTCHours() === parts.hour &&
        probe.getUTCMinutes() === parts.minute &&
        probe.getUTCSeconds() === parts.second &&
        probe.getUTCMilliseconds() === parts.millisecond
    );
}

function matchesLocalParts(date: Date, parts: WallClockParts): boolean {
    return (
        date.getFullYear() === parts.year &&
        date.getMonth() === parts.month - 1 &&
        date.getDate() === parts.day &&
        date.getHours() === parts.hour &&
        date.getMinutes() === parts.minute &&
        date.getSeconds() === parts.second &&
        date.getMilliseconds() === parts.millisecond
    );
}

function parseIsoTimestamp(value: string | null | undefined): Date | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const match = ISO_DATE_TIME_WITH_ZONE_PATTERN.exec(trimmed);

    if (!match) {
        return null;
    }

    const parts: WallClockParts = {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6] ?? "0"),
        millisecond: normalizeFraction(match[7]),
    };

    if (!isValidWallClock(parts)) {
        return null;
    }

    let offsetMinutes = 0;

    if (match[8] !== "Z") {
        const offsetHours = Number(match[10]);
        const offsetRemainingMinutes = Number(match[11]);

        if (offsetHours > 23 || offsetRemainingMinutes > 59) {
            return null;
        }

        offsetMinutes =
            (match[9] === "-" ? -1 : 1) *
            (offsetHours * 60 + offsetRemainingMinutes);
    }

    const wallClock = new Date(0);

    wallClock.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    wallClock.setUTCHours(
        parts.hour,
        parts.minute,
        parts.second,
        parts.millisecond,
    );

    const date = new Date(wallClock.getTime() - offsetMinutes * 60_000);

    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Converts a datetime-local value using the browser's local timezone.
 * The component round-trip check rejects times that do not exist because of
 * a daylight-saving jump instead of silently shifting them.
 */
export function toUtcIsoFromDateTimeLocal(
    value: string | null | undefined,
): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const match = DATE_TIME_LOCAL_PATTERN.exec(trimmed);

    if (!match) {
        return null;
    }

    const parts: WallClockParts = {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6] ?? "0"),
        millisecond: normalizeFraction(match[7]),
    };

    if (!isValidWallClock(parts)) {
        return null;
    }

    const date = new Date(0);

    date.setFullYear(parts.year, parts.month - 1, parts.day);
    date.setHours(
        parts.hour,
        parts.minute,
        parts.second,
        parts.millisecond,
    );

    if (!matchesLocalParts(date, parts)) {
        return null;
    }

    return date.toISOString();
}

/** Converts an API timestamp into a browser-local datetime-local value. */
export function toDateTimeLocalFromUtcIso(
    value: string | null | undefined,
): string | null {
    const date = parseIsoTimestamp(value);

    if (!date) {
        return null;
    }

    return (
        `${pad4(date.getFullYear())}-${pad2(date.getMonth() + 1)}-` +
        `${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
    );
}

function formatUtcOffset(date: Date): string {
    // getTimezoneOffset() is minutes behind UTC, so negate it to get the
    // conventional UTC offset for the supplied instant.
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(offsetMinutes);

    return `UTC${sign}${pad2(Math.floor(absoluteOffset / 60))}:${pad2(absoluteOffset % 60)}`;
}

const interviewDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

/** Formats an API timestamp for an Interview card in browser-local time. */
export function formatInterviewDateTime(
    value: string | null | undefined,
): string | null {
    const date = parseIsoTimestamp(value);

    if (!date) {
        return null;
    }

    try {
        const parts = interviewDateTimeFormatter.formatToParts(date);
        const timeZoneName =
            parts.find((part) => part.type === "timeZoneName")?.value.trim() ??
            "";
        const localDateTime = parts
            .filter((part) => part.type !== "timeZoneName")
            .map((part) => part.value)
            .join("")
            .trim();
        const zoneSuffix = timeZoneName ? ` ${timeZoneName}` : "";

        return `${localDateTime}${zoneSuffix} (${formatUtcOffset(date)}, local time)`;
    } catch {
        return null;
    }
}
