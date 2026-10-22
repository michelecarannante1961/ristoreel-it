// Kling 2.5 Turbo — Pro (text or start frame) and Standard (start frame or text fallback).
// Sources:
//   https://docs.higgsfield.ai/docs/models/kling-2-5-turbo
//   https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/pro-text-to-video
//   https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/pro-image-to-video
//   https://docs.higgsfield.ai/docs/models/kling-2-5-turbo/standard-image-to-video
import { compact, first, int, requirePrompt } from "../mappers"
import type { GenerationPlane, ModelEntry } from "../types"

const DOCS = "https://docs.higgsfield.ai/docs/models/kling-2-5-turbo"

const meta = {
  surface: "video",
  family: "Kling",
  provider: "Kuaishou",
  icon: "kling",
  roles: { start: 1 },
  requirePrompt: true,
  settings: {
    aspectRatio: {
      type: "enum",
      values: ["16:9", "9:16", "1:1"],
      default: "16:9",
      label: "Formato",
      labels: {
        "16:9": "16:9",
        "9:16": "9:16",
        "1:1": "1:1",
      },
    },
    duration: {
      type: "enum",
      values: ["5", "10"],
      default: "5",
      label: "Durata",
      labels: { "5": "5s", "10": "10s" },
    },
    cfgScale: {
      type: "range",
      min: 0,
      max: 1,
      step: 0.1,
      default: 0.5,
      label: "Fedeltà al prompt",
      hint: "Più alto = segue il testo in modo più letterale.",
    },
  },
} satisfies Partial<ModelEntry>

function turboBody(plane: GenerationPlane, label: string) {
  return compact({
    prompt: requirePrompt(plane, label),
    duration: int(plane.settings.duration),
    cfg_scale: plane.settings.cfgScale,
  })
}

export const kling25Turbo: ModelEntry = {
  ...meta,
  id: "kling-2.5-turbo",
  label: "Kling 2.5 Turbo Pro",
  description:
    "Clip veloci e convenienti da testo o da foto iniziale (senza audio).",
  bestFor: "Clip veloci ed economiche da testo o foto",
  badges: ["FAST", "PRO"],
  category: "FAST",
  order: 170,
  docs: [DOCS, `${DOCS}/pro-text-to-video`, `${DOCS}/pro-image-to-video`],
  toPlatform: (plane) => {
    const start = first(plane, "start")
    const body = turboBody(plane, "Kling 2.5 Turbo Pro")
    if (start)
      return {
        path: "kling-video/v2.5-turbo/pro/image-to-video",
        body: { ...body, image_url: start },
      }
    return { path: "kling-video/v2.5-turbo/pro/text-to-video", body }
  },
}

export const kling25TurboStd: ModelEntry = {
  ...meta,
  id: "kling-2.5-turbo-std",
  label: "Kling 2.5 Turbo",
  description:
    "Il modo più economico per animare una foto o generare una clip veloce da 5 o 10 secondi.",
  bestFor: "Animazione foto o clip veloce a basso costo",
  badges: ["FAST"],
  category: "FAST",
  order: 171,
  docs: [DOCS, `${DOCS}/standard-image-to-video`, `${DOCS}/pro-text-to-video`],
  toPlatform: (plane) => {
    const start = first(plane, "start")
    const body = turboBody(plane, "Kling 2.5 Turbo")
    if (start)
      return {
        path: "kling-video/v2.5-turbo/standard/image-to-video",
        body: { ...body, image_url: start },
      }
    return {
      path: "kling-video/v2.5-turbo/pro/text-to-video",
      body,
    }
  },
}

const models = [kling25Turbo, kling25TurboStd]
export default models
