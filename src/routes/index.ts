import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import { predictionController } from '../controllers/prediction.controller';
import {
  loadMarketData,
  getMarketSummary,
  getLatestCandle,
  getLastNCandles,
  getTechnicals,
  getCustomTechnical,
} from '../controllers/market-data.controller';

const router = Router();

// Health check route
router.get('/health', healthCheck);

// Market data routes
router.post('/market/load', loadMarketData);
router.get('/market/summary', getMarketSummary);
router.get('/market/latest', getLatestCandle);
router.get('/market/candles', getLastNCandles);
router.get('/market/technicals', getTechnicals);
router.get('/market/technical', getCustomTechnical);

// Prediction routes
router.post('/predict', predictionController);

// Agent management routes
router.get('/agent/status', (_req, res) => {
  res.json({ status: 'active', capabilities: ['market_analysis', 'prediction'] });
});

export default router;
