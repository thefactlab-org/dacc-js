import { verifySessionTimeWalletWithJWT } from "dacc-js";
 
const walletJWT = await verifySessionTimeWalletWithJWT({
  jwt: 'eyJhZGRyZXNz...', // JWT obtained from allowSessionTimeWalletWithJWT
  jwtSecret: 'jwt-secret-to-app'
});
 
console.log(walletJWT); // {address: '0x123...', privateKey: '0xabc...'} or null
console.log(walletJWT?.address); // 0x123address...
console.log(walletJWT?.privateKey); // 0xabcprivatekey...