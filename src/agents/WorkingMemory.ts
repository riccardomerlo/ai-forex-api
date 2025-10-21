interface Fact {
  value: any;
  source: string;
  confidence: number;
  timestamp: Date;
  corroboratingEvidence: any[];
}

interface Hypothesis {
  description: string;
  supportingFacts: string[];
  testPlan: any[];
  status: 'active' | 'confirmed' | 'rejected';
  confidence: number;
}

export class WorkingMemory {
  private facts: Map<string, Fact> = new Map();
  private hypotheses: Hypothesis[] = [];
  private evidence: any[] = [];
  private confidenceLevels: Map<string, number> = new Map();
  private analysisHistory: any[] = [];

  storeFact(key: string, value: any, source: string, confidence: number = 0.8): void {
    this.facts.set(key, {
      value,
      source,
      confidence,
      timestamp: new Date(),
      corroboratingEvidence: []
    });

    this.analysisHistory.push({
      type: 'fact_stored',
      key,
      value,
      source,
      confidence,
      timestamp: new Date()
    });
  }

  addEvidence(factKey: string, evidence: any): void {
    if (this.facts.has(factKey)) {
      const fact = this.facts.get(factKey)!;
      fact.corroboratingEvidence.push(evidence);
      fact.confidence = this.calculateAdjustedConfidence(fact);
      
      this.evidence.push({
        factKey,
        evidence,
        timestamp: new Date()
      });
    }
  }

  formulateHypothesis(description: string, supportingFacts: string[], testPlan: any[]): void {
    const hypothesis: Hypothesis = {
      description,
      supportingFacts,
      testPlan,
      status: 'active',
      confidence: 0.5
    };

    this.hypotheses.push(hypothesis);
    
    this.analysisHistory.push({
      type: 'hypothesis_formulated',
      description,
      supportingFacts,
      timestamp: new Date()
    });
  }

  updateHypothesisStatus(description: string, status: 'confirmed' | 'rejected', confidence: number): void {
    const hypothesis = this.hypotheses.find(h => h.description === description);
    if (hypothesis) {
      hypothesis.status = status;
      hypothesis.confidence = confidence;
    }
  }

  private calculateAdjustedConfidence(fact: Fact): number {
    const baseConfidence = fact.confidence;
    const evidenceCount = fact.corroboratingEvidence.length;
    const evidenceBoost = Math.min(evidenceCount * 0.1, 0.3); // Max 30% boost from evidence
    
    return Math.min(baseConfidence + evidenceBoost, 1.0);
  }

  getContext(): any {
    const confirmedFacts = Array.from(this.facts.entries())
      .filter(([_, fact]) => fact.confidence > 0.7)
      .reduce((acc, [key, fact]) => {
        acc[key] = fact.value;
        return acc;
      }, {} as Record<string, any>);

    const activeHypotheses = this.hypotheses.filter(h => h.status === 'active');

    return {
      confirmedFacts,
      activeHypotheses,
      recentEvidence: this.evidence.slice(-10),
      confidenceLevels: Object.fromEntries(this.confidenceLevels),
      analysisSummary: {
        totalFacts: this.facts.size,
        totalHypotheses: this.hypotheses.length,
        activeHypotheses: activeHypotheses.length,
        totalEvidence: this.evidence.length
      }
    };
  }

  getAnalysisHistory(): any[] {
    return [...this.analysisHistory];
  }

  getConfidenceMetrics(): any {
    const factConfidences = Array.from(this.facts.values()).map(f => f.confidence);
    const avgConfidence = factConfidences.length > 0 
      ? factConfidences.reduce((a, b) => a + b, 0) / factConfidences.length 
      : 0;

    return {
      averageFactConfidence: avgConfidence,
      highConfidenceFacts: factConfidences.filter(c => c > 0.8).length,
      lowConfidenceFacts: factConfidences.filter(c => c < 0.5).length,
      hypothesisConfidence: this.hypotheses.map(h => h.confidence)
    };
  }

  clear(): void {
    this.facts.clear();
    this.hypotheses = [];
    this.evidence = [];
    this.confidenceLevels.clear();
    this.analysisHistory = [];
  }
}
