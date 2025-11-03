import { allowSessionTimeWalletWithJWT } from "dacc-js";
 
const jwt = await allowSessionTimeWalletWithJWT({
  daccPublickey: 'daccPublickey_XxX..',
  passwordSecretkey: 'myPassword#123..',
  jwtSecret: 'jwt-secret-to-app', // Secret used to sign the JWT
//   maxAgeSeconds: 3600 // 1 hour (default)
});
 
console.log(jwt); // eyJhZGRyZXNz...