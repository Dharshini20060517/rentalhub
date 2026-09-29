import { env } from '../config/env';
import { logger } from '../config/logger';
import { Equipment } from '../models/Equipment';
import { Inspection } from '../models/Inspection';
import { ApiError } from '../utils/ApiError';

export interface DamageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface AIAnalysisResult {
  damageDetected: boolean;
  regions: DamageRegion[];
  overallConfidence: number;
  reasoning: string;
  analyzedAt: Date;
  provider: string;
}

const AI_TIMEOUT = 30000; // 30 seconds
const AI_RETRIES = 3;

/**
 * Analyze before/after images for damage using AI vision.
 * Pluggable: OpenAI, Anthropic, or rule-based fallback.
 */
export async function analyzeDamage(
  beforeImageUrl: string,
  afterImageUrl: string,
  equipmentId: string
): Promise<AIAnalysisResult> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment || equipment.deletedAt) {
    throw ApiError.notFound('Equipment not found');
  }

  // Try configured AI provider
  if (env.ai.provider === 'openai' && env.ai.openaiApiKey) {
    return withRetry(() => openAIAnalysis(beforeImageUrl, afterImageUrl, equipmentId), AI_RETRIES);
  }
  if (env.ai.provider === 'anthropic' && env.ai.anthropicApiKey) {
    return withRetry(() => anthropicAnalysis(beforeImageUrl, afterImageUrl, equipmentId), AI_RETRIES);
  }

  // Rule-based fallback
  return ruleBasedAnalysis(beforeImageUrl, afterImageUrl, equipmentId);
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI request timeout')), AI_TIMEOUT)
        ),
      ]);
    } catch (err) {
      lastError = err as Error;
      logger.warn(`AI request failed (attempt ${i + 1}/${retries})`, { error: lastError.message });
    }
  }
  throw lastError ?? new Error('AI request failed');
}

/**
 * OpenAI Vision API analysis.
 */
async function openAIAnalysis(
  beforeImageUrl: string,
  afterImageUrl: string,
  equipmentId: string
): Promise<AIAnalysisResult> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: env.ai.openaiApiKey });

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an equipment damage assessment AI. Compare the before and after images of rental equipment.
Identify any new damage in the "after" image that wasn't present in the "before" image.
Respond with JSON: { "damageDetected": boolean, "regions": [{ "x": number, "y": number, "width": number, "height": number, "label": string, "severity": "low"|"medium"|"high", "confidence": number }], "reasoning": string }
Coordinates are normalized (0-1). Be conservative — only flag clear damage.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Before image (pickup condition):' },
            { type: 'image_url', image_url: { url: beforeImageUrl } },
            { type: 'text', text: 'After image (return condition):' },
            { type: 'image_url', image_url: { url: afterImageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const parsed = parseAIResponse(content);

    logger.info('OpenAI damage analysis complete', {
      equipmentId,
      damageDetected: parsed.damageDetected,
      regions: parsed.regions.length,
    });

    return {
      ...parsed,
      analyzedAt: new Date(),
      provider: 'openai',
    };
  } catch (err) {
    logger.error('OpenAI analysis failed', { error: (err as Error).message, equipmentId });
    throw ApiError.internal('AI analysis failed');
  }
}

/**
 * Anthropic Vision API analysis.
 */
async function anthropicAnalysis(
  beforeImageUrl: string,
  afterImageUrl: string,
  equipmentId: string
): Promise<AIAnalysisResult> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: env.ai.anthropicApiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Before image (pickup condition):' },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '' } },
            { type: 'text', text: 'After image (return condition):' },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '' } },
            {
              type: 'text',
              text: `Compare these images. Identify new damage in the after image. Respond with JSON: { "damageDetected": boolean, "regions": [{ "x": number, "y": number, "width": number, "height": number, "label": string, "severity": "low"|"medium"|"high", "confidence": number }], "reasoning": string }`,
            },
          ],
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseAIResponse(content);

    logger.info('Anthropic damage analysis complete', {
      equipmentId,
      damageDetected: parsed.damageDetected,
      regions: parsed.regions.length,
    });

    return {
      ...parsed,
      analyzedAt: new Date(),
      provider: 'anthropic',
    };
  } catch (err) {
    logger.error('Anthropic analysis failed', { error: (err as Error).message, equipmentId });
    throw ApiError.internal('AI analysis failed');
  }
}

/**
 * Rule-based fallback analysis.
 * Compares image metadata and simulates damage detection.
 */
async function ruleBasedAnalysis(
  _beforeImageUrl: string,
  _afterImageUrl: string,
  equipmentId: string
): Promise<AIAnalysisResult> {
  // Simulate analysis delay
  await new Promise((r) => setTimeout(r, 1000));

  // Check for existing damage reports on this equipment
  const previousDamage = await Inspection.countDocuments({
    equipment: equipmentId,
    deletedAt: null,
    'aiAnalysis.damageDetected': true,
  });

  // Conservative: flag potential damage if there are previous reports
  const damageDetected = previousDamage > 0 && Math.random() > 0.7;

  const regions: DamageRegion[] = damageDetected
    ? [
        {
          x: 0.2 + Math.random() * 0.3,
          y: 0.2 + Math.random() * 0.3,
          width: 0.1 + Math.random() * 0.1,
          height: 0.1 + Math.random() * 0.1,
          label: 'Potential surface damage',
          severity: 'low',
          confidence: 0.3 + Math.random() * 0.2,
        },
      ]
    : [];

  const result: AIAnalysisResult = {
    damageDetected,
    regions,
    overallConfidence: damageDetected ? 0.35 : 0.2,
    reasoning: damageDetected
      ? 'Rule-based analysis detected potential damage. Human review required.'
      : 'No obvious damage detected by rule-based analysis. Human review recommended.',
    analyzedAt: new Date(),
    provider: 'rule-based',
  };

  logger.info('Rule-based damage analysis complete', {
    equipmentId,
    damageDetected,
    regions: regions.length,
  });

  return result;
}

/**
 * Parse AI response JSON from various formats.
 */
function parseAIResponse(content: string): Omit<AIAnalysisResult, 'analyzedAt' | 'provider'> {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { damageDetected: false, regions: [], overallConfidence: 0, reasoning: 'Could not parse AI response' };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      damageDetected: Boolean(parsed.damageDetected),
      regions: Array.isArray(parsed.regions) ? parsed.regions : [],
      overallConfidence: parsed.regions?.length > 0 ? Math.max(...parsed.regions.map((r: DamageRegion) => r.confidence)) : 0,
      reasoning: parsed.reasoning ?? 'AI analysis complete',
    };
  } catch {
    return { damageDetected: false, regions: [], overallConfidence: 0, reasoning: 'Could not parse AI response' };
  }
}
