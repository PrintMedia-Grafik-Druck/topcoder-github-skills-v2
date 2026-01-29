import { Octokit } from "@octokit/rest";
import { RateLimiter } from "../utils/rate-limiter.js";
import { Logger } from "../utils/logger.js";
import type {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubPullRequest,
  LanguageStats,
} from "../types/github.types.js";

export interface GitHubClientConfig {
  token: string;
  rateLimiter: RateLimiter;
  logger: Logger;
}

export class GitHubClient {
  private octokit: Octokit;
  private rateLimiter: RateLimiter;
  private logger: Logger;
  private apiCallCount: number = 0;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.rateLimiter = config.rateLimiter;
    this.logger = config.logger;
  }

  getApiCallCount(): number {
    return this.apiCallCount;
  }

  private async trackApiCall<T>(operation: () => Promise<T>): Promise<T> {
    await this.rateLimiter.waitIfNeeded();
    this.apiCallCount++;
    return operation();
  }

  async getUserProfile(): Promise<GitHubUser> {
    this.logger.debug("Fetching user profile...");
    try {
      const response = await this.trackApiCall(() =>
        this.octokit.users.getAuthenticated()
      );
      return {
        login: response.data.login,
        id: response.data.id,
        name: response.data.name || undefined,
        email: response.data.email || undefined,
        bio: response.data.bio || undefined,
        publicRepos: response.data.public_repos,
        followers: response.data.followers,
        following: response.data.following,
        createdAt: response.data.created_at,
        avatarUrl: response.data.avatar_url,
        htmlUrl: response.data.html_url,
      };
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Failed to fetch user profile: ${err.message}`);
    }
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    const repos: GitHubRepository[] = [];
    let page = 1;
    while (true) {
      const response = await this.trackApiCall(() =>
        this.octokit.repos.listForAuthenticatedUser({
          per_page: 100,
          page,
          sort: "updated",
        })
      );
      for (const repo of response.data) {
        repos.push({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          description: repo.description || undefined,
          language: repo.language || undefined,
          stargazersCount: repo.stargazers_count,
          forksCount: repo.forks_count,
          openIssuesCount: repo.open_issues_count,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at || undefined,
          htmlUrl: repo.html_url,
          fork: repo.fork,
          private: repo.private,
        });
      }
      if (response.data.length < 100) break;
      page++;
      if (page > 10) break;
    }
    return repos;
  }

  async getCommits(owner: string, repo: string, max: number = 100): Promise<GitHubCommit[]> {
    const commits: GitHubCommit[] = [];
    let page = 1;
    while (commits.length < max) {
      try {
        const response = await this.trackApiCall(() =>
          this.octokit.repos.listCommits({ owner, repo, per_page: 100, page })
        );
        for (const commit of response.data) {
          if (commits.length >= max) break;
          commits.push({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || "Unknown",
            authorEmail: commit.commit.author?.email,
            date: commit.commit.author?.date || "",
            htmlUrl: commit.html_url,
            stats: commit.stats ? {
              additions: commit.stats.additions || 0,
              deletions: commit.stats.deletions || 0,
              total: commit.stats.total || 0,
            } : undefined,
          });
        }
        if (response.data.length < 100) break;
        page++;
      } catch {
        break;
      }
    }
    return commits;
  }

  async getPullRequests(owner: string, repo: string, max: number = 50): Promise<GitHubPullRequest[]> {
    const prs: GitHubPullRequest[] = [];
    let page = 1;
    while (prs.length < max) {
      try {
        const response = await this.trackApiCall(() =>
          this.octokit.pulls.list({ owner, repo, state: "all", per_page: 100, page })
        );
        for (const pr of response.data) {
          if (prs.length >= max) break;
          prs.push({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state as "open" | "closed",
            author: pr.user?.login || "Unknown",
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            mergedAt: pr.merged_at || undefined,
            htmlUrl: pr.html_url,
            additions: 0,
            deletions: 0,
            changedFiles: 0,
          });
        }
        if (response.data.length < 100) break;
        page++;
      } catch {
        break;
      }
    }
    return prs;
  }

  async getLanguages(owner: string, repo: string): Promise<LanguageStats> {
    try {
      const response = await this.trackApiCall(() =>
        this.octokit.repos.listLanguages({ owner, repo })
      );
      return response.data as LanguageStats;
    } catch {
      return {};
    }
  }
}
