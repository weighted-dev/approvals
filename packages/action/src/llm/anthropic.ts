import type { LLMClient, LLMClientOptions } from "./types";

/**
 * Anthropic (Claude) LLM client implementation.
 */
export class AnthropicClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly debug: boolean;

  constructor(options: LLMClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || "claude-sonnet-4-20250514";
    this.debug = options.debug || false;
  }

  async analyze(prompt: string): Promise<string> {
    const url = "https://api.anthropic.com/v1/messages";

    const body = {
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system:
        "You are a code review assistant that analyzes pull requests to determine their criticality and which teams should review them. Always respond with valid JSON only, no markdown formatting.",
    };

    if (this.debug) {
      console.log("[Anthropic] Request:", JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    const textBlock = data.content?.find((block) => block.type === "text");
    const content = textBlock?.text;

    if (!content) {
      throw new Error("Anthropic returned empty response");
    }

    if (this.debug) {
      console.log("[Anthropic] Response:", content);
    }

    return content;
  }
}

