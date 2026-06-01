/**
 * useUserCreditScore — fetches the current user's credit score from
 * Firestore once. Returns null while loading or absent.
 */
import { useEffect, useState } from "react";

export default function useUserCreditScore(currentUser) {
  const [userScore, setUserScore] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function load() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (cancelled || !snap.exists()) return;
        const data = snap.data();
        if (data.creditScore || data.reputation) {
          setUserScore(data);
        }
      } catch { /* ignore */ }
    }
    load();
    return () => { cancelled = true; };
  }, [currentUser]);

  return userScore;
}
