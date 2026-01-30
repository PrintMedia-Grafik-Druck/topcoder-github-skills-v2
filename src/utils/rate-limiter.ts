import { createLogger } from './logger';
import { RateLimit } from '../types/github.types';

const logger = createLogger('RateLimiter');

export class RateLimiter {
  private primaryLimit: RateLimit = { limit: 5000, remaining: 5000, reset: 0 };
  private secondaryRetryAfter = 0;

  async waitIfNeeded(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    if (this.primaryLimit.remaining <= 1 && now < this.primaryLimit.reset) {
      const waitTime = (this.primaryLimit.reset - now) * 1000 + 1000;
      logger.warn(`Rate limit reached. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    if (this.secondaryRetryAfter > Date.now()) {
      const waitTime = this.secondaryRetryAfter - Date.now();
      logger.warn(`Secondary rate limit. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  updateLimits(headers: Record<string, string | number | undefined>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const limit = headers['x-ratelimit-limit'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining && limit && reset) {
      this.primaryLimit = {
        remaining: parseInt(String(remaining), 10),
        limit: parseInt(String(limit), 10),
        reset: parseInt(String(reset), 10)
      };
    }

    const retryAfter = headers['retry-after'];
    if (retryAfter) {
      this.secondaryRetryAfter = Date.now() + parseInt(String(retryAfter), 10) * 1000;
    }
  }

  getRemaining(): number {
    return this.primaryLimit.remaining;
  }

  getTotalCalls(): number {
    return this.primaryLimit.limit - this.primaryLimit.remaining;
  }
}
