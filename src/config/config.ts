import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  githubClientId?: string;
  githubClientSecret?: string;
  githubToken?: string;
  topcoderApiUrl: string;
  openaiApiKey?: string;
  aiEnabled: boolean;
  aiModel: string;
}

function validateConfig(): Config {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!githubToken && (!githubClientId || !githubClientSecret)) {
    throw new Error('Either GITHUB_TOKEN or (GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET) required');
  }

  return {
    githubClientId,
    githubClientSecret,
    githubToken,
    topcoderApiUrl: process.env.TOPCODER_API_URL || 'https://api.topcoder-dev.com/v5',
    openaiApiKey: process.env.OPENAI_API_KEY,
    aiEnabled: process.env.AI_ENABLED === 'true',
    aiModel: process.env.AI_MODEL || 'gpt-4'
  };
}

export const config = validateConfig();
