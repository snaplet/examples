import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Truncate all tables
await seed.$resetDatabase();

// We create 5 users, each with between 0 and 5 posts associated with them
// posts have no tags associated with them
await seed.User((x) => x(5, ({
    Post: (x) => x({min: 0, max: 5})
})))