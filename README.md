# GitHub Skills Analyzer for Topcoder - Deep Analysis Edition

TypeScript CLI application that analyzes GitHub profiles and recommends Topcoder skills using OAuth Device Flow authentication.

## Features

- OAuth Device Flow Authentication - Secure GitHub authentication without personal access tokens
- Deep Commit Analysis - Analyzes actual code changes not just repository metadata
- Pull Request Analysis - Evaluates contributions through pull requests
- Topcoder Skills API Integration - Matches detected technologies to Topcoder skills
- Confidence Scoring - Evidence-based scoring 0-100 based on code volume and activity
- Rate Limiting - Automatic pause resume when GitHub API limits are reached
- Type-safe Implementation - Full TypeScript strict mode with no any types
- Production-ready - Comprehensive error handling and logging

## Tech Stack

- TypeScript 5.x strict mode
- octokit rest - GitHub API client
- octokit auth-oauth-device - OAuth Device Flow
- axios - HTTP client for Topcoder API
- commander - CLI framework
- chalk - Terminal colors
- dotenv - Environment configuration
- Node.js 20+

## Installation

npm install
npm run build

## Configuration

Option 1 OAuth Device Flow Recommended - No configuration needed. The app will display a GitHub URL, show a verification code, wait for you to authenticate in your browser.

Option 2 Environment Variables - Create a .env file: cp .env.example .env

Edit .env:
GITHUB_TOKEN=ghp_your_token_here
GITHUB_CLIENT_ID=your_client_id
TOPCODER_API_URL=https://api.topcoder-dev.com/v5
AI_ENABLED=false

## Usage

npm start analyze

With OAuth Device Flow: Run the command, visit the displayed URL, enter the verification code, analysis begins automatically.

Sample Output: Starting GitHub OAuth Device Flow, GitHub Authentication Required, Visit https://github.com/login/device, Enter code ABCD-1234, Waiting for authentication, Authentication successful, Authenticated as your-username, Found 45 repositories, Analyzed 8 languages, Analyzed 234 commits, Analyzed 56 pull requests, SKILL RECOMMENDATIONS, JavaScript ID 123, Confidence 95/100, Evidence 5 sources, repository awesome-project 1234567 bytes, commit feat add new feature, pull_request PR 123 Refactor authentication, ANALYSIS SUMMARY, Repositories Scanned 45, Commits Analyzed 234, Pull Requests Analyzed 56, API Calls 102, Rate Limit Remaining 4898, Elapsed Time 45230ms, Skills Recommended 8

## Architecture

src auth github-oauth.ts OAuth Device Flow implementation, src clients github-client.ts GitHub API with rate limiting, src clients topcoder-client.ts Topcoder Skills API, src analyzers commit-analyzer.ts Deep commit analysis, src analyzers pr-analyzer.ts Pull request analysis, src analyzers skill-matcher.ts Match tech to skills, src analyzers ai-verifier.ts AI verification optional, src utils logger.ts Structured logging, src utils rate-limiter.ts GitHub API rate limiting, src utils confidence.ts Confidence scoring algorithm, src types github.types.ts GitHub API types, src types topcoder.types.ts Topcoder API types, src types skill.types.ts Skill recommendation types, src config config.ts Configuration validation, src index.ts CLI entry point

## Approach

Why OAuth Device Flow - More secure no personal access tokens stored, Better UX user authenticates in browser, Follows best practices GitHub-recommended approach

Why Deep Analysis - Instead of just counting repositories and languages we analyze commits parse actual code changes additions deletions, analyze PRs evaluate contribution quality through pull requests, calculate evidence build confidence scores based on real activity, provide links direct GitHub URLs to verify evidence

Confidence Scoring algorithm 0-100: Commit count 100+ commits = 40 points, 50+ = 30, 20+ = 20, 5+ = 10, PR count 20+ PRs = 25 points, 10+ = 20, 5+ = 15, 1+ = 10, Code volume 10K+ bytes = 20 points, 5K+ = 15, 1K+ = 10, 100+ = 5, Repo count 10+ repos = 10 points, 5+ = 7, 2+ = 5, 1+ = 3, Recency penalty -5 if >365 days, -3 if >180, -1 if >90

## Security

No hardcoded secrets - All sensitive data via environment variables
OAuth Device Flow - Secure authentication without storing tokens
No eval or new Function - No dynamic code execution
Typed error handling - All errors properly typed
Input validation - All user inputs validated
SAST compliant - Passes Semgrep security analysis
0 vulnerabilities - npm audit clean

## Quality Metrics

TypeScript strict mode - All code fully typed
ESLint clean - 0 errors, 0 warnings
NPM Audit clean - 0 vulnerabilities
Modular architecture - Clear separation of concerns
Comprehensive logging - Structured logs with context
Production-ready - Error handling, rate limiting, retry logic

## Development

npm run dev - Development mode with auto-reload
npm run lint - Lint code
npm run lint:fix - Fix lint issues
npm run audit - Security audit

## Repository

https://github.com/PrintMedia-Grafik-Druck/topcoder-github-skills-v2
Commit 46314e2
Lines of Code 750+ lines

## License

ISC
