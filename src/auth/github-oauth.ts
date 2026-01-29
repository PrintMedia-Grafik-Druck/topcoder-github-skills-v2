import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import chalk from "chalk";
import { createLogger } from "../utils/logger.js";

const logger = createLogger({ level: 1 });

export interface OAuthResult {
  token: string;
  tokenType: string;
}

export class GitHubOAuth {
  private clientId: string;

  constructor(clientId: string) {
    if (!clientId || clientId.trim() === "") {
      throw new Error("GitHub Client ID is required for OAuth");
    }
    this.clientId = clientId;
  }

  async authenticate(): Promise<OAuthResult> {
    logger.info("Starting GitHub OAuth Device Flow authentication...");

    try {
      const auth = createOAuthDeviceAuth({
        clientType: "oauth-app",
        clientId: this.clientId,
        scopes: ["read:user", "repo"],
        onVerification: (verification) => {
          console.log("");
          console.log(chalk.cyan("━".repeat(60)));
          console.log(chalk.bold("  GitHub Device Authorization Required"));
          console.log(chalk.cyan("━".repeat(60)));
          console.log("");
          console.log(`  1. Open: ${chalk.underline.blue(verification.verification_uri)}`);
          console.log(`  2. Enter code: ${chalk.bold.green(verification.user_code)}`);
          console.log("");
          console.log(chalk.dim(`  Code expires in ${Math.floor(verification.expires_in / 60)} minutes`));
          console.log(chalk.cyan("━".repeat(60)));
          console.log("");
          console.log(chalk.yellow("Waiting for authorization..."));
        },
      });

      const { token, tokenType } = await auth({ type: "oauth" });

      logger.info("Successfully authenticated with GitHub!");

      return {
        token,
        tokenType: tokenType || "bearer",
      };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`OAuth authentication failed: ${err.message}`);
      throw new Error(`GitHub OAuth failed: ${err.message}`);
    }
  }
}
