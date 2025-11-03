import { z } from 'zod';

export type TrendDirection =
  | 'bullish'
  | 'bearish'
  | 'neutral'
  | 'consolidation'
  | 'consolidation_bullish'
  | 'consolidation_bearish';

export const MarketDataSchema = z.object({
  symbol: z.string(),
  timestamp: z.date(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  timeframe: z.string(),
});

export type MarketData = z.infer<typeof MarketDataSchema>;

export const PredictionRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  strategy: z.enum(['comprehensive', 'technical', 'sentiment', 'momentum']).optional(),
  timePreference: z
    .object({
      macro: z.string().optional(),
      micro: z.string().optional(),
    })
    .optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
});

export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;

export const MacroTrendSchema = z.object({
  direction: z.enum(['bullish', 'bearish', 'neutral', 'consolidation']),
  confidence: z.number().min(0).max(1),
  timeframe: z.string(),
  rationale: z.string(),
});

export type MacroTrend = z.infer<typeof MacroTrendSchema>;

export const MicroTrendSchema = z.object({
  direction: z.enum([
    'bullish',
    'bearish',
    'neutral',
    'consolidation_bullish',
    'consolidation_bearish',
  ]),
  confidence: z.number().min(0).max(1),
  timeframe: z.string(),
  expectedAction: z.string(),
});

export type MicroTrend = z.infer<typeof MicroTrendSchema>;

export const KeyLevelsSchema = z.object({
  immediateSupport: z.array(z.number()),
  immediateResistance: z.array(z.number()),
  breakoutLevel: z.number().optional(),
});

export type KeyLevels = z.infer<typeof KeyLevelsSchema>;

export const PredictionDataSchema = z.object({
  macroTrend: MacroTrendSchema,
  microTrend: MicroTrendSchema,
  keyLevels: KeyLevelsSchema,
  riskFactors: z.array(z.string()),
  agentNotes: z.string().optional(),
});

export type PredictionData = z.infer<typeof PredictionDataSchema>;

export const AgentMetadataSchema = z.object({
  analysisStrategy: z.string(),
  toolsUsed: z.array(z.string()),
  dataSourcesAnalyzed: z.array(z.string()),
  reasoningSteps: z.number(),
  totalAnalysisTime: z.string(),
  confidenceCalibration: z.string(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

export const PredictionResponseSchema = z.object({
  success: z.boolean(),
  symbol: z.string(),
  prediction: PredictionDataSchema,
  agentMetadata: AgentMetadataSchema,
});

export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;

export const AgentActionSchema = z.object({
  reasoning: z.string(),
  action: z.object({
    type: z.enum(['TOOL_USE', 'FINAL_ANSWER']),
    toolName: z.string().optional(),
    parameters: z.record(z.string(), z.unknown()).optional(),
    content: z.unknown().optional(),
  }),
});

export type AgentAction = z.infer<typeof AgentActionSchema>;

export type PriceField = 'open' | 'high' | 'low' | 'close';

export interface Candle5m {
  /** Timestamp of the 5m bar (local time as per file). */
  time: Date;
  /** Milliseconds since epoch for fast indexing/sorting. */
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  changePips?: number | null;
  changePct?: number | null;
}

export interface StatsSummary {
  count: number;
  firstTime?: Date;
  lastTime?: Date;
  minClose?: number;
  maxClose?: number;
  meanClose?: number;
  stdClose?: number;
}
