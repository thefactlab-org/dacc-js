import { daccAiAgent } from 'dacc-js';
import { optimismSepolia, baseSepolia } from 'viem/chains';
 
const ai = await daccAiAgent({
  daccPublickey: 'daccPublickey_0x123_XxX..',
  passwordSecretkey: 'my+Password#123..',
  // privateKey: '0xabc123...', // Optional
  llm: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY!,
    model: 'x-ai/grok-4.1-fast',
  },
  chains: [optimismSepolia, baseSepolia],
  tokens: [
    {
      name: 'Token1',
      symbol: 'TOK1',
      chain: optimismSepolia,
      address: '0x123...',
    },
    {
      name: 'Token2',
      symbol: 'TOK2',
      chain: baseSepolia,
      address: '0x234...',
    },
  ],
});
 
// Chat with AI to perform transactions
const response = await ai.chat("Transfer 0.01 TOK1 to 0xRecipient...");
console.log('AI response:', response.text);
 
// Stream chat for real-time responses
const streamResponse = await ai.streamChat("What's my balance of Token2?");
for await (const chunk of streamResponse.textStream) {
  process.stdout.write(chunk);
}