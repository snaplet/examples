# Astro Twitter Clone

## Summary

### What’s This all about

**Astro now offers a hosted database solution with Astro DB (version 4.5 onwards).** This provides a convenient way to manage data for content-driven websites built with Astro. Locally, Astro DB utilizes an SQLite database along with a `seed.ts` file for populating initial data. While the integration of a local SQLite database is great, seeding data still requires writing individual statements using the DB ORM within the seed script.

Take this schema:

```ts
const Post = defineTable({
  columns: {
    content: column.text(),
    createdAt: column.date({ default: new Date() }),
    createdByUsername: column.text({ references: () => User.columns.username }),
  },
});

const User = defineTable({
  columns: {
    username: column.text({ primaryKey: true }),
    name: column.text(),
    profileImageKey: column.text(),
    isVerified: column.boolean({ default: false }),
  },
});
```

If we wanted to create 20 random posts, using the drizzle powered ORM, it would look something like this:

```tsx
// seed.ts
import { db, User, Post } from "astro:db";

import { createId } from "@paralleldrive/cuid2";

export default async function seed() {
  const usersToInsert = new Array(10).fill(null).map((_, idx) => {
    return {
      name: `Example ${idx}`,
      username: `example-${idx}`,
      profileImageKey: createId(),
    };
  });

  const users = await db
    .insert(User)
    .values(usersToInsert)
    .returning({ username: User.username });

  await db.insert(Post).values(
    new Array(20).fill(null).map((_, idx) => {
      return {
        content: `Example post ${idx}`,
        // pick any one of the users
        createdByUsername:
          users[Math.floor(Math.random() * users.length)].username,
      };
    })
  );
}
```

### Our approach

**This works, but it becomes cumbersome as your database structure evolves or you need to include more use cases in the seed script.** There's a better way! Here's the same script using Snaplet Seed:

```tsx
export default async function seed() {
  const seed = await createSeedClient();
  await seed.Post((x) => x(10));
}
```

In this tutorial we will being adding seed to a twitter clone, to populate it with data, and use a 3rd party storage service to store the profile images.

### Prerequisites

- Node.js and npm: [Installation Guide](https://github.com/nvm-sh/nvm#usage)

### Getting started

1. `git clone git@github.com:snaplet/examples.git && cd examples/seed/astro-twitter-clone`
2. `npm install`
3. Run the app with `npm run dev` to create a `.astro` folder

You notice the following:

`seed.config.ts` file - this file is used to interface with your database. You can see that the `seed` **better-sqlite3** adapter is in use and we have defined `.astro/content` as the database path.

`seed.ts` file - at the root of the project, this is where we define our seed logic. We will be using the `@snaplet/seed` package to seed our database. At the time of writing (17 May), astro is unable to bundle seed's generated assets, so we use `execa` in the `db/seed.ts` file to execute the `seed.ts` at the root of the project.

> `seed.ts` is renamed to `root-seed.ts`

### A basic seed script

Start with the following seed script

```tsx
/**
 * ! Executing this script will delete all data in your database and seed it with 10 User.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";
import { copycat, faker } from "@snaplet/copycat";

const main = async () => {
  const seed = await createSeedClient();

  // Seed the database with 10 Posts
  await seed.Post((x) => x(10));

  process.exit();
};
```

> The reason [`resetDatabase`](https://docs.snaplet.dev/seed/reference/client#resetdatabase) function is not in use, is because Astro resets your database before running the seed script.

If we run `npm run dev` the database will be populated with the seeded data. If you visit `http://localhost:4321/` you should see the following:

![Simple example of the clone](/seed/astro-twitter-clone/imgs/example-1.png)

Great! the app has 10 posts. If you wanted to add sorting functionality to the application (sorting by verification and date). You would update the `pages/index.astro` page where the tweets are displayed.

```astro
// pages/index.astro
<query>.orderBy(asc(PostEntity.createdAt))
```

The dates are the same and none of the users are verified. Reflecting the defaults that are set in the schema. Update the `Post` creation to seed the `isVerified` and `createdAt` columns.

```tsx
// root-seed.ts
await seed.Post((x) =>
  x(10, {
    User: {
      isVerified: async ({ seed }) => {
        return copycat.int(seed, { min: 0, max: 1 });
      },
    },
    createdAt: ({ seed }) => copycat.dateString(seed),
  })
);
```

If you restart the dev server, you now have randomized dates, and a few verified users, sort by the date the post was created.

![Screenshot 2024-05-16 at 15.12.35.png](/seed/astro-twitter-clone/imgs/example-3.png)

In many scenerio's this is enough, but as the application grows so does the functionality of the application. If you were tasked with adding profile images, you would need to update the seed script to include the profile images.

### Adding Cloudflare R2 to the Astro project

You decided to use Cloudflare R2 to store the profile images. Astro has a `@astrojs/cloudflare` plugin that allows you to integrate cloudflare services right into your application.

1. **Add the Cloudflare plugin to your Astro project**

```bash
npx astro add cloudflare
```

This will install the `@astrojs/cloudflare` dependency and update your `astro.config.mjs` file.

1. **Add R2, with a platform proxy settings**

```jsx
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
```

2. Add a `wrangler.toml` file

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "webpages"
```

To add types and learn how to access the bindings you can follow the documentation [here](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-runtime)

### Loading images from R2

You've now added R2 to the application. There are two places updated:

1. `src/pages/profile/[key].ts` - this an API route that fetches the image from R2 and returns it as a response:

```ts
// src/pages/profile/[key].ts
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const { key } = ctx.params;
  if (!key) return new Response(null, { status: 400 });

  const profileImageObj = await ctx.locals.runtime.env.R2.get(key);

  if (profileImageObj === null) {
    return new Response(`${key} not found`, { status: 404 });
  }

  return new Response(profileImageObj.body);
};
```

2. `src/components/Post.astro` - this is where the profile image is loaded, using the key

```astro
<img src={`/profile/${profileImageKey}`} ... />
```

Now if you visit `http://localhost:4321/` you should see the following:

![Tweets with broken profile images](/seed/astro-twitter-clone/imgs/example-5.png)

You have tweets and profiles, but the images don't load. This is because we haven't updated the seed script to include the profile images.

### Using Seed with R2

Update the `root-seed.ts` file to get image urls using [**faker**](https://fakerjs.dev/api/image#url) image module:

```tsx
const url = faker.image.url();
```

Download the image using the `fetch` function and store the result (`ArrayBuffer`) in our local R2 instance.

```tsx
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
```

In the end your seed script should look like this:

```tsx
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

  process.exit();
};

main();
```

If you restart your dev server you should see the following if you visit your app:

![Screenshot 2024-05-16 at 15.40.01.png](/seed/astro-twitter-clone/imgs/example-4.png)

### Conclusion

In conclusion, while Astro DB offers a convenient way to manage data for Astro applications, manually writing seed statements can become tedious. Snaplet Seed provides a powerful alternative that simplifies data seeding. This guide demonstrated how to use Snaplet Seed to populate an Astro application with complex data, including profile images stored in Cloudflare R2.

Astro's easy setup eliminates the need for database provisioning, while Snaplet's seed data provides realistic, in-context information for your application, eliminating the need to understand complex data relationships. This seamless integration makes working with these two tools an amazing developer experience.
