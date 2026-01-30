import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { createLogger } from '../utils/logger';

const logger = createLogger('GitHubOAuth');

export class GitHubOAuth {
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.GITHUB_CLIENT_ID || 'Iv1.b507a08c87ecfe98';
  }

  async authenticate(): Promise<string> {
    logger.info('🔐 Starting GitHub OAuth Device Flow...');

    const auth = createOAuthDeviceAuth({
      clientType: 'oauth-app',
      clientId: this.clientId,
      onVerification: (verification) => {
        console.log('\n' + '='.repeat(70));
        console.log('🔑 GitHub Authentication Required');
        console.log('='.repeat(70));
        console.log(`\n1. Visit: ${verification.verification_uri}`);
        console.log(`2. Enter code: ${verification.user_code}`);
        console.log(`\n⏳ Waiting for authentication...`);
        console.log('='.repeat(70) + '\n');
      },
    });

    try {
      const { token } = await auth({ type: 'oauth' });
      logger.success('✅ Authentication successful!');
      return token;
    } catch (error) {
      logger.error('❌ OAuth Device Flow failed', error as Error);
      
      const envToken = process.env.GITHUB_TOKEN;
      if (envToken) {
        logger.warn('⚠️ Falling back to GITHUB_TOKEN from environment');
        return envToken;
      }
      
      throw new Error('Authentication failed and no GITHUB_TOKEN found');
    }
  }
}
