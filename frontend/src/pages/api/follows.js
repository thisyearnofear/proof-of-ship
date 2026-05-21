/**
 * Follows API — Toggle follow, check status, and read follower/following lists
 * 
 * POST /api/follows   — Toggle follow (requires auth, body: { targetUserId })
 * GET  /api/follows?targetUserId=X — Check follow status for current user
 * GET  /api/follows?userId=X&type=followers — List followers of a user
 * GET  /api/follows?userId=X&type=following — List who a user follows
 */

import { db, auth } from "../../lib/firebase/serverOnly";
import { verifyAuth, withApiMiddleware } from "../../utils/apiMiddleware";
import { logActivity } from "../../utils/activityLogger";

/**
 * Activity types logged to follow_events:
 * - follow   : someone started following a builder
 * - unfollow : someone stopped following a builder
 */

async function handler(req, res) {
  try {
    switch (req.method) {
      case "POST":
        return handleToggleFollow(req, res);
      case "GET":
        return handleGetFollows(req, res);
      // Default case handled by withApiMiddleware
    }
  } catch (error) {
    console.error("Follows API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withApiMiddleware(handler, {
  allowedMethods: ["GET", "POST"],
  rateLimit: 15,
  rateLimitKey: "FOLLOWS",
});

/**
 * POST — Toggle follow relationship
 */
async function handleToggleFollow(req, res) {
  let userId;
  try {
    userId = await verifyAuth(req, auth);
  } catch {
    return res.status(401).json({ error: "Authentication required to follow" });
  }

  const { targetUserId } = req.body || {};
  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "targetUserId is required" });
  }

  if (userId === targetUserId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  // Verify target user exists
  const targetSnap = await db.collection("users").doc(targetUserId).get();
  if (!targetSnap.exists) {
    return res.status(404).json({ error: "User not found" });
  }

  const followDocId = `${userId}_${targetUserId}`;
  const followRef = db.collection("follows").doc(followDocId);
  const followSnap = await followRef.get();

  let following;

  if (followSnap.exists) {
    // Unfollow
    await followRef.delete();
    following = false;
  } else {
    // Follow
    await followRef.set({
      followerId: userId,
      followedId: targetUserId,
      createdAt: new Date().toISOString(),
    });
    following = true;
  }    // Log follow/unfollow event for activity feed
    try {
      const followerSnap = await db.collection("users").doc(userId).get();
      const followerData = followerSnap.data() || {};
      await db.collection("follow_events").add({
        type: following ? "follow" : "unfollow",
        followerId: userId,
        followedId: targetUserId,
        followerDisplayName: followerData.displayName || null,
        followerGithubUsername: followerData.githubUsername || null,
        followerPhotoURL: followerData.photoURL || null,
        createdAt: new Date().toISOString(),
      });

      // Also log to the global activities collection (shown on homepage feed)
      const followerName = followerData.displayName || followerData.githubUsername || "Someone";
      await logActivity({
        type: following ? "follow" : "unfollow",
        userHandle: followerName,
        description: following
          ? `Started following a builder`
          : `Unfollowed a builder`,
        metadata: {
          followerId: userId,
          followedId: targetUserId,
          followerPhotoURL: followerData.photoURL || null,
        },
      });
    } catch (logErr) {
      // Don't fail the follow operation if activity logging fails
      console.error("Failed to log follow event:", logErr);
    }

    // Return updated follower count
    const followersSnapshot = await db
      .collection("follows")
      .where("followedId", "==", targetUserId)
      .count()
      .get();

    const followerCount = followersSnapshot.data().count;

    return res.status(200).json({
      following,
      followerCount,
    });
}

/**
 * GET — Check follow status, list followers, or list following
 */
async function handleGetFollows(req, res) {
  const { targetUserId, userId, type } = req.query;

  // Check follow status for authenticated user
  if (targetUserId) {
    let currentUserId;
    try {
      currentUserId = await verifyAuth(req, auth);
    } catch {
      return res.status(200).json({ following: false, followerCount: 0 });
    }

    const followDocId = `${currentUserId}_${targetUserId}`;
    const followSnap = await db.collection("follows").doc(followDocId).get();

    // Count followers
    const followersSnapshot = await db
      .collection("follows")
      .where("followedId", "==", targetUserId)
      .count()
      .get();

    return res.status(200).json({
      following: followSnap.exists,
      followerCount: followersSnapshot.data().count,
    });
  }

  // List followers
  if (userId && type === "followers") {
    // Note: sorted client-side to avoid requiring a composite Firestore index
    const snapshot = await db
      .collection("follows")
      .where("followedId", "==", userId)
      .limit(50)
      .get();

    let followers = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const userSnap = await db.collection("users").doc(data.followerId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        followers.push({
          uid: data.followerId,
          githubUsername: userData.githubUsername || null,
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null,
          followedAt: data.createdAt,
        });
      }      }

    // Sort by followedAt descending
    followers.sort((a, b) => String(b.followedAt || "").localeCompare(String(a.followedAt || "")));

    return res.status(200).json({ followers });
  }

  // List following
  if (userId && type === "following") {
    // Note: sorted client-side to avoid requiring a composite Firestore index
    const snapshot = await db
      .collection("follows")
      .where("followerId", "==", userId)
      .limit(50)
      .get();

    let following = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const userSnap = await db.collection("users").doc(data.followedId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        following.push({
          uid: data.followedId,
          githubUsername: userData.githubUsername || null,
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null,
          followedAt: data.createdAt,
        });
      }      }

    // Sort by followedAt descending
    following.sort((a, b) => String(b.followedAt || "").localeCompare(String(a.followedAt || "")));

    return res.status(200).json({ following });
  }

  return res.status(400).json({ error: "Invalid query parameters" });
}
