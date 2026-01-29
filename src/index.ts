#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";

import { GitHubOAuth } from "./auth/github-oauth.js";
import { GitHubClient } from "./clients/github-client.js";
import { TopcoderClient } from "./clients/topcoder-client.js";
import { CommitAnalyzer } from "./analyzers/commit-analyzer.js";
import { PRAnalyzer } from "./analyzers/pr-analyzer.js";
import { SkillMatcher, AnalysisData } from "./analyzers/skill-matcher.js";
import { AIVerifier } from "./analyzers/ai-verifier.js";
import { RateLimiter } from "./utils/rate-limiter.js";
import { Logger, LogLevel } from "./utils/logger.js";
import type { SkillRecommendation } from "./types/analysis.types.js";

dotenv.config();

const program = new Command();

program
  .name("github-skills-analyzer")
  .description("Analyze GitHub profiles for Topcoder Skills")
  .version("1.0.0");

program
  .command("analyze")
  .description("Analyze your GitHub profile")
  .option("-v, --verbose", "Verbose logging", false)
  .option("--ai", "Enable AI verification", false)
  .option("--max-repos <number>", "Max repositories", "20")
  .action(async (options: { verbose: boolean; ai: boolean; maxRepos: string }) => {
    const logger = new Logger({ level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO });
    const spinner = ora();
    const startTime = Date.now();

    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        logger.error("GITHUB_CLIENT_ID required in .env");
        process.exit(1);
      }

      logger.info(chalk.bold.cyan("\n🔍 GitHub Skills Analyzer\n"));

      spinner.start("Authenticating...");
      const oauth = new GitHubOAuth(clientId);
      spinner.stop();
      const authResult = await oauth.authenticate();

      spinner.start("Initializing...");
      const rateLimiter = new RateLimiter();
      const githubClient = new GitHubClient({ token: authResult.token, rateLimiter, logger });
      const topcoderClient = new TopcoderClient({ logger });
      spinner.succeed("Ready");

      spinner.start("Fetching profile...");
      const user = await githubClient.getUserProfile();
      spinner.succeed("Profile: " + chalk.green(user.login));

      spinner.start("Fetching repositories...");
      const allRepos = await githubClient.getRepositories();
      const maxRepos = parseInt(options.maxRepos, 10) || 20;
      const repos = allRepos.filter(r => !r.fork).slice(0, maxRepos);
      spinner.succeed("Found " + chalk.green(String(repos.length)) + " repositories");

      const commitAnalyzer = new CommitAnalyzer({ maxCommitsPerRepo: 50 });
      const prAnalyzer = new PRAnalyzer({ maxPRsPerRepo: 30 });

      spinner.start("Analyzing commits and PRs...");
      const commitResults = [];
      const prResults = [];

      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        spinner.text = "Analyzing " + repo.name + " (" + (i + 1) + "/" + repos.length + ")...";
        commitResults.push(await commitAnalyzer.analyzeCommits(repo.owner, repo.name, githubClient));
        prResults.push(await prAnalyzer.analyzePullRequests(repo.owner, repo.name, githubClient));
      }

      const aggregatedCommits = commitAnalyzer.aggregateResults(commitResults);
      const aggregatedPRs = prAnalyzer.aggregateResults(prResults);
      spinner.succeed("Analysis complete");

      spinner.start("Matching skills...");
      const skillMatcher = new SkillMatcher({ logger });
      const analysisData: AnalysisData = {
        username: user.login,
        repositories: repos,
        commitAnalysis: aggregatedCommits,
        prAnalysis: aggregatedPRs,
      };

      const recommendations = await skillMatcher.matchSkills(analysisData, topcoderClient);
      spinner.succeed("Matched " + chalk.green(String(recommendations.length)) + " skills");

      if (options.ai) {
        const aiVerifier = new AIVerifier({
          logger,
          apiKey: process.env.OPENAI_API_KEY,
          enabled: true,
        });
        if (aiVerifier.isEnabled()) {
          spinner.start("AI verification...");
          for (const rec of recommendations) {
            const result = await aiVerifier.verifySkill(rec.skill.name, rec.evidence);
            rec.aiVerified = result.verified;
            rec.aiConfidence = result.confidence;
          }
          spinner.succeed("AI verification done");
        }
      }

      printRecommendations(recommendations, logger);
      printSummary(user.login, recommendations, githubClient.getApiCallCount(), Date.now() - startTime, logger);

      process.exit(0);
    } catch (error: unknown) {
      spinner.fail("Failed");
      const err = error as Error;
      logger.error("Error: " + err.message);
      process.exit(1);
    }
  });

function printRecommendations(recs: SkillRecommendation[], logger: Logger): void {
  logger.info("");
  logger.info(chalk.bold.cyan("━".repeat(60)));
  logger.info(chalk.bold("  📊 Skill Recommendations"));
  logger.info(chalk.bold.cyan("━".repeat(60)));
  logger.info("");

  if (recs.length === 0) {
    logger.info(chalk.yellow("  No recommendations found."));
    return;
  }

  for (const rec of recs.slice(0, 15)) {
    const percent = Math.round(rec.confidence * 100);
    const bar = getBar(rec.confidence);
    logger.info("  " + chalk.bold(rec.skill.name.padEnd(20)) + " " + bar + " " + chalk.dim(String(percent) + "%"));
    if (rec.metrics) {
      const m = [];
      if (rec.metrics.repositories > 0) m.push(String(rec.metrics.repositories) + " repos");
      if (rec.metrics.commits > 0) m.push(String(rec.metrics.commits) + " commits");
      if (rec.metrics.pullRequests > 0) m.push(String(rec.metrics.pullRequests) + " PRs");
      if (m.length > 0) logger.info(chalk.dim("                       " + m.join(" • ")));
    }
  }
}

function getBar(conf: number): string {
  const filled = Math.round(conf * 10);
  const color = conf >= 0.8 ? chalk.green : conf >= 0.5 ? chalk.yellow : chalk.red;
  return color("█".repeat(filled)) + chalk.dim("░".repeat(10 - filled));
}

function printSummary(user: string, recs: SkillRecommendation[], apiCalls: number, elapsed: number, logger: Logger): void {
  logger.info("");
  logger.info(chalk.bold.cyan("━".repeat(60)));
  logger.info(chalk.bold("  📈 Summary"));
  logger.info(chalk.bold.cyan("━".repeat(60)));
  logger.info("");
  logger.info("  " + chalk.dim("User:") + "            " + chalk.bold(user));
  logger.info("  " + chalk.dim("Skills:") + "          " + chalk.bold(String(recs.length)));
  logger.info("  " + chalk.dim("API Calls:") + "       " + chalk.dim(String(apiCalls)));
  logger.info("  " + chalk.dim("Time:") + "            " + chalk.dim(String(Math.round(elapsed / 1000)) + "s"));
  logger.info("");
}

program.parse();
