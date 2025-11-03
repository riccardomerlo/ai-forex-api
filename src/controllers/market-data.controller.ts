import { Request, Response } from 'express';
import path from 'node:path';
import { MarketDataStore } from '../tools';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

let marketStore: MarketDataStore | null = null;

export const loadMarketData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dir = './data/xauusd', symbol = 'XAUUSD' } = req.body;

    if (!dir || typeof dir !== 'string') {
      throw new AppError(400, 'Missing or invalid directory path');
    }

    const resolvedDir = path.resolve(process.cwd(), dir);
    logger.info('Loading market data', { symbol, dir: resolvedDir });

    marketStore = await MarketDataStore.fromFolder(resolvedDir, symbol);
    const summary = marketStore.getSummary();

    res.json({
      success: true,
      symbol,
      message: `Loaded ${summary.count} candles`,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to load market data', { error: message });
    throw new AppError(500, `Failed to load market data: ${message}`);
  }
};

export const getMarketSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!marketStore) {
      throw new AppError(400, 'Market data not loaded. Call /api/market/load first');
    }

    const summary = marketStore.getSummary();
    res.json({
      success: true,
      symbol: marketStore.symbol,
      summary,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to get market summary');
  }
};

export const getLatestCandle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!marketStore) {
      throw new AppError(400, 'Market data not loaded. Call /api/market/load first');
    }

    const latest = marketStore.getLatest();
    if (!latest) {
      throw new AppError(404, 'No candles found');
    }

    res.json({
      success: true,
      symbol: marketStore.symbol,
      latest,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to get latest candle');
  }
};

export const getLastNCandles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!marketStore) {
      throw new AppError(400, 'Market data not loaded. Call /api/market/load first');
    }

    const { n = 20 } = req.query;
    const count = typeof n === 'string' ? parseInt(n, 10) : n;

    if (Number.isNaN(count) || count <= 0 || count > 10000) {
      throw new AppError(400, 'Invalid n parameter. Must be between 1 and 10000');
    }

    const candles = marketStore.getLastN(count);
    res.json({
      success: true,
      symbol: marketStore.symbol,
      count: candles.length,
      candles,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to get candles');
  }
};

export const getTechnicals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!marketStore) {
      throw new AppError(400, 'Market data not loaded. Call /api/market/load first');
    }

    const sma20 = marketStore.getSMA(20);
    const ema20 = marketStore.getEMA(20);
    const rsi14 = marketStore.getRSI(14);
    const atr14 = marketStore.getATR(14);
    const vol = marketStore.getVolatility(96);

    res.json({
      success: true,
      symbol: marketStore.symbol,
      technicals: {
        sma20,
        ema20,
        rsi14,
        atr14,
        volatility: vol,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to calculate technicals');
  }
};

export const getCustomTechnical = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!marketStore) {
      throw new AppError(400, 'Market data not loaded. Call /api/market/load first');
    }

    const { type, period = 20 } = req.query;

    if (!type || typeof type !== 'string') {
      throw new AppError(400, 'Missing technical type. Options: sma, ema, rsi, atr, volatility');
    }

    const p = typeof period === 'string' ? parseInt(period, 10) : period;
    if (Number.isNaN(p) || p <= 0) {
      throw new AppError(400, 'Invalid period. Must be a positive integer');
    }

    let result: unknown;
    const typeStr = type.toLowerCase();

    switch (typeStr) {
      case 'sma':
        result = marketStore.getSMA(p);
        break;
      case 'ema':
        result = marketStore.getEMA(p);
        break;
      case 'rsi':
        result = marketStore.getRSI(p);
        break;
      case 'atr':
        result = marketStore.getATR(p);
        break;
      case 'volatility':
        result = marketStore.getVolatility(p);
        break;
      default:
        throw new AppError(400, `Unknown technical type: ${typeStr}`);
    }

    res.json({
      success: true,
      symbol: marketStore.symbol,
      technical: typeStr,
      period: p,
      value: result,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to calculate technical');
  }
};
