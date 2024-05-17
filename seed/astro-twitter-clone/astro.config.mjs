import { defineConfig } from "astro/config";
import db from "@astrojs/db";
import tailwind from "@astrojs/tailwind";

import cloudflare from "@astrojs/cloudflare";

/** @type {import("@astrojs/cloudflare").Options["platformProxy"]} */
export const platformProxyOptions = {
  // internal defaults for `@astrojs/cloudflare`
  // we will use these settings in the `seed.ts` file.
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
    // enabling this option will allow us to emulate
    // cloudflare services locally.
    platformProxy: platformProxyOptions,
  }),
});
