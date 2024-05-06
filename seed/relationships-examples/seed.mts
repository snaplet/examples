/**
 * ! Executing this script will delete all data in your database and seed it with 10 versions.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.mts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";

const seed = await createSeedClient();

// Truncate all tables in the database
await seed.$resetDatabase();

// Seed the database with 10 User
await seed.User((x) => x(10));

process.exit();