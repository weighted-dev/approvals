import type { AIConfig, AIAnalysisResult, LLMClient } from "./types";
import { OpenAIClient } from "./openai";
import { AnthropicClient } from "./anthropic";
import { DEFAULT_MODELS } from "./types";

/**
 * AI-powered PR analyzer that uses LLMs to assess criticality and suggest reviewers.
 */
export class AIAnalyzer {
  private readonly config: AIConfig;
  private readonly client: LLMClient;
  private readonly debug: boolean;

  constructor(config: AIConfig, debug: boolean = false) {
    this.config = config;
    this.debug = debug;

    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      throw new Error(
        `AI analysis enabled but API key not found in environment variable: ${config.apiKeyEnv}`
      );
    }

    const model = config.model || DEFAULT_MODELS[config.provider];

    if (config.provider === "openai") {
      this.client = new OpenAIClient({ apiKey, model, debug });
    } else if (config.provider === "anthropic") {
      this.client = new AnthropicClient({ apiKey, model, debug });
    } else {
      throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Analyze a PR and return criticality assessment and team suggestions.
   */
  async analyze(args: {
    diff: string;
    files: string[];
    prTitle?: string;
    prDescription?: string;
  }): Promise<AIAnalysisResult> {
    const prompt = this.buildPrompt(args);

    if (this.debug) {
      console.log("[AIAnalyzer] Prompt:", prompt);
    }

    const response = await this.client.analyze(prompt);
    return this.parseResponse(response);
  }

  /**
   * Map a criticality level (1-10) to required approvers based on config range.
   */
  mapCriticalityToApprovers(criticality: number): number {
    const { min, max } = this.config.criticalityRange;
    // Clamp criticality to 1-10
    const clamped = Math.max(1, Math.min(10, criticality));
    // Linear interpolation from 1-10 to min-max
    const ratio = (clamped - 1) / 9;
    const approvers = Math.round(min + ratio * (max - min));
    return Math.max(min, Math.min(max, approvers));
  }

  private buildPrompt(args: {
    diff: string;
    files: string[];
    prTitle?: string;
    prDescription?: string;
  }): string {
    const { diff, files, prTitle, prDescription } = args;

    // Build team descriptions section
    let teamSection = "";
    if (this.config.teams.length > 0) {
      teamSection = "\n\nAvailable teams for review:\n";
      for (const team of this.config.teams) {
        const description = this.config.teamDescriptions?.[team];
        if (description) {
          teamSection += `- ${team}: ${description}\n`;
        } else {
          teamSection += `- ${team}\n`;
        }
      }
    }

    // Truncate diff if too long (keep under ~100k chars to stay within token limits)
    const maxDiffLength = 80000;
    let truncatedDiff = diff;
    if (diff.length > maxDiffLength) {
      truncatedDiff =
        diff.slice(0, maxDiffLength) +
        "\n\n... [diff truncated due to length] ...";
    }

    return `Analyze this pull request and assess its criticality level for code review.

${prTitle ? `## PR Title\n${prTitle}\n` : ""}
${prDescription ? `## PR Description\n${prDescription}\n` : ""}
## Changed Files
${files.map((f) => `- ${f}`).join("\n")}

## Diff
\`\`\`diff
${truncatedDiff}
\`\`\`
${teamSection}
Based on the changes above, provide your analysis in the following JSON format:

{
  "criticality": <number 1-10>,
  "suggestedTeams": [<list of team names from the available teams>],
  "reasoning": "<brief explanation of why this criticality level>"
}

Criticality scale:
- 1-2: Trivial changes (typos, comments, minor formatting)
- 3-4: Low risk (small bug fixes, minor refactors, test additions)
- 5-6: Medium risk (new features, moderate refactors, dependency updates)
- 7-8: High risk (security-related, database changes, API changes, breaking changes)
- 9-10: Critical (authentication, authorization, payment processing, data migration)

Consider:
- What areas of the codebase are affected?
- Could this change break existing functionality?
- Are there security implications?
- Is this touching critical infrastructure?

Respond with ONLY the JSON object, no additional text.`;
  }

  private parseResponse(response: string): AIAnalysisResult {
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        criticality?: unknown;
        suggestedTeams?: unknown;
        reasoning?: unknown;
      };

      // Validate criticality
      const criticality = Number(parsed.criticality);
      if (!Number.isFinite(criticality) || criticality < 1 || criticality > 10) {
        throw new Error(
          `Invalid criticality value: ${parsed.criticality}. Expected 1-10.`
        );
      }

      // Validate suggestedTeams
      let suggestedTeams: string[] = [];
      if (Array.isArray(parsed.suggestedTeams)) {
        suggestedTeams = parsed.suggestedTeams
          .filter((t): t is string => typeof t === "string")
          .filter((t) => this.config.teams.includes(t));
      }

      // Get reasoning
      const reasoning =
        typeof parsed.reasoning === "string"
          ? parsed.reasoning
          : "No reasoning provided";

      return {
        criticality,
        suggestedTeams,
        reasoning,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse AI response: ${msg}. Response: ${response.slice(0, 200)}`);
    }
  }
}

/**
 * Create an AI analyzer if AI is enabled and configured correctly.
 * Returns null if AI is disabled or configuration is invalid.
 */
export function createAIAnalyzer(
  config: AIConfig | undefined,
  debug: boolean = false
): AIAnalyzer | null {
  if (!config || !config.enabled) {
    return null;
  }

  try {
    return new AIAnalyzer(config, debug);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[AI] Failed to initialize AI analyzer: ${msg}`);
    return null;
  }
}

