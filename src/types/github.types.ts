export interface GitHubUser {
  login: string;
  id: number;
  name: string;
  email: string;
  bio: string;
  public_repos: number;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  description: string;
  language: string;
}

export interface GitHubRepository extends Repository {}

export interface Commit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    message: string;
  };
  html_url: string;
  stats?: { additions: number; deletions: number };
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  additions: number;
  deletions: number;
  changed_files?: number;
  user?: { login: string };
}

export interface LanguageStats {
  [language: string]: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}
