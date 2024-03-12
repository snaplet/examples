import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const inDevEnvironment = !!process && process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
    if (!inDevEnvironment) {
        return NextResponse.redirect('/')
    }
    const requestUrl = new URL(request.url);
    const email = requestUrl.searchParams.get("email");
    const password = requestUrl.searchParams.get("password");
    if (email && password) {
        const supabase = createRouteHandlerClient({ cookies })
        await supabase.auth.signInWithPassword({ email, password })
    }
    return NextResponse.redirect(requestUrl.origin)
} 