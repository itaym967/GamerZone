import type { AvailabilityPreferences } from "./availability";

interface AutoMatchInput {
  currentAvailability: AvailabilityPreferences | null;
  currentGames: string[];
  gamerAvailability: AvailabilityPreferences | null;
  gamerGames: string[];
  isFriend: boolean;
  online: boolean;
}

function getUniqueOverlapCount(left: string[], right: string[]) {
  const rightSet = new Set(right);
  const overlap = new Set<string>();
  for (const item of left) {
    if (rightSet.has(item)) {
      overlap.add(item);
    }
  }
  return overlap.size;
}

export function getAutoMatchScore({
  currentAvailability,
  currentGames,
  gamerAvailability,
  gamerGames,
  online,
  isFriend,
}: AutoMatchInput) {
  let score = 0;

  const sharedGames = getUniqueOverlapCount(currentGames, gamerGames);
  score += sharedGames * 3;

  if (currentAvailability && gamerAvailability) {
    const sharedSlots = getUniqueOverlapCount(
      currentAvailability.slots,
      gamerAvailability.slots
    );
    score += sharedSlots * 5;
    if (currentAvailability.timezone === gamerAvailability.timezone) {
      score += 2;
    }
  }

  if (online) {
    score += 2;
  }
  if (isFriend) {
    score += 1;
  }

  return score;
}
