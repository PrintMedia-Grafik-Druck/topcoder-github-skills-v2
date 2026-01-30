import axios from 'axios';
import { createLogger } from '../utils/logger';
import { TopcoderSkill } from '../types/topcoder.types';

const logger = createLogger('TopcoderClient');

export class TopcoderClient {
  private apiUrl: string;
  private skillsCache: TopcoderSkill[] | null = null;

  constructor(apiUrl: string = 'https://api.topcoder-dev.com/v5') {
    this.apiUrl = apiUrl;
  }

  async getAllSkills(): Promise<TopcoderSkill[]> {
    if (this.skillsCache) {
      logger.info('Using cached skills');
      return this.skillsCache;
    }

    try {
      logger.info('Fetching Topcoder skills...');
      const response = await axios.get(this.apiUrl + '/standardized-skills', {
        timeout: 10000
      });

      const skills = response.data.result.content || [];
      this.skillsCache = skills;
      logger.success('Fetched ' + skills.length + ' skills');
      
      return skills;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch skills', error);
      return [];
    }
  }

  async findSkillByName(name: string): Promise<TopcoderSkill | null> {
    const skills = await this.getAllSkills();
    const found = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    return found || null;
  }
}
