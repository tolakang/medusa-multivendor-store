import { Medusa } from "@medusajs/medusa"

const app = new Medusa()

app.listen(process.env.PORT || 9000, () => {
  console.log(`Server started on port ${process.env.PORT || 9000}`)
})
