export interface TopcoderSkill {
  id: string;
  name: string;
  description?: string;
}

export interface TopcoderSkillsResponse {
  result: {
    content: TopcoderSkill[];
  };
}
