// One switch for every AI model call. Hosts pick a provider with AI_PROVIDER; prompts and
// output checks live in assess.ts and stay the same whichever model answers.
//
//   claude-bedrock     Claude on Amazon Bedrock (Opus / Sonnet / Haiku). Default.
//   bedrock-converse   Any other Bedrock model with image input (Amazon Nova, Llama, Pixtral, …).
//   openai-compatible  Any /chat/completions endpoint: Ollama or vLLM for self-hosted open models,
//                      or a hosted API such as Gemini's or OpenRouter's compatible endpoint.

export type AiProvider = "claude-bedrock" | "bedrock-converse" | "openai-compatible";

export interface AiRequest {
  system: string;
  text: string;
  images?: string[]; // base64 JPEG, with or without a data: prefix
  maxTokens: number;
}

const PROVIDERS: AiProvider[] = ["claude-bedrock", "bedrock-converse", "openai-compatible"];

export function aiProvider(env = process.env): AiProvider {
  const p = (env.AI_PROVIDER || "claude-bedrock") as AiProvider;
  if (!PROVIDERS.includes(p)) throw new Error(`Unknown AI_PROVIDER "${p}". Use one of: ${PROVIDERS.join(", ")}`);
  return p;
}

/** True when the chosen provider has what it needs to make a call. */
export function aiConfigured(env = process.env): boolean {
  if (!env.AI_MODEL_ID) return false;
  return aiProvider(env) === "openai-compatible" ? Boolean(env.AI_BASE_URL) : Boolean(env.AI_REGION || env.AWS_REGION);
}

const stripDataUrl = (img: string) => img.replace(/^data:image\/\w+;base64,/, "");
const region = () => process.env.AI_REGION || process.env.AWS_REGION;

function logUsage(input?: number, output?: number) {
  console.log(JSON.stringify({ level: "info", msg: "ai_usage", provider: aiProvider(), model: process.env.AI_MODEL_ID, input_tokens: input, output_tokens: output }));
}

/** Sends one request to the configured model and returns its text. Throws on any failure. */
export async function complete(req: AiRequest): Promise<string> {
  const model = process.env.AI_MODEL_ID;
  if (!aiConfigured() || !model) throw new Error("AI provider not configured");
  const images = (req.images ?? []).map(stripDataUrl);

  switch (aiProvider()) {
    case "claude-bedrock": {
      const { AnthropicBedrockMantle } = await import("@anthropic-ai/bedrock-sdk");
      const client = new AnthropicBedrockMantle({ awsRegion: region() });
      const res = await client.messages.create({
        model,
        max_tokens: req.maxTokens,
        system: req.system,
        ...(process.env.AI_EFFORT ? { output_config: { effort: process.env.AI_EFFORT as "low" | "medium" | "high" } } : {}),
        messages: [
          {
            role: "user",
            content: [
              ...images.map((data) => ({ type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data } })),
              { type: "text" as const, text: req.text },
            ],
          },
        ],
      });
      logUsage(res.usage?.input_tokens, res.usage?.output_tokens);
      if (res.stop_reason === "refusal") throw new Error("Model refused the request");
      const block = res.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") throw new Error("No text in model response");
      return block.text;
    }

    case "bedrock-converse": {
      const { BedrockRuntimeClient, ConverseCommand } = await import("@aws-sdk/client-bedrock-runtime");
      const client = new BedrockRuntimeClient({ region: region() });
      const res = await client.send(
        new ConverseCommand({
          modelId: model,
          system: [{ text: req.system }],
          inferenceConfig: { maxTokens: req.maxTokens },
          messages: [
            {
              role: "user",
              content: [
                ...images.map((b64) => ({ image: { format: "jpeg" as const, source: { bytes: Buffer.from(b64, "base64") } } })),
                { text: req.text },
              ],
            },
          ],
        })
      );
      logUsage(res.usage?.inputTokens, res.usage?.outputTokens);
      if (res.stopReason === "content_filtered" || res.stopReason === "guardrail_intervened") throw new Error("Model refused the request");
      const text = res.output?.message?.content?.find((c) => c.text)?.text;
      if (!text) throw new Error("No text in model response");
      return text;
    }

    case "openai-compatible": {
      const res = await fetch(`${process.env.AI_BASE_URL!.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AI_API_KEY ? { Authorization: `Bearer ${process.env.AI_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens,
          messages: [
            { role: "system", content: req.system },
            {
              role: "user",
              content: [
                ...images.map((b64) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } })),
                { type: "text", text: req.text },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(`AI endpoint returned HTTP ${res.status}`);
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      logUsage(json.usage?.prompt_tokens, json.usage?.completion_tokens);
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error("No text in model response");
      return text;
    }
  }
}
