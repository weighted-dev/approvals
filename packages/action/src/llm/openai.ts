import type { LLMClient, LLMClientOptions } from "./types";

/**
 * OpenAI LLM client implementation.
 */
export class OpenAIClient implements LLMClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly debug: boolean;

  constructor(options: LLMClientOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gpt-4o";
    this.debug = options.debug || false;
  }

  async analyze(prompt: string): Promise<string> {
    const url = "https://api.openai.com/v1/chat/completions";

    const body = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are a code review assistant that analyzes pull requests to determine their criticality and which teams should review them. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    };

    if (this.debug) {
      console.log("[OpenAI] Request:", JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    if (this.debug) {
      console.log("[OpenAI] Response:", content);
    }

    return content;
  }
}

