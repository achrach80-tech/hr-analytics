// middleware.ts - Optimized with fixed routing conflicts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method

  // 🔧 ROUTE CONFLICT FIXES
  // Block removed routes and redirect to appropriate alternatives
  if (path === '/signup') {
    return NextResponse.redirect(new URL('/demo', request.url))
  }
  
  if (path === '/forgot-password') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Fix API route conflicts by ensuring API routes take precedence
  if (path.startsWith('/api/')) {
    // Let API routes handle their own logic
    return NextResponse.next()
  }

  // 🔥 OPTIMIZED PATH DEFINITIONS
  const isPublicPath = [
    '/',
    '/login', 
    '/demo',
    '/change-password'
  ].includes(path)
  
  const isAdminPath = path.startsWith('/admin')
  const isAdminLoginPath = path === '/admin/login'
  
  const isDashboardPath = [
    '/dashboard',
    '/import', 
    '/employees',
    '/settings'
  ].some(route => path.startsWith(route))

  // 🚀 SUPABASE AUTH VALIDATION (for dashboard paths)
  if (isDashboardPath) {
    // Check for Supabase session cookie
    const supabaseAccessToken = request.cookies.get('sb-access-token')
    const supabaseRefreshToken = request.cookies.get('sb-refresh-token')
    
    if (!supabaseAccessToken && !supabaseRefreshToken) {
      // No Supabase session, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
    
    // Additional validation for company association
    const companySession = request.cookies.get('company_session')
    if (companySession) {
      try {
        const sessionData = JSON.parse(atob(companySession.value))
        if (new Date(sessionData.expires_at) < new Date()) {
          // Session expired, redirect to login
          return NextResponse.redirect(new URL('/login', request.url))
        }
      } catch {
        // Invalid session format, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // 🛡️ ADMIN AUTHENTICATION (enhanced security)
  if (isAdminPath && !isAdminLoginPath) {
    const adminSession = request.cookies.get('admin_session')
    
    if (!adminSession) {
      const adminLoginUrl = new URL('/admin/login', request.url)
      adminLoginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(adminLoginUrl)
    }
    
    // Validate admin session format and expiration
    try {
      const sessionData = JSON.parse(atob(adminSession.value))
      if (new Date(sessionData.expires_at) < new Date()) {
        // Admin session expired
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('admin_session')
        return response
      }
    } catch {
      // Invalid admin session format
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_session')
      return response
    }
  }

  // 🎯 SMART REDIRECTS (prevent loops and optimize flow)
  
  // If authenticated user tries to access login page, redirect to dashboard
  if (path === '/login' && isDashboardPath === false) {
    const supabaseAccessToken = request.cookies.get('sb-access-token')
    if (supabaseAccessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If authenticated admin tries to access admin login, redirect to admin dashboard
  if (isAdminLoginPath) {
    const adminSession = request.cookies.get('admin_session')
    if (adminSession) {
      try {
        const sessionData = JSON.parse(atob(adminSession.value))
        if (new Date(sessionData.expires_at) > new Date()) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // Invalid session, continue to login
      }
    }
  }

  // 🔄 DEMO-TO-ADMIN FLOW OPTIMIZATION
  // Add special handling for demo conversions
  if (path === '/admin/demos' && method === 'GET') {
    // Ensure admin is authenticated for demo management
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 📊 PERFORMANCE OPTIMIZATIONS
  // Add caching headers for static content
  if (path.startsWith('/_next/') || path.includes('.')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // 🛡️ SECURITY HEADERS
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP for enhanced security (adjust based on your needs)
  if (!isAdminPath) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }

  // 📈 ANALYTICS & MONITORING HEADERS
  response.headers.set('X-Powered-By', 'RH-Quantum-v5.0')
  
  if (isAdminPath) {
    response.headers.set('X-Admin-Version', '2.0-optimized')
  }
  
  if (isDashboardPath) {
    response.headers.set('X-Dashboard-Version', 'cyberpunk-5.0')
  }

  return response
}

// ⚡ OPTIMIZED MATCHER (exclude unnecessary checks)
export const config = {
  matcher: [
    // Include all routes except static files and API internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    // Specifically include API routes for proper handling
    '/api/:path*',
    // Include admin routes
    '/admin/:path*',
    // Include dashboard routes
    '/(dashboard|import|employees|settings)/:path*'
  ],
}