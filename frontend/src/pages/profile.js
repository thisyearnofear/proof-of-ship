import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useNanopayment } from '@/contexts/NanopaymentContext';
import UserProfile from '@/components/Auth/UserProfile';
import TransactionFeed from '@/components/common/TransactionFeed';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const { isInitialized, balance, transactions } = useNanopayment();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile');
    }
  }, [currentUser, loading, router]);

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
