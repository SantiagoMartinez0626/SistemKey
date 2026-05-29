const { decryptJwe } = require("../../crypto/jwe");
const { verifyJws } = require("../../crypto/jws");
const { normalizePem } = require("../../utils/env");

function getBody(event) {
  if (!event || !event.body) {
    return {};
  }

  if (typeof event.body === "string") {
    return JSON.parse(event.body);
  }

  return event.body;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function handler(event) {
  try {
    const body = getBody(event);
    const jwe = body.jwe;

    if (!jwe) {
      return response(400, { message: "Missing jwe in request body" });
    }

    const decryptionPrivateKey = normalizePem(process.env.DECRYPTION_PRIVATE_KEY_PEM);
    const verificationPublicKey = normalizePem(process.env.VERIFICATION_PUBLIC_KEY_PEM);

    if (!decryptionPrivateKey || !verificationPublicKey) {
      return response(500, {
        message: "Missing key configuration in environment variables"
      });
    }

    const { plaintext } = decryptJwe(jwe, decryptionPrivateKey);
    const verified = verifyJws(plaintext, verificationPublicKey);

    return response(200, {
      jwt: verified.jwt,
      payload: verified.payload,
      header: verified.header
    });
  } catch (error) {
    return response(400, {
      message: "Failed to decrypt or verify token",
      error: error.message
    });
  }
}

module.exports = { handler };
