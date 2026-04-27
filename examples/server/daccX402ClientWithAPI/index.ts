import { Hono } from "hono";
import { daccX402ClientWithAPI } from "dacc-js";
 
const app = new Hono();
 
// Create a proxy endpoint that forwards requests with x402 payment
app.get("/weather", async (c) => {
  const { daccPublickey, passwordSecretkey } = c.req.query();

  if (!daccPublickey || !passwordSecretkey) {
    return c.json({ error: "Missing daccPublickey or passwordSecretkey" }, 400);
  }
 
  const response = await daccX402ClientWithAPI({
    daccPublickey: daccPublickey,
    passwordSecretkey: passwordSecretkey,
    sellerServerURL: "http://localhost:4021",
    endpointPath: "/weather",
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  return c.json({ response: response });
});
 
// POST endpoint example
app.post("/submit", async (c) => {
  const body = await c.req.json();
  const { daccPublickey, passwordSecretkey } = body;
 
  const response = await daccX402ClientWithAPI({
    daccPublickey: daccPublickey,
    passwordSecretkey: passwordSecretkey,
    sellerServerURL: "http://localhost:4021",
    endpointPath: "/submit",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: body.data,
  });
  
  return c.json({ response: response });
});
 
export default app;