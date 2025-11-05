import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Middleware: ${request.method} ${path}`)
  }

  // Public paths that don't require authentication
  const isPublicPath = path === '/' || 
                      path === '/login' || 
                      path === '/demo' ||
                      path.startsWith('/_next') ||
                      path.startsWith('/favicon') ||
                      path === '/robots.txt' ||
                      path === '/sitemap.xml'
  
  // Admin API paths that should NEVER be blocked by middleware
  const isAdminApiPath = path.startsWith('/api/admin')
  
  // Admin login page (allow access)
  const isAdminLoginPath = path === '/admin/login'
  
  // Other admin pages (require auth)
  const isAdminPath = path.startsWith('/admin') && !isAdminLoginPath
  
  // Dashboard paths (require company authentication)
  const isDashboardPath = path.startsWith('/dashboard') || 
                         path.startsWith('/import') || 
                         path.startsWith('/employees') ||
                         path.startsWith('/settings')

  // CRITICAL: Never block admin API routes - let them handle their own auth
  if (isAdminApiPath) {
    console.log('✅ Admin API route - bypassing middleware')
    return NextResponse.next()
  }

  // Handle admin pages (NOT admin login page)
  if (isAdminPath) {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession?.value) {
      console.log('❌ No admin session found, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    try {
      const decodedValue = decodeURIComponent(adminSession.value)
      const sessionData = JSON.parse(decodedValue)
      
      // Type-safe validation
      if (!sessionData || typeof sessionData !== 'object') {
        console.log('❌ Invalid admin session: not an object')
        throw new Error('Invalid admin session format')
      }
      
      if (!sessionData.isAdmin) {
        console.log('❌ Invalid admin session: missing isAdmin flag')
        throw new Error('Invalid admin session')
      }
      
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        console.log('❌ Admin session expired')
        throw new Error('Admin session expired')
      }
      
      console.log('✅ Admin session valid')
      return NextResponse.next()
      
    } catch (error) {
      console.error('❌ Admin session validation error:', error)
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_session')
      return response
    }
  }

  // Handle company dashboard authentication
  if (isDashboardPath) {
    const companySession = request.cookies.get('company_session')
    
    if (!companySession?.value) {
      console.log('❌ No company session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      const sessionData = JSON.parse(companySession.value)
      
      // Type-safe validation
      if (!sessionData || typeof sessionData !== 'object') {
        console.log('❌ Invalid company session: not an object')
        throw new Error('Invalid company session format')
      }
      
      if (!sessionData.company_id || !sessionData.access_token) {
        console.log('❌ Invalid company session: missing required fields')
        throw new Error('Invalid company session')
      }
      
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        console.log('❌ Company session expired')
        throw new Error('Company session expired')
      }
      
      console.log('✅ Company session valid, adding x-company-token header')
      
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-company-token', sessionData.access_token)
      requestHeaders.set('x-client-type', 'talvio-web')
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      
    } catch (error) {
      console.error('❌ Company session validation error:', error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('company_session')
      return response
    }
  }

  // Handle API routes that need company authentication (but not admin APIs)
  if (path.startsWith('/api/') && 
      !path.startsWith('/api/auth/') && 
      !path.startsWith('/api/admin/') &&
      !isPublicPath) {
    
    let token = request.headers.get('x-company-token')
    
    if (!token) {
      const companySession = request.cookies.get('company_session')
      if (companySession?.value) {
        try {
          const sessionData = JSON.parse(companySession.value)
          if (sessionData && typeof sessionData === 'object' && sessionData.access_token) {
            token = sessionData.access_token
          }
        } catch (error) {
          console.error('❌ Failed to parse company session in API middleware:', error)
        }
      }
    }
    
    if (!token) {
      console.log('❌ No company token found for API request')
      return NextResponse.json({ 
        error: 'Authentication required',
        hint: 'Please login first'
      }, { status: 401 })
    }
    
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-company-token', token)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Allow all other requests (public pages, static assets, etc.)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}