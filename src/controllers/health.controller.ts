import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const getHealth = (req: Request, res: Response) => {
    logger.info('Health check requested');
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
};