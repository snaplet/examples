# Todo app Next.js

## Summary

- [Todo app Next.js](#todo-app-nextjs)
  - [Summary](#summary)
  - [Declarative Seeding with Snaplet seed](#declarative-seeding-with-snaplet-seed)
    - [What's This All About?](#whats-this-all-about)
    - [Our Approach](#our-approach)
    - [Prerequisites](#prerequisites)
    - [Getting Started](#getting-started)
    - [Starting Simple:](#starting-simple)
    - [Adapting to Changes:](#adapting-to-changes)
    - [Introduce snaplet to E2E testing](#introduce-snaplet-to-e2e-testing)
    - [Conclusion](#conclusion)
    - [Acknowledgment](#acknowledgment)

## Declarative Seeding with Snaplet seed

### What's This All About?

In this post, we'll dive into the fundamentals of `@snaplet/seed`. Our tool aims to redefine seed script writing—making it declarative, minimalistic, and maintainable. We use Typescript, a language beloved by many developers. By the end, you'll not only be equipped to integrate `@snaplet/seed` into your stack for enhanced dev environments but also appreciate how it streamlines and accelerates seed script creation.

### Our Approach

We'll use a simple todo app as our example (source code available [here](https://github.com/avallete/todonextjs). Through this, we'll explore a typical development scenario, demonstrating the utility of `@snaplet/seed`.

### Prerequisites

Before running this project, you will need the following installed on your system:

- Node.js
- npm
- PostgreSQL (either local or remote)

### Getting Started

1. `git clone git@github.com:snaplet/examples.git && cd examples/seed/todonextapp`
2. `npm install`
3. Edit `DATABASE_URL` in `.env` to make it match your PostgreSQL database.
4. Deploy the prisma model to our local database with: `npx prisma db push --force-reset`
5. Run the app with `npm run dev`

### Starting Simple:

First, we'll build a basic todo app with a single table, using Prisma for schema definition:

```ts
model todo {
  id         Int      @id @default(autoincrement())
  text       String
  completed  Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamp(6)
}
```

Here's what the database ERD looks like:

![erd](https://github.com/avallete/todonextjs/assets/8771783/097fce2f-9732-412e-bd30-d3cc76d96504)

With a straightforward interface and typical CRUD endpoints, our app quickly comes to life:

![demo](https://github.com/avallete/todonextjs/assets/8771783/5896b6a7-7bb1-4bf1-8a85-b125c0177a83)

Imagine wanting to create numerous todos to test various functionalities. This is where diverse approaches come into play—some prefer seed classes for each model, others lean towards straightforward SQL or TS scripts. Let's introduce another method: `@snaplet/seed`.

Here's how `snaplet` operates:

1. **Introspection:** It analyzes your database, gathering schema, data, and relationship details via `snaplet setup`.
2. **Configuration:** You receive a `seeds.mts` file, where you can declaratively specify your desired data creation. `snaplet` then utilizes the information from the introspection phase.

Setting it up is as simple as:

```bash
npx @snaplet/seedt@latest init 
```

You will be asked to choose an "adapter" to connect to your local database,
in this example we'll use "prisma".

The cli will genrate a default `seed.config.ts` for you and prompt you at some point
to edit it to provide an "adapter" allowing us to connect to the database.

In our case the edit will look like:

```ts
import { SeedPrisma } from "@snaplet/seed/adapter-prisma";
import { defineConfig } from "@snaplet/seed/config";
import { db } from "./utils/db"

export default defineConfig({
  adapter: () => {
    return new SeedPrisma(db);
  },
  // We don't want to seed or truncate the migrations table
  select: {
    'public._prisma_migrations': false,
  }
});
```

When saving this configuration, our cli watcher will detect that it's now able to connect
and introspect our database, and will finish our client generation generating a `seed.mts` file:

```ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Truncate all tables in the database
await seed.$resetDatabase();

// Seed the database with 10 todos
await seed.todos((x) => x(10));

// Learn more about the `seed` client by following our guide: https://docs.snaplet.dev/seed/getting-started

process.exit();
```

To create our desired 20 todos, we modify the `snaplet.todo` line accordingly:

```ts
// x stand for the algebric "times" operator
// So this read like "create a todo x 20"
await seed.todo((x) => x(20));
```

Populating the database is then just a command away:

```bash
npx tsx seed.mts
```

And voila !

![todolist](https://github.com/avallete/todonextjs/assets/8771783/e1ecf3b9-7cd8-41c2-a7e4-84c36c1f5fbc)

Running adding the dry run true option to the seed client creation allows us to reveals the underlying SQL queries showcasing the simplicity and power of `@snaplet/seed`:

```ts
...
const seed = await createSeedClient({ dryRun: true });
```

```sql
INSERT INTO
  public.todo (id, text, completed, created_at)
VALUES
  (
    1,
    'Maledatio de quam conventorquean im perspecta genus.',
    DEFAULT,
    DEFAULT
  ),
  (
    2,
    'Eturus quod probo cum valla cum videret.',
    DEFAULT,
    DEFAULT
  ),
  (
    3,
    'Faciendum quosvis quo apudinum pertur vult.',
    DEFAULT,
    DEFAULT
  ),
  ...
  (
    20,
    'Nobis ad placet esset quod inflammater sed.',
    DEFAULT,
    DEFAULT
  );

SELECT
  setval(
    '"public"."todo_id_seq"'::regclass,
    (
      SELECT
        MAX("id")
      FROM
        "public"."todo"
    )
  );
```

### Adapting to Changes:

As with any project, requirements evolve. Let's say our app now needs:

1. Each todo linked to a user.
2. Todos with upvote/downvote capabilities.

Let's update our `schema.prisma` accordingly:

```ts
model user {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  created_at DateTime @default(now()) @db.Timestamp(6)
  todos     todo[]
  votes     vote[]
}

model todo {
  id         Int      @id @default(autoincrement())
  text       String
  completed  Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamp(6)
  created_by_id Int
  created_by user     @relation(fields: [created_by_id], references: [id])
  votes      vote[]
}

enum vote_value {
  UPVOTE
  DOWNVOTE
}

model vote {
  id        Int      @id @default(autoincrement())
  todo_id   Int
  todo      todo     @relation(fields: [todo_id], references: [id])
  value     vote_value @default(UPVOTE)
  created_at DateTime @default(now()) @db.Timestamp(6)
  created_by_id Int
  created_by user     @relation(fields: [created_by_id], references: [id])
}
```

Let's deploy this new schema to our database:

```bash
# Generate a migration file           # Reset our local database schema    # Regenerate prisma client 
npx prisma migrate dev --create-only && npx prisma db push --force-reset && npx prisma generate
```

Then we can adapt our UI and api to reflect these changes by uncommenting the following lines:
- `types.ts` (line 7-8)
- `pages/index.tsx` (line 193-196)
- `pages/api/todo.ts` (line 20-56 and line 93)
- `pages/search.ts` (line 27-50)


Our updated ERD schema:

![updated-erd](https://github.com/avallete/todonextjs/assets/8771783/06156217-8c3c-4ad1-a949-1a3e6cd434e3)

Now we want to re-introspect our database with `snaplet` to update our types with new values. We can do so by re-running our setup:

```bash
npx @snaplet/seed sync
```

For development, we now want:

1. Five users.
2. Twenty todos created by these users.
3. Five votes per todo.

With `snaplet`, our `seed.mts` changes to:

```ts
import { copycat } from "@snaplet/copycat";
...
// 1. We create our first 5 initials users
const appPlan = await seed.users((x) => x(5));

// 2. We create our 20 todos, 
await seed.todos(
  (x) =>
    x(20, () => ({
      votes: (x) =>
        x(
          // 3. For each todo, we want to create 5 votes
          5,
          () => ({
            // 4. Each vote value should be either an upvote or a downvote
            value: ({ seed }) =>
              copycat.oneOf(seed, ["UPVOTE" as const, "DOWNVOTE" as const]),
          })
        ),
    })),
  // 5. We use connect to ensure that those 20 todos will be connected to the pool of users we already created before
  { connect: { users: appPlan.users } }
);
```

We can now seed our database with:

```bash
npx tsx seed.mts
```

This comprehensive approach saves us from maintaining a lengthy and complex seed script (the generated SQL is now 120 lines long), illustrating why at Snaplet, we advocate for a declarative, database-aware, and auto-filled methodology. It's about creating and maintaining a dynamic, production-like development environment with ease.

### Introduce snaplet to E2E testing

We've now established a convenient method for adding data to our application. However, what's crucial is ensuring that this data is accurately displayed by our interface, allowing us to interact with it as desired. One effective way to achieve this is through End-to-End (E2E) testing, as it encompasses the entire spectrum from your data to your user and hinges not on your implementation, but on the behavior..

Here let's write 2 basics E2E tests that would ensure that:

1. When a todo is not "finished" we can check it to mark it as "finished", the interface should reflect that
2. Whant a todo is "finished" we can check it out, and it should be back in the "todo items" section

If you think about this, those two E2E tests, will already cover a whole bunch of our app behaviours and implementation, in 2 tests you can check:
1. That your UI allow the user to perform the action
2. That your API properly pass the action to the database
3. That your database properly save the user change
4. That your UI update to show the change to the user

And by using `@snaplet/seed` rather than a handmade seeding script, you can declare and seed only the data that you care about in your test.

So let's dig in, as a first we'll add [playwright](https://playwright.dev/docs/intro) E2E web testing too our app.

To do so, let's run and follow the [playwright onboarding docs](https://playwright.dev/docs/intro):

```
npm init playwright@latest
```

Then we can configure a playwright test file to execute the tests we mentioned before under `tests/todos-actions.spec.ts`

With the following content in it:

```ts
import { test, expect } from '@playwright/test';
import { createSeedClient } from "@snaplet/seed";

test.describe('Todo App actions', () => {
  // Run tests in serial order because they're hitting the same database
  test.describe.configure({mode: 'serial'})

  test('can mark an unfinished todo as finished', async ({ page }) => {
    const seed = await createSeedClient({
      dryRun: false
    });
    
    // Clears all existing data in the database, but keep the structure
    await seed.$resetDatabase();
    // We create a single unfinished todo in the database
    await seed.todos((x) => x(1, { completed: false, text: 'todo-body' }));
    await page.goto('http://localhost:3000/');
    // Check if the new task is added to the "Todo Items" section
    const todoItem = page.locator('.todo-item:has-text("todo-body")');
    await expect(todoItem).toHaveCount(1);
    // Click the checkbox to mark the todo as finished
    await todoItem.locator('input[type="checkbox"]').click();
    // Check if the task is moved to the "Finished Items" section
    const finishedItem = page.locator('.finished-item:has-text("todo-body")');
    await expect(finishedItem).toHaveCount(1)
  });
  
  test('can mark a finished todo as unfinished', async ({ page }) => {
    const seed = await createSeedClient({
      dryRun: false
    });
    
    // Clears all existing data in the database, but keep the structure
    await seed.$resetDatabase();
    // We create a single unfinished todo in the database
    await seed.todos((x) => x(1, { completed: true, text: 'todo-body' }));
    await page.goto('http://localhost:3000/');
    // Check if the task is moved to the "Finished Items" section
    const finishedItem = page.locator('.finished-item:has-text("todo-body")');
    await expect(finishedItem).toHaveCount(1)  
    // Click the checkbox to mark the todo as unfinished
    await finishedItem.locator('input[type="checkbox"]').click();
    // Check if the new task is added to the "Todo Items" section
    const todoItem = page.locator('.todo-item:has-text("todo-body")');
    await expect(todoItem).toHaveCount(1);
  })
})
```

Running it with playwright --ui we can see that our tests are performing as we expect:

```
npx playwright test --ui
```

![playwright-run](https://github.com/snaplet/docs/assets/8771783/9f1ad0af-d597-43b5-ada6-affd602ce28a)

### Conclusion

In our exploration of `@snaplet/seed`, we've seen its capability in simplifying the creation and maintenance of seed scripts, particularly as your project requirements evolve. It stands as a robust tool in your development toolkit, adapting seamlessly to changes and enhancements in your project.

We have also covered how we can simply integrate it with E2E testing to ensure that our data is properly displayed and interacted with by our users. Additionally, we plan to create recipes for other testing tools and advanced use cases, such as parallel testing, in the future.

For a comprehensive understanding of all the features, our [seed documentation](https://docs.snaplet.dev/core-concepts/seed) is an invaluable resource. It covers everything you need to know to make the most out of `seed`.

We also highly value community engagement and feedback. If you have any use cases, questions, or suggestions about `seed`, we would love to hear from you. Join our conversation on our [Discord Server](https://discord.gg/traBYqnysU).
Let's make generate not just a tool, but a community-driven powerhouse.

Happy seeding, and see you on Discord!

---

### Acknowledgment

The foundation for this tutorial was David Li's blog post, which I've expanded upon to demonstrate the enhanced developer experience with `snaplet seed`: [David Li's Original Post](https://friendlyuser.github.io/posts/tech/js/nextjs_todo_list_neon/).
