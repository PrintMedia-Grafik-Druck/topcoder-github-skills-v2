import { createLogger } from '../utils/logger';
import { SkillRecommendation } from '../types/skill.types';

const logger = createLogger('AIVerifier');

export class AIVerifier {
  private enabled: boolean;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  async verifySkills(recommendations: SkillRecommendation[]): Promise<SkillRecommendation[]> {
    if (!this.enabled) {
      logger.info('AI verification disabled');
      return recommendations;
    }

    logger.info('AI verification not implemented yet');
    return recommendations;
  }
}
