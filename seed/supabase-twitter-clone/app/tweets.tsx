"use client"
import { useEffect, useOptimistic } from "react";
import Likes from "./likes";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";


export default function Tweets({tweets}: {tweets: TweetWithAuthor[]}) {
    const supabase = createClientComponentClient<Database>();
    const router = useRouter();
    useEffect(() => {
        const channel = supabase.channel("realtime tweets").on('postgres_changes', {event: '*', schema: 'public', table: 'tweets'}, (payload) => {
            router.refresh()
        }).subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, supabase])
    const [optimisticTweets, addOptimisticTweet] = useOptimistic<TweetWithAuthor[], TweetWithAuthor>(tweets, (currentOptimisticTweet, newTweet) => {
        const newOptimisticTweet = [...currentOptimisticTweet]
        const index = newOptimisticTweet.findIndex((tweet) => tweet.id === newTweet.id)
        newOptimisticTweet[index] = newTweet
        return newOptimisticTweet
    })
    return (
        optimisticTweets?.map((tweet) => (<div key={tweet.id}>
            <p>{tweet.author.name} {tweet.author.username}</p>
            <p>{tweet.title}</p>
            <Likes tweet={tweet} addOptimisticTweet={addOptimisticTweet} />
        </div>))
    )

}