import { GitHubClient } from "../clients/github-client.js";

export interface PRAnalysisResult {
  language: string;
  prCount: number;
  additions: number;
  deletions: number;
}

export class PRAnalyzer {
  private maxPRsPerRepo: number;

  constructor(config: { maxPRsPerRepo?: number }) {
    this.maxPRsPerRepo = config.maxPRsPerRepo || 50;
  }

  async analyzePullRequests(owner: string, repo: string, client: GitHubClient): Promise<PRAnalysisResult[]> {
    const languages = await client.getLanguages(owner, repo);
    const prs = await client.getPullRequests(owner, repo, this.maxPRsPerRepo);
    
    if (Object.keys(languages).length === 0 || prs.length === 0) return [];
    
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const results: PRAnalysisResult[] = [];
    
    for (const [language, bytes] of Object.entries(languages)) {
      const ratio = bytes / total;
      results.push({
        language,
        prCount: Math.round(prs.length * ratio) || 1,
        additions: 0,
        deletions: 0,
      });
    }
    
    return results.sort((a, b) => b.prCount - a.prCount);
  }

  aggregateResults(all: PRAnalysisResult[][]): PRAnalysisResult[] {
    const map = new Map<string, { prCount: number; additions: number; deletions: number }>();
    for (const results of all) {
      for (const r of results) {
        const existing = map.get(r.language);
        if (existing) {
          existing.prCount += r.prCount;
          existing.additions += r.additions;
          existing.deletions += r.deletions;
        } else {
          map.set(r.language, { prCount: r.prCount, additions: r.additions, deletions: r.deletions });
        }
      }
    }
    const final: PRAnalysisResult[] = [];
    for (const [language, stats] of map) {
      final.push({ language, ...stats });
    }
    return final.sort((a, b) => b.prCount - a.prCount);
  }
}
