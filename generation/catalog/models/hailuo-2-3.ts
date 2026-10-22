// Hailuo 2.3 Standard — text and image to video.
// Sources:
//   https://docs.higgsfield.ai/docs/models/hailuo-2-3
//   https://docs.higgsfield.ai/docs/models/hailuo-2-3/standard-text-to-video
//   https://docs.higgsfield.ai/docs/models/hailuo-2-3/standard-image-to-video
import { compact, first, int, requirePrompt } from "../mappers"
import type { ModelEntry } from "../types"

const DOCS = "https://docs.higgsfield.ai/docs/models/hailuo-2-3"

const hailuo23: ModelEntry = {
  id: "hailuo-2.3",
  surface: "video",
  family: "MiniMax",
  provider: "MiniMax",
  icon: "minimax",
  label: "Hailuo 2.3",
  description:
    "Clip economiche a 768p con movimenti realistici da testo o da foto iniziale.",
  bestFor: "Clip economiche con fisica naturale",
  category: "GENERAL",
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
      values: ["6", "10"],
      default: "6",
      label: "Durata",
      labels: { "6": "6s", "10": "10s" },
    },
    promptOptimizer: {
      type: "boolean",
      default: true,
      label: "Migliora prompt",
      hint: "Rifinisci automaticamente il prompt prima di generare.",
    },
  },
  enhanceSetting: "promptOptimizer",
  order: 190,
  docs: [
    DOCS,
    `${DOCS}/standard-text-to-video`,
    `${DOCS}/standard-image-to-video`,
  ],
  toPlatform: (plane) => {
    const start = first(plane, "start")
    const body = compact({
      prompt: requirePrompt(plane, "Hailuo 2.3"),
      duration: int(plane.settings.duration),
      prompt_optimizer: plane.settings.promptOptimizer,
    })
    if (start)
      return {
        path: "minimax/hailuo-2.3/standard/image-to-video",
        body: { ...body, image_url: start },
      }
    return { path: "minimax/hailuo-2.3/standard/text-to-video", body }
  },
}

export default hailuo23
