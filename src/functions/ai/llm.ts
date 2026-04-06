import { type LLMConfig } from "./type";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider types
 */
export type LLMProvider = "openai-compatible";

/**
 * LLM Provider instance
 */
export interface LLMProviderInstance {
  type: LLMProvider;
  provider: ReturnType<typeof createOpenAICompatible>;
  model: (modelId: string) => ReturnType<ReturnType<typeof createOpenAICompatible>>;
}

/**
 * Create LLM provider using OpenAI-compatible API
 * @param config LLM configuration
 * @returns LLM provider instance
 */
export function createLLMProvider(config: LLMConfig): LLMProviderInstance {
  const provider = createOpenAICompatible({
    name: "dacc-ai-agent",
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });

  return {
    type: "openai-compatible",
    provider,
    model: (modelId: string) => provider(modelId)
  };
}

/**
 * Default system prompt for Dacc AI
 */
export const DEFAULT_SYSTEM_PROMPT = `You are Dacc AI Agent - an autonomous blockchain agent.
You can help users perform blockchain transactions using natural language.

Available capabilities:
- sendNative: Send native cryptocurrency (ETH, etc.)
- sendToken: Send ERC20 tokens
- getBalanceNative: Check native balance
- getBalanceToken: Check ERC20 token balance`;
