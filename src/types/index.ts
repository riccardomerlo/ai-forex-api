import { z } from 'zod';

// Market Data Types
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

export const PredictionRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  strategy: z.enum(['comprehensive', 'technical', 'sentiment', 'momentum']).optional(),
  timePreference: z.object({
    macro: z.string().optional(),
    micro: z.string().optional(),
  }).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
});

export const PredictionResponseSchema = z.object({
  success: z.boolean(),
  symbol: z.string(),
  prediction: z.object({
    macroTrend: z.object({
      direction: z.enum(['bullish', 'bearish', 'neutral', 'consolidation']),
      confidence: z.number().min(0).max(1),
      timeframe: z.string(),
      rationale: z.string(),
    }),
    microTrend: z.object({
      direction: z.enum(['bullish', 'bearish', 'neutral', 'consolidation_bullish', 'consolidation_bearish']),
      confidence: z.number().min(0).max(1),
      timeframe: z.string(),
      expectedAction: z.string(),
    }),
    keyLevels: z.object({
      immediateSupport: z.array(z.number()),
      immediateResistance: z.array(z.number()),
      breakoutLevel: z.number().optional(),
    }),
    riskFactors: z.array(z.string()),
    agentNotes: z.string().optional(),
  }),
  agentMetadata: z.object({
    analysisStrategy: z.string(),
    toolsUsed: z.array(z.string()),
    dataSourcesAnalyzed: z.array(z.string()),
    reasoningSteps: z.number(),
    totalAnalysisTime: z.string(),
    confidenceCalibration: z.string(),
  }),
});

export const AgentActionSchema = z.object({
  reasoning: z.string(),
  action: z.object({
    type: z.enum(['TOOL_USE', 'FINAL_ANSWER']),
    toolName: z.string().optional(),
    parameters: z.record(z.any()).optional(),
    content: z.any().optional(),
  }),
});

// Type exports
export type MarketData = z.infer<typeof MarketDataSchema>;
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
export type PredictionResponse = z.infer<typeof PredictionResponseSchema>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export type TrendDirection = 'bullish' | 'bearish' | 'neutral' | 'consolidation' | 'consolidation_bullish' | 'consolidation_bearish';
