# Utilizing @snaplet/seed with Relationships

This guide illustrates how to employ @snaplet/seed for implementing common relationship patterns, specifically focusing on one-to-many and many-to-many relationships. It aims to streamline the process of managing and interconnecting data.

## Getting Started

Execute the following commands to clone the example repository, install dependencies, migrate your database, and sync your seed data:

```bash
git clone git@github.com:snaplet/examples.git && cd examples/seed/relationships-examples
npm install
npx prisma migrate dev
npx @snaplet/seed init
```

## Database Structure

Within this example, our `schema.prisma` file defines the database structure, showcasing models that represent a one-to-many relationship and a many-to-many relationship. We'll construct a simplistic blog system where:

- A User can create multiple Posts (illustrating a one-to-many relationship).
- A Post can be tagged with multiple Tags, and a Tag can be associated with multiple Posts (demonstrating a many-to-many relationship via the PostTags table).

### One-to-Many Relationship

Suppose we aim to create 5 new users, each with a varying number of posts ranging from 0 to 5. The following snippet illustrates how to define this one-to-many relationship in our seed file:

```one-to-many.ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Clear all tables
await seed.$resetDatabase();

// Create 5 users, each potentially having up to 5 posts
// Posts at this stage do not have associated tags
await seed.User((x) => x(5, {
    Post: (x) => x({min: 0, max: 5})
}))
```

### Many-to-Many Relationship

A many-to-many relationship through a join table is another typical pattern. In our case, Posts and Tags have a many-to-many relationship. We aim for each user's posts to have between 0 and 3 associated tags:

```many-to-many.ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Clear all tables
await seed.$resetDatabase();

// Initially, create a pool of 5 tags for post association
const { Tag } = await seed.Tag((x) => x(5))

// Create 5 users
await seed.User(
    (x) => x(5, {
    // Each can have up to 5 posts
    Post: (x) => x({min: 0, max: 5},
        () => ({
            // Each post can be associated with up to 3 tags
            PostTags: (x) => x({min: 0, max: 3})
        })
    )}),
    {
    // Link the posts to the pre-created tags
    connect: { Tag }
})
```

By running the below SQL query, you can verify that the posts are linked with the tags as intended:

```sql
SELECT postId, COUNT(DISTINCT tagId)
FROM PostTags
GROUP BY postId
```