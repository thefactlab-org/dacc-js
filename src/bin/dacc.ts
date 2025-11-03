#!/usr/bin/env node
import { program } from "commander";
import { createDaccWallet } from "../../src/functions/createDaccWallet";
import { allowDaccWallet } from "../../src/functions/allowDaccWallet";
import prompts from "prompts";
import fs from "fs";
import path from "path";

program
  .name("dacc")
  .description("Quickly create a Dacc wallet using the command-line interface.")
  .version("1.0.0", "-v, --version", "Output the CLI version");

program
  .command("create")
  .description("Create a new Dacc wallet")
  .option("-p, --password <string>", "Password for wallet encryption")
  .option("-s, --save <path>", "Save wallet to file (optional)")
  .action(async (opts) => {
    try {
      const password =
        opts.password ||
        (
          await prompts({
            type: "password",
            name: "password",
            message: "Enter password for encryption:",
          })
        ).password;

      const result = await createDaccWallet({ passwordSecretkey: password });

      console.log("\n✅ Wallet created successfully!");
      console.log("Address:", result.address);
      console.log("DaccPublicKey:", result.daccPublickey);

      if (opts.save) {
        const savePath = path.resolve(opts.save);
        fs.writeFileSync(
          savePath,
          JSON.stringify(result, null, 2),
          "utf-8"
        );
        console.log(`💾 Saved to: ${savePath}`);
      }
    } catch (err: any) {
      console.error("❌ Error creating wallet:", err.message);
    }
  });

program
  .command("allow [daccPublickey]")
  .description("Decrypt and recover a Dacc wallet")
  .option("-f, --file <path>", "Path to wallet file (JSON, .txt, .md, etc.)")
  .option("-p, --password <string>", "Password to decrypt wallet (optional)")
  .action(async (daccArg, opts) => {
    try {
      let daccPublickey = daccArg;

      if (!daccPublickey && opts.file && fs.existsSync(opts.file)) {
        const raw = fs.readFileSync(opts.file, "utf-8").trim();
        try {
          const data = JSON.parse(raw);
          daccPublickey =
            data.daccPublickey ||
            data.publickey ||
            Object.values(data).find((v) =>
              typeof v === "string" && v.startsWith("daccPublickey_")
            );
        } catch {
          const match = raw.match(/daccPublickey_[A-Za-z0-9]+/);
          if (match) daccPublickey = match[0];
        }
      }

      if (!daccPublickey) throw new Error(
        "No daccPublickey provided. Use --file <path> or pass directly."
      );

      const password = opts.password || (
        await prompts({
          type: "password",
          name: "password",
          message: "Enter your wallet password:",
        })
      ).password;

      const wallet = await allowDaccWallet({ daccPublickey, passwordSecretkey: password });

      console.log("\n✅ Wallet decrypted successfully!");
      console.log("Address:", wallet.address);
      console.log("Private Key:", wallet.privateKey);
    } catch (err: any) {
      console.error("❌ Error decrypting wallet:", err.message);
    }
  });

program.parseAsync();
