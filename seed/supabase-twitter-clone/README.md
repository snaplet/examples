# Supabase + NextJS Twitter Clone: Local Development and E2E Testing with Snaplet Seed

## Summary
- [Supabase + NextJS Twitter Clone: Local Development and E2E Testing with Snaplet Seed](#supabase--nextjs-twitter-clone-local-development-and-e2e-testing-with-snaplet-seed)
  - [Summary](#summary)
  - [What's This All About?](#whats-this-all-about)
  - [Our Approach](#our-approach)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Local Development with Supabase](#local-development-with-supabase)
    - [Setup OAuth for Local Development](#setup-oauth-for-local-development)
    - [Setup an Email+Password Login for Local Development](#setup-an-emailpassword-login-for-local-development)
    - [Setup @snaplet/seed](#setup-snapletseed)
    - [Snaplet Seed with E2E](#snaplet-seed-with-e2e)
    - [Conclusion](#conclusion)
    - [Acknowledgments](#acknowledgments)

## What's This All About?

In this tutorial, we'll leverage the Supabase guide to [Build a Twitter Clone](https://egghead.io/courses/build-a-twitter-clone-with-the-next-js-app-router-and-supabase-19bebadb?af=9qsk0a) and demonstrate how to use Snaplet Seed for efficient local development and testing. Snaplet Seed simplifies the process of developing and testing your application by providing a method to easily seed your local environment with data.

## Our Approach

We aim to integrate Snaplet Seed into your Supabase development workflow by:

1. Illustrating the simplest method to seed a local development environment for the Supabase Twitter clone using Snaplet Seed, including how to log in as a user with pre-filled data.
2. Demonstrating how to write end-to-end tests for the Supabase Twitter clone, using Snaplet Seed to create test personas.

## Prerequisites

- Familiarity with the original Supabase tutorial [here](https://egghead.io/courses/build-a-twitter-clone-with-the-next-js-app-router-and-supabase-19bebadb?af=9qsk0a) or a basic understanding of NextJS and Supabase.
- Node.js and npm installed. See the [Installation Guide](https://github.com/nvm-sh/nvm#usage).
- Docker and Docker-compose installed. [Get Docker](https://docs.docker.com/get-docker/).

## Getting Started

1. Clone the examples repository and navigate to the Supabase example:

    ```bash
    git clone git@github.com:snaplet/examples.git && cd examples/seed/supabase-twitter-clone
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

Now, you have a Supabase Twitter clone project set up. If you haven't followed the tutorial, here's what you need to know about this clone for this tutorial:

- It includes OAuth login with GitHub.
- Features a feed page where users can see everyone's tweets, post tweets, and like or unlike tweets.
- Supports real-time updates on the feed page when other users post tweets.

## Local Development with Supabase

First, let's set up a local development environment for the Supabase Twitter clone. Follow the [Supabase documentation](https://supabase.com/docs/guides/cli/local-development) for guidance:

1. Login using the Supabase CLI and initialize the project for local development:

    ```bash
    npx supabase login
    ```

![supabase-init-asciinema](https://github.com/snaplet/examples/assets/8771783/10f11bca-5dd5-42ac-b81a-b33d6016026e)

2. Sync your local project with your Supabase project:

    ```bash
    # Your projectID can be found using the `supabase projects list` command and noting the REFERENCE ID value.
    # Input your remote database password when prompted.
    npx supabase link --project-ref <your-twitter-clone-project-id>

    # Pull the database schema from the remote project.
    npx supabase db pull
    ```

This process creates a new `remote_schema.sql` file within the `supabase/migrations` folder. However, this migration lacks the necessary triggers and publications for our real-time updates to function correctly. Thus, we need to manually add them to the `remote_schema.sql` file:

```sql
-- Append at the end
-- Trigger to create a profile for a user upon creation
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION "public"."create_profile_for_user"();
-- Publication for the tweets table to enable real-time functionality
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tweets";
RESET ALL;
```

Next, we must synchronize our local development project with the remote one:

```bash
npx supabase migration repair --status applied
```

This command aligns our current migration with the remote project, ensuring both are in sync.

![supabase-db-pull-asciinema](https://github.com/snaplet/examples/assets/8771783/007d3bd6-a3e8-4bb0-93a7-c1b1e37cbe45)

With these steps completed, we're now ready to launch our local development environment:

```bash
npx supabase start

Applying migration 20240312132633_remote_schema.sql...
Seeding data with supabase/seed.sql...
Supabase local development setup is now running.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: <anon-key>
service_role key: <service-role-key>
```

To finalize the setup, we configure our NextJS project with the necessary development values. This is achieved by creating a `.env` file at the project root and populating it with the following entries:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_BASE_APP_URL=http://127.0.0.1:3000
```

### Setup OAuth for Local Development

Our Supabase Twitter clone uses GitHub OAuth for login. However, we cannot use the same OAuth credentials for our local development environment. Therefore, we need to create a new OAuth application on GitHub specifically for local development.

To accomplish this, navigate to your GitHub account's developer settings and access the OAuth applications section. Create a new OAuth application with the following settings:

- Homepage URL: `http://127.0.0.1:3000`
- Authorization callback URL: `http://localhost:54321/auth/v1/callback`

After creation, copy the client ID and secret, and add them to your `.env` file:

```bash
SUPABASE_AUTH_GITHUB_CLIENT_ID=<app-client-id>
SUPABASE_AUTH_GITHUB_SECRET=<app-client-secret>
```

Next, to activate OAuth login for our local environment, modify the `supabase/config.toml` file as follows:

```toml
[auth]
#...
# Add our redirects to the additional_redirect_urls
additional_redirect_urls = ["http://127.0.0.1:3000", "http://localhost:54321/auth/v1/callback"]
#...

# Configuration for GitHub OAuth provider
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

For the changes to take effect, restart the Supabase local development environment:

```bash
npx supabase stop --no-backup
npx supabase start
```

Now, running our Next.js dev server should allow login via GitHub:

```bash
npm run dev
> supabase-twitter-clone@0.1.0 dev
> next dev

   ▲ Next.js 14.1.1
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 1727ms
```

![GitHub login](https://github.com/snaplet/examples/assets/8771783/9dca1ab2-08ff-4fa8-a71e-31164533e9d2)

Although OAuth login works, it's not the most efficient method for automating testing or quickly logging into different personas, as it would require multiple GitHub accounts. Let's address this issue next.

### Setup an Email+Password Login for Local Development

For local development and testing, it's crucial to have the ability to log in as different personas easily. This can be achieved by creating a new user with pre-filled data. We can facilitate this by setting up an email and password login mechanism, and then utilize the Supabase admin interface to add specific data to it.

Firstly, we'll create a utility route for development purposes. This route will allow us to easily log in as a user using an email and password. To accomplish this, create a new route at `app/auth/dev/login/route.ts` with the following content:

```ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const inDevEnvironment = !!process && process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
    // This route is intended for development/testing purposes only
    if (!inDevEnvironment) {
        return NextResponse.redirect('/')
    }
    const requestUrl = new URL(request.url);
    // Extract email and password from query parameters
    const email = requestUrl.searchParams.get("email");
    const password = requestUrl.searchParams.get("password");
    if (email && password) {
        const supabase = createRouteHandlerClient({ cookies });
        // Sign in the user with email and password
        await supabase.auth.signInWithPassword({ email, password });
    }
    return NextResponse.redirect(requestUrl.origin);
}
```

With this setup, we can now easily log in as a user using email and password by navigating to:
`http://localhost:3000/api/auth/dev/login?email=<user-email>&password=<user-password>`

However, we still need to create a new user with email and password. This is where Snaplet Seed will be utilized.

### Setup @snaplet/seed

To set it up:

```bash
npx @snaplet/seed@latest init
```

You will be asked to choose an "adapter" to connect to your local database,
in this example we'll use "postgres-js".

The cli will genrate a default `seed.config.ts` for you and prompt you at some point
to edit it to provide an "adapter" allowing us to connect to the database.

What we need to do here is two things:

1. Configure the default adapter so it connect to our localhost database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
2. Ensure our seed, won't be touching our supabase internal tables as we don't want to alter them. We'll exclude them using the `select` option in the config.

So let's edit our `seed.config.ts` so it look like this:

```ts
import { defineConfig } from "@snaplet/seed/config";
import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
import postgres from "postgres";

export default defineConfig({
  // We use our postgres-js adapter to connect to our local database
  adapter: () =>
    new SeedPostgres(
      postgres("postgresql://postgres:postgres@127.0.0.1:54322/postgres")
    ),
  alias: {
    // We want inflections name on our fields see: https://docs.snaplet.dev/seed/core-concepts#inflection
    inflection: true,
  }
  select: [
    // We don't alter any extensions tables that might be owned by extensions
    "!*", 
    // We want to alter all the tables under public schema
    "public*",
    // We also want to alter some of the tables under the auth schema
    "auth.users",
    "auth.identities",
    "auth.sessions",
  ]
});
```

> Every time you alter your database schema or seed.config.ts
> you can run `npx @snaplet/seed sync` to update your seed client.

When saving this configuration, our cli watcher will detect that it's now able to connect
and introspect our database, and will finish our client generation generating a `seed.ts` file:

```ts
import { createSeedClient } from '@snaplet/seed';
import { copycat } from '@snaplet/copycat';

const seed = await createSeedClient();

// Reset the database, keeping the structure intact
await seed.$resetDatabase()

// Create 3 records in the HttpResponses table
await seed.HttpResponses(x => x(3))
```

Now, let's edit our `seed.ts` file to generate some tweets:

```ts
await seed.$resetDatabase()

// Generate 10 tweets
await seed.tweets(x => x(10))
```

After running `npx tsx seed.ts`, we encounter an error related to invalid `avatar_url` in the Next.js images. To fix this, we adjust the `avatar_url` generation in our `seed.ts`:

```ts
import { faker } from '@snaplet/copycat';

const seed = await createSeedClient({
  models: {
    profiles: {
      data: {
        avatarUrl: ({ seed }) => faker.image.avatarGitHub(),
      }
    }
  }
});

await seed.$resetDatabase()

// Generate 10 tweets with valid avatar URLs
await seed.tweets(x => x(10))
```

We can now re-run our script with `npx tsx seed.ts`.

Refreshing our page should now display the seeded tweet data correctly.

To easily log in as the creators of these tweets, we integrate the Supabase SDK into our seed script:

```ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Note you might want to use `SUPABASE_ROLE` key here with `auth.admin.signUp` if your app is using email confirmation 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PASSWORD = "testuser";
for (let i = 0; i < 5; i++) {
  const email = copycat.email(i).toLowerCase();
  const avatar = faker.image.avatarGitHub();
  const fullName = copycat.fullName(i);
  const userName = copycat.username(i);
  
  await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: {
      data: {
        avatar_url: avatar,
        name: fullName,
        user_name: userName,
      }
    }
  });
}

const { data: databaseProfiles } = await supabase.from("profiles").select();

const profiles = databaseProfiles?.map(profile => ({
  avatarUrl: profile.avatar_url,
  id: profile.id,
  name: profile.name,
  username: profile.username,
})) ?? [];

// Insert tweets linked to profiles
await seed.tweets(x => x(10), { connect: { profiles } });
console.log("Profiles created: ", profiles);
```

This process creates a pool of 5 users with email and password logins, allowing us to easily log in as any tweet creator.

Combining all the steps, our `seed.ts` file becomes:

<details>
<summary>Click to show the full code</summary>

```ts
import { createSeedClient, type profilesScalars } from '@snaplet/seed';
import { createClient } from '@supabase/supabase-js'
import {Database} from './lib/database.types'
import { copycat, faker } from '@snaplet/copycat'


const seed = await createSeedClient({
  models: {
    profiles: {
      data: {
        avatarUrl: ({ seed }) => faker.image.avatarGitHub(),
      }
    }
  }
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)



// Clears all existing data in the database, but keep the structure
await seed.$resetDatabase()

const PASSWORD = "testuser";
for (let i = 0; i < 5; i += 1) {
  const email = copycat.email(i).toLowerCase();
  const avatar: string = faker.image.avatarGitHub();
  const fullName: string = copycat.fullName(i);
  const userName: string = copycat.username(i);
  await supabase.auth.signUp({
      email,
      password: PASSWORD,
      options: {
      data: {
        avatar_url: avatar,
        name: fullName,
        user_name: userName,
      }
    }
  });
}
// In our app, all our data under public isn't directly linked under the auth.user table but rather under the public.profiles table
// And for any user inserted in the auth.users table we have a trigger that will insert a row in the public.profiles table
// Since `supabase.auth.signUp` create a user, we should now have all the profiles created as well
const { data: databaseProfiles } = await supabase.from("profiles").select()
//  We convert our database fields to something that our seed client can understand
const profiles: profilesScalars[] = databaseProfiles?.map(profile => ({
  avatarUrl: profile.avatar_url,
  id: profile.id,
  name: profile.name,
  username: profile.username,
})) ?? []

// We can now use our seed client to insert tweets that will be linked to the profiles
await seed.tweets(x => x(10), {connect: { profiles }})
console.log('Profiles created: ', profiles)
```

</details>

Re-run the seed script with the environment variables set to your local Supabase instance:

`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> npx tsx seed.ts`:

![snaplet-seed-users-and-tweets-asciinema](https://github.com/snaplet/examples/assets/8771783/db797322-d5f4-469b-8860-ca8d9f108943)

Now, visiting the Supabase admin panel will reveal 5 new users and 10 new tweets in our database. Utilizing the app/auth/dev/login route allows us to log in as any of these users:

![demo-signup](https://github.com/snaplet/examples/assets/8771783/de524d62-a6ac-4cad-b19d-e4f932a01c30)

### Snaplet Seed with E2E

With our local development environment prepared and populated with data, we can leverage Snaplet Seed to create personas for our end-to-end tests. Our objectives include testing behaviors such as:

1. A user can log in and view the feed.
2. A user can post a tweet.
3. A user can like a tweet.

First, let's add Playwright to our project:

```bash
npm init playwright@latest
```

To configure Playwright for our local development environment, we create a playwright.config.ts in the project root with the following setup:

```ts
  webServer: {
    command: 'npx supabase start && npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  }
```

Next, we'll create a new test file e2e.spec.ts at the project root. To facilitate user creation and login in our tests, we include some utility functions:
  
```ts
import { test, expect, type Page } from '@playwright/test';
import { createSeedClient, type profilesScalars } from "@snaplet/seed";
import { createClient } from '@supabase/supabase-js'
import {Database} from '../lib/database.types'
import { copycat, faker } from '@snaplet/copycat'

const PASSWORD = "testuser";

async function login(page: Page, {email, password}: {email: string, password: string}) {
  await page.goto(`./auth/dev/login?email=${email}&password=${password}`);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function createSupabaseUser(seed: string): Promise<profilesScalars & {email: string}> {
  const email = copycat.email(seed).toLowerCase();
  const avatar: string = faker.image.avatarGitHub();
  const fullName: string = copycat.fullName(seed);
  const userName: string = copycat.username(seed);
  const user = await supabase.auth.signUp({
      email,
      password: PASSWORD,
      options: {
      data: {
        avatar_url: avatar,
        name: fullName,
        user_name: userName,
      }
    }
  });
  return { id: user.data.user?.id, avatarUrl: avatar, name: fullName, username: userName, email};
}

async function createAndLoginUser(page: Page, seed: string): Promise<profilesScalars> {
  const user = await createSupabaseUser(seed);
  await login(page, {email: user.email, password: PASSWORD});
  return { id: user.id, avatarUrl: user.avatarUrl, name: user.name, username: user.username};
}
```

To ensure tests start from a clean state, we reset our database before each test using Snaplet Seed:

```ts
test.describe('Twitter Clone actions', () => {
  test.describe.configure({mode: 'serial'})

  test.beforeEach(async () => {
    const seed = await createSeedClient({ dryRun: false });
    await seed.$resetDatabase();
  });
});
```

We can now set up our personas and test the specified behaviors:

<details>
<summary>Click to show the full code</summary>

```ts
  test("can login and logout as a user", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    await createAndLoginUser(page, testId);
    // Check that the user is logged in
    await page.goto("/");
    // We should see the logout button
    const logoutButton = await page.waitForSelector(`text=${"Logout"}`);
    // Logout
    await logoutButton.click();
    // Check that the user is logged out
    expect(page.locator(`text=${"Logout"}`)).not.toBeVisible();
  });

  test("can write own tweets", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    await createAndLoginUser(page, testId);
    // Check that the user is logged in
    await page.goto("/");
    // We should now see our tweet in the page
    expect(page.locator("p", { hasText: "Hello, World!" })).not.toBeVisible();
    const tweetInput = await page.waitForSelector('input[name="title"]');
    await tweetInput.fill("Hello, World!");
    await tweetInput.press("Enter");
    // Because playwright doesn't work with nextjs router.refresh, we need to reload the page
    await page.reload();
    // The tweet should now be visible without a refresh of the page with the realtime updates
    await expect(page.locator("p", { hasText: "Hello, World!" })).toBeVisible();
  });

  test("can like existing tweets", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    const userProfile = await createAndLoginUser(page, testId);
    const seed = await createSeedClient({ dryRun: false });
    // Create some tweets to like
    await seed.tweets((x) => x(10), { connect: { profiles: [userProfile] } });
    // Check that the user is logged in
    await page.goto("/");

    const firstTweet = await page.getByTestId("tweet-0");
    // The tweet like button should be visible
    const firstTweetLikeButton = await firstTweet.getByTestId("like-button");
    const firstTweetUnlikeLikeButton =
      await firstTweet.getByTestId("unlike-button");
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
    // Like the tweet
    await firstTweetLikeButton.click();
    // The like button should now be hidden
    expect(firstTweetLikeButton).not.toBeVisible();
    // The unlike button should now be visible
    expect(firstTweetUnlikeLikeButton).toBeVisible();
    // Everything should persist after a page reload
    await page.reload();
    expect(firstTweetLikeButton).not.toBeVisible();
    expect(firstTweetUnlikeLikeButton).toBeVisible();
  });
  test("can unlike already liked tweet", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    const userProfile = await createAndLoginUser(page, testId);
    const seed = await createSeedClient({ dryRun: false });
    // Create some tweets to like
    await seed.tweets(
      (x) =>
        x(10, () => ({
          // We make it so our user has liked the tweet
          likes: [{ userId: userProfile.id }],
        })),
      { connect: { profiles: [userProfile] } }
    );
    // Check that the user is logged in
    await page.goto("/");

    const firstTweet = await page.getByTestId("tweet-0");
    // The tweet unlike button should be visible
    const firstTweetLikeButton = await firstTweet.getByTestId("like-button");
    const firstTweetUnlikeLikeButton =
      await firstTweet.getByTestId("unlike-button");
    expect(firstTweetUnlikeLikeButton).toBeVisible();
    expect(firstTweetLikeButton).not.toBeVisible();
    // Unlike the tweet
    await firstTweetUnlikeLikeButton.click();
    // The the unlike button should now be hidden and the like button available
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
    // Everything should persist after a page reload
    await page.reload();
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
  });
```

</details>

Snaplet ensures each test operates with a unique user and pre-established data conditions, facilitating a diverse range of scenario tests, such as users with or without liked tweets.

To execute our tests and visually verify the outcomes, use the command:

```bash
NEXT_PUBLIC_SUPABASE_URL=<url> NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> npx playwright test --ui
```

![e2e-test-run](https://github.com/snaplet/examples/assets/8771783/8618909a-cba6-4ae4-b5f9-024739c15430)

### Conclusion

This tutorial showcased the integration of Snaplet Seed for setting up a local development environment and creating personas for end-to-end testing within a Supabase and Next.js-based Twitter clone. We hope these insights will assist in your Supabase projects, making Snaplet Seed a valuable tool in your development arsenal.

### Acknowledgments

I would like to thank Jon Meyers for his valuable course "Build a Twitter Clone with the Next.js App Router and Supabase," hosted on egghead.io. This article was inspired and informed by his work.