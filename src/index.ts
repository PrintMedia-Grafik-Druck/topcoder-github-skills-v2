#!/usr/bin/env node
import { Command } from 'commander';
import { GitHubClient } from './clients/github-client';
import { TopcoderClient } from './clients/topcoder-client';
import { CommitAnalyzer } from './analyzers/commit-analyzer';
import { PRAnalyzer } from './analyzers/pr-analyzer';
import { SkillMatcher } from './analyzers/skill-matcher';
import { AIVerifier } from './analyzers/ai-verifier';
import { createLogger } from './utils/logger';
import { config } from './config/config';

const logger = createLogger('CLI');
const program = new Command();

program
  .name('github-skills-analyzer')
  .description('Deep GitHub profile analyzer for Topcoder Skills')
  .version('2.0.0');

program
  .command('analyze')
  .description('Analyze authenticated user GitHub profile')
  .action(async (): Promise<void> => {
    const startTime = Date.now();

    try {
      logger.info('Initializing...');

      const githubClient = new GitHubClient(config.githubToken!);
      const topcoderClient = new TopcoderClient(config.topcoderApiUrl);
      const commitAnalyzer = new CommitAnalyzer(githubClient);
      const prAnalyzer = new PRAnalyzer(githubClient);
      const skillMatcher = new SkillMatcher(topcoderClient);
      const aiVerifier = new AIVerifier(config.aiEnabled);

      logger.info('Fetching user profile...');
      const user = await githubClient.getAuthenticatedUser();
      logger.success('User: ' + user.login);

      logger.info('Fetching repositories...');
      const repos = await githubClient.getUserRepos(user.login);
      logger.success('Found ' + repos.length + ' repositories');

      logger.info('Analyzing languages...');
      const languageStats = new Map<string, number>();
      
      for (const repo of repos) {
        const languages = await githubClient.getRepoLanguages(repo.owner.login, repo.name);
        for (const [lang, bytes] of Object.entries(languages)) {
          languageStats.set(lang, (languageStats.get(lang) || 0) + bytes);
        }
      }

      logger.info('Analyzing commits...');
      const commitData = await commitAnalyzer.analyzeCommits(repos, user.login);

      logger.info('Analyzing pull requests...');
      const prData = await prAnalyzer.analyzePullRequests(repos, user.login);

      logger.info('Matching skills...');
      const recommendations = await skillMatcher.matchSkills(languageStats, repos, commitData, prData);

      if (config.aiEnabled) {
        logger.info('AI verification enabled');
        await aiVerifier.verifySkills(recommendations);
      }

      const elapsedTime = Date.now() - startTime;

      process.stdout.write('\n=== SKILL RECOMMENDATIONS ===\n\n');

      recommendations.forEach((rec, index) => {
        process.stdout.write((index + 1) + '. ' + rec.skillName + '\n');
        process.stdout.write('   Skill ID: ' + rec.skillId + '\n');
        process.stdout.write('   Confidence: ' + rec.confidence + '/100\n');
        process.stdout.write('   Evidence: ' + rec.evidence.length + ' sources\n\n');
      });

      process.stdout.write('\n=== ANALYSIS SUMMARY ===\n\n');
      process.stdout.write('Repositories Scanned: ' + repos.length + '\n');
      process.stdout.write('Commits Analyzed: ' + commitData.commitCount + '\n');
      process.stdout.write('Pull Requests Analyzed: ' + prData.prCount + '\n');
      process.stdout.write('API Calls: ' + githubClient.getApiCallCount() + '\n');
      process.stdout.write('Rate Limit Remaining: ' + githubClient.getRateLimitRemaining() + '\n');
      process.stdout.write('Elapsed Time: ' + elapsedTime + 'ms\n');
      process.stdout.write('Skills Recommended: ' + recommendations.length + '\n\n');

    } catch (error) {
      if (error instanceof Error) {
        logger.error('Analysis failed', error);
      }
      process.exit(1);
    }
  });

program.parse();
