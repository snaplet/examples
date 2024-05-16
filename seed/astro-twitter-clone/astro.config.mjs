import { defineConfig } from "astro/config";
import db from "@astrojs/db";
import tailwind from "@astrojs/tailwind";

import cloudflare from "@astrojs/cloudflare";

/** @type {import("@astrojs/cloudflare").Options["platformProxy"]} */
export const platformProxyOptions = {
  // defaults inside `@astrojs/cloudflare`
  // to be used in `seed.ts`
  enabled: true,
  configPath: "wrangler.toml",
  experimentalJsonConfig: false,
  persist: true,
};

// https://astro.build/config
export default defineConfig({
  integrations: [db(), tailwind()],
  output: "server",
  adapter: cloudflare({
    platformProxy: platformProxyOptions,
  }),
});
