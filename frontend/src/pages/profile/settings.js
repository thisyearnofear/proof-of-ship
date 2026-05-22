import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Card, Button, Breadcrumbs } from '@/components/common';
import { 
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  if (loading) return null;
  if (!currentUser) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Settings | Proof of Ship</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Profile', href: '/profile' },
          { label: 'Settings' }
        ]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
            Back
          </Button>
        </div>

        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <ArrowTopRightOnSquareIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Profile editing moved
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Display name, bio, social links, and avatar are now edited directly on your profile page.
          </p>
          <Button onClick={() => router.push('/profile')}>
            Go to profile
          </Button>
        </Card>
      </div>
    </div>
  );
}
