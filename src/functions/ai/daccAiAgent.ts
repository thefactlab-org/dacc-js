import { generateText, streamText, stepCountIs } from "ai";
import { tool } from "ai";
import { createLLMProvider, DEFAULT_SYSTEM_PROMPT } from "./llm";
import { z } from "zod";
import { allowDaccWallet } from "../allowDaccWallet";
import { daccSendNative } from "../transactions/daccSendNative";
import { daccSendToken } from "../transactions/daccSendToken";
import { getBalanceNative } from "../balance/getBalanceNative";
import { getBalanceToken } from "../balance/getBalanceToken";
import {
  type TypeDaccAiAgent,
  type AiAgentInstance,
  type TokenInfo,
  type ChatResponse,
  type StreamChatResponse,
} from "./type";
import { type Chain } from "viem";

/**
 * Creates a Dacc AI instance that can chat and perform blockchain actions on behalf of the user.
 * @description The AI can execute transactions, and interact with smart contracts via natural language.
 * 
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-ai/ai-agent
 * 
 * @param daccPublickey - **Required:** Encrypted public key from createDaccWallet
 * @param passwordSecretkey - **Required:** Password for decrypting the wallet
 * @param privateKey - **Optional:** Direct private key (alternative to daccPublickey + password)
 * @param llm - **Required:** LLM configuration (baseURL, apiKey, model)
 * @param chains - **Required:** Array of supported chains (e.g., [optimismSepolia, baseSepolia])
 * @param tokens - **Required:** Array of tokens with name, symbol, chain, and address
 * @param systemPrompt - **Optional:** Custom system prompt (defaults to built-in prompt)
 * @returns Ai Agent with chat and streamChat
 * 
 * @example
 * import { daccAiAgent } from "dacc-js";
 * import { optimismSepolia, baseSepolia } from "viem/chains";
 * 
 * const ai = await daccAiAgent({
 *   daccPublickey: "daccPublickey_0x123_XxX...",
 *   passwordSecretkey: "my+Password#123...",
 *   // privateKey: "0xabc123...", // Optional
 *   llm: {
 *     baseURL: "https://openrouter.ai/api/v1",
 *     apiKey: process.env.OPENROUTER_API_KEY!,
 *     model: "x-ai/grok-4.1-fast",
 *   },
 *   chains: [optimismSepolia, baseSepolia],
 *   tokens: [
 *     {
 *       name: "Token1",
 *       symbol: "TOK1",
 *       chain: optimismSepolia,
 *       address: "0x123...",
 *     },
 *     {
 *       name: "Token2",
 *       symbol: "TOK2",
 *       chain: baseSepolia,
 *       address: "0x234...",
 *     },
 *   ],
 * });
 * 
 * // Chat with AI to perform transactions
 * const response = await ai.chat("Transfer 0.01 TOK1 to 0xRecipient...");
 * console.log("AI response:", response.text);
 * 
 * // Stream chat for real-time responses
 * const streamResponse = await ai.streamChat("What's my balance of Token2?");
 * for await (const chunk of streamResponse.textStream) {
 *   process.stdout.write(chunk);
 * }
 */
