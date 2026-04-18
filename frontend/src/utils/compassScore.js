/**
 * Calculates the Compass Score for a backer based on their ROI history.
 * 
 * ROI History is an array of objects:
 * {
 *   projectId: string,
 *   amountStaked: number,
 *   amountReturned: number,
 *   timestamp: string
 * }
 * 
 * Compass Score is a value from 0 to 1000, where:
 * - 0-300: Novice Scout
 * - 301-600: Reliable Navigator
 * - 601-850: Master Explorer
 * - 851-1000: Legendary Captain
 */
export const calculateCompassScore = (roiHistory) => {
  if (!roiHistory || roiHistory.length === 0) {
    return 400; // Base score for new backers
  }

  let totalStaked = 0;
  let totalReturned = 0;
  let successCount = 0;

  roiHistory.forEach(entry => {
    totalStaked += entry.amountStaked;
    totalReturned += entry.amountReturned;
    if (entry.amountReturned > entry.amountStaked) {
      successCount++;
    }
  });

  const overallROI = totalStaked > 0 ? totalReturned / totalStaked : 1;
  const successRate = roiHistory.length > 0 ? successCount / roiHistory.length : 0;

  // Base score from ROI (max 600 points)
  // 1x ROI = 300 points, 2x ROI = 500 points, 3x+ ROI = 600 points
  let roiPoints = 0;
  if (overallROI >= 3) roiPoints = 600;
  else if (overallROI >= 2) roiPoints = 500 + (overallROI - 2) * 100;
  else if (overallROI >= 1) roiPoints = 300 + (overallROI - 1) * 200;
  else roiPoints = overallROI * 300;

  // Success rate points (max 300 points)
  const successPoints = successRate * 300;

  // Consistency points (max 100 points)
  // More projects backed = more reliable score
  const consistencyPoints = Math.min(100, roiHistory.length * 10);

  const totalScore = Math.min(1000, Math.round(roiPoints + successPoints + consistencyPoints));
  
  return totalScore;
};

export const getCompassTier = (score) => {
  if (score >= 851) return { name: "Legendary Captain", color: "text-purple-600", icon: "👑" };
  if (score >= 601) return { name: "Master Explorer", color: "text-indigo-600", icon: "🔭" };
  if (score >= 301) return { name: "Reliable Navigator", color: "text-blue-600", icon: "🧭" };
  return { name: "Novice Scout", color: "text-slate-600", icon: "🛶" };
};
