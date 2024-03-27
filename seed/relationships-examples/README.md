# Utilizing @snaplet/seed with Relationships

This guide demonstrates how to use @snaplet/seed to implement common relationship patterns, focusing particularly on one-to-many and many-to-many relationships. Its goal is to simplify the management and interconnection of data.

## Getting Started

To begin, execute the following commands to clone the example repository, install dependencies, migrate your database, and initialize your seed data:

```bash
git clone git@github.com:snaplet/examples.git && cd examples/seed/relationships-examples
npm install
npx prisma migrate dev
npx @snaplet/seed init
```

## Database Structure

In this example, the `schema.prisma` file outlines the database structure, illustrating models that depict a one-to-many relationship and a many-to-many relationship. We aim to create a basic blog system where:

- A User can create multiple Posts, illustrating a one-to-many relationship.
- A Post can be associated with multiple Tags, and a Tag can be linked to multiple Posts, showcasing a many-to-many relationship through the PostTags table.

### One-to-Many Relationship

Let's say our goal is to generate 5 new users, each with a variable number of posts ranging from 0 to 5. The code snippet below demonstrates how to define this one-to-many relationship in our seed file:

```one-to-many.ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Clear all tables
await seed.$resetDatabase();

// Create 5 users, each potentially having up to 5 posts
// At this stage, posts do not have associated tags
await seed.User((x) => x(5, {
    Post: (x) => x({min: 0, max: 5})
}))
```

### Many-to-Many Relationship

A many-to-many relationship facilitated by a join table is another common pattern. Here, Posts and Tags are interrelated in such a manner. Our aim is for each user's posts to be linked to between 0 and 3 tags:

```many-to-many.ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Clear all tables
await seed.$resetDatabase();

// Create 5 users, each potentially having up to 5 posts
await seed.User(
    (x) => x(5, ({
    Post: (x) => x({min: 0, max: 5},
        () => ({
            // Each post can have between 0 and 3 tags associated with it
            PostTags: (x) => x({min: 0, max: 3})
        })
    )})
))
```

To ensure that posts are associated with tags as expected, run the following SQL query:

```sql
SELECT postId, COUNT(DISTINCT tagId)
FROM PostTags
GROUP BY postId
```

However, an issue arises in our database: each `PostTags` association corresponds to a unique `Tag` entity, meaning no two `PostTags` associations share the same `Tag` entity. This is not the desired outcome, as it results from `PostTags` creating a new `Tag` entity for each association rather than utilizing existing ones.

To address this, we can introduce a "pool" method, allowing `PostTags` to link each post with tags from our predefined pool instead of generating new ones for each association. Here's how we can adjust our script accordingly:

```many-to-many-pool.ts
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Clear all tables
await seed.$resetDatabase();

// Initially, create a pool of 5 tags for post associations
const { Tag } = await seed.Tag((x) => x(5))

// Create 5 users
await seed.User(
    (x) => x(5, ({
    Post: (x) => x({min: 0, max: 5},
        () => ({
            // Each post can have between 0 and 3 tags associated with it
            PostTags: (x) => x({min: 0, max: 3})
        })
    )}),
    {
    // Provide the pool of tags for the PostTags relationship to select from
    connect: { Tag }
})
```

Now, we achieve a more realistic data representation, with 30 tag associations across our posts, yet only 5 unique tags are used.