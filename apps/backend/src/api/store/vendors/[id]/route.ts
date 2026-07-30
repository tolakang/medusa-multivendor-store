import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const vendorService = req.scope.resolve("vendorService")
  const { id } = req.params

  try {
    const vendor = await vendorService.retrieve(id)
    res.json({ vendor })
  } catch (error) {
    res.status(404).json({ message: "Vendor not found" })
  }
}
