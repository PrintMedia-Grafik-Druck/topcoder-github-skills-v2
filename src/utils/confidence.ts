export interface ContributionMetrics {
  commits: number;
  pullRequests: number;
  codeVolume: number;
  repositories: number;
}

export function calculateConfidence(metrics: ContributionMetrics): number {
  let score = 0;

  // Commit contribution (0-40 points)
  if (metrics.commits >= 100) score += 40;
  else if (metrics.commits >= 50) score += 30;
  else if (metrics.commits >= 20) score += 20;
  else if (metrics.commits >= 5) score += 10;

  // PR contribution (0-25 points)
  if (metrics.pullRequests >= 20) score += 25;
  else if (metrics.pullRequests >= 10) score += 20;
  else if (metrics.pullRequests >= 5) score += 15;
  else if (metrics.pullRequests >= 1) score += 10;

  // Code volume (0-20 points)
  if (metrics.codeVolume >= 10000) score += 20;
  else if (metrics.codeVolume >= 5000) score += 15;
  else if (metrics.codeVolume >= 1000) score += 10;
  else if (metrics.codeVolume >= 100) score += 5;

  // Repository count (0-10 points)
  if (metrics.repositories >= 10) score += 10;
  else if (metrics.repositories >= 5) score += 7;
  else if (metrics.repositories >= 2) score += 5;
  else if (metrics.repositories >= 1) score += 3;

  // Normalize to 0-1
  return Math.max(0, Math.min(1, score / 100));
}
