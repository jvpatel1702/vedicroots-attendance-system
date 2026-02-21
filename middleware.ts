import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js middleware for authentication and role-based access control.
 *
 * On every request to a protected route, this middleware:
 * 1. Verifies the session exists (via Supabase server-side auth)
 * 2. Fetches the user's role from the `profiles` table (never trusted from client)
 * 3. Blocks access to wrong-role routes and redirects to the correct dashboard
 *
 * Security note: Role is always read from the database, not from cookies or JWT claims.
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Protect all role-specific routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/office')) {
        // Step 1: Session must exist
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Step 2: Role must exist in the database (never trust client-side state)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, roles')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Step 3: Enforce role-based access — redirect to correct dashboard or login
        const userRoles = profile.roles && profile.roles.length > 0
            ? profile.roles
            : [profile.role]

        if (pathname.startsWith('/admin') && !userRoles.includes('ADMIN')) {
            if (userRoles.includes('TEACHER')) {
                return NextResponse.redirect(new URL('/teacher', request.url))
            } else if (userRoles.includes('OFFICE')) {
                return NextResponse.redirect(new URL('/office', request.url))
            } else {
                // Catch-all: user has no recognised role
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }

        if (pathname.startsWith('/teacher') && !userRoles.includes('TEACHER')) {
            if (userRoles.includes('ADMIN')) {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else if (userRoles.includes('OFFICE')) {
                return NextResponse.redirect(new URL('/office', request.url))
            } else {
                // Catch-all: user has no recognised role
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }

        if (pathname.startsWith('/office') && !userRoles.includes('OFFICE')) {
            if (userRoles.includes('ADMIN')) {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else if (userRoles.includes('TEACHER')) {
                return NextResponse.redirect(new URL('/teacher', request.url))
            } else {
                // Catch-all: user has no recognised role
                return NextResponse.redirect(new URL('/login', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/teacher/:path*', '/office/:path*'],
}
