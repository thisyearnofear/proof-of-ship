/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "target", "idl", "blockchain_solana.json");
const dst = path.join(__dirname, "..", "..", "frontend", "src", "idl", "blockchain_solana.json");

if (!fs.existsSync(src)) {
  console.error(`IDL not found at: ${src}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log(`Copied IDL -> ${dst}`);

