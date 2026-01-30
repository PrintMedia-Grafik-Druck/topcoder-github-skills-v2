import { TopcoderClient } from '../clients/topcoder-client';
import { createLogger } from '../utils/logger';
import { GitHubRepository } from '../types/github.types';
import { SkillRecommendation, Evidence } from '../types/skill.types';
import { calculateConfidence, ContributionMetrics } from '../utils/confidence';

const logger = createLogger('SkillMatcher');

export class SkillMatcher {
  private topcoderClient: TopcoderClient;

  constructor(topcoderClient: TopcoderClient) {
    this.topcoderClient = topcoderClient;
  }

  async matchSkills(
    languageStats: Map<string, number>,
    repos: GitHubRepository[],
    commitData: { commitCount: number; codeVolume: number },
    prData: { prCount: number; codeVolume: number }
  ): Promise<SkillRecommendation[]> {
    logger.info('Starting skill matching...');
    const skills = await this.topcoderClient.getAllSkills();
    const recommendations: SkillRecommendation[] = [];

    for (const [language, bytes] of languageStats.entries()) {
      const skill = skills.find(s => s.name.toLowerCase() === language.toLowerCase());
      
      if (skill) {
        const metrics: ContributionMetrics = {
          commitCount: commitData.commitCount,
          prCount: prData.prCount,
          codeVolume: bytes,
          repoCount: repos.filter(r => r.language === language).length,
          daysSinceLastActivity: 0
        };

        const confidence = calculateConfidence(metrics);
        
        const evidence: Evidence[] = repos
          .filter(r => r.language === language)
          .slice(0, 5)
          .map(r => ({
            type: 'repository' as const,
            url: r.html_url,
            description: r.name + ' (' + bytes + ' bytes)',
            weight: 1
          }));

        recommendations.push({
          skillId: skill.id,
          skillName: skill.name,
          confidence,
          evidence
        });
      }
    }

    logger.success('Matched ' + recommendations.length + ' skills');
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }
}
