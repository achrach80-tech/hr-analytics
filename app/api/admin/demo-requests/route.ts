// app/api/admin/demo-requests/route.ts
// DEBUG VERSION: Detailed logging to troubleshoot admin demo requests

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to validate admin session with detailed logging
function validateAdminSession(request: NextRequest): boolean {
  console.log('🔍 Starting admin session validation...')
  
  const adminSession = request.cookies.get('admin_session')
  
  if (!adminSession) {
    console.log('❌ No admin_session cookie found')
    console.log('Available cookies:', request.cookies.getAll().map(c => c.name))
    return false
  }

  console.log('✅ admin_session cookie found')
  console.log('Cookie value (first 50 chars):', adminSession.value.substring(0, 50))

  try {
    // Try to decode the cookie value
    console.log('🔄 Attempting to decode cookie...')
    const decodedValue = decodeURIComponent(adminSession.value)
    console.log('✅ Cookie decoded successfully')
    console.log('Decoded value (first 100 chars):', decodedValue.substring(0, 100))
    
    // Try to parse JSON
    console.log('🔄 Attempting to parse JSON...')
    const sessionData = JSON.parse(decodedValue)
    console.log('✅ JSON parsed successfully')
    console.log('Session data keys:', Object.keys(sessionData))
    
    // Check if it's an admin session
    if (!sessionData.isAdmin) {
      console.log('❌ Session does not have isAdmin=true')
      console.log('isAdmin value:', sessionData.isAdmin)
      return false
    }
    console.log('✅ isAdmin flag is true')
    
    // Check expiration
    if (sessionData.expires_at) {
      const expiresAt = new Date(sessionData.expires_at)
      const now = new Date()
      console.log('🕐 Checking expiration...')
      console.log('Expires at:', expiresAt.toISOString())
      console.log('Current time:', now.toISOString())
      
      if (expiresAt < now) {
        console.log('❌ Admin session expired')
        return false
      }
      console.log('✅ Session not expired')
    }
    
    console.log('✅ Admin session is VALID')
    return true
  } catch (error) {
    console.error('❌ Error validating admin session:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return false
  }
}

export async function GET(request: NextRequest) {
  console.log('\n=== DEMO REQUESTS API CALLED ===')
  console.log('Method: GET')
  console.log('URL:', request.url)
  
  try {
    // Validate admin session
    const isValid = validateAdminSession(request)
    
    if (!isValid) {
      console.log('❌ Admin validation failed, returning 401')
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required',
        hint: 'Please login to admin panel first'
      }, { status: 401 })
    }

    console.log('✅ Admin validated, proceeding to fetch demo requests...')

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    console.log('✅ Environment variables present')

    // Create client with SERVICE_ROLE key (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('✅ Supabase client created with service_role')

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    console.log('📋 Fetching demo requests...')
    console.log('Status filter:', status || 'all')

    // Query builder
    let query = supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filter if present
    if (status && status !== 'all') {
      console.log(`Filtering by status: ${status}`)
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      return NextResponse.json({ 
        error: error.message,
        details: 'Database query failed',
        code: error.code
      }, { status: 500 })
    }

    console.log(`✅ Query successful! Found ${data?.length || 0} demo requests`)
    
    if (data && data.length > 0) {
      console.log('First demo request:', {
        id: data[0].id,
        company_name: data[0].company_name,
        status: data[0].status,
        created_at: data[0].created_at
      })
    }

    return NextResponse.json({ 
      data: data || [], 
      success: true,
      count: data?.length || 0
    })
  } catch (error) {
    console.error('❌ Unexpected API error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update demo request status
export async function PATCH(request: NextRequest) {
  console.log('\n=== DEMO REQUESTS API CALLED ===')
  console.log('Method: PATCH')
  
  try {
    // Validate admin session
    const isValid = validateAdminSession(request)
    
    if (!isValid) {
      console.log('❌ Admin validation failed, returning 401')
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { id, status, ...updates } = body

    if (!id) {
      console.log('❌ No ID provided')
      return NextResponse.json({ error: 'Demo request ID required' }, { status: 400 })
    }

    console.log(`📝 Updating demo request ${id}`)
    console.log('New status:', status)
    console.log('Additional updates:', updates)

    const { data, error } = await supabase
      .from('demo_requests')
      .update({
        status,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating demo request:', error)
      return NextResponse.json({ 
        error: error.message,
        details: 'Failed to update demo request'
      }, { status: 500 })
    }

    console.log('✅ Demo request updated successfully')

    return NextResponse.json({ 
      data, 
      success: true 
    })
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}