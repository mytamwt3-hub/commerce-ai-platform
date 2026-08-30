import { Queue } from 'bullmq';
import Redis from '../lib/redis';

// We pass the ioredis instance as the connection
export const investmentQueue = new Queue('investment', { connection: (Redis as any) });
