import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Card, Button, Input, Breadcrumbs } from '@/components/common';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  WalletIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { currentUser, userProfile, loading } = useUser();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    notifications: {
      marketing: true,
      updates: true,
      security: true
    }
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        displayName: userProfile.displayName || '',
        email: userProfile.email || ''
      }));
    }
  }, [userProfile]);

  if (loading) return null;
  if (!currentUser) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleSave = () => {
    // Save logic here
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Head>
        <title>Settings | Proof of Ship</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Profile', href: '/profile' },
          { label: 'Settings' }
        ]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Settings</h1>
          <Button variant="ghost" onClick={() => router.back()} leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-2">
            <SettingsTab icon={UserIcon} label="Account" active />
            <SettingsTab icon={BellIcon} label="Notifications" />
            <SettingsTab icon={ShieldCheckIcon} label="Security" />
            <SettingsTab icon={WalletIcon} label="Wallet Connect" />
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-primary mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Display Name</label>
                    <Input 
                      value={formData.displayName} 
                      onChange={e => setFormData({...formData, displayName: e.target.value})}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Email Address</label>
                    <Input 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="your@email.com"
                      disabled
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-primary mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <ToggleRow 
                  label="Product Updates" 
                  description="Receive news about new features and improvements."
                  checked={formData.notifications.updates}
                />
                <ToggleRow 
                  label="Security Alerts" 
                  description="Get notified about important security updates for your account."
                  checked={formData.notifications.security}
                />
                <ToggleRow 
                  label="Marketing" 
                  description="Receive promotional offers and newsletters."
                  checked={formData.notifications.marketing}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active }) {
  return (
    <button className={`
      flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all
      ${active 
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
        : 'text-secondary hover:bg-surface-hover hover:text-primary'}
    `}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function ToggleRow({ label, description, checked }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-primary">{label}</p>
        <p className="text-xs text-secondary">{description}</p>
      </div>
      <div className={`
        w-11 h-6 rounded-full relative transition-colors cursor-pointer
        ${checked ? 'bg-primary-500' : 'bg-gray-200'}
      `}>
        <div className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `} />
      </div>
    </div>
  );
}
