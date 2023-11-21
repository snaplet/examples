# Todo app Next.js

## Declarative Seeding with Snaplet Generate

### What's This All About?

In this post, we'll dive into the fundamentals of `snaplet generate`. Our tool aims to redefine seed script writing—making it declarative, minimalistic, and maintainable. We use Typescript, a language beloved by many developers. By the end, you'll not only be equipped to integrate `snaplet generate` into your stack for enhanced dev environments but also appreciate how it streamlines and accelerates seed script creation.

### Our Approach

We'll use a simple todo app as our example (source code available [here](https://github.com/avallete/todonextjs). Through this, we'll explore a typical development scenario, demonstrating the utility of `snaplet generate`.

### Prerequisites

Before running this project, you will need the following installed on your system:

- Node.js
- npm
- PostgreSQL (either local or remote)

### Getting Started

1. `git clone git@github.com:snaplet/examples.git && cd examples/generate/todonextapp`
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

https://github.com/avallete/todonextjs/assets/8771783/097fce2f-9732-412e-bd30-d3cc76d96504

With a straightforward interface and typical CRUD endpoints, our app quickly comes to life:

https://github.com/avallete/todonextjs/assets/8771783/5896b6a7-7bb1-4bf1-8a85-b125c0177a83

Imagine wanting to create numerous todos to test various functionalities. This is where diverse approaches come into play—some prefer seed classes for each model, others lean towards straightforward SQL or TS scripts. Let's introduce another method: `snaplet generate`.

Here's how `snaplet` operates:

1. **Introspection:** It analyzes your database, gathering schema, data, and relationship details via `snaplet setup`.
2. **Configuration:** You receive a `snaplet.config.ts` file, where you can declaratively specify your desired data creation. `snaplet` then utilizes the information from the introspection phase.

Setting it up is as simple as:

```bash
npx --yes snaplet@latest setup 
```

Select the option 2 "No, I want to generate data locally" and provide your database URL when prompted.

This process generates a `snaplet.config.ts` file:
```ts
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
copycat.setHashKey("yHiTMIO7lhhnEoPX");
export default defineConfig({
  generate: {
    async run(snaplet) {
      await snaplet.todo((x) => x(2));
    },
  },
});

```

https://github.com/avallete/todonextjs/assets/8771783/9805bdcf-7008-45ae-b91b-a6f75f3d5ef5

To create our desired 20 todos, we modify the `snaplet.todo` line accordingly:

```ts
// x stand for the algebric "times" operator
// So this read like "create a todo x 20"
await snaplet.todo((x) => x(20));
```
Populating the database is then just a command away:

```bash
npx snaplet generate
```

And voila !

https://github.com/avallete/todonextjs/assets/8771783/e1ecf3b9-7cd8-41c2-a7e4-84c36c1f5fbc

Running `npx snaplet generate --sql` reveals the underlying SQL queries, showcasing the simplicity and power of `snaplet generate`:

