import { $ } from "execa";

// https://astro.build/db/seed
export default async function seed() {
  console.log("🌱 seeding database...");
  await $`npx tsx seed.ts`;
}
