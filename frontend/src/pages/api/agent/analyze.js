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
 *
 * Tracks: Tether Frontier Track ($10K)
 */

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

    // Project analysis
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
  strengths.push('Submitted to Proof of Ship platform');

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
