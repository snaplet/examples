import { test, expect, type Page } from "@playwright/test";
import { createSeedClient, type profilesScalars } from "@snaplet/seed";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";
import { copycat, faker } from "@snaplet/copycat";

const PASSWORD = "testuser";

async function login(
  page: Page,
  { email, password }: { email: string; password: string }
) {
  await page.goto(`./auth/dev/login?email=${email}&password=${password}`);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function createSupabaseUser(
  seed: string
): Promise<profilesScalars & { email: string }> {
  const email = copycat.email(seed).toLowerCase();
  const avatar: string = faker.image.avatarGitHub();
  const fullName: string = copycat.fullName(seed);
  const userName: string = copycat.username(seed);
  const user = await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: {
      data: {
        avatar_url: avatar,
        name: fullName,
        user_name: userName,
      },
    },
  });
  return {
    id: user.data.user?.id,
    avatarUrl: avatar,
    name: fullName,
    username: userName,
    email,
  };
}

async function createAndLoginUser(
  page: Page,
  seed: string
): Promise<profilesScalars> {
  const user = await createSupabaseUser(seed);
  await login(page, { email: user.email, password: PASSWORD });
  return {
    id: user.id,
    avatarUrl: user.avatarUrl,
    name: user.name,
    username: user.username,
  };
}

test.describe("Twitter Clone actions", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    const seed = await createSeedClient({ dryRun: false });
    // After all tests, we reset the database so we start from a clean slate
    await seed.$resetDatabase();
  });

  test("can login and logout as a user", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    await createAndLoginUser(page, testId);
    // Check that the user is logged in
    await page.goto("/");
    // We should see the logout button
    const logoutButton = await page.waitForSelector(`text=${"Logout"}`);
    // Logout
    await logoutButton.click();
    // Check that the user is logged out
    expect(page.locator(`text=${"Logout"}`)).not.toBeVisible();
  });

  test("can write own tweets", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    await createAndLoginUser(page, testId);
    // Check that the user is logged in
    await page.goto("/");
    // We should now see our tweet in the page
    expect(page.locator("p", { hasText: "Hello, World!" })).not.toBeVisible();
    const tweetInput = await page.waitForSelector('input[name="title"]');
    await tweetInput.fill("Hello, World!");
    await tweetInput.press("Enter");
    // Because playwright doesn't work with nextjs router.refresh, we need to reload the page
    await page.reload();
    // The tweet should now be visible without a refresh of the page with the realtime updates
    await expect(page.locator("p", { hasText: "Hello, World!" })).toBeVisible();
  });

  test("can like existing tweets", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    const userProfile = await createAndLoginUser(page, testId);
    const seed = await createSeedClient({ dryRun: false });
    // Create some tweets to like
    await seed.tweets((x) => x(10), { connect: { profiles: [userProfile] } });
    // Check that the user is logged in
    await page.goto("/");

    const firstTweet = await page.getByTestId("tweet-0");
    // The tweet like button should be visible
    const firstTweetLikeButton = await firstTweet.getByTestId("like-button");
    const firstTweetUnlikeLikeButton =
      await firstTweet.getByTestId("unlike-button");
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
    // Like the tweet
    await firstTweetLikeButton.click();
    // The like button should now be hidden
    expect(firstTweetLikeButton).not.toBeVisible();
    // The unlike button should now be visible
    expect(firstTweetUnlikeLikeButton).toBeVisible();
    // Everything should persist after a page reload
    await page.reload();
    expect(firstTweetLikeButton).not.toBeVisible();
    expect(firstTweetUnlikeLikeButton).toBeVisible();
  });
  test("can unlike already liked tweet", async ({ page }, { testId }) => {
    // Create the user we'll be login with
    const userProfile = await createAndLoginUser(page, testId);
    const seed = await createSeedClient({ dryRun: false });
    // Create some tweets to like
    await seed.tweets(
      (x) =>
        x(10, () => ({
          // We make it so our user has liked the tweet
          likes: [{ userId: userProfile.id }],
        })),
      { connect: { profiles: [userProfile] } }
    );
    // Check that the user is logged in
    await page.goto("/");

    const firstTweet = await page.getByTestId("tweet-0");
    // The tweet unlike button should be visible
    const firstTweetLikeButton = await firstTweet.getByTestId("like-button");
    const firstTweetUnlikeLikeButton =
      await firstTweet.getByTestId("unlike-button");
    expect(firstTweetUnlikeLikeButton).toBeVisible();
    expect(firstTweetLikeButton).not.toBeVisible();
    // Unlike the tweet
    await firstTweetUnlikeLikeButton.click();
    // The the unlike button should now be hidden and the like button available
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
    // Everything should persist after a page reload
    await page.reload();
    expect(firstTweetLikeButton).toBeVisible();
    expect(firstTweetUnlikeLikeButton).not.toBeVisible();
  });
});
