import axios, { AxiosInstance } from "axios";
import { Logger } from "../utils/logger.js";
import type { TopcoderSkill } from "../types/topcoder.types.js";

export class TopcoderClient {
  private client: AxiosInstance;
  private logger: Logger;
  private skillsCache: TopcoderSkill[] | null = null;

  constructor(config: { logger: Logger; baseUrl?: string }) {
    this.logger = config.logger;
    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.topcoder-dev.com",
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async getAllSkills(): Promise<TopcoderSkill[]> {
    if (this.skillsCache) return this.skillsCache;
    
    try {
      const response = await this.client.get<TopcoderSkill[]>("/v5/standardized-skills");
      this.skillsCache = Array.isArray(response.data) ? response.data : [];
      return this.skillsCache;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Failed to fetch Topcoder skills: ${err.message}, using defaults`);
      this.skillsCache = this.getDefaultSkills();
      return this.skillsCache;
    }
  }

  async findSkillByName(name: string): Promise<TopcoderSkill | undefined> {
    const skills = await this.getAllSkills();
    const normalized = name.toLowerCase().trim();
    return skills.find(s => s.name.toLowerCase() === normalized) ||
           skills.find(s => s.name.toLowerCase().includes(normalized));
  }

  private getDefaultSkills(): TopcoderSkill[] {
    return [
      { id: "js-1", name: "JavaScript", category: "Programming" },
      { id: "ts-1", name: "TypeScript", category: "Programming" },
      { id: "py-1", name: "Python", category: "Programming" },
      { id: "java-1", name: "Java", category: "Programming" },
      { id: "go-1", name: "Go", category: "Programming" },
      { id: "rust-1", name: "Rust", category: "Programming" },
      { id: "cpp-1", name: "C++", category: "Programming" },
      { id: "cs-1", name: "C#", category: "Programming" },
      { id: "ruby-1", name: "Ruby", category: "Programming" },
      { id: "php-1", name: "PHP", category: "Programming" },
    ];
  }
}
