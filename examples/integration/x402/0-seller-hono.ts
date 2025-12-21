import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

const app = new Hono();
const payTo = process.env.PAY_TO  as `0x${string}` || '0x000000000000000000000000000000000000dEaD' as `0x${string}`;
const port = process.env.PORT || 4021;
const network = process.env.NETWORK || 'eip155:84532';

const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL || "https://x402.org/facilitator"
});

const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

app.use(
  paymentMiddleware(
    {
      "/weather": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: network as `eip155:${number}`,
            payTo,
          },
        ],
        description: "dacc-js X x402 for content testing.",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

app.get("/weather", (c) => {
  return c.json({ message: "This content is a successful dacc-js x x402 download." });
});

serve({ fetch: app.fetch, port: Number(port) });
console.log(`Seller server is running on port: http://localhost:${port}`);
console.log(`Serving /weather endpoint that costs.`);