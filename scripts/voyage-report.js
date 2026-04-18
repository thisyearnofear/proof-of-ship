const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'proofofship',
  });
}

const db = admin.firestore();

async function getWeeklyStats() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString();

  const stats = {
    newProjects: 0,
    newLogs: 0,
    newMilestones: 0,
    totalPayouts: 0,
  };

  // New projects
  const projectsSnap = await db.collection('projects')
    .where('createdAt', '>=', oneWeekAgoStr)
    .get();
  stats.newProjects = projectsSnap.size;

  // New logs
  const logsSnap = await db.collection('ships_logs')
    .where('timestamp', '>=', oneWeekAgoStr)
    .get();
  stats.newLogs = logsSnap.size;

  // New activities (for milestones and payouts)
  const activitiesSnap = await db.collection('activities')
    .where('timestamp', '>=', oneWeekAgoStr)
    .get();
  
  activitiesSnap.forEach(doc => {
    const data = doc.data();
    if (data.type === 'milestone_verified') {
      stats.newMilestones++;
    }
    if (data.amount) {
      stats.totalPayouts += data.amount;
    }
  });

  return stats;
}

async function sendVoyageReport() {
  const stats = await getWeeklyStats();
  const apiKey = process.env.HYPERSNAP_API_KEY;

  if (!apiKey) {
    console.error('HYPERSNAP_API_KEY not configured');
    return;
  }

  const title = "🚢 Your Weekly Voyage Report";
  const body = `This week in the fleet:
🚀 ${stats.newProjects} new ships launched
📝 ${stats.newLogs} logs posted
🏁 ${stats.newMilestones} milestones reached
💰 ${stats.totalPayouts} USDC distributed

Keep shipping!`;

  // Get all users with Farcaster FID and notifications enabled
  const usersSnap = await db.collection('users')
    .where('notificationsEnabled', '==', true)
    .get();

  console.log(`Sending report to ${usersSnap.size} users...`);

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (userData.farcasterFid) {
      try {
        const response = await fetch('https://api.hypersnap.xyz/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            fid: userData.farcasterFid,
            notification: {
              title,
              body
            }
          })
        });

        if (response.ok) {
          console.log(`Sent to FID ${userData.farcasterFid}`);
        } else {
          console.error(`Failed to send to FID ${userData.farcasterFid}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error sending to FID ${userData.farcasterFid}:`, error);
      }
    }
  }
}

sendVoyageReport()
  .then(() => console.log('Voyage Report process completed'))
  .catch(err => console.error('Error in Voyage Report:', err));
