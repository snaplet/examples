import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import AuthButtonServer from "./auth-button-server";
import { redirect } from "next/navigation";
import NewTweet from "./new-tweet";
import Likes from "./likes";
import Tweets from "./tweets";

export default async function Home() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {data: {session}} = await supabase.auth.getSession()

  if (!session) {
    return redirect('/login')
  }

  const { data } = await supabase
  .from("tweets")
  .select('*, author: profiles(*), likes(user_id)');

  const tweets = data?.map((tweet) => ({
    ...tweet,
    author: Array.isArray(tweet.author) ? tweet.author[0] : tweet.author,
    user_has_liked_tweet: tweet.likes.some((like) => like.user_id === session.user.id),
    likes: tweet.likes.length
  })) ?? []

  return (
    <div className="bg-blue-200 w-full max-w-xl mx-auto">
      <div className="flex justify-between px-4 py-6 border-gray-800">
        <h1 className="text-xl font-bold">
          Home
        </h1>
        <AuthButtonServer />
      </div>
      <NewTweet />
      <Tweets tweets={tweets} />
    </div>
  );
}
