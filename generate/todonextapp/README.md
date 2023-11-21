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

```
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
npm install -D snaplet && npx snaplet setup
```

This process generates a `snaplet.config.ts` file: