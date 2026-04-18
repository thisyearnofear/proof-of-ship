import { db } from "../lib/firebase/adminApp";

/**
 * Logs an activity to the global engagement feed.
 * 
 * @param {Object} activity - The activity data
 * @param {string} activity.type - 'project_submitted', 'milestone_verified', 'payout_processed', 'stake_added'
 * @param {string} activity.projectSlug - Slug of the project
 * @param {string} activity.projectName - Name of the project
 * @param {string} activity.userHandle - Handle or name of the user involved
 * @param {string} activity.description - Description of the activity
 * @param {number} [activity.amount] - Optional amount (e.g. payout or stake)
 * @param {string} [activity.ecosystem] - Ecosystem associated with the project
 * @param {Object} [activity.metadata] - Additional metadata
 */
export const logActivity = async (activity) => {
  try {
    const activityDoc = {
      ...activity,
      timestamp: new Date().toISOString(),
    };
    
    // Add to global activities collection
    await db.collection("activities").add(activityDoc);
    
    // Also optionally update a 'latest_activity' field on the project itself
    if (activity.projectSlug) {
      await db.collection("projects").doc(activity.projectSlug).set({
        lastActivityAt: activityDoc.timestamp,
        lastActivityType: activity.type
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error("Error logging activity:", error);
    return false;
  }
};
