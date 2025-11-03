import type { LanguageModel } from 'ai';
import type { PredictionResponse } from './market.types';
import type { AnalysisContext, ConfidenceMetrics, AnalysisHistoryEntry } from './analysis.types';
import type { ToolsMap } from './tools.types';

export interface UserPreferences {
  strategy?: 'comprehensive' | 'technical' | 'sentiment' | 'momentum';
  timePreference?: {
    macro?: string;
    micro?: string;
  };
  riskTolerance?: 'low' | 'medium' | 'high';
}

export interface AgentMetadata {
  analysisStrategy: string;
  toolsUsed: string[];
  dataSourcesAnalyzed: string[];
  reasoningSteps: number;
  totalAnalysisTime: string;
  confidenceCalibration: string;
}

export interface OrchestratorState {
  workingMemory: AnalysisContext;
  toolsUsed: string[];
  reasoningSteps: number;
}

export interface OrchestratorInterface {
  generateMarketPrediction(symbol: string, userPreferences: UserPreferences): Promise<PredictionResponse>;
  getCurrentState(): OrchestratorState;
  getReasoningChain(): AnalysisHistoryEntry[];
  getToolsUsed(): string[];
  getAnalysisDuration(): number;
  getConfidenceMetrics(): ConfidenceMetrics;
}

export interface MemoryInterface {
  storeFact(key: string, value: unknown, source: string, confidence?: number): void;
  addEvidence(factKey: string, evidence: unknown): void;
  formulateHypothesis(description: string, supportingFacts: string[], testPlan: unknown[]): void;
  updateHypothesisStatus(description: string, status: 'confirmed' | 'rejected', confidence: number): void;
  getContext(): AnalysisContext;
  getAnalysisHistory(): AnalysisHistoryEntry[];
  getConfidenceMetrics(): ConfidenceMetrics;
  clear(): void;
}

export interface OrchestratorConstructor {
  model: LanguageModel;
  tools: ToolsMap;
}
