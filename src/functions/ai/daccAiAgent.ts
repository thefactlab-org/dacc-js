import { generateText, streamText, stepCountIs, type ToolSet } from "ai";
import { tool } from "ai";
import { createLLMProvider, DEFAULT_SYSTEM_PROMPT } from "./llm";
import { z } from "zod";
import { allowDaccWallet } from "../allowDaccWallet";
import { daccSendNative } from "../transactions/daccSendNative";
import { daccSendToken } from "../transactions/daccSendToken";
import { getReadContract } from "../read/getReadContract";
import { daccWriteContract } from "../transactions/daccWriteContract";
import { getBalanceNative } from "../balance/getBalanceNative";
import { getBalanceToken } from "../balance/getBalanceToken";
import {
  type TypeDaccAiAgent,
  type AiAgentInstance,
  type TokenInfo,
  type ContractInfo,
  type ContractMode,
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
 * @param daccPublickey - **Conditional:** Encrypted public key from createDaccWallet
 * @param passwordSecretkey - Password for decrypting the wallet
 * @param privateKey - **Conditional:** Direct private key (alternative to daccPublickey + password)
 * @param llm - **Required:** LLM configuration (baseURL, apiKey, model)
 * @param chains - **Required:** Array of supported chains (e.g., [optimismSepolia, baseSepolia])
 * @param tokens - **Required:** Array of tokens with name, symbol, decimals, chain, and address
 * @param contracts - **Optional:** Array of contracts with name, description, mode, chain, contractAddress, abi[], functionName and args
 * @param systemPrompt - **Optional:** Custom system prompt appended to default prompt
 * @returns Ai Agent with chat and streamChat
 *
 * @example
 * import { daccAiAgent } from "dacc-js";
 * import { type TypeDaccAiAgent, type TypeAiConfigToken, type TypeAiConfigContract } from 'dacc-js';
 * import { optimismSepolia, baseSepolia } from "viem/chains";
 *
 * const ai = await daccAiAgent({
 *   daccPublickey: "daccPublickey_0x123_XxX...",
 *   passwordSecretkey: "my+Password#123...",
 *   // privateKey: "0xabc123...", // Optional
 *   llm: {
 *     baseURL: "https://openrouter.ai/api/v1",
 *     apiKey: process.env.OPENROUTER_AI_API_KEY!,
 *     model: "openai/gpt-oss-20",
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
 *   contracts: [
 *     {
 *       name: "MyContract",
 *       description: "A smart contract for...",
 *       mode: "write",
 *       chain: optimismSepolia,
 *       contractAddress: "0x345...",
 *       abi: [...],
 *       functionName: "myFunction",
 *       args: ["arg1", ""],
 *     },
 *     {
 *       name: "MyContract-2",
 *       description: "A smart contract for...",
 *       mode: "read",
 *       chain: optimismSepolia,
 *       contractAddress: "0x567...",
 *       abi: [...],
 *       functionName: "myFunction",
 *       args: [],
 *     },
 *   ],
 * });
 *
 * // Chat with AI to perform transactions
 * const response = await ai.chat("Transfer 0.01 TOK1 to 0xRecipient...");
 * console.log("AI response:", response.text);
 *
 * // Stream chat for real-time responses
 * const streamResponse = await ai.streamChat("Call use MyContract args 2");
 * for await (const chunk of streamResponse.textStream) {
 *   process.stdout.write(chunk);
 * }
 */
export async function daccAiAgent(options: TypeDaccAiAgent): Promise<AiAgentInstance> {
  const {
    chains,
    tokens,
    contracts = [],
    daccPublickey,
    passwordSecretkey,
    privateKey,
    llm,
    systemPrompt = "",
  } = options;

  // Resolve wallet address
  const walletAddress = privateKey
    ? privateKey
    : (await allowDaccWallet({
        daccPublickey,
        passwordSecretkey,
      })).address;

  // Validate token aliases per chain.
    // - name must be unique per chain because the AI can search by name
    // - address must be unique per chain
    // - same name with different address is still allowed
  if (tokens.length > 0) {
    const chainNameById = new Map(chains.map((chain) => [chain.id.toString(), chain.name]));
    const seenAddresses = new Set<string>();
    const seenNames = new Set<string>();
    const nameToOriginalName = new Map<string, string>();
    const duplicateTokens = new Map<string, string>();

    for (const token of tokens) {
      const chainKey = token.chain.id.toString();
      const chainName = chainNameById.get(chainKey) ?? chainKey;
      const addressKey = `${chainKey}:${token.address.toLowerCase()}`;
      const nameKey = `${chainKey}:${token.name.trim().toLowerCase()}`;

      if (seenAddresses.has(addressKey)) {
        duplicateTokens.set(`address ${token.address} on ${chainName}`, "");
      } else {
        seenAddresses.add(addressKey);
      }

      if (seenNames.has(nameKey)) {
        const similarName = nameToOriginalName.get(nameKey) ?? token.name;
        duplicateTokens.set(`name "${token.name}" on ${chainName}`, similarName);
      } else {
        seenNames.add(nameKey);
        nameToOriginalName.set(nameKey, token.name);
      }
    }

    if (duplicateTokens.size > 0) {
      const duplicates = [...duplicateTokens.entries()].map(([key, similarName]) => {
        if (similarName) {
          return `${key}. (Note: Similar to "${similarName}")`;
        }
        return key;
      });
      throw new Error(
        `[daccAiAgent] Duplicate tokens found: ${duplicates.join(", ")}. ` +
        `Each token address and name must be unique per chain.`
      );
    }
  }

  // Validate contract names must be unique (case-insensitive)
  if (contracts.length > 0) {
    const seenNames = new Set<string>();
    const nameToOriginalName = new Map<string, string>();
    const duplicateContracts = new Map<string, string>();

    for (const contract of contracts) {
      const nameKey = contract.name.trim().toLowerCase();

      if (seenNames.has(nameKey)) {
        const similarName = nameToOriginalName.get(nameKey) ?? contract.name;
        duplicateContracts.set(`name "${contract.name}"`, similarName);
      } else {
        seenNames.add(nameKey);
        nameToOriginalName.set(nameKey, contract.name);
      }
    }

    if (duplicateContracts.size > 0) {
      const duplicates = [...duplicateContracts.entries()].map(([key, similarName]) => {
        if (similarName) {
          return `${key}. (Note: Similar to "${similarName}")`;
        }
        return key;
      });
      throw new Error(
        `[daccAiAgent] Duplicate contracts name found: ${duplicates.join(", ")}. ` +
        `Each contract name must be unique (case-insensitive).`
      );
    }
  }

  /**
   * Find token by name or symbol, optionally filter by chain
   * If chainId is not provided and multiple tokens match, throws error
   */
  function findToken(nameOrSymbol: string, chainId?: number): TokenInfo | undefined {
    const search = nameOrSymbol.toLowerCase();
    const matches = tokens.filter(
      (token) =>
        token.name.toLowerCase() === search ||
        token.symbol.toLowerCase() === search
    );

    // No match found
    if (matches.length === 0) {
      return undefined;
    }

    // If chainId is specified, filter by chain
    if (chainId) {
      const found = matches.find((t) => t.chain.id === chainId);
      return found;
    }

    // Multiple matches but no chainId specified - require user to specify
    if (matches.length > 1) {
      const tokenChoices = matches.map((t) => `"${t.name} (${t.symbol})" on ${t.chain.name} (chainId: ${t.chain.id})`).join(", ");
      throw new Error(
        `Ambiguous token '${nameOrSymbol}'. Found multiple tokens: ${tokenChoices}. Please specify chainId.`
      );
    }

    // Single match, return it
    return matches[0];
  }

  /**
   * Find contract by name and mode
   */
  function findContractByMode(name: string, mode: ContractMode): ContractInfo | undefined {
    const search = name.toLowerCase();
    return contracts.find(
      (contract) => contract.name.toLowerCase() === search && contract.mode === mode
    );
  }

  /**
   * Serialize tool result
   */
  function serializeResult(value: unknown): unknown {
    if (typeof value === "bigint") return value.toString();
    if (Array.isArray(value)) return value.map(serializeResult);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serializeResult(v)])
      );
    }
    return value;
  }

  /**
   * Get default chain from tokens or chains array
   */
  function getDefaultChain(): Chain {
    if (tokens.length > 0) {
      return tokens[0]!.chain as Chain;
    }
    return chains[0]! as Chain;
  }

  /**
   * Get the configured function ABI inputs for a contract.
   */
  function getFunctionInputs(contract: ContractInfo) {
    const abi = contract.abi;
    const functionAbi =
      abi.find((item) => item.type === "function" && "name" in item && item.name === contract.functionName) ??
      abi.find((item) => item.type === "function");
    return functionAbi && "inputs" in functionAbi ? functionAbi.inputs : [];
  }

  /**
   * Resolve configured args with AI-provided args.
   *
   * The AI should only provide values for the empty ('') placeholder slots.
   * Fixed (non-empty) values in the config are used as-is.
   * AI args are mapped in order to each '' placeholder.
   */
  function resolveContractArgs(contract: ContractInfo, aiArgs: unknown[] = []): unknown[] {
    const configArgs = contract.args ?? [];
    const inputs = getFunctionInputs(contract);
    let placeholderIndex = 0;

    return configArgs.map((configVal, index) => {
      if (configVal !== "") {
        // Fixed value — use as-is
        return configVal;
      }

      // '' placeholder — fill from AI args in order
      const resolvedValue = aiArgs[placeholderIndex];
      if (resolvedValue === undefined || resolvedValue === null || resolvedValue === "") {
        const argName = inputs[index]?.name || `arg${index}`;
        const argType = inputs[index]?.type || "unknown";
        throw new Error(
          `Missing required argument '${argName}' (type: ${argType}) at position ${placeholderIndex} for contract '${contract.name}'. ` +
          `Please provide all required values in order.`
        );
      }

      placeholderIndex += 1;
      return resolvedValue;
    });
  }

  /**
   * Count the number of '' placeholder args in a contract config.
   */
  function countPlaceholders(contract: ContractInfo): number {
    return (contract.args ?? []).filter((a) => a === "").length;
  }

  /**
   * Build a human-readable arg signature for a contract, showing only the placeholders.
   */
  function buildArgSignature(contract: ContractInfo): string {
    const inputs = getFunctionInputs(contract);
    const placeholders = (contract.args ?? []).map((a, i) =>
      a === "" && inputs[i] ? `<${inputs[i]!.name}: ${inputs[i]!.type}>` : null
    ).filter(Boolean);
    if (placeholders.length === 0) return "(no user args needed)";
    return `(${placeholders.join(", ")})`;
  }

  /**
   * Create AI SDK tools for blockchain actions
   */
  function createTools(): ToolSet {
    const readableContracts = contracts.filter((c) => c.mode === "read");
    const writableContracts = contracts.filter((c) => c.mode === "write");
    const readableNames = readableContracts.map((c) => c.name);
    const writableNames = writableContracts.map((c) => c.name);

    const baseTools = {
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
            network: chain as Chain,
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
          const token = findToken(tokenNameOrSymbol, chainId);
          if (!token) {
            throw new Error(
              `Token '${tokenNameOrSymbol}' not found. Available tokens: ${tokens.map((t) => `${t.name} (${t.symbol}) on ${t.chain.name}`).join(", ")}`
            );
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
            decimals: token.decimals ?? 18,
            network: chain as Chain,
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
          return getBalanceNative({ address: addr, network: chain as Chain });
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
          const token = findToken(tokenNameOrSymbol, chainId);
          if (!token) {
            throw new Error(
              `Token '${tokenNameOrSymbol}' not found. Available tokens: ${tokens.map((t) => `${t.name} (${t.symbol}) on ${t.chain.name}`).join(", ")}`
            );
          }
          const addr = (address as `0x${string}`) || walletAddress;
          const chain = chainId
            ? chains.find((c) => c.id === chainId)
            : token.chain;
          if (!chain) {
            throw new Error(`Chain not found for token ${tokenNameOrSymbol}`);
          }
          return getBalanceToken({ tokenAddress: token.address, address: addr, network: chain as Chain });
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

      getContracts: tool({
        description: "Get list of all available contracts with their names, descriptions, modes, chains, addresses, and functions",
        inputSchema: z.object({}),
        execute: async () => {
          return contracts.map((contract) => ({
            name: contract.name,
            description: contract.description,
            mode: contract.mode,
            chainId: contract.chain.id,
            chainName: contract.chain.name,
            contractAddress: contract.contractAddress,
            functionName: contract.functionName,
          }));
        },
      }),
    };

    // Add contract tools if configured
    if (contracts.length === 0) {
      return baseTools as ToolSet;
    }

    // Build per-contract descriptions for readContract tool
    const readContractEntries = readableContracts.map((c) => {
      const sig = buildArgSignature(c);
      const n = countPlaceholders(c);
      const desc = c.description ? ` — ${c.description}` : "";
      return `"${c.name}"${desc}: ${c.functionName}${sig} [provide ${n} arg(s) in args array]`;
    });

    // Build per-contract descriptions for writeContract tool
    const writeContractEntries = writableContracts.map((c) => {
      const sig = buildArgSignature(c);
      const n = countPlaceholders(c);
      const desc = c.description ? ` — ${c.description}` : "";
      return `"${c.name}"${desc}: ${c.functionName}${sig} [provide ${n} arg(s) in args array]`;
    });

    return {
      ...baseTools,
      ...(readableNames.length > 0
        ? {
            readContract: tool({
              description: [
                "Call a read-only (view) function on a configured smart contract.",
                "Available contracts:",
                ...readContractEntries.map((e) => `  - ${e}`),
                "",
                "IMPORTANT: The `args` array must contain ONLY the values for the placeholder (<name: type>) slots shown above, in order.",
                "Do NOT include fixed values that are already set in the config.",
              ].join("\n"),
              inputSchema: z.object({
                contractName: z.enum(readableNames as [string, ...string[]]).describe(
                  "Exact contract name from the list above"
                ),
                args: z.array(
                  z.union([z.string(), z.number(), z.boolean()])
                ).optional().describe(
                  "Ordered values for each placeholder slot only. E.g. if the contract has 2 placeholders, provide exactly 2 values."
                ),
              }),
              execute: async ({ contractName, args }: { contractName: string; args?: unknown[] }) => {
                const contract = findContractByMode(contractName, "read");
                if (!contract) {
                  throw new Error(`Contract '${contractName}' not found`);
                }
                const resolvedArgs = resolveContractArgs(contract, args ?? []);
                const result = await getReadContract({
                  network: contract.chain as Chain,
                  contractAddress: contract.contractAddress,
                  abi: contract.abi,
                  functionName: contract.functionName,
                  args: resolvedArgs,
                });
                return {
                  contractName: contract.name,
                  chainId: result.chainId,
                  contractAddress: result.contractAddress,
                  functionName: result.functionName,
                  data: serializeResult(result.data),
                };
              },
            }),
          }
        : {}),
      ...(writableNames.length > 0
        ? {
            writeContract: tool({
              description: [
                "Call a state-changing (write) function on a configured smart contract.",
                "Available contracts:",
                ...writeContractEntries.map((e) => `  - ${e}`),
                "",
                "IMPORTANT: The `args` array must contain ONLY the values for the placeholder (<name: type>) slots shown above, in order.",
                "Do NOT include fixed values that are already set in the config.",
                "Example: if a contract has placeholders <to: address>, <id: uint256> and the user says 'mint to 0xAbc id 5', pass args: [\"0xAbc\", 5]",
              ].join("\n"),
              inputSchema: z.object({
                contractName: z.enum(writableNames as [string, ...string[]]).describe(
                  "Exact contract name from the list above"
                ),
                args: z.array(
                  z.union([z.string(), z.number(), z.boolean()])
                ).optional().describe(
                  "Ordered values for each placeholder slot only. E.g. if the contract has 2 placeholders, provide exactly 2 values."
                ),
                value: z.number().optional().describe(
                  "Amount of native token (ETH) to send with the transaction, in ETH units. Omit if not payable."
                ),
              }),
              execute: async ({ contractName, args, value }: { contractName: string; args?: unknown[]; value?: number }) => {
                const contract = findContractByMode(contractName, "write");
                if (!contract) {
                  throw new Error(`Contract '${contractName}' not found`);
                }
                const resolvedArgs = resolveContractArgs(contract, args ?? []);
                const result = await daccWriteContract({
                  account: privateKey as `0x${string}` | undefined,
                  address: walletAddress,
                  daccPublickey,
                  passwordSecretkey,
                  network: contract.chain as Chain,
                  contractAddress: contract.contractAddress,
                  abi: contract.abi,
                  functionName: contract.functionName,
                  args: resolvedArgs,
                  value,
                });
                return {
                  contractName: contract.name,
                  chainId: result.chainId,
                  txHash: result.txHash,
                  from: result.from,
                  contractAddress: result.contractAddress,
                  functionName: result.functionName,
                };
              },
            }),
          }
        : {}),
    } as ToolSet;
  }

  const tools = createTools();
  const customSystemPrompt = [
    DEFAULT_SYSTEM_PROMPT,
    systemPrompt ? `\n\n## Additional Instructions\n${systemPrompt}` : "",
  ].join("").trim();

  /**
   * Chat with the AI to perform blockchain actions
   */
  async function chat(message: string): Promise<ChatResponse> {
    const provider = createLLMProvider(llm);
    const model = provider.model(llm.model);

    const result = await generateText({
      model: model,
      system: customSystemPrompt,
      prompt: message,
      tools: tools,
      stopWhen: stepCountIs(10),
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
      model: model,
      system: customSystemPrompt,
      prompt: message,
      tools: tools,
      stopWhen: stepCountIs(10),
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