```sql
INSERT INTO public.todo (id,text,completed,created_at) VALUES
(1, 'Acesto orum ad nullam de aris ut, efficiantur imad ab laetam si nobis exmultamen esse.', DEFAULT, DEFAULT),
(2, 'Potiorem homin contra concordant conquis.', DEFAULT, DEFAULT),
(3, 'Omi quid satiabilit quoddam venire appetenim a.', DEFAULT, DEFAULT),
(4, 'Potest praesid ex gendos ant, scientia solum epicet suo etiam qui dicta.', DEFAULT, DEFAULT),
(5, 'Et responender se e physicis nullo summum, ere quae et vero timumquam sent quibusu.', DEFAULT, DEFAULT),
(6, 'Ut video mihi maxime alest, unum habet aut minimpedien consequantur congressuscip.', DEFAULT, DEFAULT),
(7, 'Expeten domo tum parta inum saepe, dignitione de a liberos tum se homo qua.', DEFAULT, DEFAULT),
(8, 'Homere nobis ex voluptate mihi possit vero, inclusae a gymnasia as poteramic ut vita.', DEFAULT, DEFAULT),
(9, 'Homin delectatem et quam as desis.', DEFAULT, DEFAULT),
(10, 'Inum torem nec vire dubio mihi illum per.', DEFAULT, DEFAULT),
(11, 'Et rerum deorum dialectet orteat.', DEFAULT, DEFAULT),
(12, 'Delecce perangore multi et illud, publictorquat is magisse ipsas referin neque sive.', DEFAULT, DEFAULT),
(13, 'Siculassum eturus modum missimo iud quantum inis.', DEFAULT, DEFAULT),
(14, 'Nihillo cohaeres aperta probartemper sunt.', DEFAULT, DEFAULT),
(15, 'Quaedamicar recoristun neque a esse perspicuum.', DEFAULT, DEFAULT),
(16, 'Quam repugientiam neque es enim tamentur provinandum, nobisse hominesse sublatincur eosque et corpus consequi itur.', DEFAULT, DEFAULT),
(17, 'Sit totellatin bonae has et albucius diu efficerit, quidam gravisse si m nondum.', DEFAULT, DEFAULT),
(18, 'Posse si erunturben a quibus enda necesse tem, desid in nec undia satiabillus afferre.', DEFAULT, DEFAULT),
(19, 'Hac paulo a et est falsariam verbum sic, esse monstruosi idua aut debilitur non mediocritud haec.', DEFAULT, DEFAULT),
(20, 'Ident fruuntur noscertae et proptervalet neque es.', DEFAULT, DEFAULT);
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
- `pages/api/todo.ts` (line 20-56)
- `pages/search.ts` (line 27-50)


Our updated ERD schema:

https://github.com/avallete/todonextjs/assets/8771783/06156217-8c3c-4ad1-a949-1a3e6cd434e3

Now we want to re-introspect our database with `snaplet` to update our types with new values. We can do so by re-running our setup:
```bash
npx snaplet setup
```

For development, we now want:

1. Five users.
2. Twenty todos created by these users.
3. Five votes per todo.

With `snaplet`, our configuration changes to:
```ts
export default defineConfig({
  generate: {
    async run(snaplet) {
      // 1. snaplet.$pipe allow to link two "generates" sections togethers
      await snaplet.$pipe([
        // 2. We create our first 5 initials users
        snaplet.user((x) => x(5)),
        // 3. We want to create 20 todos
        snaplet.todo(
          (x) =>
            x(20, () => ({
              vote: (x) =>
                x(
                  // 5. For each todo, we want to create 5 votes
                  5,
                  () => ({
                    // 6. Each vote value should be either an upvote or a downvote
                    value: ({ seed }) =>
                      copycat.oneOf(seed, [
                        "UPVOTE" as const,
                        "DOWNVOTE" as const,
                      ]),
                  })
                ),
            })),
          // 4. By using this option we're telling:
          // "generated data should try to connect with existing data rather than create new one"
          // Since we already created 5 users, everything related to "users" in our todo will pick
          // and connect with one of them for each created todo
          { autoConnect: true }
        ),
      ]);
    },
  },
});
```

We can now seed our database with:

```bash
npx snaplet generate
```

This comprehensive approach saves us from maintaining a lengthy and complex seed script (the generated SQL is now 120 lines long), illustrating why at Snaplet, we advocate for a declarative, database-aware, and auto-filled methodology. It's about creating and maintaining a dynamic, production-like development environment with ease.


### Conclusion

In our exploration of `snaplet generate`, we've seen its capability in simplifying the creation and maintenance of seed scripts, particularly as your project requirements evolve. It stands as a robust tool in your development toolkit, adapting seamlessly to changes and enhancements in your project.

For a comprehensive understanding of all the features, our [generate documentation](https://docs.snaplet.dev/core-concepts/generate) is an invaluable resource. It covers everything you need to know to make the most out of `generate`.

We also highly value community engagement and feedback. If you have any use cases, questions, or suggestions about `generate`, we would love to hear from you. Join our conversation on our [Discord Server](https://discord.gg/traBYqnysU).
Let's make generate not just a tool, but a community-driven powerhouse.

Happy seeding, and see you on Discord!

---

### Acknowledgment

The foundation for this tutorial was David Li's blog post, which I've expanded upon to demonstrate the enhanced developer experience with `snaplet generate`: [David Li's Original Post](https://friendlyuser.github.io/posts/tech/js/nextjs_todo_list_neon/).