export async function daccAiAgent(options: TypeDaccAiAgent): Promise<AiAgentInstance> {
  const {
    chains,
    tokens,
    daccPublickey,
    passwordSecretkey,
    privateKey,
    llm,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
  } = options;

  // Resolve wallet address
  const walletAddress = privateKey
    ? privateKey
    : (await allowDaccWallet({
        daccPublickey,
        passwordSecretkey,
      })).address;

  /**
   * Find token by name or symbol
   */
  function findToken(nameOrSymbol: string): TokenInfo | undefined {
    const search = nameOrSymbol.toLowerCase();
    const found = tokens.find(
      (token) =>
        token.name.toLowerCase() === search ||
        token.symbol.toLowerCase() === search
    );
    return found;
  }

  /**
   * Get default chain from tokens or chains array
   */
  function getDefaultChain(): Chain {
    if (tokens.length > 0) {
      return tokens[0]!.chain;
    }
    return chains[0]!;
  }

  /**
   * Resolve chain from parameter or default
   */
  function resolveChain(chain?: Chain): Chain {
    return chain || getDefaultChain();
  }

  /**
   * Create AI SDK tools for blockchain actions
   */
  function createTools() {
    return {
      sendNative: tool({
        description: "Send native cryptocurrency (ETH, BNB, etc.) to a recipient address on a specific chain",
        inputSchema: z.object({
          to: z.string().describe("Recipient address (0x...)"),
          amount: z.number().describe("Amount to send in native units (e.g., ETH)"),
          chainId: z.number().optional().describe("Chain ID to use. If not provided, uses the first configured chain."),
        }),
        execute: async ({ to, amount, chainId }: { to: string; amount: number; chainId?: number }) => {
          const chain = chainId
            ? chains.find((c) => c.id === chainId)
            : getDefaultChain();
          if (!chain) {
            throw new Error(`Chain with ID ${chainId} not found in configured chains`);
          }
          const result = await daccSendNative({
            account: privateKey as `0x${string}` | undefined,
            address: walletAddress,
            daccPublickey,
            passwordSecretkey,
            to: to as `0x${string}`,
            amount,
            network: chain,
          });
          return {
            txHash: result.txHash,
            chainId: result.chainId,
            from: result.from,
            to: result.to,
            amount: result.amount.toString(),
          };
        },
      }),

      sendToken: tool({
        description: "Send ERC20 tokens to a recipient address using token name or symbol (e.g., 'OP', 'baseToken')",
        inputSchema: z.object({
          tokenNameOrSymbol: z.string().describe("Token name or symbol (e.g., 'OP', 'baseToken', 'BASE')"),
          to: z.string().describe("Recipient address (0x...)"),
          amount: z.number().describe("Amount of tokens to send"),
          chainId: z.number().optional().describe("Chain ID to use. If not provided, uses the token's chain."),
        }),
        execute: async ({ tokenNameOrSymbol, to, amount, chainId }: { tokenNameOrSymbol: string; to: string; amount: number; chainId?: number }) => {
          const token = findToken(tokenNameOrSymbol);
          if (!token) {
            throw new Error(`Token '${tokenNameOrSymbol}' not found. Available tokens: ${tokens.map((t) => `${t.name} (${t.symbol})`).join(", ")}`);
          }
          const chain = chainId
            ? chains.find((c) => c.id === chainId)
            : token.chain;
          if (!chain) {
            throw new Error(`Chain not found for token ${tokenNameOrSymbol}`);
          }
          const result = await daccSendToken({
            account: privateKey as `0x${string}` | undefined,
            address: walletAddress,
            daccPublickey,
            passwordSecretkey,
            tokenAddress: token.address,
            to: to as `0x${string}`,
            amount,
            network: chain,
          });
          return {
            txHash: result.txHash,
            chainId: result.chainId,
            from: result.from,
            to: result.to,
            tokenAddress: result.tokenAddress,
            tokenName: token.name,
            tokenSymbol: token.symbol,
            amount: result.amount,
          };
        },
      }),

      getBalanceNative: tool({
        description: "Get native cryptocurrency balance of an address",
        inputSchema: z.object({
          address: z.string().optional().describe("Address to check balance (0x...). If not provided, uses the wallet address."),
          chainId: z.number().optional().describe("Chain ID to check balance. If not provided, uses the first configured chain."),
        }),
        execute: async ({ address, chainId }: { address?: string; chainId?: number } = {}) => {
          const addr = (address as `0x${string}`) || walletAddress;
          const chain = chainId
            ? chains.find((c) => c.id === chainId)
            : getDefaultChain();
          if (!chain) {
            throw new Error("No chain configured");
          }
          return getBalanceNative({ address: addr, network: chain });
        },
      }),

      getBalanceToken: tool({
        description: "Get ERC20 token balance of an address using token name or symbol",
        inputSchema: z.object({
          tokenNameOrSymbol: z.string().describe("Token name or symbol (e.g., 'OP', 'baseToken', 'BASE')"),
          address: z.string().optional().describe("Address to check balance (0x...). If not provided, uses the wallet address."),
          chainId: z.number().optional().describe("Chain ID to check balance. If not provided, uses the token's chain."),
        }),
        execute: async ({ tokenNameOrSymbol, address, chainId }: { tokenNameOrSymbol: string; address?: string; chainId?: number }) => {
          const token = findToken(tokenNameOrSymbol);
          if (!token) {
            throw new Error(`Token '${tokenNameOrSymbol}' not found. Available tokens: ${tokens.map((t) => `${t.name} (${t.symbol})`).join(", ")}`);
          }
          const addr = (address as `0x${string}`) || walletAddress;
          const chain = chainId
            ? chains.find((c) => c.id === chainId)
            : token.chain;
          if (!chain) {
            throw new Error(`Chain not found for token ${tokenNameOrSymbol}`);
          }
          return getBalanceToken({ tokenAddress: token.address, address: addr, network: chain });
        },
      }),

      getTokens: tool({
        description: "Get list of all available tokens with their names, symbols, chains, and addresses",
        inputSchema: z.object({}),
        execute: async () => {
          return tokens.map((token) => ({
            name: token.name,
            symbol: token.symbol,
            chainId: token.chain.id,
            chainName: token.chain.name,
            address: token.address,
          }));
        },
      }),
    };
  }

  const tools = createTools();

  /**
   * Chat with the AI to perform blockchain actions
   */
  async function chat(message: string): Promise<ChatResponse> {
    const provider = createLLMProvider(llm);
    const model = provider.model(llm.model);

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      tools,
      stopWhen: stepCountIs(5),
    });

    return {
      text: result.text,
    };
  }

  /**
   * Stream chat with the AI for real-time responses
   */
  async function streamChat(message: string): Promise<StreamChatResponse> {
    const provider = createLLMProvider(llm);
    const model = provider.model(llm.model);

    const result = await streamText({
      model,
      system: systemPrompt,
      prompt: message,
      tools,
      stopWhen: stepCountIs(5),
    });

    return {
      textStream: result.textStream,
    };
  }

  return {
    chat,
    streamChat,
  };
}
