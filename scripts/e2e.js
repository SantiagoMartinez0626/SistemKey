async function run() {
  const payload = {
    sub: "user-123",
    role: "admin",
    iat: Math.floor(Date.now() / 1000)
  };

  const encryptResponse = await fetch("http://localhost:3000/encrypt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload })
  });
  const encrypted = await encryptResponse.json();

  if (!encryptResponse.ok) {
    throw new Error(`Encrypt failed: ${JSON.stringify(encrypted)}`);
  }

  const decryptResponse = await fetch("http://localhost:3001/decrypt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jwe: encrypted.jwe })
  });
  const decrypted = await decryptResponse.json();

  if (!decryptResponse.ok) {
    throw new Error(`Decrypt failed: ${JSON.stringify(decrypted)}`);
  }

  console.log(JSON.stringify({ encrypted, decrypted }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
