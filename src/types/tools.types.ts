export interface MarketDataPoint {
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataResult {
  symbol: string;
  timeframes: string[];
  data: MarketDataPoint[];
  timestamp: string;
}

export interface NewsArticle {
  headline: string;
  source: string;
  sentiment: number;
  publishedAt: string;
}

export interface NewsSentimentResult {
  symbol: string;
  lookbackHours: number;
  articles: NewsArticle[];
  overallSentiment: number;
  timestamp: string;
}

export interface TechnicalPattern {
  name: string;
  confidence: number;
  timeframe: string;
}

export interface KeyLevels {
  support: number[];
  resistance: number[];
}

export interface Indicators {
  rsi: number;
  macd: number;
  movingAverage20: number;
  movingAverage50: number;
}

export interface TechnicalAnalysisResult {
  symbol: string;
  patterns: TechnicalPattern[];
  keyLevels: KeyLevels;
  indicators: Indicators;
  timestamp: string;
}

export interface SupportResistanceResult {
  symbol: string;
  support: number[];
  resistance: number[];
  confidence: number;
  timestamp: string;
}

export interface TimeframeAlignment {
  symbol: string;
  alignment: string;
  conflicts: string[];
  overallBias: string;
  timestamp: string;
}

export interface MarketRegimeResult {
  symbol: string;
  regime: string;
  volatility: string;
  trendStrength: number;
  timestamp: string;
}

export type ToolResult = 
  | MarketDataResult
  | NewsSentimentResult
  | TechnicalAnalysisResult
  | SupportResistanceResult
  | TimeframeAlignment
  | MarketRegimeResult;

export interface ToolParameters {
  symbol: string;
  [key: string]: string | number | string[] | undefined | boolean;
}

export type ToolsMap = Record<string, unknown>;
