export interface Evidence {
  type: 'repository' | 'commit' | 'pull_request' | 'language';
  url: string;
  description: string;
  weight: number;
}

export interface SkillRecommendation {
  skillId: string;
  skillName: string;
  confidence: number;
  evidence: Evidence[];
}

export interface AnalysisSummary {
  repositoriesScanned: number;
  commitsAnalyzed: number;
  pullRequestsAnalyzed: number;
  apiCallsTotal: number;
  elapsedTimeMs: number;
  rateLimitRemaining: number;
  recommendations: SkillRecommendation[];
}
