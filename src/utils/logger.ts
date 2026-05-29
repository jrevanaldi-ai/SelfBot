import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const baileysLogger = pino({
  level: config.baileysLogLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
});
