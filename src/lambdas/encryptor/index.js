const { createJws } = require("../../crypto/jws");
const { encryptJwe } = require("../../crypto/jwe");
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
    const payload = body.payload || {};

    const signingPrivateKey = normalizePem(process.env.SIGNING_PRIVATE_KEY_PEM);
    const encryptionPublicKey = normalizePem(process.env.ENCRYPTION_PUBLIC_KEY_PEM);

    if (!signingPrivateKey || !encryptionPublicKey) {
      return response(500, {
        message: "Missing key configuration in environment variables"
      });
    }

    const jws = createJws(payload, signingPrivateKey);
    const jwe = encryptJwe(jws, encryptionPublicKey);

    return response(200, { jwe, jws });
  } catch (error) {
    return response(400, {
      message: "Failed to create JWE",
      error: error.message
    });
  }
}

module.exports = { handler };
