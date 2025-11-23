import { 
  OrchestrationRequest, 
  OrchestrationResult, 
  BaseResponse, 
  CandidateResponse,
  TextRequest,
  ImageRequest,
  RealtimeRequest,
  Tier 
} from './types';
import { TextModelService, ImageModelService, RealtimeService, getAvailableModels } from './aiServices';
import { getUserTier } from '@/lib/tiers/tiers';
import { v4 as uuidv4 } from 'uuid';

export class OptiBrain {
  private static readonly DEFAULT_THRESHOLD = 0.6;
  private static readonly MAX_ITERATIONS = 3;
  
  // Scoring weights
  private static readonly CONFIDENCE_WEIGHT = 0.4;
  private static readonly COMPLETENESS_WEIGHT = 0.3;
  private static readonly LATENCY_WEIGHT = 0.2;
  private static readonly TOKEN_WEIGHT = 0.1;

  static async runTextOrchestration(prompt: string, options?: {
    tier?: Tier;
    userId?: string;
    maxTokens?: number;
    temperature?: number;
    maxIterations?: number;
    threshold?: number;
  }): Promise<OrchestrationResult> {
    const tier = options?.tier || getUserTier(options?.userId);
    const availableModels = getAvailableModels(tier);
    const startTime = Date.now();
    
    const request: TextRequest = {
      type: 'text',
      prompt,
      userId: options?.userId,
      tier,
      options: {
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
      },
    };

    const modelIds = Object.keys(availableModels.deepThinkers);
    if (modelIds.length === 0) {
      throw new Error('No text models available for this tier');
    }

    let candidates: CandidateResponse[] = [];
    let iterations = 0;
    const maxIterations = options?.maxIterations || this.MAX_ITERATIONS;
    const threshold = options?.threshold || this.DEFAULT_THRESHOLD;

    // Run initial batch
    candidates = await this.runTextModels(request, modelIds);
    iterations++;

    // Check if we have a good candidate
    let bestCandidate = this.selectBestCandidate(candidates);
    
    // If no candidate meets threshold and we have iterations left, try to improve
    while (bestCandidate && bestCandidate.finalScore < threshold && iterations < maxIterations) {
      // Try to improve the best candidate
      const improvedRequest: TextRequest = {
        ...request,
        prompt: `Please improve and expand upon this response: "${bestCandidate.response.content}". Make it more comprehensive and detailed.`,
      };

      const improvementCandidates = await this.runTextModels(improvedRequest, [bestCandidate.response.modelId]);
      candidates.push(...improvementCandidates);
      iterations++;

      // Re-evaluate all candidates
      bestCandidate = this.selectBestCandidate(candidates);
    }

    const orchestrationTime = Date.now() - startTime;
    const selectedResponse = bestCandidate?.response || candidates[0]?.response;
    const unusedOutputs = candidates
      .filter(c => c.response !== selectedResponse && !c.response.error)
      .map(c => c.response);

    return {
      selectedResponse: selectedResponse!,
      allCandidates: candidates,
      unusedOutputs,
      orchestrationTime,
      iterations,
      metadata: {
        userId: options?.userId,
        tier,
        modelTypes: ['text'],
      },
    };
  }

  static async runImageOrchestration(prompt: string, options?: {
    tier?: Tier;
    userId?: string;
    style?: string;
    dimensions?: { width: number; height: number };
    maxIterations?: number;
    threshold?: number;
  }): Promise<OrchestrationResult> {
    const tier = options?.tier || getUserTier(options?.userId);
    const availableModels = getAvailableModels(tier);
    const startTime = Date.now();
    
    const request: ImageRequest = {
      type: 'image',
      prompt,
      userId: options?.userId,
      tier,
      style: options?.style,
      dimensions: options?.dimensions,
    };

    const modelIds = Object.keys(availableModels.visualCreators);
    if (modelIds.length === 0) {
      throw new Error('No image models available for this tier');
    }

    const candidates = await this.runImageModels(request, modelIds);
    const bestCandidate = this.selectBestCandidate(candidates);
    const orchestrationTime = Date.now() - startTime;

    const selectedResponse = bestCandidate?.response || candidates[0]?.response;
    const unusedOutputs = candidates
      .filter(c => c.response !== selectedResponse && !c.response.error)
      .map(c => c.response);

    return {
      selectedResponse: selectedResponse!,
      allCandidates: candidates,
      unusedOutputs,
      orchestrationTime,
      iterations: 1,
      metadata: {
        userId: options?.userId,
        tier,
        modelTypes: ['image'],
      },
    };
  }

