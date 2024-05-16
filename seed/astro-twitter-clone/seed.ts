/**
 * ! Executing this script will delete all data in your database and seed it with 10 User.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";
import { copycat, faker } from "@snaplet/copycat";

import { getPlatformProxy } from "wrangler";
import { platformProxyOptions } from "./astro.config.mjs";

const downloadAndStoreImage = async (
  url: string,
  options: {
    env: Record<string, unknown>;
    key: string;
  }
) => {
  const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
  await (options.env.R2 as any).put(options.key, arrayBuffer);

  console.log(`Uploaded image:`, options.key);
};

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  const { env } = await getPlatformProxy(platformProxyOptions);

  // Seed the database with 10 Posts
  await seed.Post((x) =>
    x(10, {
      User: {
        profileImageKey: async ({ seed }) => {
          const key = copycat.uuid(seed);
          const url = faker.image.url();

          await downloadAndStoreImage(url, { key, env });

          return key;
        },
        isVerified: async ({ seed }) => {
          return copycat.int(seed, { min: 0, max: 1 });
        },
      },
      createdAt: ({ seed }) => copycat.dateString(seed),
    })
  );

  // // Type completion not working? You might want to reload your TypeScript Server to pick up the changes
  process.exit();
};

main();
