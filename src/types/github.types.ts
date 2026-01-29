export interface GitHubUser {
  login: string;
  id: number;
  name?: string;
  email?: string;
  bio?: string;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description?: string;
  language?: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt?: string;
  htmlUrl: string;
  fork: boolean;
  private: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  authorEmail?: string;
  date: string;
  htmlUrl: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  htmlUrl: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface LanguageStats {
  [language: string]: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}
