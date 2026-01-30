import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  githubClientId: string;
  githubToken?: string;
  topcoderApiUrl: string;
  openaiApiKey?: string;
  aiEnabled: boolean;
}

function validateConfig(): Config {
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN required');
  }

  return {
    githubToken,
    githubClientId: process.env.GITHUB_CLIENT_ID || '',
  topcoderApiUrl: process.env.TOPCODER_API_URL || 'https://api.topcoder-dev.com/v5',
    openaiApiKey: process.env.OPENAI_API_KEY,
    aiEnabled: process.env.AI_ENABLED === 'true'
  };
}

export const config = validateConfig();
