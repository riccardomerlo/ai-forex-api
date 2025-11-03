export type AnalysisStepType = 'data_collection' | 'technical_analysis' | 'sentiment_analysis' | 'synthesis';

export interface AnalysisStep {
  type: AnalysisStepType;
  tool: string;
  parameters: Record<string, string | number | string[] | boolean | undefined>;
  expectedInsight: string;
}

export interface AnalysisPlan {
  rationale: string;
  steps: AnalysisStep[];
}

export type HypothesisStatus = 'active' | 'confirmed' | 'rejected';

export interface Hypothesis {
  description: string;
  supportingFacts: string[];
  testPlan: AnalysisStep[];
  status: HypothesisStatus;
  confidence: number;
}

export interface Fact {
  value: unknown;
  source: string;
  confidence: number;
  timestamp: Date;
  corroboratingEvidence: unknown[];
}

export interface Evidence {
  factKey: string;
  evidence: unknown;
  timestamp: Date;
}

export interface AnalysisContext {
  confirmedFacts: Record<string, unknown>;
  activeHypotheses: Hypothesis[];
  recentEvidence: Evidence[];
  confidenceLevels: Record<string, number>;
  analysisSummary: {
    totalFacts: number;
    totalHypotheses: number;
    activeHypotheses: number;
    totalEvidence: number;
  };
}

export interface AnalysisHistoryEntry {
  type: 'fact_stored' | 'hypothesis_formulated' | 'hypothesis_updated';
  key?: string;
  value?: unknown;
  source?: string;
  confidence?: number;
  description?: string;
  supportingFacts?: string[];
  timestamp: Date;
}

export interface ConfidenceMetrics {
  averageFactConfidence: number;
  highConfidenceFacts: number;
  lowConfidenceFacts: number;
  hypothesisConfidence: number[];
}
