/**
 * Agent Result Cache
 * 
 * Caches AI agent results in Firestore to avoid redundant API calls.
 * Shows "Last analyzed: X ago" with a "Re-analyze" option.
 * Cache TTL: 1 hour for underwrite/verify, 30 min for scout.
 */
import { db } from "@/lib/firebase/adminApp";

const CACHE_TTL = {
  underwrite: 60 * 60 * 1000,  // 1 hour
  scout: 30 * 60 * 1000,       // 30 min
  verify: 60 * 60 * 1000,      // 1 hour
  chat: 0,                      // never cache chat
};

function getCacheKey(agentType, params) {
  const parts = [agentType];
  if (params.projectId) parts.push(params.projectId);
  if (params.prId) parts.push(params.prId);
  if (params.ecosystem) parts.push(params.ecosystem);
  return parts.join(":");
}

/**
 * Get cached agent result if fresh enough.
 * @returns {{ data: object, cachedAt: string, age: number } | null}
 */
export async function getCachedResult(agentType, params = {}) {
  const ttl = CACHE_TTL[agentType];
  if (!ttl) return null;

  const key = getCacheKey(agentType, params);

  try {
    const doc = await db.collection("agentCache").doc(key).get();
    if (!doc.exists) return null;

    const cached = doc.data();
    const age = Date.now() - cached.cachedAt;

    if (age > ttl) return null;

    return {
      data: cached.result,
      cachedAt: new Date(cached.cachedAt).toISOString(),
      ageMs: age,
      ageHuman: formatAge(age),
    };
  } catch (err) {
    console.warn("Cache read failed:", err.message);
    return null;
  }
}

/**
 * Store agent result in cache.
 */
export async function setCachedResult(agentType, params, result) {
  const ttl = CACHE_TTL[agentType];
  if (!ttl) return;

  const key = getCacheKey(agentType, params);

  try {
    await db.collection("agentCache").doc(key).set({
      agentType,
      params,
      result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  } catch (err) {
    console.warn("Cache write failed:", err.message);
  }
}

function formatAge(ms) {
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}
