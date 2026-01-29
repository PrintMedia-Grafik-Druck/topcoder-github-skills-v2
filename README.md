# GitHub Skills Analyzer for Topcoder

Deep analysis tool that examines GitHub profiles and recommends matching skills from the Topcoder Skills API.

## Features

- GitHub OAuth Device Flow - Secure authentication
- Deep Repository Analysis - Commits, PRs, code volume
- Rate Limiting - Handles GitHub API limits gracefully
- Skill Matching - Maps languages to Topcoder skills
- Confidence Scoring - 0-100 based on contribution metrics
- Evidence Links - Direct links to repos, commits, PRs
- AI Verification (Optional) - OpenAI-powered validation
- Progress Output - Real-time analysis feedback
- Production Ready - TypeScript strict mode, 0 vulnerabilities

## Tech Stack

- TypeScript 5.x (strict mode)
- @octokit/rest - GitHub API client
- @octokit/auth-oauth-device - OAuth Device Flow
- axios - HTTP client for Topcoder API
- commander - CLI framework
- chalk - Terminal colors
- ora - Progress spinners
- dotenv - Environment configuration
- openai (optional) - AI skill verification

## Installation

npm install
npm run build

## Configuration

1. Create .env file:
cp .env.example .env

2. Required: GitHub OAuth App
   Go to: https://github.com/settings/developers
   Create OAuth App
   Copy Client ID to .env:
   GITHUB_CLIENT_ID=your_client_id_here

3. Optional: OpenAI API (for AI verification)
   OPENAI_API_KEY=sk-your_key_here
   AI_ENABLED=true

## Usage

Basic Analysis:
npm start analyze

With AI Verification:
npm start analyze --ai

Limit Repositories:
npm start analyze --max-repos 10

Verbose Logging:
npm start analyze -v

## Architecture

src/
  auth/ - OAuth Device Flow implementation
  clients/ - GitHub and Topcoder API wrappers
  analyzers/ - Commit, PR, and skill analysis logic
  utils/ - Logger, rate limiter, confidence scoring
  types/ - TypeScript type definitions
  config/ - Configuration loader
  index.ts - CLI entry point

## Security

- No hardcoded secrets
- Environment variables only
- Input validation
- Typed error handling
- Rate limiting
- 0 npm vulnerabilities

## How It Works

1. Authentication: GitHub OAuth Device Flow - user authorizes via browser
2. Data Collection: Fetches repos, commits, PRs, language statistics
3. Skill Matching: Maps languages to Topcoder skills with confidence scoring
4. Evidence Generation: Links to repositories, commits, PRs
5. AI Verification (Optional): OpenAI GPT-4 validates recommendations

## Approach

Why This Approach?
- OAuth Device Flow: Most secure for CLI apps
- Deep Analysis: Analyzes actual commits and PRs, not just repo languages
- Weighted Scoring: Recent contributions weighted higher
- Evidence-Based: Every recommendation backed by GitHub links
- Rate Limit Safe: Respects API limits with automatic pause/resume

Differentiators:
- Not just has JavaScript repos - Analyzes actual commit volume
- Not just public repos - Includes all accessible repositories
- Not just languages - Maps to Topcoder standardized skill taxonomy
- Not surface-level - Deep dives into contribution patterns

## Requirements Met

- GitHub OAuth Device Flow authentication
- Deep insight into user activities (commits, PRs)
- Rate limiting with pause/resume
- Topcoder Skills API integration
- Skill ID + Name from standardized API
- Confidence scoring (0-100)
- Evidence with URLs to GitHub resources
- Progress output during analysis
- Analysis summary (repos, commits, PRs, API calls, time)
- SAST compliant (no secrets, typed errors, input validation)

## Production Ready

- TypeScript strict mode
- ESLint clean
- 0 vulnerabilities
- Comprehensive error handling
- Rate limiting
- Secure authentication

## License

ISC
