import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Fixed import
import { WorkingMemory } from './WorkingMemory';
import { PredictionResponse, AgentAction } from '../types';
import { logger } from '../utils/logger';

interface Tool {
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

interface AnalysisStep {
  type: 'data_collection' | 'technical_analysis' | 'sentiment_analysis' | 'synthesis';
  tool: string;
  parameters: Record<string, any>;
  expectedInsight: string;
}

interface AnalysisPlan {
  rationale: string;
  steps: AnalysisStep[];
}

export class AdvancedOrchestrator {
  private workingMemory: WorkingMemory;
  private toolsUsed: string[] = [];
  private reasoningSteps: number = 0;
  private analysisStartTime: number = 0;

  constructor(
    private ai: ReturnType<typeof createGoogleGenerativeAI>, // Updated type
    private tools: Record<string, Tool>
  ) {
    this.workingMemory = new WorkingMemory();
  }

  async generateMarketPrediction(
    symbol: string,
    userPreferences: any
  ): Promise<PredictionResponse> {
    this.analysisStartTime = Date.now();
    this.toolsUsed = [];
    this.reasoningSteps = 0;

    try {
      const objective = this.buildObjective(symbol, userPreferences);
      const analysisPlan = await this.formulateAnalysisPlan(symbol, userPreferences);

      logger.info('Starting analysis plan', { symbol, plan: analysisPlan });

      // Execute analysis plan
      for (const step of analysisPlan.steps) {
        const result = await this.executeAnalysisStep(step, symbol);
        this.workingMemory.storeFact(step.type, result, step.tool);
        this.reasoningSteps++;

        // Dynamic plan adjustment based on intermediate results
        if (this.shouldAdjustPlan(result, step)) {
          await this.adjustAnalysisPlan(analysisPlan, result);
        }
      }

      // Synthesize final prediction
      const prediction = await this.synthesizePrediction(symbol);

      return {
        success: true,
        symbol,
        prediction,
        agentMetadata: this.getAgentMetadata(),
      };

    } catch (error) {
      logger.error('Analysis failed', { error, symbol });
      // Fallback prediction
      return await this.generateFallbackPrediction(symbol);
    }
  }

  private buildObjective(symbol: string, preferences: any): string {
    return `
      Provide a comprehensive market prediction for ${symbol} that includes:
      - Macro trend direction (next 1-4 weeks)
      - Micro trend direction (next 1-3 days) 
      - Key support/resistance levels
      - Confidence assessment
      - Expected price action narrative
      - Risk factors

      User preferences: ${JSON.stringify(preferences)}
    `;
  }

  private async formulateAnalysisPlan(symbol: string, preferences: any): Promise<AnalysisPlan> {
    const prompt = `
      Create an analysis plan for ${symbol} market prediction.
      
      Available tools: ${Object.keys(this.tools).join(', ')}
      User preferences: ${JSON.stringify(preferences)}

      Consider what data and analysis would be most relevant for this prediction.
      Return a structured plan with steps.

      Respond with JSON:
      {
        "rationale": "Why this plan was chosen",
        "steps": [
          {
            "type": "data_collection|technical_analysis|sentiment_analysis|synthesis",
            "tool": "tool_name",
            "parameters": {},
            "expectedInsight": "What we hope to learn"
          }
        ]
      }
    `;

    // In a real implementation, this would call the AI model
    // For now, return a default plan
    return {
      rationale: "Comprehensive multi-timeframe analysis with sentiment integration",
      steps: [
        {
          type: "data_collection",
          tool: "getMarketData",
          parameters: { symbol, timeframes: ['1h', '4h', '1d', '1w'] },
          expectedInsight: "Price action across multiple timeframes"
        },
        {
          type: "technical_analysis",
          tool: "analyzeTechnicalPatterns",
          parameters: { symbol, primaryTimeframe: '1d' },
          expectedInsight: "Technical patterns and key levels"
        },
        {
          type: "sentiment_analysis",
          tool: "getNewsSentiment",
          parameters: { symbol, lookbackHours: 48 },
          expectedInsight: "Market sentiment and catalysts"
        }
      ]
    };
  }

