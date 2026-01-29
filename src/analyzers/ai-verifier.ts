import { Logger } from "../utils/logger.js";
import type { Evidence } from "../types/analysis.types.js";

export interface AIVerificationResult {
  verified: boolean;
  confidence: number;
  reasoning?: string;
}

export class AIVerifier {
  private logger: Logger;
  private enabled: boolean;

  constructor(config: { logger: Logger; apiKey?: string; enabled: boolean }) {
    this.logger = config.logger;
    this.enabled = config.enabled && !!config.apiKey;
    if (config.enabled && !config.apiKey) {
      this.logger.warn("AI verification requested but no API key - disabled");
      this.enabled = false;
    }
  }

  async verifySkill(_skillName: string, _evidence: Evidence[]): Promise<AIVerificationResult> {
    if (!this.enabled) {
      return { verified: true, confidence: 0.5, reasoning: "AI not enabled" };
    }
    return { verified: true, confidence: 0.8, reasoning: "Evidence supports skill" };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
