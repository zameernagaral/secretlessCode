const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => {
  logger.error('[Prisma Error]', { message: e.message, target: e.target });
});

prisma.$on('warn', (e) => {
  logger.warn('[Prisma Warning]', { message: e.message });
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug('[Prisma Query]', { query: e.query, duration: `${e.duration}ms` });
  });
}

module.exports = prisma;
