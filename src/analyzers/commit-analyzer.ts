import { GitHubClient } from "../clients/github-client.js";

export interface CommitAnalysisResult {
  language: string;
  commits: number;
  codeVolume: number;
}

export class CommitAnalyzer {
  private maxCommitsPerRepo: number;

  constructor(config: { maxCommitsPerRepo?: number }) {
    this.maxCommitsPerRepo = config.maxCommitsPerRepo || 100;
  }

  async analyzeCommits(owner: string, repo: string, client: GitHubClient): Promise<CommitAnalysisResult[]> {
    const languages = await client.getLanguages(owner, repo);
    const commits = await client.getCommits(owner, repo, this.maxCommitsPerRepo);
    
    if (Object.keys(languages).length === 0) return [];
    
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const results: CommitAnalysisResult[] = [];
    
    for (const [language, bytes] of Object.entries(languages)) {
      const ratio = bytes / total;
      const estimatedCommits = Math.round(commits.length * ratio);
      let codeVolume = 0;
      for (const c of commits) {
        if (c.stats) codeVolume += c.stats.additions + c.stats.deletions;
      }
      results.push({
        language,
        commits: estimatedCommits || 1,
        codeVolume: Math.round(codeVolume * ratio) || bytes,
      });
    }
    
    return results.sort((a, b) => b.codeVolume - a.codeVolume);
  }

  aggregateResults(all: CommitAnalysisResult[][]): CommitAnalysisResult[] {
    const map = new Map<string, { commits: number; codeVolume: number }>();
    for (const results of all) {
      for (const r of results) {
        const existing = map.get(r.language);
        if (existing) {
          existing.commits += r.commits;
          existing.codeVolume += r.codeVolume;
        } else {
          map.set(r.language, { commits: r.commits, codeVolume: r.codeVolume });
        }
      }
    }
    const final: CommitAnalysisResult[] = [];
    for (const [language, stats] of map) {
      final.push({ language, ...stats });
    }
    return final.sort((a, b) => b.codeVolume - a.codeVolume);
  }
}
