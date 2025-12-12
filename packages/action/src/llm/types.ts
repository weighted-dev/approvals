/**
 * LLM Provider interface for AI-powered PR analysis.
 */
export interface LLMClient {
  /**
   * Send a prompt to the LLM and get a response.
   */
  analyze(prompt: string): Promise<string>;
}

/**
 * Result of AI analysis of a PR.
 */
export interface AIAnalysisResult {
  /** Criticality level from 1-10 */
  criticality: number;
  /** Teams that should review this PR */
  suggestedTeams: string[];
  /** Reasoning for the criticality level */
  reasoning: string;
}

/**
 * Configuration for AI-powered PR analysis.
 */
export interface AIConfig {
  /** Whether AI analysis is enabled */
  enabled: boolean;
  /** LLM provider to use */
  provider: "openai" | "anthropic";
  /** Environment variable name containing the API key (BYOK) */
  apiKeyEnv: string;
  /** Optional model override */
  model?: string;
  /** Criticality range mapping (1-10 maps to min-max approvers) */
  criticalityRange: {
    min: number;
    max: number;
  };
  /** Teams that the AI can suggest for review */
  teams: string[];
  /** Optional team descriptions to help AI make better suggestions */
  teamDescriptions?: Record<string, string>;
}

/**
 * Options for creating an LLM client.
 */
export interface LLMClientOptions {
  apiKey: string;
  model?: string;
  debug?: boolean;
}

/**
 * Default models for each provider.
 */
export const DEFAULT_MODELS: Record<AIConfig["provider"], string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
};

