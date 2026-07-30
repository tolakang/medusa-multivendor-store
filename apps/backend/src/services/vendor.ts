import { TransactionBaseService } from "@medusajs/medusa"
import { Vendor } from "../models/vendor"

class VendorService extends TransactionBaseService {
  async list() {
    const vendorRepo = this.activeManager_.getRepository(Vendor)
    return vendorRepo.find()
  }

  async retrieve(id: string) {
    const vendorRepo = this.activeManager_.getRepository(Vendor)
    return vendorRepo.findOne({ where: { id } })
  }

  async create(data: Partial<Vendor>) {
    const vendorRepo = this.activeManager_.getRepository(Vendor)
    const vendor = vendorRepo.create(data)
    return vendorRepo.save(vendor)
  }

  async update(id: string, data: Partial<Vendor>) {
    const vendorRepo = this.activeManager_.getRepository(Vendor)
    const vendor = await this.retrieve(id)
    Object.assign(vendor, data)
    return vendorRepo.save(vendor)
  }

  async delete(id: string) {
    const vendorRepo = this.activeManager_.getRepository(Vendor)
    const vendor = await this.retrieve(id)
    return vendorRepo.remove(vendor)
  }
}

export default VendorService
