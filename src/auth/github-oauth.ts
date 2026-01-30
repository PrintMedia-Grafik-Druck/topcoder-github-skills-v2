import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { createLogger } from '../utils/logger';
import { config } from '../config/config';

const logger = createLogger('GitHubOAuth');

export class GitHubOAuth {
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || config.githubClientId || 'Iv1.b507a08c87ecfe98';
  }

  async authenticate(): Promise<string> {
    logger.info('🔐 Starting GitHub OAuth Device Flow...');

    const auth = createOAuthDeviceAuth({
      clientType: 'oauth-app',
      clientId: this.clientId,
      onVerification: (verification) => {
        logger.info('GitHub Authentication Required');
        logger.info(`Please visit: ${verification.verification_uri}`);
        logger.info(`Enter code: ${verification.user_code}`);
        logger.info('Waiting for authentication...');
      },
    });

    try {
      const { token } = await auth({ type: 'oauth' });
      logger.success('✅ Authentication successful!');
      return token;
    } catch (error: unknown) {
      logger.error('❌ OAuth Device Flow failed', error as Error);
      
      const envToken = config.githubToken;
      if (envToken) {
        logger.warn('⚠️ Falling back to GITHUB_TOKEN from environment');
        return envToken;
      }
      
      throw new Error('Authentication failed and no GITHUB_TOKEN found');
    }
  }
}
