import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNanopayment } from '@/contexts/NanopaymentContext';
import UserProfile from '@/components/Auth/UserProfile';
import TransactionFeed from '@/components/common/TransactionFeed';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const { isInitialized, balance, transactions } = useNanopayment();
  const router = useRouter();
  const [myProjects, setMyProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function fetchMyProjects() {
      setLoadingProjects(true);
      try {
        const { db } = await import('@/lib/firebase/clientApp');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'projects'), where('submittedBy', '==', currentUser.uid));
        const snap = await getDocs(q);
        if (!cancelled) {
          setMyProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.warn('Failed to load projects:', e);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }
    fetchMyProjects();
    return () => { cancelled = true; };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const totalSpent = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Your Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile + stats */}
        <div className="lg:col-span-2 space-y-6">
          <UserProfile />

          {/* My Projects */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                📦 My Projects
              </h2>
              <Link href="/build" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                + New Project
              </Link>
            </div>
            {loadingProjects ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : myProjects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">You haven&apos;t submitted any projects yet.</p>
                <Link href="/build" className="inline-block px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                  Submit Your First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myProjects.map((p) => (
                  <Link key={p.id} href={`/projects/${p.ecosystem}/${p.slug || p.id}`} className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.ecosystem} · {p.category}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.status || 'pending'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nanopayment Stats */}
          {isInitialized && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ⚡ Nanopayment Activity
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    ${parseFloat(balance?.available || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Available Balance
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total Queries
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    ${totalSpent.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total Spent
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: transaction feed */}
        <div className="space-y-6">
          <TransactionFeed maxItems={10} />
        </div>
      </div>
    </div>
  );
}
