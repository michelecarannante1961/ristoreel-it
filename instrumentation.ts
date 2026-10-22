/**
 * Boot hook: validate the environment (production fails fast with a clear
 * list of missing variables) and, in development or on persistent Node.js
 * servers like Hostinger hPanel, run the reconciler on an interval unless
 * IN_PROCESS_RECONCILE=false.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { env } = await import("./lib/env")
  const value = env()
  if (!value.MONGODB_URI) return
  if (
    process.env.DEV_RECONCILE === "false" ||
    process.env.IN_PROCESS_RECONCILE === "false"
  )
    return
  const isDev = value.NODE_ENV === "development"
  const globalFlag = globalThis as typeof globalThis & {
    __vireoReconciler?: boolean
  }
  if (globalFlag.__vireoReconciler) return
  globalFlag.__vireoReconciler = true
  const { reconcile } = await import("./lib/generations/reconcile")
  const intervalMs = isDev ? 5_000 : 60_000
  const tick = async () => {
    try {
      const summary = await reconcile(
        isDev ? { staleSeconds: 4, pendingSeconds: 90 } : undefined
      )
      const moved = Object.entries(summary).filter(([, n]) => n > 0)
      if (moved.length)
        console.info(
          isDev ? "[reconcile:dev]" : "[reconcile:prod]",
          Object.fromEntries(moved)
        )
    } catch (error) {
      console.error(
        isDev ? "[reconcile:dev]" : "[reconcile:prod]",
        error instanceof Error ? error.message : error
      )
    }
  }
  setInterval(() => void tick(), intervalMs).unref()
}
