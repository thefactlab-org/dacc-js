import { daccX402ClientWithAPI } from 'dacc-js';

// sell server: https://github.com/thefactlab-org/dacc-js/tree/main/examples/server/daccX402ClientWithAPI
const response = await daccX402ClientWithAPI({
  // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
  daccPublickey: 'daccPublickey_0x123_XxX..',
  passwordSecretkey: "my+Password#123..",
  sellerServerURL: 'http://localhost:4021',
  endpointPath: '/weather',
  method: 'GET', // GET, POST
  headers: { 'Content-Type': 'application/json' },
  // data: { key: 'value' } // Optionals body
});
 
console.log(response); // API response data