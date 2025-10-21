import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';
import { predictionController } from '../controllers/prediction.controller';

const router = Router();

// Health check route
router.get('/health', healthCheck);

// Prediction routes
router.post('/predict', predictionController);

// Agent management routes
router.get('/agent/status', (req, res) => {
  // TODO: Implement agent status endpoint
  res.json({ status: 'active', capabilities: ['market_analysis', 'prediction'] });
});

export default router;
