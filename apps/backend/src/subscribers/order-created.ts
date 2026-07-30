import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa"

export default async function handleOrderCreated({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  logger.info(`Order ${event.data.id} was created`)
}

export const config: SubscriberConfig = {
  event: "order.created",
}
