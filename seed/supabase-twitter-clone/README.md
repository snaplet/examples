# Supabase + NextJS Twitter Clone: Local development and E2E testing with Snaplet Seed

### What's this all about ?

In this example, we will be re-using the supabase tutorial to [Build a Twitter Clone](https://egghead.io/courses/build-a-twitter-clone-with-the-next-js-app-router-and-supabase-19bebadb?af=9qsk0a) and demonstrate how to use snaplet seed to develop and test the application locally very easily.

### Our Approach

To demonstrate how to integrate snaplet seed in your supabase development workflow, we will be doing two things:

1. We will show the easiest method to seed up a local development environment for the supabase twitter clone using snaplet seed. Demonstrating how to login as a user with some data already preffiled in it.
2. We will show how to write end-to-end tests for the supabase twitter clone using snaplet seed to create the tests personas.

### Prerequisites

- You should either have read the supabase original tutorial [here](https://egghead.io/courses/build-a-twitter-clone-with-the-next-js-app-router-and-supabase-19bebadb?af=9qsk0a) or have some knowledge of NextJS and Supabase.
- Node.js and npm: [Installation Guide](https://github.com/nvm-sh/nvm#usage)
- Docker and docker-compose: [Get Docker](https://docs.docker.com/get-docker/)

### Getting Started

1. Let's first clone our examples repository and navigate to the supabase example:
```bash
git clone git@github.com:snaplet/examples.git && cd examples/seed/supabase-twitter-clone
```

2. Install the dependencies:
```bash
npm install
```

So here, we are, we now have a supabase twitter clone project. If you didn't follow the tutorial here is the outline of what's inside this clone that will be of interest to us during this tutorial:

1. We have a Oauth login with github
2. We have a feed page where we can see the tweets of everyone connected, connected users can also post tweets, like or unlike tweets.
3. We have real-time updates on the feed page when other users post tweets.

### Local Development with supabase

The first thing we want to do is to setup a local development environment for the supabase twitter clone.
So let's first follow the [Supabase docs](https://supabase.com/docs/guides/cli/local-development) about it:

First we need to login using the supabase cli and init the project for supabase local development:
```bash
npx supabase login
npx supabase init
```

[![supabase-init](https://asciinema.org/a/d1B5ZcVDiHth3X7qodf3h4rZM.svg)](https://asciinema.org/a/d1B5ZcVDiHth3X7qodf3h4rZM)

This will have created a new "supabase" folder in our project with some files in it. But we now need to sync our local project
with the one we created and setup on supabase. To do that we need to run the following command:

```bash
# Your projectID can be found using supabase projects list command and getting the REFERENCE ID value
# then input your remote database password when asked to
npx supabase link --project-ref <your-twitter-clone-project-id>
# We need a valid migrations folder for supabase to pull the first migration in
mkdir -p supabase/migrations
# Now we can pull the database schema from the remote project
npx supabase db pull
```

This will have created a new file `supabase/migrations` folder with a `remote_schema.sql` file in it. But this migration is missing the triggers and publications that we need for our real-time updates to work. So we need to add them manually to the `remote_schema.sql` file:

```sql
-- append at the end
-- We create our trigger to create a profile for a user when it's created
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION "public"."create_profile_for_user"();
-- We create our publication for the tweets table to enable realtime on it
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tweets";
RESET ALL;
```

The, we must sync our local development project with the remote one:

```bash
npx supabase migration repair --status applied
```

This will push our current migration to the remote project so it's in sync with the remote project.

[![supabase-db-pull](https://asciinema.org/a/2FvlJxh6CH8eJciakpY3C2Bjy.svg)](https://asciinema.org/a/2FvlJxh6CH8eJciakpY3C2Bjy)

Then we're finally ready to start our local development environment:

```bash
npx supabase start

Applying migration 20240312132633_remote_schema.sql...
Seeding data supabase/seed.sql...
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: <anon-key>
service_role key: <service-role-key>
```

Now, we want to setup those development values for our nextjs project. We can do that by creating a `.env` file in the root of our project and adding the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_BASE_APP_URL=http://127.0.0.1:3000
```

### Setup OAuth for local development

Our supabase twitter clone uses OAuth of github to login. Issue is that we can't use the same OAuth credentials for our local development environment. So we need to create a new OAuth application on github and use those credentials for our local development.

To do that, go to your github account, developer settings and navigate to the OAuth applications section. Then create a new OAuth application with the following values:

- Homepage URL: http://127.0.0.1:3000
- Authorization callback URL: http://localhost:54321/auth/v1/callback

Copy it's client id and secret and add them to your `.env` file:

```bash
SUPABASE_AUTH_GITHUB_CLIENT_ID=<app-client-id>
SUPABASE_AUTH_GITHUB_SECRET=<app-client-secret>
```

Now, we wan to activate the OAuth login for our local development environment. To do that, we need to edit the `supabase/config.toml` file like so:

```toml
[auth]
#...
# We need ot add our redirect to the additional_redirect_urls
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:54321/auth/v1/callback"]
#...

# Configuration for github OAuth provider
[auth.external.github]
enabled = true
client_id = "env(SUPABASE_AUTH_GITHUB_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GITHUB_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

For the changes to take effect, we need to restart our supabase local development environment:

```bash
npx supabase stop --no-backup
npx supabase start
```

And we should also be able to run our next dev server and login with github:

```bash
npm run dev
> supabase-twitter-clone@0.1.0 dev
> next dev

   ▲ Next.js 14.1.1
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 1727ms
```

![github-login](https://github.com/snaplet/examples/assets/8771783/9dca1ab2-08ff-4fa8-a71e-31164533e9d2)

Alright now we can "use" our app but oauth login is not really the best way to automate testing and quickly login to different personas.
It would require multiples github account and that's not really convenient so let's fix that !

### Setup a email+password login for local development:

For local development and testing, we want to be able to login as different personas easily. We can do that by creating a new user with some data already prefilled in it. We can do that by creating a new user with a email+password login and then use the supabase admin to add some data to it.

First, we will create an utils route for development, this route will allows us to easily login as a user with email+password.
So let's create a new route under `app/auth/dev/login/route.ts` with the following content in it:

```ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const inDevEnvironment = !!process && process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
    // We want to enable this route for development/testing only
    if (!inDevEnvironment) {
        return NextResponse.redirect('/')
    }
    const requestUrl = new URL(request.url);
    // We extract the email and password from the query params
    const email = requestUrl.searchParams.get("email");
    const password = requestUrl.searchParams.get("password");
    if (email && password) {
        const supabase = createRouteHandlerClient({ cookies })
        // We sign in the user with email+password
        await supabase.auth.signInWithPassword({ email, password })
    }
    return NextResponse.redirect(requestUrl.origin)
}
```

With that in place, we can now easily login as a user with email+password by visiting the following url:
`http://localhost:3000/api/auth/dev/login?email=<user-email>&password=<user-password>`

But we still need to create a new user with email+password. This is where snaplet seed will come into play.

### Setup @snaplet/seed

First, we want to setup snaplet for our project. To do so we simply run snaplet setup and follow the instructions,
using our local development supabase database as a target (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`)

[![snaplet-setup](https://asciinema.org/a/GQTPGHS0dnG7NZ0KqzJM7uWpq.svg)](https://asciinema.org/a/GQTPGHS0dnG7NZ0KqzJM7uWpq)

This will generate a `seed.mts` file looking like this:

```ts
import { createSeedClient } from '@snaplet/seed';

// You can use @snaplet/copycat to generate fake data for a field, for example:
// ```
// await seed.users([{ email: ({ seed }) => copycat.email(seed) }])
// ```
// More on this in our docs: https://docs.snaplet.dev/core-concepts/seed#inside-the-snapletseed-workflow
import { copycat } from '@snaplet/copycat'

// This is a basic example generated by Snaplet to start you off, check out the docs for where to go from here
// * For more on getting started with @snaplet/seed: https://docs.snaplet.dev/getting-started/quick-start/seed
// * For a more detailed reference: https://docs.snaplet.dev/core-concepts/seed


const seed = await createSeedClient({
  dryRun: process.env.DRY !== '0',
});

// Clears all existing data in the database, but keep the structure
await seed.$resetDatabase()


// This will create 3 records in the HttpResponses table
// it reads HttpResponses times(x) 3
await seed.HttpResponses(x => x(3))

// Run it with: DRY=0 npx tsx seed.mts
```

By default snaplet will pull everything in our database, but for supabase, we want to be able to pull only to some of the schemas.
To do so, let's add a `snaplet.config.ts` file in the root of our project with the following content:

```ts
/// <reference path=".snaplet/snaplet.d.ts" />
import {defineConfig} from 'snaplet'

export default defineConfig({
    select: {
        $default: false,
        auth: {
            $default: false,
            // We only want those tables so our $resetDatabase flush all existing users or sessions
            users: true,
            identities: true,
            sessions: true,
        },
        public: true,
    }
})
```

Now let's regenerate our seed file with the new configuration:
[![snaplet-setup-generate](https://asciinema.org/a/wtyKxRZB6p3i0R4SO6Hoqwx1s.svg)](https://asciinema.org/a/wtyKxRZB6p3i0R4SO6Hoqwx1s)

Now let's see if we can generate some tweets, by editing our `seed.mts` file to:

```ts
import { createSeedClient } from '@snaplet/seed';

// You can use @snaplet/copycat to generate fake data for a field, for example:
// ```
// await seed.users([{ email: ({ seed }) => copycat.email(seed) }])
// ```
// More on this in our docs: https://docs.snaplet.dev/core-concepts/seed#inside-the-snapletseed-workflow
import { copycat } from '@snaplet/copycat'

// This is a basic example generated by Snaplet to start you off, check out the docs for where to go from here
// * For more on getting started with @snaplet/seed: https://docs.snaplet.dev/getting-started/quick-start/seed
// * For a more detailed reference: https://docs.snaplet.dev/core-concepts/seed


const seed = await createSeedClient({
  dryRun: process.env.DRY !== '0',
});

// Clears all existing data in the database, but keep the structure
await seed.$resetDatabase()


await seed.tweets(x => x(10))
```

Then if we run it via `DRY=0 npx tsx seed.mts` we can head to our localhost dev server, but we see an error from next/images mentionning that the avatar_url is invalid.

Indeed, we want to have valid urls coming from github as avatar_url (as mentioned in the `next.config.mjs` file). To do so, we can simply override how the avatar_url is generated in our `seed.mts` file at the model level:

```ts
const seed = await createSeedClient({
  dryRun: process.env.DRY !== '0',
  models: {
    // Here we ensure that for any profiles the avatarUrl will be a valid github avatar
    profiles: {
      data: {
        avatarUrl: ({ seed }) => faker.image.avatarGitHub(),
      }
    }
  }
});

// Clears all existing data in the database, but keep the structure
await seed.$resetDatabase()


await seed.tweets(x => x(10))
```

Let's re-run `DRY=0 npx tsx seed.mts` and refresh our page, we should now be able to see our seeded tweets data:

![tweet-generated](https://github.com/snaplet/examples/assets/8771783/2e6a3740-03b6-425b-a950-ed57fefc3b73)


That's great, but what we would like is to be able to login as a the creator of those tweets easily.
To do so, we can leverage supabase sdk to sign up a pool of users, and use them in our seed script.

First, we want to create a new supabase client inside our seed script:

```ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Then, we want to create a pool of 5 differents users and sign them up with a email+password login:

```ts
import { type profilesScalars } from '@snaplet/seed';


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
```

Then, we can use those profiles to create our tweets and log them in our output so we can try to connect to it:

```ts
// We can now use our seed client to insert tweets that will be linked to the profiles
await seed.tweets(x => x(10), {connect: { profiles }})
console.log("Profiles created: ", profiles)
```

If we put them all togethers we get the following `seed.mts` file:

```ts
import { createSeedClient, type profilesScalars } from '@snaplet/seed';
import { createClient } from '@supabase/supabase-js'
import {Database} from './lib/database.types'
import { copycat, faker } from '@snaplet/copycat'


const seed = await createSeedClient({
  dryRun: process.env.DRY !== '0',
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

Now let's re-run `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> DRY=0 npx tsx seed.mts`:

[![snaplet-seed-users-and-tweets](https://asciinema.org/a/sItlFhIlrQ8E4bQm7TlBgMIya.svg)](https://asciinema.org/a/sItlFhIlrQ8E4bQm7TlBgMIya)

We can now head to our supabase admin and see that we have 5 new users and 10 new tweets in our database. And we can use our `app/auth/dev/login` route to login as any of those users:

![demo-signup](https://github.com/snaplet/examples/assets/8771783/de524d62-a6ac-4cad-b19d-e4f932a01c30)
