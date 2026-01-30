import { GitHubClient } from '../clients/github-client';
import { createLogger } from '../utils/logger';
import { Repository } from '../types/github.types';

const logger = createLogger('PRAnalyzer');

export class PRAnalyzer {
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async analyzePullRequests(repos: Repository[], username: string): Promise<{ prCount: number; codeVolume: number }> {
    let totalPRs = 0;
    let totalCodeVolume = 0;

    for (const repo of repos) {
      const prs = await this.githubClient.getRepoPullRequests(repo.owner.login, repo.name, username);
      totalPRs += prs.length;

      const codeVolume = prs.reduce((sum: number, pr) => {
        const additions = pr.additions || 0;
        const deletions = pr.deletions || 0;
        return sum + additions + deletions;
      }, 0);

      totalCodeVolume += codeVolume;
      logger.info(`${repo.name}: ${prs.length} PRs, ${codeVolume} code changes`);
    }

    return { prCount: totalPRs, codeVolume: totalCodeVolume };
  }
}
