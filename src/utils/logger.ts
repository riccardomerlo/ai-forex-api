import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console logging
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger
export const logger = winston.createLogger({
    level: config.logLevel,
    format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
    ),
    defaultMeta: { service: 'express-api' },
    transports: [
        // Write all logs with importance level of 'error' or less to 'error.log'
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of 'info' or less to 'combined.log'
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If we're not in production, log to the console with a simple format
if (config.nodeEnv !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: combine(colorize(), consoleFormat),
        })
    );
}