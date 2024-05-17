import { column, defineDb, defineTable } from "astro:db";

const Post = defineTable({
  columns: {
    content: column.text(),
    createdAt: column.date({ default: new Date() }),
    createdByUsername: column.text({ references: () => User.columns.username }),
  },
});

const User = defineTable({
  columns: {
    username: column.text({ primaryKey: true }),
    name: column.text(),
    profileImageKey: column.text(),
    isVerified: column.boolean({ default: false }),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: {
    Post,
    User,
  },
});
