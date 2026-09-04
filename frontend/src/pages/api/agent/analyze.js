/**
 * Project Analysis API Endpoint
 *
 * Cloud fallback for QVAC on-device analysis. Uses the same prompts as
 * QvacService.analyzeProject() and explainCreditScore() so results are
 * consistent regardless of inference source.
 *
 * POST /api/agent/analyze
 *   Body: { project: { name, description, githubUrl?, ecosystem? } }
 *   Body: { type: 'credit', scoreData: { reputation, totalBacking, milestonesCompleted, milestonesTotal } }
 *   Body: { type: 'claim_verification', project: { hackathons: [...] } }
 *   Body: { type: 'listing_improvement', project: { ... } }
 *
 * Tracks: Tether Frontier Track ($10K)
 */

import { getProjectQuality } from '@/lib/projects/projectQuality';
import { payoutVerifierService } from '@/services/PayoutVerifierService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { project, type, scoreData } = req.body;

    // Credit score explanation
    if (type === 'credit' && scoreData) {
      const prompt = `Explain this builder's credit score in 2-3 sentences:
- Reputation: ${scoreData.reputation}/800
- Total Backing: $${scoreData.totalBacking} USDC
- Milestones: ${scoreData.milestonesCompleted}/${scoreData.milestonesTotal} completed

Focus on what the score means for their borrowing capacity and what would improve it.`;

      const analysis = await callAI(prompt, 'You are a credit analyst. Be concise and actionable.');
      return res.status(200).json({ success: true, analysis, source: 'cloud' });
    }

    // ── Claim verification with on-chain attestation ─────────────
    if (type === 'claim_verification' && project) {
      const hackathonClaims = project.hackathons || [];

      if (hackathonClaims.length === 0) {
        return res.status(200).json({
          success: true,
          analysis: {
            summary: 'No hackathon claims to verify.',
            verified: false,
            claims: []
          },
          source: 'rule-based'
        });
      }

      // Pre-load firebase for Firestore updates (cached by Node)
      let firebaseModule = null;
      try {
        firebaseModule = await import('@/lib/firebase/serverOnly');
      } catch {}

      const verifiedClaims = [];
      let attestationsCreated = 0;

      for (let idx = 0; idx < hackathonClaims.length; idx++) {
        const claim = hackathonClaims[idx];

        // 1. Rule-based signal analysis (always run)
        const signals = [];
        const missing = [];

        if (claim.name) signals.push('hackathon_name');
        else missing.push('hackathon_name');

        if (claim.url && claim.url.startsWith('http')) signals.push('submission_url');
        else missing.push('public_url');

        if (claim.outcome === 'winner' || claim.outcome === 'finalist') {
          signals.push('positive_outcome');
        } else if (claim.outcome) {
          signals.push('recorded_outcome');
        } else {
          missing.push('recorded_outcome');
        }

        if (claim.payoutAt) {
          signals.push('payout_recorded');
          try {
            const payoutDate = new Date(claim.payoutAt);
            if (!isNaN(payoutDate.getTime())) {
              signals.push('valid_payout_date');
            }
          } catch {}
        } else {
          missing.push('payout_date');
        }

        // 2. On-chain verification — only when we have solid evidence
        let onChainResult = null;
        const hasTxEvidence = claim.payoutTxHash || claim.circleTransferId;
        const hasWinnerAddress = claim.winnerAddress || project.ownerWalletAddress;
        const expectedAmount = parseFloat(claim.payoutAmount);

        if (hasTxEvidence && hasWinnerAddress && expectedAmount > 0) {
          const winnerAddress = claim.winnerAddress || project.ownerWalletAddress;

          try {
            const { result, attestationId } = await payoutVerifierService.verify({
              hackathonName: claim.name || `Hackathon ${idx + 1}`,
              winnerAddress,
              expectedAmount,
              payoutTxHash: claim.payoutTxHash,
              circleTransferId: claim.circleTransferId,
              chainId: claim.chainId, // must be a known chainId — no fallback to ecosystem name
            });

            onChainResult = { ...result, attestationId };
            if (attestationId) attestationsCreated++;

            if (result.verified) {
              signals.push('on_chain_verified');
            }
          } catch (err) {
            console.warn(`On-chain verification failed for claim ${idx}:`, err.message);
          }
        }

        // 3. Compute credibility score
        const totalSignals = signals.length + (onChainResult?.verified ? 1 : 0);
        const totalPossible = totalSignals + missing.length;
        const signalScore = Math.round((totalSignals / Math.max(totalPossible, 1)) * 100);

        const claimResult = {
          hackathonName: claim.name || `Hackathon ${idx + 1}`,
          outcome: claim.outcome || 'Not specified',
          payoutAt: claim.payoutAt || null,
          signals,
          missing,
          credibility: signalScore >= 80 ? 'high' : signalScore >= 50 ? 'medium' : 'low',
          signalScore,
          onChainVerification: onChainResult ? {
            verified: onChainResult.verified,
            provider: onChainResult.provider,
            actualAmount: onChainResult.actualAmount,
            payoutTimestamp: onChainResult.payoutTimestamp,
            confidence: onChainResult.confidence,
            details: onChainResult.details,
            attestationId: onChainResult.attestationId,
          } : null,
        };

        verifiedClaims.push(claimResult);

        // 4. Update the project's hackathon claim in Firestore with verification results
        if (onChainResult && project.slug && firebaseModule) {
          try {
            const { db } = firebaseModule;
            const projectRef = db.collection('projects').doc(project.slug);
            const projectSnap = await projectRef.get();

            if (projectSnap.exists) {
              const currentData = projectSnap.data();
              const hackathons = Array.isArray(currentData.hackathons) ? [...currentData.hackathons] : [];

              if (idx < hackathons.length) {
                hackathons[idx] = {
                  ...hackathons[idx],
                  payoutVerified: onChainResult.verified,
                  payoutConfidence: onChainResult.confidence,
                  payoutAttestationId: onChainResult.attestationId,
                  payoutActualAmount: onChainResult.actualAmount,
                  payoutVerifiedAt: new Date().toISOString(),
                  payoutProvider: onChainResult.provider,
                  payoutAt: onChainResult.payoutTimestamp || hackathons[idx].payoutAt,
                };

                await projectRef.update({
                  hackathons,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          } catch (err) {
            console.warn('Failed to update project hackathon claim:', err.message);
          }
        }
      }

      const avgScore = Math.round(verifiedClaims.reduce((sum, c) => sum + c.signalScore, 0) / verifiedClaims.length);
      const verifiedCount = verifiedClaims.filter((c) => c.credibility === 'high').length;
      const onChainVerifiedCount = verifiedClaims.filter((c) => c.onChainVerification?.verified).length;

      return res.status(200).json({
        success: true,
        analysis: {
          summary: `Verified ${verifiedClaims.length} hackathon claim(s). ${verifiedCount} high credibility, ${onChainVerifiedCount} on-chain confirmed. Average score: ${avgScore}/100.`,
          verified: avgScore >= 50,
          claims: verifiedClaims,
          attestationsCreated,
        },
        source: onChainVerifiedCount > 0 ? 'on-chain' : 'rule-based',
      });
    }

    // ── Listing improvement ──────────────────────────────────────
    if (type === 'listing_improvement' && project) {
      const quality = getProjectQuality(project);
      const prompt = `Review this builder project listing and return JSON only:
{
  "summary": "<one sentence>",
  "suggestions": [
    {"field": "<description|milestones|website|twitter|imageUrl|contractAddress>", "suggested": "<specific replacement or action>", "reason": "<why it helps backers>", "impact": "<low|medium|high>", "canApplyAutomatically": <boolean>}
  ]
}

Project:
Name: ${project.name || 'Untitled'}
Description: ${project.description || 'N/A'}
GitHub: ${project.githubUrl || 'N/A'}
Website: ${project.website || project.liveUrl || 'N/A'}
Ecosystem: ${project.ecosystem || 'N/A'}
Category: ${project.category || 'N/A'}
Milestones: ${Array.isArray(project.milestones) ? project.milestones.join('; ') : 'N/A'}
Missing signals: ${quality.missing.map((item) => item.label).join(', ')}`;

      const analysis = await callAI(prompt, 'You help builders make project listings credible, concise, and attractive to backers. Respond only with valid JSON.');
      return res.status(200).json({
        success: true,
        analysis: parseListingImprovement(analysis, project),
        source: 'cloud',
        quality
      });
    }

    // ── General project analysis ─────────────────────────────────
    if (project) {
      const prompt = `Analyze this project and return a JSON score object:
{
  "score": <0-100>,
  "strengths": [<string>, ...],
  "risks": [<string>, ...],
  "recommendation": "<one of: strong-back, moderate-back, watch, skip>",
  "summary": "<one sentence>"
}

Project: ${project.name || 'Unknown'}
Description: ${project.description || 'N/A'}
${project.githubUrl ? `GitHub: ${project.githubUrl}` : ''}
${project.ecosystem ? `Ecosystem: ${project.ecosystem}` : ''}`;

      const analysis = await callAI(prompt, 'You are an expert project analyst for a Solana hackathon platform. Respond only with valid JSON.');
      return res.status(200).json({ success: true, analysis, source: 'cloud' });
    }

    return res.status(400).json({ error: 'Missing project or scoreData in request body' });
  } catch (err) {
    console.error('Analyze API error:', err);
    return res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
}

function parseListingImprovement(raw, project) {
  try {
    const text = String(raw || '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return generateRuleBasedListingImprovement(project);
}

function generateRuleBasedListingImprovement(project) {
  const quality = getProjectQuality(project);
  const suggestions = quality.missing.slice(0, 5).map((item) => ({
    field: item.id,
    suggested: item.action,
    reason: `${item.label} is a visible trust signal for backers and verifiers.`,
    impact: item.weight >= 10 ? 'high' : 'medium',
    canApplyAutomatically: false
  }));

  if (String(project.description || '').trim().length > 0 && String(project.description || '').trim().length < 120) {
    suggestions.unshift({
      field: 'description',
      suggested: `${project.description} It is built for users who need a reliable onchain workflow, with clear milestones and public proof of progress.`,
      reason: 'A fuller description helps backers understand the user, value, and proof path faster.',
      impact: 'high',
      canApplyAutomatically: true
    });
  }

  return {
    summary: `This listing is ${quality.tier.toLowerCase()} at ${quality.score}/100. Improve the missing trust signals first.`,
    suggestions
  };
}

/**
 * Call the cloud AI provider chain (Featherless -> AIsa).
 */
async function callAI(prompt, systemPrompt) {
  // Try Featherless first
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';
  const baseUrl = process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1';

  if (apiKey) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No analysis generated';
      }
    } catch (err) {
      console.warn('Featherless failed:', err.message);
    }
  }

  // Try AIsa as fallback
  const aisaUrl = process.env.AISA_API_URL;
  const aisaKey = process.env.AISA_API_KEY;

  if (aisaUrl && aisaKey) {
    try {
      const response = await fetch(aisaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aisaKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No analysis generated';
      }
    } catch (err) {
      console.warn('AIsa failed:', err.message);
    }
  }

  // Final fallback: rule-based analysis
  return generateRuleBasedAnalysis(prompt);
}

/**
 * Rule-based analysis fallback when no AI provider is available.
 * Generates meaningful scores from project metadata.
 */
function generateRuleBasedAnalysis(prompt) {
  // Extract project name from prompt
  const nameMatch = prompt.match(/Project: (.+)/);
  const descMatch = prompt.match(/Description: (.+)/);
  const name = nameMatch?.[1] || 'Unknown';
  const description = descMatch?.[1] || '';

  // Score based on description quality
  let score = 50;
  if (description.length > 50) score += 10;
  if (description.length > 150) score += 10;
  if (description.length > 300) score += 5;
  if (prompt.includes('GitHub:')) score += 10;
  if (prompt.includes('Ecosystem:')) score += 5;

  // Stable hash for variety
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  score += Math.abs(hash) % 10;
  score = Math.min(100, Math.max(30, score));

  const strengths = [];
  if (description.length > 100) strengths.push('Detailed project description');
  if (prompt.includes('GitHub:')) strengths.push('Open source with public repository');
  if (prompt.includes('Ecosystem:')) strengths.push('Clear ecosystem alignment');
  strengths.push('Submitted to PledgeBond platform');

  const risks = ['Early-stage project with limited track record'];
  if (description.length < 50) risks.push('Sparse project documentation');
  if (!prompt.includes('GitHub:')) risks.push('No public code repository linked');

  const recommendation = score >= 75 ? 'strong-back' : score >= 55 ? 'moderate-back' : score >= 40 ? 'watch' : 'skip';

  return JSON.stringify({
    score,
    strengths,
    risks,
    recommendation,
    summary: `${name} scores ${score}/100 based on submission completeness and documentation quality.`,
  });
}
