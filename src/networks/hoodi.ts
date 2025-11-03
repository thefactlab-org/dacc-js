import { defineChain } from 'viem'
 
export const hoodi = defineChain({
  id: 560048,
  name: 'Hoodi',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://ethereum-hoodi.gateway.tatum.io',
        'https://rpc.hoodi.ethpandaops.io',
        'https://0xrpc.io/hoodi'
        ],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://eth-hoodi.blockscout.com/',
      apiUrl: 'https://eth-hoodi.blockscout.com/api',
    },
  },
  testnet: true,
})