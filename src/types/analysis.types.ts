import type { TopcoderSkill } from './topcoder.types';

export interface Evidence {
  type: 'repository' | 'commits' | 'pull_requests' | 'language';
  description: string;
  url?: string;
  metrics?: Record<string, number>;
}

export interface SkillRecommendation {
  skill: TopcoderSkill;
  confidence: number;
  evidence: Evidence[];
  metrics?: {
    commits: number;
    pullRequests: number;
    codeVolume: number;
    repositories: number;
  };
  aiVerified?: boolean;
  aiConfidence?: number;
}
