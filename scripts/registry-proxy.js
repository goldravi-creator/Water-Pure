// =====================================================================
//  Local npm registry proxy (workaround for broken npm TLS on Windows)
//
//  Root cause found empirically on this machine:
//    * npm's bundled HTTP stack fails on registry responses
//      (ERR_SSL_CIPHER_OPERATION_FAILED / decryption failures) — its
//      agent keeps sockets alive and these long-lived connections get
//      corrupted by the local network/firewall.
//    * Node's built-in fetch (undici) handles large responses fine on
//      FRESH connections, but its shared pool also degrades after heavy
//      sustained use on the same sockets.
//
//  Fix: proxy every upstream request via undici fetch, and EXIT after a
//  small number of requests so the connection pool is always fresh
//  (the supervisor script restarts us instantly). npm retries cover the
//  brief restart gap.
//
//  Run the supervisor:  powershell scripts/registry-proxy-supervisor.ps1
//  Then:  npm install --registry=http://127.0.0.1:4873/ \
//             --replace-registry-host=always
// =====================================================================

const http = require("http");

const PORT = Number(process.env.PORT || 4873);
const MAX_REQUESTS = Number(process.env.MAX_REQUESTS || 120);
const UPSTREAM = "https://registry.npmjs.org";

let served = 0;

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  try {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (["host", "connection", "content-length", "accept-encoding"].includes(k)) continue;
      headers[k] = v;
    }
    headers["accept-encoding"] = "identity";
    headers.connection = "close";

    const url = new URL(req.url || "/", UPSTREAM);
    const up = await fetch(url.toString(), {
      method: req.method || "GET",
      headers,
      redirect: "follow",
    });

    const body = Buffer.from(await up.arrayBuffer());

    if (!res.headersSent) {
      res.writeHead(up.status, {
        "content-type": up.headers.get("content-type") || "application/octet-stream",
        "content-length": body.length,
        "cache-control": up.headers.get("cache-control") || "public, max-age=60",
      });
    }
    res.end(body);

    served++;
    console.log(
      `[${served}/${MAX_REQUESTS} ${((Date.now() - start) / 1000).toFixed(1)}s] ${req.method} ${req.url} → ${up.status} ${(body.length / 1048576).toFixed(1)}MB`
    );

    if (served >= MAX_REQUESTS) {
      console.log("Request budget reached — exiting for a fresh pool.");
      setTimeout(() => process.exit(0), 100);
    }
  } catch (e) {
    console.error(`UPSTREAM ERROR ${req.url}: ${e.message}`);
    try {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
      res.end("proxy error: " + e.message);
    } catch {
      /* ignore */
    }
    if (e && typeof e.message === "string" && /terminated|socket|reset|corrupt/i.test(e.message)) {
      setTimeout(() => process.exit(0), 50);
    }
  }
});

server.listen(PORT, "127.0.0.1", () =>
  console.log(`✅ npm registry proxy (fresh-pool) on http://127.0.0.1:${PORT}`)
);