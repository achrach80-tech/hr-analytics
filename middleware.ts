import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths
  const isPublicPath = path === '/' || path === '/login' || path === '/demo'
  
  // Admin paths
  const isAdminPath = path.startsWith('/admin')
  
  // Dashboard paths
  const isDashboardPath = path.startsWith('/dashboard') || 
                         path.startsWith('/import') || 
                         path.startsWith('/employees') ||
                         path.startsWith('/settings')

  // Check company session for dashboard
  if (isDashboardPath) {
    const companySession = request.cookies.get('company_session')
    
    if (!companySession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      const sessionData = JSON.parse(companySession.value)
      
      // Check expiration
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('company_session')
        return response
      }
      
      // CRITICAL FIX: Add x-company-token header to all dashboard requests
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-company-token', sessionData.access_token)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Company session validation error:', error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('company_session')
      return response
    }
  }

  // Check admin session for admin panel
  if (isAdminPath && path !== '/admin/login') {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    try {
      // FIXED: Decode URI component before parsing JSON
      const decodedValue = decodeURIComponent(adminSession.value)
      const sessionData = JSON.parse(decodedValue)
      
      // Check expiration
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('admin_session')
        return response
      }
      
      // Verify it's actually an admin session
      if (!sessionData.isAdmin) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('admin_session')
        return response
      }
      
      // Admin session is valid, allow access
      return NextResponse.next()
      
    } catch (error) {
      console.error('Admin session validation error:', error)
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}