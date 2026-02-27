/**
 * Kid Safety Utility Module
 * Handles age verification, content filtering, and restriction checks
 * for COPPA compliance and safe environment for minors.
 */

// Age thresholds
export const AGE_THRESHOLDS = {
  COPPA_MIN: 13, // Under 13 requires parental consent (COPPA)
  TEEN_MIN: 13, // 13-17 = teen with some restrictions
  ADULT_MIN: 18, // 18+ = full access
} as const;

// Account types
export type AccountType = "standard" | "minor" | "supervised";

// Restriction levels based on age
export interface SafetyRestrictions {
  canJoinParties: boolean;
  canPostLFG: boolean;
  canSharePersonalInfo: boolean;
  canViewExplore: boolean;
  chatEnabled: boolean;
  chatRequiresFriendship: boolean;
  contentFilterLevel: "strict" | "moderate" | "standard";
  maxDailyChatMinutes: number;
  profilePublic: boolean;
  requiresParentalConsent: boolean;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Determine if user is a minor based on date of birth
 */
export function isMinor(dateOfBirth: string | Date): boolean {
  return calculateAge(dateOfBirth) < AGE_THRESHOLDS.ADULT_MIN;
}

/**
 * Determine if user requires COPPA parental consent (under 13)
 */
export function requiresCOPPAConsent(dateOfBirth: string | Date): boolean {
  return calculateAge(dateOfBirth) < AGE_THRESHOLDS.COPPA_MIN;
}

/**
 * Get account type based on age
 */
export function getAccountType(dateOfBirth: string | Date): AccountType {
  const age = calculateAge(dateOfBirth);
  if (age < AGE_THRESHOLDS.COPPA_MIN) {
    return "supervised";
  }
  if (age < AGE_THRESHOLDS.ADULT_MIN) {
    return "minor";
  }
  return "standard";
}

/**
 * Get safety restrictions based on account type
 */
export function getSafetyRestrictions(
  accountType: AccountType
): SafetyRestrictions {
  switch (accountType) {
    case "supervised": // Under 13
      return {
        chatEnabled: true,
        chatRequiresFriendship: true,
        profilePublic: false,
        canSharePersonalInfo: false,
        canJoinParties: false,
        canPostLFG: false,
        canViewExplore: true,
        maxDailyChatMinutes: 60,
        contentFilterLevel: "strict",
        requiresParentalConsent: true,
      };
    case "minor": // 13-17
      return {
        chatEnabled: true,
        chatRequiresFriendship: false,
        profilePublic: true,
        canSharePersonalInfo: false,
        canJoinParties: true,
        canPostLFG: true,
        canViewExplore: true,
        maxDailyChatMinutes: 180,
        contentFilterLevel: "moderate",
        requiresParentalConsent: false,
      };
    case "standard": // 18+
    default:
      return {
        chatEnabled: true,
        chatRequiresFriendship: false,
        profilePublic: true,
        canSharePersonalInfo: true,
        canJoinParties: true,
        canPostLFG: true,
        canViewExplore: true,
        maxDailyChatMinutes: 0, // unlimited
        contentFilterLevel: "standard",
        requiresParentalConsent: false,
      };
  }
}

/**
 * Validate date of birth input
 * Returns error message or null if valid
 */
export function validateDateOfBirth(dateOfBirth: string): string | null {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  if (isNaN(dob.getTime())) {
    return "תאריך לידה לא תקין";
  }

  if (dob > today) {
    return "תאריך לידה לא יכול להיות בעתיד";
  }

  const age = calculateAge(dateOfBirth);

  if (age > 120) {
    return "תאריך לידה לא תקין";
  }

  if (age < 6) {
    return "גיל מינימלי להרשמה הוא 6";
  }

  return null;
}

/**
 * Generate a random consent token for parental verification
 */
export function generateConsentToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Extended profanity patterns for Hebrew + English
const PERSONAL_INFO_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
  /\b\d{9,10}\b/, // Israeli phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  /\b\d{5,}\b/, // Long number sequences (potential IDs)
  /(?:רחוב|כתובת|גר ב|דירה)\s+.{3,}/, // Hebrew address patterns
  /(?:street|address|live at|apt)\s+.{3,}/i, // English address patterns
];

/**
 * Check if message contains personal information
 */
export function containsPersonalInfo(text: string): boolean {
  return PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Filter personal information from text (replace with asterisks)
 */
export function filterPersonalInfo(text: string): string {
  let filtered = text;
  PERSONAL_INFO_PATTERNS.forEach((pattern) => {
    filtered = filtered.replace(pattern, (match) => "*".repeat(match.length));
  });
  return filtered;
}

/**
 * Enhanced content filter for different strictness levels
 */
export function filterContent(
  text: string,
  blockedWords: string[],
  level: "strict" | "moderate" | "standard"
): { filtered: string; wasFiltered: boolean; reasons: string[] } {
  let filtered = text;
  const reasons: string[] = [];

  // Always filter blocked words
  const lowerText = text.toLowerCase();
  blockedWords.forEach((word) => {
    if (lowerText.includes(word.toLowerCase())) {
      const regex = new RegExp(word, "gi");
      filtered = filtered.replace(regex, "*".repeat(word.length));
      reasons.push("blocked_word");
    }
  });

  // For strict and moderate: filter personal info
  if (
    (level === "strict" || level === "moderate") &&
    containsPersonalInfo(filtered)
  ) {
    filtered = filterPersonalInfo(filtered);
    reasons.push("personal_info");
  }

  // For strict: additional checks
  if (level === "strict") {
    // Filter URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    if (urlPattern.test(filtered)) {
      filtered = filtered.replace(urlPattern, "[קישור הוסר]");
      reasons.push("url_removed");
    }

    // Filter social media handles
    const socialPattern = /@[\w.]+/g;
    if (socialPattern.test(filtered)) {
      filtered = filtered.replace(socialPattern, "[שם משתמש הוסר]");
      reasons.push("social_handle_removed");
    }
  }

  return {
    filtered,
    wasFiltered: filtered !== text,
    reasons: [...new Set(reasons)],
  };
}

/**
 * Get age-appropriate safety message in Hebrew
 */
export function getSafetyMessage(accountType: AccountType): string {
  switch (accountType) {
    case "supervised":
      return "החשבון שלך מפוקח. חלק מהתכונות מוגבלות להגנתך. הורה או אפוטרופוס צריך לאשר את החשבון.";
    case "minor":
      return "אתה משתמש צעיר. סינון תוכן מוגבר פעיל להגנתך. אל תשתף מידע אישי עם זרים.";
    case "standard":
    default:
      return "";
  }
}