  private async executeAnalysisStep(step: AnalysisStep, symbol: string): Promise<any> {
    const tool = this.tools[step.tool];
    if (!tool) {
      throw new Error(`Tool ${step.tool} not found`);
    }

    this.toolsUsed.push(step.tool);

    // Enhance parameters with current context
    const enhancedParams = await this.enhanceParameters(step.parameters, symbol);

    try {
      const result = await tool.execute(enhancedParams);
      logger.debug('Tool execution completed', { tool: step.tool, params: enhancedParams });
      return result;
    } catch (error) {
      logger.warn('Tool execution failed', { tool: step.tool, error });
      // Fixed: Call the method that actually exists
      return await this.handleToolError(step, error);
    }
  }

  // Fixed: Added the missing method implementation
  private async handleToolError(step: AnalysisStep, error: any): Promise<any> {
    logger.error(`Tool ${step.tool} failed, using fallback`, {
      error: error.message,
      step: step.type
    });

    // Return a basic fallback result to allow continuation
    return {
      error: error.message,
      fallback: true,
      tool: step.tool,
      timestamp: new Date().toISOString()
    };
  }

  private async enhanceParameters(baseParams: any, symbol: string): Promise<any> {
    // Simple parameter enhancement - in real implementation, this would use AI
    return {
      ...baseParams,
      symbol,
      timestamp: new Date().toISOString()
    };
  }

  private shouldAdjustPlan(result: any, step: AnalysisStep): boolean {
    // Simple heuristic for plan adjustment
    return result?.error || result?.insufficientData ||
      (step.type === 'data_collection' && !result?.data?.length);
  }

  private async adjustAnalysisPlan(plan: AnalysisPlan, result: any): Promise<void> {
    // Simple plan adjustment - add fallback steps if needed
    if (result?.error) {
      plan.steps.push({
        type: 'data_collection',
        tool: 'getMarketData',
        parameters: { fallback: true, basic: true },
        expectedInsight: 'Fallback data collection'
      });
    }
  }

  private async synthesizePrediction(symbol: string): Promise<any> {
    // In real implementation, this would use AI to synthesize all collected data
    // For now, return a mock prediction
    const context = this.workingMemory.getContext();

    return {
      macroTrend: {
        direction: 'bullish' as const,
        confidence: 0.75,
        timeframe: '2_weeks',
        rationale: 'Based on weekly trend analysis and positive market structure'
      },
      microTrend: {
        direction: 'consolidation_bullish' as const,
        confidence: 0.65,
        timeframe: '3_days',
        expectedAction: 'Expected consolidation between key levels followed by breakout'
      },
      keyLevels: {
        immediateSupport: [180.50, 178.20],
        immediateResistance: [185.30, 187.80],
        breakoutLevel: 188.50
      },
      riskFactors: [
        'Market awaiting economic data',
        'Potential sector rotation'
      ],
      agentNotes: 'Analysis based on multi-timeframe technical structure and volume analysis'
    };
  }

  private async generateFallbackPrediction(symbol: string): Promise<any> {
    // Fallback prediction when analysis fails
    return {
      macroTrend: {
        direction: 'neutral' as const,
        confidence: 0.5,
        timeframe: '2_weeks',
        rationale: 'Insufficient data for confident prediction'
      },
      microTrend: {
        direction: 'neutral' as const,
        confidence: 0.5,
        timeframe: '3_days',
        expectedAction: 'Market likely to continue current range'
      },
      keyLevels: {
        immediateSupport: [],
        immediateResistance: [],
      },
      riskFactors: ['Analysis system encountered errors'],
      agentNotes: 'Fallback prediction due to system issues'
    };
  }

  private getAgentMetadata() {
    const analysisTime = Date.now() - this.analysisStartTime;

    return {
      analysisStrategy: 'multi_timeframe_technical_sentiment',
      toolsUsed: [...new Set(this.toolsUsed)],
      dataSourcesAnalyzed: ['price_data', 'technical_indicators', 'news_sentiment'],
      reasoningSteps: this.reasoningSteps,
      totalAnalysisTime: `${analysisTime}ms`,
      confidenceCalibration: 'conservative',
    };
  }

  // Public methods for state inspection
  getCurrentState() {
    return {
      workingMemory: this.workingMemory.getContext(),
      toolsUsed: this.toolsUsed,
      reasoningSteps: this.reasoningSteps,
    };
  }

  getReasoningChain() {
    return this.workingMemory.getAnalysisHistory();
  }

  getToolsUsed() {
    return this.toolsUsed;
  }

  getAnalysisDuration() {
    return Date.now() - this.analysisStartTime;
  }

  getConfidenceMetrics() {
    return this.workingMemory.getConfidenceMetrics();
  }
}