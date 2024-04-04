import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Truncate all tables
await seed.$resetDatabase();

// We create 5 users
await seed.User(
    (x) => x(5, ({
    // each with between 0 and 5 posts associated with it    
    Post: (x) => x({min: 0, max: 5},
        () => ({
            // each post have between 0 and 3 tags associated with it
            PostTags: (x) => x({min: 0, max: 3})
        })
    )})
))