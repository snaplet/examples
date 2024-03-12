"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Likes from "./likes";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useRef, useState, useLayoutEffect } from "react";

function useOptimistic<T, P>(
  passthrough: T,
  reducer: (state: T, payload: P) => T
) {
  const [value, setValue] = useState(passthrough);

  useEffect(() => {
    setValue(passthrough);
  }, [passthrough]);

  const reducerRef = useRef(reducer);
  useLayoutEffect(() => {
    reducerRef.current = reducer;
  }, []);

  const dispatch = useCallback(
    (payload: P) => {
      setValue(reducerRef.current(passthrough, payload));
    },
    [passthrough]
  );

  return [value, dispatch] as const;
}

export default function Tweets({
  tweets,
}: {
  tweets: Record<string, TweetWithAuthor>;
}) {
  const [optimisticTweets, addOptimisticTweet] = useOptimistic<
    Record<string, TweetWithAuthor>,
    TweetWithAuthor
  >(tweets, (currentOptimisticTweets, newTweet) => {
    const newOptimisticTweets = { ...currentOptimisticTweets };
    newOptimisticTweets[newTweet.id] = newTweet;
    return newOptimisticTweets;
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("realtime tweets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tweets",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return Object.values(optimisticTweets).map((tweet) => (
    <div
      key={tweet.id}
      className="border border-gray-800 border-t-0 px-4 py-8 flex"
    >
      <div className="h-12 w-12">
        <Image
          className="rounded-full"
          src={tweet.author.avatar_url}
          alt="tweet user avatar"
          width={48}
          height={48}
        />
      </div>
      <div className="ml-4">
        <p>
          <span className="font-bold">{tweet.author.name}</span>
          <span className="text-sm ml-2 text-gray-400">
            {tweet.author.username}
          </span>
        </p>
        <p>{tweet.title}</p>
        <Likes tweet={tweet} addOptimisticTweet={addOptimisticTweet} />
      </div>
    </div>
  ));
}
