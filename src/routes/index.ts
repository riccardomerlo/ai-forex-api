import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

// Health endpoint
router.get('/health', getHealth);

export default router;