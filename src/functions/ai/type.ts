import { type Chain } from "viem";

/**
 * Configuration options for LLM (Large Language Model) connection
 */
export interface LLMConfig {
  /** Base URL for the LLM API (e.g., "https://openrouter.ai/api/v1") */
  baseURL: string;
  /** API key for authentication with the LLM provider */
  apiKey: string;
  /** Model identifier (e.g., "x-ai/grok-4.1-fast", "openai/gpt-4") */
  model: string;
}

/**
 * Token information for multi-chain support
 */
export interface TokenInfo {
  /** Token name for AI reference (e.g., "opToken", "baseToken") */
  name: string;
  /** Token symbol (e.g., "OP", "BASE") */
  symbol: string;
  /** Chain this token belongs to */
  chain: Chain;
  /** Token contract address */
  address: `0x${string}`;
}

/**
 * Options for creating an AI instance
 */
export interface TypeDaccAiAgent {
  /** Array of supported chains (e.g., [optimismSepolia, baseSepolia]) */
  chains: Chain[];
  /** Array of supported tokens with name, symbol, chain, and address */
  tokens: TokenInfo[];
  /** Encrypted public key from createDaccWallet */
  daccPublickey: string;
  /** Password for decrypting the wallet */
  passwordSecretkey: string;
  /** Optional: Direct private key (alternative to daccPublickey + password) */
  privateKey?: `0x${string}`;
  /** LLM configuration for AI capabilities */
  llm: LLMConfig;
  /** Optional: System prompt to customize AI behavior */
  systemPrompt?: string;
}

/**
 * Response from chat method with AI text response
 */
export interface ChatResponse {
  /** The AI's text response */
  text: string;
}

/**
 * Response from streamChat method with streaming text
 */
export interface StreamChatResponse {
  /** Async iterable stream of text chunks */
  textStream: AsyncIterable<string>;
}

/**
 * AI agent instance with chat and streamChat capabilities
 */
export interface AiAgentInstance {
  /** Chat with the AI to perform actions */
  chat: (message: string) => Promise<ChatResponse>;
  /** Stream chat with the AI for real-time responses */
  streamChat: (message: string) => Promise<StreamChatResponse>;
}
