/**
 * QVAC Local-First AI Service
 *
 * Provides on-device AI inference via Tether's QVAC SDK as a privacy-preserving
 * alternative to cloud-based AI providers. When QVAC is available, analysis runs
 * locally — project data never leaves the user's device. Falls back to the
 * existing cloud provider chain (Featherless -> AIsa) when QVAC isn't installed.
 *
 * Tracks: Tether Frontier Track ($10K)
 *
 * QVAC SDK installation (required for local inference):
 *   npm install @qvac/sdk
 *
 * The SDK includes native GPU inference engines (~500MB) for Vulkan/Metal.
 * It auto-downloads models on first use via loadModel().
 */

export interface QvacCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export interface QvacCompletionResult {
  text: string;
  source: 'qvac-local' | 'cloud-fallback';
  modelId?: string;
}

export interface QvacStatus {
  available: boolean;
  modelLoaded: boolean;
  modelId: string | null;
  error?: string;
}

// Lazy-loaded QVAC module reference
let qvacModule: any = null;
let loadedModelId: string | null = null;

class QvacService {
  private initialized = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Check if QVAC SDK is available and can load models.
   * Returns status without attempting a full model load.
   */
  async getStatus(): Promise<QvacStatus> {
    try {
      const mod = await this.loadModule();
      if (!mod) {
        return { available: false, modelLoaded: false, modelId: null, error: 'QVAC SDK not installed' };
      }
      return {
        available: true,
        modelLoaded: loadedModelId !== null,
        modelId: loadedModelId,
      };
    } catch (err: any) {
      return { available: false, modelLoaded: false, modelId: null, error: err.message };
    }
  }

  /**
   * Initialize QVAC by loading a lightweight LLM model.
   * Uses Llama 3.2 1B (Q4_0 quantized) — small enough for any device,
   * good enough for project scoring and analysis tasks.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized && loadedModelId) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<boolean> {
    try {
      const mod = await this.loadModule();
      if (!mod) return false;

      const modelId = await mod.loadModel({
        modelSrc: mod.LLAMA_3_2_1B_INST_Q4_0,
        modelType: 'llm',
        onProgress: (progress: any) => {
          if (progress.status === 'ready') {
            loadedModelId = modelId;
          }
        },
      });

      loadedModelId = modelId;
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn('[QVAC] Failed to initialize:', err);
      this.initPromise = null;
      return false;
    }
  }

  /**
   * Generate a completion locally using QVAC.
   * Returns the result with source='qvac-local' on success.
   * Throws if QVAC is not available — caller should fall back to cloud.
   */
  async complete(request: QvacCompletionRequest): Promise<QvacCompletionResult> {
    if (!loadedModelId) {
      const ok = await this.initialize();
      if (!ok) throw new Error('QVAC not available');
    }

    const mod = await this.loadModule();
    if (!mod || !loadedModelId) throw new Error('QVAC not available');

    const history = [
      ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
      { role: 'user' as const, content: request.prompt },
    ];

    const result = mod.completion({
      modelId: loadedModelId,
      history,
      stream: false,
    });

    // Non-streaming returns full text
    const text = typeof result === 'string' ? result : result.text || '';

    return {
      text,
      source: 'qvac-local',
      modelId: loadedModelId,
    };
  }

  /**
   * Analyze a project locally using QVAC.
   * Returns structured analysis without sending data to cloud APIs.
   */
  async analyzeProject(projectData: {
    name: string;
    description: string;
    githubUrl?: string;
    ecosystem?: string;
  }): Promise<QvacCompletionResult> {
    const prompt = `Analyze this project and return a JSON score object:
{
  "score": <0-100>,
  "strengths": [<string>, ...],
  "risks": [<string>, ...],
  "recommendation": "<one of: strong-back, moderate-back, watch, skip>",
  "summary": "<one sentence>"
}

Project: ${projectData.name}
Description: ${projectData.description}
${projectData.githubUrl ? `GitHub: ${projectData.githubUrl}` : ''}
${projectData.ecosystem ? `Ecosystem: ${projectData.ecosystem}` : ''}`;

    return this.complete({
      prompt,
      systemPrompt: 'You are an expert project analyst for a Solana hackathon platform. Respond only with valid JSON.',
    });
  }

  /**
   * Generate a credit score explanation locally.
   * Keeps the user's financial data on-device.
   */
  async explainCreditScore(scoreData: {
    reputation: number;
    totalBacking: string;
    milestonesCompleted: number;
    milestonesTotal: number;
  }): Promise<QvacCompletionResult> {
    const prompt = `Explain this builder's credit score in 2-3 sentences:
- Reputation: ${scoreData.reputation}/800
- Total Backing: $${scoreData.totalBacking} USDC
- Milestones: ${scoreData.milestonesCompleted}/${scoreData.milestonesTotal} completed

Focus on what the score means for their borrowing capacity and what would improve it.`;

    return this.complete({
      prompt,
      systemPrompt: 'You are a credit analyst. Be concise and actionable.',
    });
  }

  /**
   * Unload the model to free GPU/memory resources.
   */
  async unload(): Promise<void> {
    if (!loadedModelId) return;
    try {
      const mod = await this.loadModule();
      if (mod && loadedModelId) {
        await mod.unloadModel({ modelId: loadedModelId });
        loadedModelId = null;
        this.initialized = false;
      }
    } catch (err) {
      console.warn('[QVAC] Failed to unload model:', err);
    }
  }

  /**
   * Lazily load the QVAC SDK module.
   * Returns null if the SDK isn't installed (graceful degradation).
   */
  private async loadModule(): Promise<any> {
    if (qvacModule) return qvacModule;

    try {
      // Dynamic import with webpack ignore — only works if @qvac/sdk is installed.
      // The SDK has large native GPU binaries (~500MB) so it may not
      // be present in all environments. Webpack ignore prevents build-time resolution.
      qvacModule = await import(/* webpackIgnore: true */ '@qvac/sdk');
      return qvacModule;
    } catch {
      // QVAC SDK not installed — service degrades gracefully
      return null;
    }
  }
}

export const qvacService = new QvacService();
export default qvacService;
