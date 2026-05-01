import React from 'react';
import { Card } from '@/components/common/Card';
import ScoreBar from '@/components/common/ScoreBar';
import Button from '@/components/common/Button';
import { useScorePreview } from '@/hooks/useScorePreview';

export default function ScorePreviewCard({
  compact = false,
  onGetStarted,
  className = '',
}) {
  const { username, setUsername, result, error, loading, submit } = useScorePreview();

  return (
    <div className={className}>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-default bg-surface text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={!username.trim() || loading}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-3 text-sm font-semibold whitespace-nowrap"
        >
          {loading ? '...' : '🔍 Preview'}
        </Button>
      </form>

      {result && (
        <Card className="mt-4 p-4 text-left border border-default bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-secondary">Estimated Credit Score</p>
              <p className="text-2xl font-bold text-primary">{result.estimatedScore}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              result.estimatedScore >= 700 ? 'bg-success-50 text-success-700' :
              result.estimatedScore >= 550 ? 'bg-warning-50 text-warning-700' :
              'bg-surface-secondary text-secondary'
            }`}>
              {result.tier}
            </span>
          </div>
          <ScoreBar score={result.estimatedScore} />
          <div className="flex justify-between text-xs text-secondary mt-1 mb-3">
            <span>400</span><span>550</span><span>700</span><span>850</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
            <span>📦 {result.stats.publicRepos} repos</span>
            <span>⭐ {result.stats.totalStars} stars</span>
          </div>
          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="mt-3 w-full text-center text-sm font-semibold text-primary hover:text-primary-600"
            >
              Connect to unlock your full credit profile →
            </button>
          )}
        </Card>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
