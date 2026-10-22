import { spawn } from "node:child_process"
import {
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs"
import { createConnection } from "node:net"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { randomBytes } from "node:crypto"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(root)
mkdirSync(".data/logs", { recursive: true })

if (!existsSync("node_modules/next/dist/bin/next")) {
  console.error(
    "Prima esegui PREPARA-RISTOVIDEO.cmd per installare le dipendenze."
  )
  process.exit(1)
}
if (!existsSync(".env.local")) {
  const secret = () => randomBytes(32).toString("hex")
  writeFileSync(
    ".env.local",
    [
      "APP_URL=http://localhost:3000",
      "AUTH_URL=http://localhost:3000",
      "NEXT_PUBLIC_BRAND_NAME=RistoReel",
      `AUTH_SECRET=${secret()}`,
      `HF_WEBHOOK_SECRET=${secret()}`,
      "MONGODB_URI=mongodb://127.0.0.1:27027/?replicaSet=vireo",
      "MONGODB_DB=ristoreel-dev",
      "HF_API_BASE_URL=http://localhost:4010",
      "HF_CREDENTIALS=mock:mock",
      "HF_PRICE_GUARD=true",
      "RESTAURANT_MODE=true",
      "CREDIT_MARKUP=1.5",
      "CREDIT_USD_VALUE=0.01",
      "SIGNUP_BONUS_CREDITS=500",
      "E2E_TEST_MODE=true",
      "BLOCK_DISPOSABLE_EMAIL=false",
      "NEXT_PUBLIC_DEMO_MODE=true",
      "",
    ].join("\n")
  )
}

// This launcher is deliberately local and simulated. Live deployments use their own service manager.
const config = readFileSync(".env.local", "utf8")
if (
  !/^HF_API_BASE_URL=http:\/\/(localhost|127\.0\.0\.1):4010\s*$/m.test(config)
) {
  console.error(
    "La configurazione non è quella simulata: avvia questa installazione con la procedura del server di produzione."
  )
  process.exit(1)
}

const open = (port) =>
  new Promise((done) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    socket.setTimeout(800)
    socket.once("connect", () => {
      socket.destroy()
      done(true)
    })
    socket.once("error", () => done(false))
    socket.once("timeout", () => {
      socket.destroy()
      done(false)
    })
  })
const wait = async (port, processId) => {
  const until = Date.now() + 120_000
  while (Date.now() < until) {
    if (await open(port)) return
    try {
      process.kill(processId, 0)
    } catch {
      throw new Error(
        `Il servizio sulla porta ${port} non si è avviato. Controlla .data/logs.`
      )
    }
    await new Promise((done) => setTimeout(done, 700))
  }
  throw new Error(
    `Avvio sulla porta ${port} troppo lento. Controlla .data/logs.`
  )
}
let owned = existsSync(".data/local-processes.json")
  ? JSON.parse(readFileSync(".data/local-processes.json", "utf8"))
  : []
async function start(name, args, port) {
  if (await open(port)) {
    console.log(`${name}: già disponibile.`)
    return
  }
  const log = openSync(`.data/logs/${name}.log`, "a")
  const absoluteArgs = args.map((argument) =>
    argument.startsWith("node_modules/") || argument.startsWith("scripts/")
      ? resolve(root, argument)
      : argument
  )
  const child = spawn(process.execPath, absoluteArgs, {
    cwd: root,
    windowsHide: true,
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, NODE_ENV: "development" },
  })
  child.on("error", () => console.error(`Impossibile avviare ${name}.`))
  child.unref()
  closeSync(log)
  owned = owned.filter((item) => item.name !== name)
  owned.push({ name, pid: child.pid, root, started: new Date().toISOString() })
  writeFileSync(".data/local-processes.json", JSON.stringify(owned, null, 2))
  console.log(`${name}: avvio in corso…`)
  await wait(port, child.pid)
}
try {
  await start(
    "database",
    ["node_modules/tsx/dist/cli.mjs", "scripts/dev-mongo.ts"],
    27027
  )
  const initLog = openSync(".data/logs/inizializzazione.log", "a")
  const initialized = await new Promise((done) => {
    const child = spawn(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "--conditions=react-server",
        "scripts/db-init.ts",
      ],
      { cwd: root, windowsHide: true, stdio: ["ignore", initLog, initLog] }
    )
    child.once("exit", (code) => done(code === 0))
    child.once("error", () => done(false))
  })
  closeSync(initLog)
  if (!initialized)
    throw new Error(
      "Inizializzazione del database non riuscita. Controlla .data/logs/inizializzazione.log."
    )
  await start(
    "simulatore",
    ["node_modules/tsx/dist/cli.mjs", "scripts/mock-higgsfield.ts"],
    4010
  )
  await start(
    "studio",
    ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
    3000
  )
  const response = await fetch("http://localhost:3000", {
    signal: AbortSignal.timeout(120_000),
  })
  const html = await response.text()
  if (
    !response.ok ||
    (!html.includes("RistoReel") && !html.includes("RistoVideo"))
  )
    throw new Error(
      "La porta 3000 non restituisce RistoReel. Nessun altro processo è stato arrestato."
    )
  console.log(
    "\nRISTOREEL (ristoreel.it) pronto: http://localhost:3000\nAnteprima locale: video e crediti simulati, nessun costo API."
  )
  process.exit(0)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
