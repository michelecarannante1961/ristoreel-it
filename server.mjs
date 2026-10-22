// Entry point per il gestore applicazioni Node.js (Passenger / LiteSpeed) di Hostinger hPanel.
// Nella configurazione Node.js di Hostinger imposta:
// - Application startup file: server.mjs
// - Comando build: pnpm build
import { createServer } from "node:http"
import { parse } from "node:url"
import next from "next"

process.env.NODE_ENV ||= "production"

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || "0.0.0.0"

// Non passare hostname="0.0.0.0" a next(), altrimenti Next.js riscrive gli URL di redirect su 0.0.0.0:3021
const app = next({ dev: false })
const handle = app.getRequestHandler()

await app.prepare()

createServer((req, res) => {
  if (req.headers.host && !req.headers["x-forwarded-host"]) {
    req.headers["x-forwarded-host"] = req.headers.host
  }
  const parsedUrl = parse(req.url || "/", true)
  void handle(req, res, parsedUrl)
}).listen(port, hostname, () => {
  console.log(
    `[RistoReel] Server Node.js avviato su http://${hostname}:${port} (ristoreel.it)`
  )
})
