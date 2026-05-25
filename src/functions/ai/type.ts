import { type Abi } from "viem";

/**
 * A lightweight chain shape that is structurally compatible with viem chain objects
 * from any installed copy of viem.
 *
 * This avoids TypeScript incompatibilities when the library and the consuming app
 */
export interface Chains {
  /** Numeric chain ID. */
  id: number;
  /** Human-readable chain name. */
  name: string;
  /** Optional extra viem chain fields are allowed. */
  [key: string]: unknown;
}

/**
 * Contract interaction mode
 *  - "write": Execute a transaction (e.g., mint, transfer)
 *  - "read": Read data from the contract (e.g., balanceOf, totalSupply)
 */
export type ContractMode = "write" | "read";

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
  /** Token decimals (default: 18, e.g., 6 for USDC) */
  decimals?: number;
  /** Chain this token belongs to */
  chain: Chains;
  /** Token contract address */
  address: `0x${string}`;
}

/**
 * Convenience alias for a single token configuration
 */
export type TypeAiConfigToken = TokenInfo;

/**
 * Preconfigured smart contract action that the AI is allowed to use
 */
export interface ContractInfo {
  /** Unique name used by the AI to select this contract action */
  name: string;
  /** Optional human-readable description for better tool selection */
  description?: string;
  /** Contract interaction mode. Required - must be "write" or "read" */
  mode: ContractMode;
  /** Chain where this contract is deployed */
  chain: Chains;
  /** Smart contract address */
  contractAddress: `0x${string}`;
  /** Contract ABI (function) */
  abi: Abi;
  /** Function name to execute */
  functionName: string;
  /** Optional default arguments for contract functions (**empty '' values are replaced by AI user input**) */
  args?: unknown[];
}

/**
 * Convenience alias for a single contract configuration
 */
export type TypeAiConfigContract = ContractInfo;

/**
 * Options for creating an AI instance
 */
export interface TypeDaccAiAgent {
  /** Array of supported chains (e.g., [optimismSepolia, baseSepolia]) */
  chains: Chains[];
  /** Array of supported tokens with name, symbol, decimals, chain, and address */
  tokens: TokenInfo[];
  /** Optional allowlist of smart contract actions the AI can "read" or "write" */
  contracts?: ContractInfo[];
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
