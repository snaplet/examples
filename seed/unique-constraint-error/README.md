# How to Handle Unique Constraint Errors with Snaplet Seed

Welcome to your step-by-step guide on tackling unique constraint errors while establishing relationships between entities in your database using Snaplet Seed. 
This guide is designed to make your journey smoother and help you understand how to navigate through common pitfalls with ease and efficiency.

## Kick-Starting Your Project

Let's get the ball rolling! 
To set up your environment, we're going to clone a sample repository, install necessary dependencies, migrate your database, and get your seed data ready. 
Simply run the following commands in your terminal:

```bash
git clone git@github.com:snaplet/examples.git && cd examples/seed/unique-constraint-error
npm install
npx prisma migrate dev
npx @snaplet/seed init
```

## Understanding Your Database

In our example, the `schema.prisma` file lays out the database structure, highlighting two key constraints:

- **Each User's Email Must Be Unique**: Ensuring every user has a unique email address in the database is crucial. This is enforced by marking the email field with `@unique` in the User model, mirroring the UNIQUE constraint on the email column in the SQL schema.
- **One Membership Per Organization**: To avoid duplicate memberships, the Member model defines two unique constraints using the `@@unique([organizationId, userId])` attribute. This ensures a user can join multiple organizations but can't join the same one more than once.

![Unique Constraints Diagram](./unique-constraint-schema.svg)

## Solving Unique Constraint Errors on Scalars

When linking entities, unique constraint errors may pop up if your data attempts to breach these defined constraints. 
For example, trying to create two users with the identical email address will trigger a unique constraint error, as seen in the code snippet below:

```typescript
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();
await seed.$resetDatabase();

const user = await seed.User((x) => x(2, () => ({ email: 'a-static-user-email@gmail.com' })));
```

### How to Navigate Through

Snaplet Seed attempts to avoid these errors by variating the data. 
If you encounter an issue, modifying your script to generate unique emails using the `seed` value can be a straightforward solution:

```typescript
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();
await seed.$resetDatabase();

const user = await seed.User((x) => x(2, ({ seed }) => ({ email: `user-${seed}@example.com` })));
```

## Tackling Unique Constraint Errors on Relationships

Similar errors can arise when establishing relationships. If your script exceeds the number of unique combinations allowed by your constraints, you'll face an error. 
Consider this scenario where creating more members than the unique combinations of users and organizations leads to a constraint error.

### The Solution

Adjust your script to fit within the bounds of possible unique combinations. 
For instance, increasing the number of organizations or reducing the number of members to be created ensures you stay within the limits.

```typescript
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();
await seed.$resetDatabase();

const { User } = await seed.User((x) => x(2));
// Increase the number of organizations to 3
const { Organization } = await seed.Organization((x) => x(3));

// Adjust members to fit new possibilities
const members = await seed.Member((x) => x(5, () => ({
    role: 'MEMBER'
})), { connect: { User, Organization } });
```

By following these steps, you can efficiently navigate and resolve unique constraint errors, ensuring your database relationships are established correctly. 

Happy coding!