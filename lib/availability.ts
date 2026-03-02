export type AvailabilitySlot =
  | "afternoon"
  | "evening"
  | "late-night"
  | "morning";

export interface AvailabilityPreferences {
  slots: AvailabilitySlot[];
  timezone: string;
}

const AVAILABILITY_PREFIX = "avail:";
const DEFAULT_TIMEZONE = "Asia/Jerusalem";

const VALID_SLOTS: AvailabilitySlot[] = [
  "morning",
  "afternoon",
  "evening",
  "late-night",
];

export const DEFAULT_AVAILABILITY: AvailabilityPreferences = {
  slots: [],
  timezone: DEFAULT_TIMEZONE,
};

function isAvailabilitySlot(value: string): value is AvailabilitySlot {
  return VALID_SLOTS.includes(value as AvailabilitySlot);
}

export function encodeAvailabilityPreferences(
  preferences: AvailabilityPreferences
): string {
  return `${AVAILABILITY_PREFIX}${JSON.stringify(preferences)}`;
}

export function parseAvailabilityPreferences(raw: string | null | undefined) {
  if (!raw?.startsWith(AVAILABILITY_PREFIX)) {
    return null;
  }

  const payload = raw.slice(AVAILABILITY_PREFIX.length);
  try {
    const parsed = JSON.parse(payload) as Partial<AvailabilityPreferences>;
    const timezone =
      typeof parsed.timezone === "string" && parsed.timezone.trim()
        ? parsed.timezone.trim()
        : DEFAULT_TIMEZONE;
    const slots = Array.isArray(parsed.slots)
      ? parsed.slots.filter(
          (slot): slot is AvailabilitySlot =>
            typeof slot === "string" && isAvailabilitySlot(slot)
        )
      : [];
    return { timezone, slots };
  } catch {
    return null;
  }
}
