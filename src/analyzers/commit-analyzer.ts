import { GitHubClient } from '../clients/github-client';
import { createLogger } from '../utils/logger';
import { Repository } from '../types/github.types';

const logger = createLogger('CommitAnalyzer');

export class CommitAnalyzer {
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async analyzeCommits(repos: Repository[], username: string): Promise<{ commitCount: number; codeVolume: number }> {
    let totalCommits = 0;
    let totalCodeVolume = 0;

    for (const repo of repos) {
      const commits = await this.githubClient.getRepoCommits(repo.owner.login, repo.name, username);
      totalCommits += commits.length;

      const codeVolume = commits.reduce((sum: number, commit) => {
        const additions = commit.stats?.additions || 0;
        const deletions = commit.stats?.deletions || 0;
        return sum + additions + deletions;
      }, 0);

      totalCodeVolume += codeVolume;
      logger.info(`${repo.name}: ${commits.length} commits, ${codeVolume} code changes`);
    }

    return { commitCount: totalCommits, codeVolume: totalCodeVolume };
  }
}
