import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
}
