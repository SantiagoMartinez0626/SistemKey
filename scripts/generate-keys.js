const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function createRsaPemPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  return { publicKey, privateKey };
}

function toEnvValue(pem) {
  return `"${pem.replace(/\n/g, "\\n")}"`;
}

const signing = createRsaPemPair();
const encryption = createRsaPemPair();

const envContent = [
  `SIGNING_PRIVATE_KEY_PEM=${toEnvValue(signing.privateKey)}`,
  `ENCRYPTION_PUBLIC_KEY_PEM=${toEnvValue(encryption.publicKey)}`,
  `DECRYPTION_PRIVATE_KEY_PEM=${toEnvValue(encryption.privateKey)}`,
  `VERIFICATION_PUBLIC_KEY_PEM=${toEnvValue(signing.publicKey)}`,
  ""
].join("\n");

const outputPath = path.join(process.cwd(), ".env");
fs.writeFileSync(outputPath, envContent, "utf8");
console.log(`Generated ${outputPath}`);
