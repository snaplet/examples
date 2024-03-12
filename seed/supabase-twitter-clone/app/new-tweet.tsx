import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default function NewTweet() {
  const addTweet = async (formData: FormData) => {
    "use server";
    const title = String(formData.get("title"));
    const supabase = createServerActionClient<Database>({ cookies });
    const {data: {user}} = await supabase.auth.getUser()
    if (title && user) {
        await supabase.from('tweets').insert({title, user_id: user.id})
    }
  };

  return (
    <form action={addTweet}>
      <input type="text" name="title" className="bg-inherit" />
    </form>
  );
}
