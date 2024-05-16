import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const { key } = ctx.params;
  if (!key) return new Response(null, { status: 400 });

  const profileImageObj = await ctx.locals.runtime.env.R2.get(key);

  if (profileImageObj === null) {
    return new Response(`${key} not found`, { status: 404 });
  }

  return new Response(profileImageObj.body);
};
