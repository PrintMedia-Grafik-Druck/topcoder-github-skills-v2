#!/usr/bin/env node
import { Command } from 'commander';
import { GitHubOAuth } from './auth/github-oauth';
import { GitHubClient } from './clients/github-client';
import { TopcoderClient } from './clients/topcoder-client';
import { CommitAnalyzer } from './analyzers/commit-analyzer';
import { PRAnalyzer } from './analyzers/pr-analyzer';
import { SkillMatcher } from './analyzers/skill-matcher';
import { AIVerifier } from './analyzers/ai-verifier';
import { createLogger } from './utils/logger';
import { config } from './config/config';

const logger = createLogger('Main');

const program = new Command();

program
  .name('github-skills-analyzer')
  .description('Analyze GitHub profile and recommend Topcoder skills')
  .version('2.0.0');

program
  .command('analyze')
  .description('Analyze authenticated user GitHub profile')
  .action(async () => {
    const startTime = Date.now();
    
    try {
      logger.info('Starting GitHub Skills Analysis...');

      logger.info('Step 1: Authentication');
      const oauth = new GitHubOAuth();
      const token = await oauth.authenticate();
      
      logger.info('Step 2: Initializing clients');
      const githubClient = new GitHubClient(token);
      const topcoderClient = new TopcoderClient(config.topcoderApiUrl);
      
      logger.info('Step 3: Fetching user profile');
      const user = await githubClient.getAuthenticatedUser();
      logger.success(`Authenticated as: ${user.login}`);
      
      logger.info('Step 4: Fetching repositories');
      const repos = await githubClient.getUserRepos(user.login);
      logger.success(`Found ${repos.length} repositories`);
      
      logger.info('Step 5: Analyzing languages');
      const languageStats = new Map<string, number>();
      
      for (const repo of repos) {
        const languages = await githubClient.getRepoLanguages(repo.owner.login, repo.name);
        for (const [lang, bytes] of Object.entries(languages)) {
          languageStats.set(lang, (languageStats.get(lang) || 0) + bytes);
        }
      }
      
      logger.success(`Analyzed ${languageStats.size} languages`);
      
      logger.info('Step 6: Analyzing commits (deep analysis)');
      const commitAnalyzer = new CommitAnalyzer(githubClient);
      const commitData = await commitAnalyzer.analyzeCommits(repos, user.login);
      logger.success(`Analyzed ${commitData.commitCount} commits`);
      
      logger.info('Step 7: Analyzing pull requests (deep analysis)');
      const prAnalyzer = new PRAnalyzer(githubClient);
      const prData = await prAnalyzer.analyzePullRequests(repos, user.login);
      logger.success(`Analyzed ${prData.prCount} pull requests`);
      
      logger.info('Step 8: Matching Topcoder skills');
      const skillMatcher = new SkillMatcher(topcoderClient);
      const recommendations = await skillMatcher.matchSkills(
        languageStats,
        repos,
        commitData,
        prData
      );
      
      if (config.aiEnabled) {
        logger.info('Step 9: AI skill verification');
        const aiVerifier = new AIVerifier(config.aiEnabled);
        await aiVerifier.verifySkills(recommendations);
      }
      
      const elapsedTime = Date.now() - startTime;
      
      process.stdout.write('\n' + '='.repeat(70) + '\n');
      process.stdout.write('SKILL RECOMMENDATIONS\n');
      process.stdout.write('='.repeat(70) + '\n\n');
      
      recommendations.forEach((rec, index) => {
        process.stdout.write(`${index + 1}. ${rec.skillName} (ID: ${rec.skillId})\n`);
        process.stdout.write(`   Confidence: ${rec.confidence}/100\n`);
        process.stdout.write(`   Evidence: ${rec.evidence.length} sources\n`);
        rec.evidence.slice(0, 3).forEach(ev => {
          process.stdout.write(`   - ${ev.type}: ${ev.description}\n`);
        });
        process.stdout.write('\n');
      });
      
      process.stdout.write('='.repeat(70) + '\n');
      process.stdout.write('ANALYSIS SUMMARY\n');
      process.stdout.write('='.repeat(70) + '\n');
      process.stdout.write(`Repositories Scanned:     ${repos.length}\n`);
      process.stdout.write(`Commits Analyzed:         ${commitData.commitCount}\n`);
      process.stdout.write(`Pull Requests Analyzed:   ${prData.prCount}\n`);
      process.stdout.write(`API Calls:                ${githubClient.getApiCallCount()}\n`);
      process.stdout.write(`Rate Limit Remaining:     ${githubClient.getRateLimitRemaining()}\n`);
      process.stdout.write(`Elapsed Time:             ${elapsedTime}ms\n`);
      process.stdout.write(`Skills Recommended:       ${recommendations.length}\n`);
      process.stdout.write('='.repeat(70) + '\n\n');
      
    } catch (error: unknown) {
      logger.error('Analysis failed', error as Error);
      process.exit(1);
    }
  });

program.parse();