  static async runRealtimeOrchestration(query: string, options?: {
    tier?: Tier;
    userId?: string;
    sources?: ('web' | 'youtube' | 'custom')[];
    maxResults?: number;
    maxIterations?: number;
    threshold?: number;
  }): Promise<OrchestrationResult> {
    const tier = options?.tier || getUserTier(options?.userId);
    const availableModels = getAvailableModels(tier);
    const startTime = Date.now();
    
    const request: RealtimeRequest = {
      type: 'realtime',
      prompt: query,
      userId: options?.userId,
      tier,
      sources: options?.sources,
      maxResults: options?.maxResults,
    };

    const modelIds = Object.keys(availableModels.realtimeAssist);
    if (modelIds.length === 0) {
      throw new Error('No realtime models available for this tier');
    }

    const candidates = await this.runRealtimeModels(request, modelIds);
    const bestCandidate = this.selectBestCandidate(candidates);
    const orchestrationTime = Date.now() - startTime;

    const selectedResponse = bestCandidate?.response || candidates[0]?.response;
    const unusedOutputs = candidates
      .filter(c => c.response !== selectedResponse && !c.response.error)
      .map(c => c.response);

    return {
      selectedResponse: selectedResponse!,
      allCandidates: candidates,
      unusedOutputs,
      orchestrationTime,
      iterations: 1,
      metadata: {
        userId: options?.userId,
        tier,
        modelTypes: ['realtime'],
      },
    };
  }

  static async runMixedOrchestration(input: string, options?: {
    modelTypes?: ('text' | 'image' | 'realtime')[];
    tier?: Tier;
    userId?: string;
    maxIterations?: number;
    threshold?: number;
  }): Promise<OrchestrationResult> {
    const tier = options?.tier || getUserTier(options?.userId);
    const modelTypes = options?.modelTypes || ['text', 'realtime'];
    const startTime = Date.now();
    
    const allCandidates: CandidateResponse[] = [];
    let selectedResponse: BaseResponse | undefined;
    let iterations = 0;

    // Run each model type in parallel
    const promises: Promise<CandidateResponse[]>[] = [];

    if (modelTypes.includes('text')) {
      promises.push(this.runTextOrchestration(input, options).then(result => result.allCandidates));
    }

    if (modelTypes.includes('image')) {
      promises.push(this.runImageOrchestration(input, options).then(result => result.allCandidates));
    }

    if (modelTypes.includes('realtime')) {
      promises.push(this.runRealtimeOrchestration(input, options).then(result => result.allCandidates));
    }

    const results = await Promise.all(promises);
    results.forEach(candidates => allCandidates.push(...candidates));
    iterations = 1;

    // Select the best candidate across all model types
    selectedResponse = this.selectBestCandidate(allCandidates)?.response;
    
    if (!selectedResponse) {
      throw new Error('No successful responses from any models');
    }

    const orchestrationTime = Date.now() - startTime;
    const unusedOutputs = allCandidates
      .filter(c => c.response !== selectedResponse && !c.response.error)
      .map(c => c.response);

    return {
      selectedResponse,
      allCandidates,
      unusedOutputs,
      orchestrationTime,
      iterations,
      metadata: {
        userId: options?.userId,
        tier,
        modelTypes,
      },
    };
  }

  private static async runTextModels(request: TextRequest, modelIds: string[]): Promise<CandidateResponse[]> {
    const promises = modelIds.map(modelId => 
      TextModelService.generateText(request, modelId)
        .then(response => this.evaluateResponse(response))
        .catch(error => ({
          response: {
            type: 'text' as const,
            modelId,
            modelName: modelId,
            modelType: 'text' as const,
            content: '',
            timestamp: new Date(),
            latency: 0,
            error: error.message,
          },
          score: 0,
          completenessScore: 0,
          latencyPenalty: 0,
          tokenPenalty: 0,
          finalScore: 0,
        }))
    );

    return Promise.all(promises);
  }

  private static async runImageModels(request: ImageRequest, modelIds: string[]): Promise<CandidateResponse[]> {
    const promises = modelIds.map(modelId => 
      ImageModelService.generateImage(request, modelId)
        .then(response => this.evaluateResponse(response))
        .catch(error => ({
          response: {
            type: 'image' as const,
            modelId,
            modelName: modelId,
            modelType: 'image' as const,
            content: '',
            timestamp: new Date(),
            latency: 0,
            error: error.message,
          },
          score: 0,
          completenessScore: 0,
          latencyPenalty: 0,
          tokenPenalty: 0,
          finalScore: 0,
        }))
    );

    return Promise.all(promises);
  }

