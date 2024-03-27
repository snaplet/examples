# Using @snaplet/seed with relationships

This example demonstrates how to use @snaplet/seed with common relationships pattern.
Mainly both one-to-many and many-to-many relationships.

And how to control and connect data together.

## Getting started

```bash
   git clone git@github.com:snaplet/examples.git && cd examples/seed/relationships-examples
   npm install
   npx prisma migrate dev
```

## Database structure

In this example we have a database stucture defined in `schema.prisma` file.
And models that showcases a one-to-many relationship and a many-to-many relationship, we'll build a small blog system where:

- A User can have many Posts (one-to-many relationship).
- A Post can have many Tags, and a Tag can belong to many Posts (many-to-many relationship).

