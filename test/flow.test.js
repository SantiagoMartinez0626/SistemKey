const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const { handler: encryptHandler } = require("../src/lambdas/encryptor");
const { handler: decryptHandler } = require("../src/lambdas/decryptor");

function createRsaPemPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  return { publicKey, privateKey };
}

test("should create JWE and then recover verified JWT", async () => {
  const signing = createRsaPemPair();
  const encryption = createRsaPemPair();

  process.env.SIGNING_PRIVATE_KEY_PEM = signing.privateKey;
  process.env.ENCRYPTION_PUBLIC_KEY_PEM = encryption.publicKey;
  process.env.DECRYPTION_PRIVATE_KEY_PEM = encryption.privateKey;
  process.env.VERIFICATION_PUBLIC_KEY_PEM = signing.publicKey;

  const payload = {
    sub: "user-123",
    role: "admin",
    iat: Math.floor(Date.now() / 1000)
  };

  const encryptedResponse = await encryptHandler({
    body: JSON.stringify({ payload })
  });
  assert.equal(encryptedResponse.statusCode, 200);

  const encryptedBody = JSON.parse(encryptedResponse.body);
  assert.ok(encryptedBody.jwe);
  assert.ok(encryptedBody.jws);

  const decryptedResponse = await decryptHandler({
    body: JSON.stringify({ jwe: encryptedBody.jwe })
  });
  assert.equal(decryptedResponse.statusCode, 200);

  const decryptedBody = JSON.parse(decryptedResponse.body);
  assert.deepEqual(decryptedBody.payload.sub, payload.sub);
  assert.deepEqual(decryptedBody.payload.role, payload.role);
  assert.equal(decryptedBody.header.alg, "RS256");
});
