import { db, auth } from '../../../lib/firebase/serverOnly';

export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      return handleStatus(req, res);
    case "POST":
      return handleClaim(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleStatus(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const uid = decodedToken.uid;

  const winnerDoc = await db.collection('hackathonWinners').doc(uid).get();

  if (winnerDoc.exists) {
    const data = winnerDoc.data();
    return res.status(200).json({
      verified: true,
      wins: data.wins || [],
      totalWins: data.totalWins || 0,
      lastVerifiedAt: data.lastVerifiedAt || null,
      hasPendingClaim: false,
    });
  }

  let queuePosition = null;
  let totalPending = 0;

  try {
    const allPendingSnap = await db
      .collection('winnerClaims')
      .where('status', '==', 'pending')
      .orderBy('submittedAt', 'asc')
      .get();

    totalPending = allPendingSnap.size;
    const idx = allPendingSnap.docs.findIndex(d => d.data().uid === uid);
    if (idx >= 0) queuePosition = idx + 1;
  } catch {
  }

  const claimsSnap = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!claimsSnap.empty) {
    const claim = claimsSnap.docs[0].data();
    return res.status(200).json({
      verified: false,
      wins: [],
      hasPendingClaim: true,
      queuePosition,
      totalPending,
      pendingClaim: {
        id: claimsSnap.docs[0].id,
        hackathonName: claim.hackathonName,
        submittedAt: claim.submittedAt,
        email: claim.email || null,
        wantsCall: Boolean(claim.wantsCall),
      },
    });
  }

  const rejectedSnap = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'rejected')
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (!rejectedSnap.empty) {
    const claim = rejectedSnap.docs[0].data();
    return res.status(200).json({
      verified: false,
      wins: [],
      hasPendingClaim: false,
      rejectedClaim: {
        id: rejectedSnap.docs[0].id,
        hackathonName: claim.hackathonName,
        reason: claim.rejectionReason || null,
        rejectedAt: claim.updatedAt,
      },
    });
  }

  return res.status(200).json({
    verified: false,
    wins: [],
    hasPendingClaim: false,
  });
}

async function handleClaim(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const uid = decodedToken.uid;
  const { hackathonName, announcementUrl, githubRepo, outcome, email, telegram, wantsCall } = req.body;

  if (!hackathonName || !hackathonName.trim()) {
    return res.status(400).json({ error: 'Hackathon name is required' });
  }

  if (!announcementUrl || !announcementUrl.trim()) {
    return res.status(400).json({ error: 'Announcement URL is required' });
  }

  if (!githubRepo || !githubRepo.trim()) {
    return res.status(400).json({ error: 'GitHub repo URL is required' });
  }

  if (!['winner', 'finalist'].includes(outcome)) {
    return res.status(400).json({ error: 'Outcome must be "winner" or "finalist"' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required for verification notification' });
  }

  const existingClaims = await db
    .collection('winnerClaims')
    .where('uid', '==', uid)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingClaims.empty) {
    return res.status(409).json({
      error: 'You already have a pending claim. Please wait for the founder to review it.',
    });
  }

  const winnerDoc = await db.collection('hackathonWinners').doc(uid).get();
  if (winnerDoc.exists) {
    return res.status(409).json({
      error: 'You are already verified as a hackathon winner.',
    });
  }

  const now = new Date().toISOString();
  const claimRef = await db.collection('winnerClaims').add({
    uid,
    hackathonName: hackathonName.trim(),
    announcementUrl: announcementUrl.trim(),
    githubRepo: githubRepo.trim(),
    outcome,
    email: email.trim(),
    telegram: telegram || null,
    wantsCall: Boolean(wantsCall),
    status: 'pending',
    submittedAt: now,
    updatedAt: now,
  });

  await db.collection('users').doc(uid).set(
    {
      email: email.trim(),
      telegram: telegram || null,
      wantsCall: Boolean(wantsCall),
      winnerClaimPending: true,
      winnerClaimId: claimRef.id,
      winnerClaimSubmittedAt: now,
    },
    { merge: true }
  );

  return res.status(201).json({
    success: true,
    claimId: claimRef.id,
  });
}
