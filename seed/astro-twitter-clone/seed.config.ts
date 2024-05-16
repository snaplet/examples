import { SeedBetterSqlite3 } from "@snaplet/seed/adapter-better-sqlite3";
import { defineConfig } from "@snaplet/seed/config";
import Database from "better-sqlite3";

export default defineConfig({
  adapter: () => {
    const client = new Database(".astro/content.db", { fileMustExist: true });
    return new SeedBetterSqlite3(client);
  },
});
