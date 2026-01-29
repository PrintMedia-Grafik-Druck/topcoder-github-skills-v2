import { TopcoderClient } from "../clients/topcoder-client.js";
import { calculateConfidence } from "../utils/confidence.js";
import type { CommitAnalysisResult } from "./commit-analyzer.js";
import type { PRAnalysisResult } from "./pr-analyzer.js";
import type { Evidence, SkillRecommendation } from "../types/analysis.types.js";
import type { GitHubRepository } from "../types/github.types.js";

export interface AnalysisData {
  username: string;
  repositories: GitHubRepository[];
  commitAnalysis: CommitAnalysisResult[];
  prAnalysis: PRAnalysisResult[];
}

const LANGUAGE_MAPPINGS: Record<string, string> = {
  JavaScript: "JavaScript",
  TypeScript: "TypeScript",
  Python: "Python",
  Java: "Java",
  Go: "Go",
  Rust: "Rust",
  "C++": "C++",
  "C#": "C#",
  Ruby: "Ruby",
  PHP: "PHP",
  Swift: "Swift",
  Kotlin: "Kotlin",
};

export class SkillMatcher {
  constructor(_config: { logger: unknown }) {
    // Config stored but not used in simplified version
  }

  async matchSkills(data: AnalysisData, client: TopcoderClient): Promise<SkillRecommendation[]> {
    const stats = this.aggregateStats(data);
    const recommendations: SkillRecommendation[] = [];

    for (const [language, metrics] of Object.entries(stats)) {
      const skillName = LANGUAGE_MAPPINGS[language] || language;
      const skill = await client.findSkillByName(skillName);
      
      if (!skill) continue;

      const confidence = calculateConfidence({
        commits: metrics.commits,
        pullRequests: metrics.prCount,
        codeVolume: metrics.codeVolume,
        repositories: metrics.repoCount,
      });

      const evidence = this.generateEvidence(language, data, metrics);

      recommendations.push({
        skill,
        confidence,
        evidence,
        metrics: {
          commits: metrics.commits,
          pullRequests: metrics.prCount,
          codeVolume: metrics.codeVolume,
          repositories: metrics.repoCount,
        },
      });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private aggregateStats(data: AnalysisData) {
    const stats: Record<string, { commits: number; prCount: number; codeVolume: number; repoCount: number }> = {};
    
    for (const c of data.commitAnalysis) {
      if (!stats[c.language]) stats[c.language] = { commits: 0, prCount: 0, codeVolume: 0, repoCount: 0 };
      stats[c.language].commits += c.commits;
      stats[c.language].codeVolume += c.codeVolume;
    }
    
    for (const p of data.prAnalysis) {
      if (!stats[p.language]) stats[p.language] = { commits: 0, prCount: 0, codeVolume: 0, repoCount: 0 };
      stats[p.language].prCount += p.prCount;
    }
    
    for (const repo of data.repositories) {
      if (repo.language && stats[repo.language]) {
        stats[repo.language].repoCount++;
      }
    }
    
    return stats;
  }

  private generateEvidence(language: string, data: AnalysisData, metrics: any): Evidence[] {
    const evidence: Evidence[] = [];
    const repos = data.repositories.filter(r => r.language === language).slice(0, 5);
    
    for (const repo of repos) {
      evidence.push({
        type: "repository",
        description: `Repository: ${repo.name}`,
        url: repo.htmlUrl,
        metrics: { stars: repo.stargazersCount, forks: repo.forksCount },
      });
    }
    
    if (metrics.commits > 0) {
      evidence.push({
        type: "commits",
        description: `${metrics.commits} commits in ${language}`,
        metrics: { count: metrics.commits },
      });
    }
    
    return evidence;
  }
}
