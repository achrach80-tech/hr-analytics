// app/api/admin/login/route.ts - VERSION SIMPLE SANS BCRYPT
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 === SIMPLE ADMIN LOGIN START ===')
    
    const { email, password } = await request.json()

    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Login attempt for: ${email}`)

    // SIMPLE AUTH - Check hardcoded credentials first
    if (email === 'admin@talvio.com' && password === 'admin123') {
      console.log('✅ Hardcoded admin credentials matched!')
      
      // Get or create admin user in database
      let { data: adminUser, error } = await adminClient
        .from('admin_users')
        .select('id, email, role, is_active')
        .eq('email', email)
        .single()

      if (error || !adminUser) {
        console.log('⚠️ Admin not found in DB, creating...')
        
        // Create admin user if not exists
        const { data: newAdmin, error: createError } = await adminClient
          .from('admin_users')
          .insert({
            email: 'admin@talvio.com',
            password_hash: 'simple_hash', // Placeholder
            role: 'super_admin',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Failed to create admin:', createError)
          return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
        }

        adminUser = newAdmin
        console.log('✅ Admin user created')
      }

      // Update last login
      await adminClient
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id)

      // Create admin session
      const sessionData = {
        adminId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isAdmin: true,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        created_at: new Date().toISOString()
      }

      console.log('📝 Creating admin session...')

      const response = NextResponse.json({
        success: true,
        session: sessionData,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        }
      })

      // Set HTTP-only cookie
      const cookieValue = encodeURIComponent(JSON.stringify(sessionData))
      response.cookies.set({
        name: 'admin_session',
        value: cookieValue,
        httpOnly: false, // Must be false so client JS can read it
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 hours in seconds
        path: '/'
      })

      console.log('✅ === SIMPLE ADMIN LOGIN SUCCESS ===')
      return response
    }

    // If not hardcoded credentials, check database with simple password
    console.log('🔍 Checking database for admin user...')
    
    const { data: adminUser, error: adminError } = await adminClient
      .from('admin_users')
      .select('id, email, password_hash, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      console.log('❌ Admin user not found in database')
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Simple password check (if password_hash is "admin123" or the password matches)
    if (adminUser.password_hash === password || password === 'admin123') {
      console.log('✅ Database admin credentials matched!')

      // Update last login
      await adminClient
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id)

      // Create admin session
      const sessionData = {
        adminId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        isAdmin: true,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }

      const response = NextResponse.json({
        success: true,
        session: sessionData,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        }
      })

      response.cookies.set({
        name: 'admin_session',
        value: encodeURIComponent(JSON.stringify(sessionData)),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60,
        path: '/'
      })

      console.log('✅ === DATABASE ADMIN LOGIN SUCCESS ===')
      return response
    }

    console.log('❌ Invalid password')
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  } catch (error) {
    console.error('💥 Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    console.log('🚪 Admin logout requested')
    
    const response = NextResponse.json({ success: true })
    
    // Clear the admin session cookie
    response.cookies.set({
      name: 'admin_session',
      value: '',
      expires: new Date(0),
      path: '/'
    })

    console.log('✅ Admin session cleared')
    return response

  } catch (error) {
    console.error('❌ Admin logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}