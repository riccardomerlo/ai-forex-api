import { Request, Response } from 'express';
import { PredictionRequestSchema } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AdvancedOrchestrator } from '../agents/AdvancedOrchestrator';
import { aiSdkTools } from '../tools';
import { openai } from '@ai-sdk/openai';
import { config } from '../config';

const model = openai('gpt-4o-mini');

const orchestrator = new AdvancedOrchestrator(model, aiSdkTools);

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
