export interface MCPConfig {
  githubToken?: string;
  stackOverflowKey?: string;
  openaiKey?: string;
}

export function createMCPConfig(): MCPConfig {
  return {
    githubToken: process.env.GITHUB_TOKEN,
    stackOverflowKey: process.env.STACKOVERFLOW_KEY,
    openaiKey: process.env.OPENAI_API_KEY
  };
} 