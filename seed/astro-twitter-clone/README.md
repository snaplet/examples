## Summary

### What’s This all about

**Astro now offers a hosted database solution with Astro DB (version 4.5 onwards).** This provides a convenient way to manage data for content-driven websites built with Astro. Locally, Astro DB utilizes an SQLite database along with a `seed.ts` file for populating initial data. While the integration of a local SQLite database is great, seeding data still requires writing individual statements using your ORM within the seed script.

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

In this tutorial we will be adding seed to a twitter clone, two populate it with data, that also includes profile images.

### Prerequisites

- Node.js and npm: [Installation Guide](https://github.com/nvm-sh/nvm#usage)

### Getting started

1. `git clone git@github.com:snaplet/examples.git && cd examples/seed/astro-twitter-clone`
2. `npm install`
3. Run the app with `npm run dev` to create your `.astro` folder

You notice a few things:

`seed.config.ts` file - this is the file, `seed` will use to interface with your database. You can see that the `seed` **better-sqlite3** adapter is in use and we have defined `.astro/content` \*\*\*\*as the database path.

`seed.ts` file at root of the project - we define our logic here, and use `execa` in the `db/seed.ts` file to execute the `seed.ts` at the root of the project. This is because at the time of writing (16 May), astro is unable to bundle seed, which contains generated assets. So we use this as a workaround.

### Our first seed

In our `seed.ts` at the root of our project we have simple script.

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

> The reason `resetDatabase` function is not used, is because astro resets your database, before it runs the seed script.

If run `npm run dev` astro will run the seed script and if we visit our [`http://localhost:4321/`](http://localhost:4321/) we should see the following:

![Screenshot 2024-05-16 at 15.01.48.png](/seed/astro-twitter-clone/imgs/example-1.png)

Great! your app now us 10 users that you can now work with. However what if we wanted to add sorting functionality to the application, sorting by verified and date. At the moment all the users are marked as unverified (corresponding to the default value set in the schema definition) and all the dates are the same.

Update your `Post` creation, to seed the `isVerified` and `createdAt` columns, it should look this:

```tsx
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

If we restart our dev server again we should get the following:

![Screenshot 2024-05-16 at 15.10.03.png](/seed/astro-twitter-clone/imgs/example-2.png)

We know have randomized dates and a few verified users. When we add our sorting functionality, for now you can just sort by the date the post was created. You have this now:

![Screenshot 2024-05-16 at 15.12.35.png](/seed/astro-twitter-clone/imgs/example-3.png)

In many scenerio’s we can say that seed has done it’s, but applications grow and so does the functionality of the them. Let’s say you were tasked with adding profile images. At the end of the day, seed is run in a typescript file, like a typical seed script, we can introduce 3rd party services or query existing data to enrich the final result.

### Hooking up Cloudflare R2

You’ve decided to go for Cloudflare R2, Cloudflare’s object storage service to store the user profiles. Astro has a `@astrojs/cloudflare` plugin, that allows you to integrate cloudflare services right into your application.

1. **Add the Cloudflare plugin to your Astro project**

```bash
npx astro add cloudflare
```

This will install the `@astrojs/cloudflare` dependency and update your `astro.config.mjs`

1. **Add R2, with a platform proxy settings**

```jsx
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
    // enabling this option will allow us to emulate
    // cloudflare services locally.
    platformProxy: platformProxyOptions,
  }),
});
```

1. Add a `wrangler.toml` file

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "webpages"
```

To add types and learn how to access the bindings you can follow the documentation [here](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#cloudflare-runtime)

### Using Seed with R2

We will update our seed file, to fetch images using `fakers` image url function:

```tsx
const url = faker.image.url();
```

Download them using the `fetch` function and store them in our local R2 instance as an `ArrayBuffer`

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

If we update our app, by adding an endpoint that fetches the images (`src/pages/profile/[key].ts` ) and load them in our Post component `src/component/Post.astro` . We should now have a page with profile images.

![Screenshot 2024-05-16 at 15.40.01.png](/seed/astro-twitter-clone/imgs/example-4.png)

### Conclusion

In conclusion, while Astro DB offers a convenient way to manage data for Astro applications, manually writing seed statements can become tedious. Snaplet Seed provides a powerful alternative that simplifies data seeding. This guide demonstrated how to use Snaplet Seed to populate an Astro application with complex data, including profile images stored in Cloudflare R2.

Astro's easy setup eliminates the need for database provisioning, while Snaplet's seed data provides realistic, in-context information for your application, eliminating the need to understand complex data relationships. This seamless integration makes working with these two tools an amazing developer experience.
