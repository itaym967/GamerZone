import type { AvailabilityPreferences } from "./availability";

interface AutoMatchInput {
  currentAvailability: AvailabilityPreferences | null;
  currentGames: string[];
  gamerAvailability: AvailabilityPreferences | null;
  gamerGames: string[];
  isFriend: boolean;
  online: boolean;
}

interface AutoMatchBreakdown {
  confidence: number;
  reasons: string[];
  score: number;
}

const MAX_SHARED_GAMES_FOR_CONFIDENCE = 4;
const MAX_SHARED_SLOTS_FOR_CONFIDENCE = 4;
const GAME_WEIGHT = 3;
const SLOT_WEIGHT = 5;
const SAME_TIMEZONE_WEIGHT = 2;
const ONLINE_WEIGHT = 2;
const FRIEND_WEIGHT = 1;
const MAX_CONFIDENCE_SCORE =
  MAX_SHARED_GAMES_FOR_CONFIDENCE * GAME_WEIGHT +
  MAX_SHARED_SLOTS_FOR_CONFIDENCE * SLOT_WEIGHT +
  SAME_TIMEZONE_WEIGHT +
  ONLINE_WEIGHT +
  FRIEND_WEIGHT;

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
  score += sharedGames * GAME_WEIGHT;

  if (currentAvailability && gamerAvailability) {
    const sharedSlots = getUniqueOverlapCount(
      currentAvailability.slots,
      gamerAvailability.slots
    );
    score += sharedSlots * SLOT_WEIGHT;
    if (currentAvailability.timezone === gamerAvailability.timezone) {
      score += SAME_TIMEZONE_WEIGHT;
    }
  }

  if (online) {
    score += ONLINE_WEIGHT;
  }
  if (isFriend) {
    score += FRIEND_WEIGHT;
  }

  return score;
}

export function getAutoMatchInsights({
  currentAvailability,
  currentGames,
  gamerAvailability,
  gamerGames,
  online,
  isFriend,
}: AutoMatchInput): AutoMatchBreakdown {
  const reasons: string[] = [];
  let confidenceScore = 0;

  const sharedGames = getUniqueOverlapCount(currentGames, gamerGames);
  if (sharedGames > 0) {
    reasons.push(`${sharedGames} משחקים משותפים`);
    confidenceScore +=
      Math.min(sharedGames, MAX_SHARED_GAMES_FOR_CONFIDENCE) * GAME_WEIGHT;
  }

  if (currentAvailability && gamerAvailability) {
    const sharedSlots = getUniqueOverlapCount(
      currentAvailability.slots,
      gamerAvailability.slots
    );
    if (sharedSlots > 0) {
      reasons.push(`${sharedSlots} חלונות זמינות חופפים`);
      confidenceScore +=
        Math.min(sharedSlots, MAX_SHARED_SLOTS_FOR_CONFIDENCE) * SLOT_WEIGHT;
    }
    if (currentAvailability.timezone === gamerAvailability.timezone) {
      reasons.push("אותו אזור זמן");
      confidenceScore += SAME_TIMEZONE_WEIGHT;
    }
  }

  if (online) {
    reasons.push("מחובר עכשיו");
    confidenceScore += ONLINE_WEIGHT;
  }

  if (isFriend) {
    reasons.push("כבר חבר שלך");
    confidenceScore += FRIEND_WEIGHT;
  }

  const score = getAutoMatchScore({
    currentAvailability,
    currentGames,
    gamerAvailability,
    gamerGames,
    online,
    isFriend,
  });
  const confidence = Math.round((confidenceScore / MAX_CONFIDENCE_SCORE) * 100);

  return {
    score,
    confidence,
    reasons,
  };
}
