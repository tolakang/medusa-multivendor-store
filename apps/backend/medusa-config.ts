import { loadEnv, Modules, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

// Read env vars with fallbacks
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const WORKER_MODE = (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" | undefined) ?? "shared";
const SHOULD_DISABLE_ADMIN = process.env.MEDUSA_DISABLE_ADMIN === "true";

const BACKEND_URL = process.env.BACKEND_URL || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const STORE_CORS = process.env.STORE_CORS;
const ADMIN_CORS = process.env.ADMIN_CORS;
const AUTH_CORS = process.env.AUTH_CORS;

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_ADMIN_KEY || process.env.MEILISEARCH_API_KEY;

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      storeCors: STORE_CORS,
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard", "@medusajs/admin-shared"],
      },
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    // File storage (local by default, S3 if configured)
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: `${BACKEND_URL}/static`,
            },
          },
        ],
      },
    },
    // Event bus (Redis)
    ...(REDIS_URL
      ? [
          {
            key: Modules.EVENT_BUS,
            resolve: "@medusajs/event-bus-redis",
            options: { redisUrl: REDIS_URL },
          },
          {
            key: Modules.WORKFLOW_ENGINE,
            resolve: "@medusajs/workflow-engine-redis",
            options: { redis: { redisUrl: REDIS_URL } },
          },
        ]
      : []),
  ],
  plugins: [
    // Meilisearch integration (optional)
    ...(MEILISEARCH_HOST && MEILISEARCH_API_KEY
      ? [
          {
            resolve: "@rokmohar/medusa-plugin-meilisearch",
            options: {
              config: { host: MEILISEARCH_HOST, apiKey: MEILISEARCH_API_KEY },
              settings: {
                products: {
                  type: "products",
                  enabled: true,
                  fields: ["id", "title", "description", "handle", "variant_sku", "thumbnail"],
                  indexSettings: {
                    searchableAttributes: ["title", "description", "variant_sku"],
                    displayedAttributes: ["id", "handle", "title", "description", "variant_sku", "thumbnail"],
                    filterableAttributes: ["id", "handle"],
                  },
                  primaryKey: "id",
                },
              },
            },
          },
        ]
      : []),
  ],
};

export default defineConfig(medusaConfig);
