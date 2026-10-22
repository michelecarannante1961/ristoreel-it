# Vireo — contract for coding agents

## RistoVideo specialization (owner-approved, 2026-10-21)

- Product: Italian restaurant video studio, 20 areas and all 161 user-supplied topics in `lib/restaurant/catalog.ts`.
- Preserve a Higgsfield-like studio layout; the owner explicitly requires different colors. Copper `#e8a276`, charcoal and cream override the original lime-only palette below.
- `RESTAURANT_MODE=true` requires a valid structured brief on the server. Prompt context is deterministic; it is not a semantic moderation classifier.
- Retail rule: supplier cost times 1.5, rounded up to whole credits. `creditConfig()` enforces the factor in restaurant mode. Never confuse a 50% markup with a 50% net margin.
- Any changed accepted credit quote blocks the request before debit. Live restaurant requests fail closed when numeric supplier estimates cannot be verified.
- Euro values use a dated ECB conversion for display only. Current credit checkout is USD; do not label it an EUR checkout. Restaurant top-ups have no inherited plan/pack bonuses; inherited subscriptions are not sold.
- Local `.env.local` uses the mock only. The generated `public/media/ristorazione/demo.mp4` is an explicitly labeled demo fixture, not an AI output.
- Before live launch: clarify upstream licenses, configure owned service credentials and validate real generation, payment currency and invoices end to end. Never print secrets or magic-link URLs.
- Current stage is local development. Do not deploy demo mailboxes, mock credentials or simulated payment claims.

Vireo is a credit-metered AI image/video studio on the Higgsfield REST API,
scaffolded from `higgsfield-ai/app-templates` (studio). Read `README.md`,
`docs/decisions.md` and `docs/model-catalog.md` before changing behaviour.

## Layout

- `app/(site)` marketing pages (expanded nav + footer) · `app/(studio)` full-height
  workspaces (generators, library) · `app/(app)` scrolling signed-in pages
  (account, billing, admin) · `app/api` route handlers · `app/actions` server actions.
- `generation/catalog/models/*.ts` — one file per model family; the barrel is
  generated (`pnpm models`). Never hand-edit `models.generated.ts`.
- `lib/higgsfield` (server-only platform client), `lib/generations` (submit,
  finalize, reconcile, cancel, library), `lib/billing` (price, ledger, Stripe),
  `lib/db`, `lib/storage` (R2 / local), `lib/uploads.ts`, `auth.ts`.
- `components/generator` (panel, dock, canvas, picker), `components/studio`
  (template primitives: prompt box, gallery, lightbox, asset library),
  `components/site`, `components/billing`, `components/library`, `components/admin`.

## Invariants — preserve these

- **Server only:** the platform key, Stripe/Resend/R2 secrets and model paths.
  `lib/higgsfield/**` imports `server-only`. Request paths and bodies come from
  the catalog (`toPlatform`), never from the client.
- **Every server action / route handler** calls `auth()` (via `requireUser`)
  and scopes queries by `userId`; other users' ids are 404, not 403.
- **Credits change only through `lib/billing/ledger.ts`**, inside transactions,
  never below zero, idempotent on `{reason, refType, refId, bucket}`.
- **Prices come from `priceFor`/`quoteRequest`** on the server; the client's
  number is display only.
- **Finalize is the only path to a terminal status**; it re-fetches the status
  (webhook payloads are untrusted) and refunds failed/nsfw/canceled once.
- **Poll our DB, not the platform:** the browser polls
  `GET /api/generations/status`; never poll through a server action.
- **Model files cite their docs URLs**; never invent endpoints, fields or enums.
- Generating and failed tiles stay in feeds; loaded media never unmounts on fast scroll.
- Dark only; lime is reserved for the Generate CTA and active states; every
  visible control works (remove what can't); no `any`, `@ts-ignore`,
  `@ts-expect-error`.

## Definition of done for a change

`pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass; E2E
(`pnpm test:e2e`) passes against a running stack; docs updated when a default
or contract changes.
