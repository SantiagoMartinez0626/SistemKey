const crypto = require("node:crypto");
const { toBase64Url, fromBase64Url } = require("./base64url");

function encryptJwe(plaintext, recipientPublicKeyPem, extraHeader = {}) {
  const header = {
    alg: "RSA-OAEP-256",
    enc: "A256GCM",
    cty: "JWT",
    ...extraHeader
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const aad = Buffer.from(encodedHeader, "utf8");

  const cek = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const encryptedKey = crypto.publicEncrypt(
    {
      key: recipientPublicKeyPem,
      oaepHash: "sha256",
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    cek
  );

  const cipher = crypto.createCipheriv("aes-256-gcm", cek, iv);
  cipher.setAAD(aad);

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    encodedHeader,
    toBase64Url(encryptedKey),
    toBase64Url(iv),
    toBase64Url(ciphertext),
    toBase64Url(tag)
  ].join(".");
}

function decryptJwe(jweCompact, recipientPrivateKeyPem) {
  const parts = jweCompact.split(".");
  if (parts.length !== 5) {
    throw new Error("JWE compact serialization must have 5 parts");
  }

  const [
    encodedHeader,
    encodedEncryptedKey,
    encodedIv,
    encodedCiphertext,
    encodedTag
  ] = parts;

  const header = JSON.parse(fromBase64Url(encodedHeader).toString("utf8"));
  if (header.alg !== "RSA-OAEP-256" || header.enc !== "A256GCM") {
    throw new Error("Unsupported JWE algorithms");
  }

  const cek = crypto.privateDecrypt(
    {
      key: recipientPrivateKeyPem,
      oaepHash: "sha256",
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    fromBase64Url(encodedEncryptedKey)
  );

  const decipher = crypto.createDecipheriv("aes-256-gcm", cek, fromBase64Url(encodedIv));
  decipher.setAAD(Buffer.from(encodedHeader, "utf8"));
  decipher.setAuthTag(fromBase64Url(encodedTag));

  const plaintext = Buffer.concat([
    decipher.update(fromBase64Url(encodedCiphertext)),
    decipher.final()
  ]).toString("utf8");

  return { header, plaintext };
}

module.exports = {
  encryptJwe,
  decryptJwe
};
