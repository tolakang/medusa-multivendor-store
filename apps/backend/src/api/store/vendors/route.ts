import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const vendorService = req.scope.resolve("vendorService")

  try {
    const vendors = await vendorService.list()
    res.json({ vendors })
  } catch (error) {
    res.status(500).json({ message: "Error fetching vendors" })
  }
}
