import { createLogger } from '../utils/logger';

const logger = createLogger('GitHubOAuth');

export class GitHubOAuth {
  async authenticate(): Promise<string> {
    logger.info('OAuth not implemented - using token from env');
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GITHUB_TOKEN required');
    }
    
    return token;
  }
}
