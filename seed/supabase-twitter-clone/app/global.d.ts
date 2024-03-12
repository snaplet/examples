import { Database as Db } from "@/lib/database.types";

type Tweet = Db["public"]["Tables"]["tweets"]["Row"];
type Profile = Db["public"]["Tables"]["profiles"]["Row"];

declare global {
  type Database = Db;

  type TweetWithAuthor = Tweet & {
    author: Profile;
    likes: number;
    user_has_liked_tweet: boolean;
  };
}
