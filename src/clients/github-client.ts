import { Octokit } from '@octokit/rest';
import { createLogger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { GitHubUser, Repository, Commit, PullRequest, LanguageStats } from '../types/github.types';

const logger = createLogger('GitHubClient');

export class GitHubClient {
  private octokit: Octokit;
  private rateLimiter: RateLimiter;
  private apiCallCount = 0;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'topcoder-github-skills-v2'
    });
    this.rateLimiter = new RateLimiter();
  }

  async getAuthenticatedUser(): Promise<GitHubUser> {
    try {
      await this.rateLimiter.waitIfNeeded();
      this.apiCallCount++;
      
      logger.info('Fetching authenticated user...');
      const response = await this.octokit.users.getAuthenticated();
      
      this.rateLimiter.updateLimits(response.headers);
      logger.success('User fetched');
      
      return response.data as GitHubUser;
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch user', error);
      throw new Error('Failed: ' + error.message);
    }
  }

  async getUserRepos(username: string): Promise<Repository[]> {
    try {
      await this.rateLimiter.waitIfNeeded();
      this.apiCallCount++;
      
      logger.info('Fetching repos for: ' + username);
      const response = await this.octokit.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 100
      });
      
      this.rateLimiter.updateLimits(response.headers);
      logger.success('Fetched ' + response.data.length + ' repos');
      
      return response.data as Repository[];
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to fetch repos', error);
      throw error;
    }
  }

  async getRepoLanguages(owner: string, repo: string): Promise<LanguageStats> {
    try {
      await this.rateLimiter.waitIfNeeded();
      this.apiCallCount++;
      
      const response = await this.octokit.repos.listLanguages({ owner, repo });
      this.rateLimiter.updateLimits(response.headers);
      
      return response.data as LanguageStats;
    } catch (err) {
      logger.warn('Failed languages for ' + owner + '/' + repo);
      return {};
    }
  }

  async getRepoCommits(owner: string, repo: string, author: string): Promise<Commit[]> {
    try {
      await this.rateLimiter.waitIfNeeded();
      this.apiCallCount++;
      
      logger.progress('Fetching commits: ' + repo);
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        author,
        per_page: 100
      });
      
      this.rateLimiter.updateLimits(response.headers);
      
      return response.data as Commit[];
    } catch (err) {
      logger.warn('Failed commits for ' + repo);
      return [];
    }
  }

  async getRepoPullRequests(owner: string, repo: string, creator: string): Promise<PullRequest[]> {
    try {
      await this.rateLimiter.waitIfNeeded();
      this.apiCallCount++;
      
      logger.progress('Fetching PRs: ' + repo);
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100
      });
      
      this.rateLimiter.updateLimits(response.headers);
      
      const userPRs = response.data.filter(pr => pr.user?.login === creator);
      
      return userPRs.map(pr => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        html_url: pr.html_url,
        state: pr.state,
        additions: 0,
        deletions: 0
      }));
    } catch (err) {
      logger.warn('Failed PRs for ' + repo);
      return [];
    }
  }

  getApiCallCount(): number {
    return this.apiCallCount;
  }

  getRateLimitRemaining(): number {
    return this.rateLimiter.getRemaining();
  }
}
