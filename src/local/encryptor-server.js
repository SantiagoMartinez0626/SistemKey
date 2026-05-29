const http = require("node:http");
const { handler } = require("../lambdas/encryptor");

const port = Number(process.env.PORT || 3000);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/encrypt") {
    try {
      const body = await readBody(req);
      const lambdaResponse = await handler({ body: JSON.stringify(body) });
      res.writeHead(lambdaResponse.statusCode, lambdaResponse.headers);
      res.end(lambdaResponse.body);
      return;
    } catch (error) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON", error: error.message }));
      return;
    }
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "encryptor" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Not found" }));
});

server.listen(port, () => {
  console.log(`Encryptor listening on ${port}`);
});
