import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Card, StatCard, FeatureCard } from '@/components/common/Card';
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  CodeBracketIcon, 
  ArrowPathIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  DocumentMagnifyingGlassIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  const steps = [
    {
      title: "1. Get Your Score",
      description: "Link your GitHub and on-chain identity. Our scoring algorithm calculates your initial credit line based on commit history and delivery.",
      icon: DocumentMagnifyingGlassIcon,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "2. Get Backed",
      description: "Create project milestones. Backers place bets on your success, directly scaling your liquidity via our predictive credit market.",
      icon: CurrencyDollarIcon,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "3. Ship & Repay",
      description: "Deliver your milestones to unlock funding. Repay from your prize winnings or revenue to grow your reputation and credit terms.",
      icon: ArrowPathIcon,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const securityFeatures = [
    {
      title: "Smart Contract Audit",
      description: "Our contracts are open-source and have undergone community review for safety and efficiency.",
      icon: ShieldCheckIcon
    },
    {
      title: "Identity Verification",
      description: "We use Sybil-resistant identity linking via Farcaster and GitHub to ensure high-quality participation.",
      icon: CodeBracketIcon
    }
  ];

  return (
    <div className="py-12 space-y-16">
      <Head>
        <title>About | Builder Credit</title>
      </Head>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
          Empowering the World&apos;s <span className="text-primary-600">Builders</span>
        </h1>
        <p className="text-xl text-secondary">
          Builder Credit is the first predictive liquidity platform that turns 
          developer reputation into collateralized funding.
        </p>
      </section>

      {/* How It Works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">How It Works</h2>
          <p className="text-secondary mt-2 text-lg">The virtuous cycle of shipping and funding</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Card key={i} className="p-8 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-primary">{step.title}</h3>
              <p className="text-secondary leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust & Security */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-surface-secondary rounded-3xl p-8 md:p-12">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ShieldCheckIcon className="w-10 h-10 text-success-600" />
            Security First
          </h2>
          <p className="text-lg text-secondary">
            Building financial infrastructure requires unwavering trust. We&apos;ve built Builder Credit
            on the principles of transparency and security.
          </p>
          <div className="grid grid-cols-1 gap-6">
            {securityFeatures.map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-primary">{f.title}</h4>
                  <p className="text-secondary">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative aspect-square md:aspect-video bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-2xl flex items-center justify-center border border-primary-100 overflow-hidden">
            <div className="absolute inset-0 wave-pattern opacity-30"></div>
            <ShieldCheckIcon className="w-48 h-48 text-primary-600/20" />
            <div className="absolute bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-sm p-4 rounded-xl border border-default shadow-xl">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                    Smart Contract Security Rules Active
                </p>
            </div>
        </div>
      </section>

      {/* Community & Team */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">Ecosystem & Community</h2>
          <p className="text-secondary mt-2">Built with the support of leading web3 voyages</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 flex items-start gap-4">
            <GlobeAltIcon className="w-10 h-10 text-primary-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-primary mb-2">Network Partners</h3>
              <p className="text-secondary mb-4">
                Proudly supporting builders on Base, Linea, and Celo networks. 
                Integrating the best of the Ethereum L2 ecosystem.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-secondary text-primary text-xs font-semibold rounded-full border border-default">BASE</span>
                <span className="px-3 py-1 bg-surface-secondary text-primary text-xs font-semibold rounded-full border border-default">LINEA</span>
                <span className="px-3 py-1 bg-surface-secondary text-primary text-xs font-semibold rounded-full border border-default">CELO</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 flex items-start gap-4">
            <ChatBubbleLeftRightIcon className="w-10 h-10 text-secondary-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-primary mb-2">Join the Fleet</h3>
          <p className="text-secondary mb-4">
            Connect with us on Warpcast and Farcaster to discuss features, 
            get help, and find collaborators.
          </p>
              <a 
                href="https://warpcast.com/papa" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary-600 font-bold hover:underline"
              >
                Follow on Warpcast →
              </a>
            </div>
          </Card>
        </div>
      </section>

      {/* Transparency */}
      <section className="text-center py-12 border-t border-default">
        <h2 className="text-2xl font-bold text-primary mb-6 italic">Built in public. Verified onchain.</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="https://github.com/thisyearnofear/proof-of-ship" className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
            <CodeBracketIcon className="w-5 h-5" />
            GitHub Repository
          </a>
          <Link href="/explore" className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
            <DocumentMagnifyingGlassIcon className="w-5 h-5" />
            Project Explorer
          </Link>
          <a href="https://alfajores.celoscan.io/address/0x7890123456789012345678901234567890123456" className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
            <ShieldCheckIcon className="w-5 h-5" />
            Onchain Registry
          </a>
        </div>
      </section>
    </div>
  );
}