  private static async runRealtimeModels(request: RealtimeRequest, modelIds: string[]): Promise<CandidateResponse[]> {
    const promises = modelIds.map(modelId => 
      RealtimeService.fetchRealtimeInfo(request, modelId)
        .then(response => this.evaluateResponse(response))
        .catch(error => ({
          response: {
            type: 'realtime' as const,
            modelId,
            modelName: modelId,
            modelType: 'realtime' as const,
            content: '',
            timestamp: new Date(),
            latency: 0,
            error: error.message,
          },
          score: 0,
          completenessScore: 0,
          latencyPenalty: 0,
          tokenPenalty: 0,
          finalScore: 0,
        }))
    );

    return Promise.all(promises);
  }

  private static evaluateResponse(response: BaseResponse): CandidateResponse {
    if (response.error) {
      return {
        response,
        score: 0,
        completenessScore: 0,
        latencyPenalty: 0,
        tokenPenalty: 0,
        finalScore: 0,
      };
    }

    const confidence = response.confidence || 0.5;
    const completenessScore = this.calculateCompletenessScore(response);
    const latencyPenalty = this.calculateLatencyPenalty(response.latency);
    const tokenPenalty = this.calculateTokenPenalty(response.tokensUsed);

    const score = confidence * this.CONFIDENCE_WEIGHT + 
                  completenessScore * this.COMPLETENESS_WEIGHT - 
                  latencyPenalty * this.LATENCY_WEIGHT - 
                  tokenPenalty * this.TOKEN_WEIGHT;

    return {
      response,
      score,
      completenessScore,
      latencyPenalty,
      tokenPenalty,
      finalScore: Math.max(0, score),
    };
  }

  private static calculateCompletenessScore(response: BaseResponse): number {
    if (!response.content) return 0;

    let score = 0.5; // Base score

    // Length factor
    if (response.content.length > 50) score += 0.1;
    if (response.content.length > 200) score += 0.1;
    if (response.content.length > 500) score += 0.1;

    // Content-specific factors
    if (response.modelType === 'text') {
      // Check for structured content
      if (response.content.includes('\n')) score += 0.1;
      if (response.content.match(/\d+\./)) score += 0.1; // Numbered lists
    } else if (response.modelType === 'realtime') {
      const realtimeResponse = response as any;
      if (realtimeResponse.sources && realtimeResponse.sources.length > 0) {
        score += 0.2 * Math.min(realtimeResponse.sources.length / 5, 1);
      }
    } else if (response.modelType === 'image') {
      const imageResponse = response as any;
      if (imageResponse.imageUrl || imageResponse.imageBase64) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0);
  }

  private static calculateLatencyPenalty(latency: number): number {
    // Convert latency to penalty (lower is better)
    if (latency < 1000) return 0;
    if (latency < 3000) return 0.1;
    if (latency < 5000) return 0.2;
    if (latency < 10000) return 0.3;
    return 0.4;
  }

  private static calculateTokenPenalty(tokensUsed?: number): number {
    if (!tokensUsed) return 0.2; // Penalty for unknown token usage
    
    // Penalty for very high token usage (cost efficiency)
    if (tokensUsed < 100) return 0;
    if (tokensUsed < 500) return 0.05;
    if (tokensUsed < 1000) return 0.1;
    if (tokensUsed < 2000) return 0.15;
    return 0.2;
  }

  private static selectBestCandidate(candidates: CandidateResponse[]): CandidateResponse | undefined {
    // Filter out candidates with errors
    const validCandidates = candidates.filter(c => !c.response.error);
    
    if (validCandidates.length === 0) return undefined;
    
    return validCandidates.reduce((best, current) => 
      current.finalScore > best.finalScore ? current : best
    );
  }
}

export class OutputSelector {
  static selectBestResponse(candidates: CandidateResponse[]): BaseResponse | null {
    const bestCandidate = candidates.reduce((best, current) => 
      current.finalScore > best.finalScore ? current : best
    );
    
    return bestCandidate?.response || null;
  }

  static filterByThreshold(candidates: CandidateResponse[], threshold: number): CandidateResponse[] {
    return candidates.filter(c => c.finalScore >= threshold);
  }

  static getTopNCandidates(candidates: CandidateResponse[], n: number): CandidateResponse[] {
    return candidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, n);
  }
}
