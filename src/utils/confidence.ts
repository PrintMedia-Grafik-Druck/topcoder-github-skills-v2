export interface ContributionMetrics {
  commitCount: number;
  prCount: number;
  codeVolume: number;
  repoCount: number;
  daysSinceLastActivity: number;
  commits?: number;
}

export function calculateConfidence(metrics: ContributionMetrics): number {
  let score = 0;

  const commitCount = metrics.commits || metrics.commitCount;

  if (commitCount >= 100) score += 40;
  else if (commitCount >= 50) score += 30;
  else if (commitCount >= 20) score += 20;
  else if (commitCount >= 5) score += 10;

  if (metrics.prCount >= 20) score += 25;
  else if (metrics.prCount >= 10) score += 20;
  else if (metrics.prCount >= 5) score += 15;
  else if (metrics.prCount >= 1) score += 10;

  if (metrics.codeVolume >= 10000) score += 20;
  else if (metrics.codeVolume >= 5000) score += 15;
  else if (metrics.codeVolume >= 1000) score += 10;
  else if (metrics.codeVolume >= 100) score += 5;

  if (metrics.repoCount >= 10) score += 10;
  else if (metrics.repoCount >= 5) score += 7;
  else if (metrics.repoCount >= 2) score += 5;
  else if (metrics.repoCount >= 1) score += 3;

  if (metrics.daysSinceLastActivity > 365) score -= 5;
  else if (metrics.daysSinceLastActivity > 180) score -= 3;
  else if (metrics.daysSinceLastActivity > 90) score -= 1;

  return Math.max(0, Math.min(100, score));
}
