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
      logger.info('🚀 Starting GitHub Skills Analysis...\n');

      // 1. Authenticate with OAuth Device Flow
      logger.info('Step 1: Authentication');
      const oauth = new GitHubOAuth();
      const token = await oauth.authenticate();
      
      // 2. Initialize clients
      logger.info('\nStep 2: Initializing clients');
      const githubClient = new GitHubClient(token);
      const topcoderClient = new TopcoderClient(config.topcoderApiUrl);
      
      // 3. Get authenticated user
      logger.info('\nStep 3: Fetching user profile');
      const user = await githubClient.getAuthenticatedUser();
      logger.success(`✅ Authenticated as: ${user.login}`);
      
      // 4. Get user repositories
      logger.info('\nStep 4: Fetching repositories');
      const repos = await githubClient.getUserRepos(user.login);
      logger.success(`✅ Found ${repos.length} repositories`);
      
      // 5. Analyze languages
      logger.info('\nStep 5: Analyzing languages');
      const languageStats = new Map<string, number>();
      
      for (const repo of repos) {
        const languages = await githubClient.getRepoLanguages(repo.owner.login, repo.name);
        for (const [lang, bytes] of Object.entries(languages)) {
          languageStats.set(lang, (languageStats.get(lang) || 0) + bytes);
        }
      }
      
      logger.success(`✅ Analyzed ${languageStats.size} languages`);
      
      // 6. Deep analysis: Commits
      logger.info('\nStep 6: Analyzing commits (deep analysis)');
      const commitAnalyzer = new CommitAnalyzer(githubClient);
      const commitData = await commitAnalyzer.analyzeCommits(repos, user.login);
      logger.success(`✅ Analyzed ${commitData.commitCount} commits`);
      
      // 7. Deep analysis: Pull Requests
      logger.info('\nStep 7: Analyzing pull requests (deep analysis)');
      const prAnalyzer = new PRAnalyzer(githubClient);
      const prData = await prAnalyzer.analyzePullRequests(repos, user.login);
      logger.success(`✅ Analyzed ${prData.prCount} pull requests`);
      
      // 8. Match skills
      logger.info('\nStep 8: Matching Topcoder skills');
      const skillMatcher = new SkillMatcher(topcoderClient);
      const recommendations = await skillMatcher.matchSkills(
        languageStats,
        repos,
        commitData,
        prData
      );
      
      // 9. AI verification (optional)
      if (config.aiEnabled) {
        logger.info('\nStep 9: AI skill verification');
        const aiVerifier = new AIVerifier(config.aiEnabled);
        await aiVerifier.verifySkills(recommendations);
      }
      
      const elapsedTime = Date.now() - startTime;
      
      // Display results
      console.log('\n' + '='.repeat(70));
      console.log('📊 SKILL RECOMMENDATIONS');
      console.log('='.repeat(70) + '\n');
      
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.skillName} (ID: ${rec.skillId})`);
        console.log(`   Confidence: ${rec.confidence}/100`);
        console.log(`   Evidence: ${rec.evidence.length} sources`);
        rec.evidence.slice(0, 3).forEach(ev => {
          console.log(`   - ${ev.type}: ${ev.description}`);
        });
        console.log('');
      });
      
      // Summary
      console.log('='.repeat(70));
      console.log('📈 ANALYSIS SUMMARY');
      console.log('='.repeat(70));
      console.log(`Repositories Scanned:     ${repos.length}`);
      console.log(`Commits Analyzed:         ${commitData.commitCount}`);
      console.log(`Pull Requests Analyzed:   ${prData.prCount}`);
      console.log(`API Calls:                ${githubClient.getApiCallCount()}`);
      console.log(`Rate Limit Remaining:     ${githubClient.getRateLimitRemaining()}`);
      console.log(`Elapsed Time:             ${elapsedTime}ms`);
      console.log(`Skills Recommended:       ${recommendations.length}`);
      console.log('='.repeat(70) + '\n');
      
    } catch (error) {
      logger.error('❌ Analysis failed', error as Error);
      process.exit(1);
    }
  });

program.parse();
