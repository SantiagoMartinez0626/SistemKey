const crypto = require("node:crypto");
const { toBase64Url, fromBase64Url } = require("./base64url");

function createJws(payloadObject, privateKeyPem, extraHeader = {}) {
  const header = {
    alg: "RS256",
    typ: "JWT",
    ...extraHeader
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payloadObject));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), {
    key: privateKeyPem
  });

  const encodedSignature = toBase64Url(signature);
  return `${signingInput}.${encodedSignature}`;
}

function verifyJws(jwsCompact, publicKeyPem) {
  const parts = jwsCompact.split(".");
  if (parts.length !== 3) {
    throw new Error("JWS compact serialization must have 3 parts");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = fromBase64Url(encodedSignature);

  const isValid = crypto.verify("RSA-SHA256", Buffer.from(signingInput), {
    key: publicKeyPem
  }, signature);

  if (!isValid) {
    throw new Error("Invalid JWS signature");
  }

  const header = JSON.parse(fromBase64Url(encodedHeader).toString("utf8"));
  const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8"));

  return { header, payload, jwt: jwsCompact };
}

module.exports = {
  createJws,
  verifyJws
};
