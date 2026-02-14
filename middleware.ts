import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Get user role from database
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, roles')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Role-based access control
        const userRoles = profile.roles || [profile.role]

        if (pathname.startsWith('/admin') && !userRoles.includes('ADMIN')) {
            // Redirect non-admin users to their appropriate dashboard
            if (userRoles.includes('TEACHER')) {
                return NextResponse.redirect(new URL('/teacher', request.url))
            } else if (userRoles.includes('OFFICE')) {
                return NextResponse.redirect(new URL('/office', request.url))
            }
        }

        if (pathname.startsWith('/teacher') && !userRoles.includes('TEACHER')) {
            // Redirect non-teacher users to their appropriate dashboard
            if (userRoles.includes('ADMIN')) {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else if (userRoles.includes('OFFICE')) {
                return NextResponse.redirect(new URL('/office', request.url))
            }
        }

        if (pathname.startsWith('/office') && !userRoles.includes('OFFICE')) {
            // Redirect non-office users to their appropriate dashboard
            if (userRoles.includes('ADMIN')) {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else if (userRoles.includes('TEACHER')) {
                return NextResponse.redirect(new URL('/teacher', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/teacher/:path*', '/office/:path*'],
}
