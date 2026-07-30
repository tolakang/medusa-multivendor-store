import { defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV, process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseLogging: false,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    {
      resolve: "@medusajs/file-local",
      options: {
        upload_dir: "uploads",
      },
    },
    {
      resolve: "medusa-plugin-meilisearch",
      options: {
        config: {
          host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
          apiKey: process.env.MEILISEARCH_MASTER_KEY || "masterKey",
        },
        settings: {
          products: {
            searchableAttributes: ["title", "description", "variant_sku", "collection_title", "vendor"],
            attributesForFaceting: ["available", "variant_sku", "options", "collections.title", "vendor", "material", "category"],
          },
        },
        indexSettings: true,
        reindex: true,
      },
    },
  ],
})

function loadEnv(env: string | undefined, cwd: string) {
  const dotenv = require("dotenv")
  try {
    if (env === "production") {
      dotenv.config({ path: `${cwd}/.env.production` })
    } else if (env === "staging") {
      dotenv.config({ path: `${cwd}/.env.staging` })
    } else {
      dotenv.config({ path: `${cwd}/.env` })
    }
  } catch (e) {
    // ignore
  }
}
