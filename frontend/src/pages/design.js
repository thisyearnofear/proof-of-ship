import React from 'react';
import Head from 'next/head';
import { 
  Button, 
  Card, 
  Input, 
  ThemeToggle, 
  TabBar,
  CircularProgress,
  LoadingSpinner,
  Icon,
  Breadcrumbs
} from '@/components/common';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface-secondary pb-20">
      <Head>
        <title>Design System | Proof of Ship</title>
      </Head>

      <div className="bg-surface border-b border-default mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-primary mb-2">Design System</h1>
              <p className="text-lg text-secondary">
                A collection of reusable components and styles for the Proof of Ship platform.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Colors Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">🎨</span>
            Colors & Palettes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch label="Primary" color="bg-primary-500" hex="#3b82f6" />
            <ColorSwatch label="Secondary" color="bg-secondary-500" hex="#a855f7" />
            <ColorSwatch label="Success" color="bg-success-500" hex="#22c55e" />
            <ColorSwatch label="Warning" color="bg-warning-500" hex="#f59e0b" />
            <ColorSwatch label="Error" color="bg-error-500" hex="#ef4444" />
            <ColorSwatch label="Surface" color="bg-white dark:bg-gray-800" hex="#ffffff" border />
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">Aa</span>
            Typography
          </h2>
          <Card className="p-8 space-y-6">
            <div className="border-b border-default pb-4">
              <h1 className="text-4xl font-extrabold text-primary">Heading 1 - 4xl Extrabold</h1>
              <p className="text-xs text-secondary mt-1">Inter / 36px / 40px Leading</p>
            </div>
            <div className="border-b border-default pb-4">
              <h2 className="text-3xl font-bold text-primary">Heading 2 - 3xl Bold</h2>
              <p className="text-xs text-secondary mt-1">Inter / 30px / 36px Leading</p>
            </div>
            <div className="border-b border-default pb-4">
              <h3 className="text-2xl font-semibold text-primary">Heading 3 - 2xl Semibold</h3>
              <p className="text-xs text-secondary mt-1">Inter / 24px / 32px Leading</p>
            </div>
            <div>
              <p className="text-base text-secondary">
                Body Text - Base. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. 
                Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.
              </p>
              <p className="text-xs text-secondary mt-1">Inter / 16px / 24px Leading</p>
            </div>
          </Card>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">🔘</span>
            Buttons
          </h2>
          <Card className="p-8">
            <div className="flex flex-wrap gap-4 mb-8">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Card>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm">🗂️</span>
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-lg font-bold mb-2">Standard Card</h4>
              <p className="text-secondary mb-4">
                Used for content grouping and layout structures. Supports hover effects and various padding tokens.
              </p>
              <Button variant="outline" size="sm">Learn More</Button>
            </Card>
            <Card className="p-6 border-primary-200 bg-primary-50/30">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-5 h-5 text-primary-500" />
                <h4 className="text-lg font-bold text-primary-900">Featured Card</h4>
              </div>
              <p className="text-primary-800 mb-4">
                Highlighted content with custom background and border treatments to draw user attention.
              </p>
              <Button size="sm" className="bg-primary-600">Get Started</Button>
            </Card>
          </div>
        </section>

        {/* Feedback Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">💬</span>
            Feedback & Indicators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center text-center">
              <CircularProgress value={75} size={80} className="mb-4 text-primary-500" />
              <h4 className="font-bold">Progress</h4>
              <p className="text-xs text-secondary">Circular indicators for scores and status.</p>
            </Card>
            <Card className="p-6 flex flex-col items-center text-center">
              <LoadingSpinner size="lg" className="mb-4 text-secondary-500" />
              <h4 className="font-bold">Loading</h4>
              <p className="text-xs text-secondary">Smooth animations for background tasks.</p>
            </Card>
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-success-600 bg-success-50 p-2 rounded-lg text-sm">
                <CheckCircleIcon className="w-5 h-5" />
                Success Message
              </div>
              <div className="flex items-center gap-2 text-error-600 bg-error-50 p-2 rounded-lg text-sm">
                <XCircleIcon className="w-5 h-5" />
                Error Message
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({ label, color, hex, border }) {
  return (
    <div className="space-y-2">
      <div className={`h-24 w-full rounded-xl shadow-inner ${color} ${border ? 'border border-default' : ''}`} />
      <div>
        <p className="text-sm font-bold text-primary">{label}</p>
        <p className="text-xs text-secondary font-mono">{hex}</p>
      </div>
    </div>
  );
}
