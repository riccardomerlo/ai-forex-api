import { Request, Response } from 'express';
import { PredictionRequestSchema } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AdvancedOrchestrator } from '../agents/AdvancedOrchestrator';
import { availableTools } from '../tools';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from '../config';

const ai = createGoogleGenerativeAI({
  apiKey: config.ai.googleApiKey!,
});

const orchestrator = new AdvancedOrchestrator(ai, availableTools);

export const predictionController = async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = PredictionRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(400, `Invalid request: ${validationResult.error.message}`);
    }

    const { symbol, strategy, timePreference, riskTolerance } = validationResult.data;

    // Generate prediction using agentic orchestrator
    const prediction = await orchestrator.generateMarketPrediction(symbol, {
      strategy: strategy || 'comprehensive',
      timePreference: timePreference || { macro: '2_weeks', micro: '3_days' },
      riskTolerance: riskTolerance || 'medium',
    });

    res.json(prediction);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
