import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Truncate all tables
await seed.$resetDatabase();

// First, we create a pool of 5 tags to associate with posts
const { Tag } = await seed.Tag((x) => x(5))

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
),
{
    // We provide our pool of tags for the PostTags relationship to choose from
    connect: { Tag }
})