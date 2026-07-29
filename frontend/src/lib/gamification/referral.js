/**
 * Referral Service
 *
 * Lightweight referral attribution: generates invite links, stores
 * referrals in Firestore, and awards XP bonus to referrers.
 *
 * Referral flow:
 *   1. Builder shares /ref/<code> link (code = their username or UID hash)
 *   2. New user visits, referral code stored in localStorage
 *   3. On signup, referral is recorded in Firestore `referrals` collection
 *   4. Referrer gets +150 XP bonus (added to their XP via activity log)
 */

const REFERRAL_BONUS_XP = 150;
const REFERRAL_STORAGE_KEY = "pos_referral_code";

/**
 * Generate a referral code from a username or UID.
 * Uses a short hash for privacy (not the raw UID).
 */
export function generateReferralCode(identifier) {
  if (!identifier) return null;
  const str = String(identifier).toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `ref_${Math.abs(hash).toString(36).slice(0, 8)}`;
}

/**
 * Build a referral URL for sharing.
 */
export function buildReferralUrl(identifier, baseUrl = "") {
  const code = generateReferralCode(identifier);
  if (!code) return null;
  const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://proofofship.web.app");
  return `${origin}/ref/${code}`;
}

/**
 * Store a referral code from the URL (client-side, called on page load).
 * The code is picked up during signup to attribute the referral.
 */
export function storeReferralCode(code) {
  if (!code || typeof window === "undefined" || !window.localStorage) return;
  try {
    // Don't overwrite if already set (first-touch wins)
    const existing = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!existing) {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    }
  } catch { /* noop */ }
}

/**
 * Get the stored referral code (called during signup).
 */
export function getStoredReferralCode() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(REFERRAL_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Clear the stored referral code (after attribution).
 */
export function clearStoredReferralCode() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch { /* noop */ }
}

export { REFERRAL_BONUS_XP, REFERRAL_STORAGE_KEY };
