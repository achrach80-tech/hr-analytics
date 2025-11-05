// app/api/admin/demo-requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching demo requests for admin...')

    // Get all demo requests - use service_role to bypass RLS
    const { data: demoRequests, error } = await adminClient
      .from('demo_requests')
      .select(`
        id,
        company_name,
        contact_name,
        email,
        phone,
        employee_count,
        industry,
        country,
        message,
        status,
        qualification_score,
        scheduled_date,
        demo_completed_date,
        converted_to_company_id,
        lost_reason,
        admin_notes,
        assigned_to,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching demo requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch demo requests', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${demoRequests?.length || 0} demo requests`)

    return NextResponse.json({
      success: true,
      data: demoRequests || [],
      total: demoRequests?.length || 0
    })

  } catch (error) {
    console.error('💥 Demo requests API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, admin_notes, qualification_score } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Demo request ID is required' }, { status: 400 })
    }

    console.log(`📝 Updating demo request ${id}...`)

    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (status) updateData.status = status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes
    if (qualification_score !== undefined) updateData.qualification_score = qualification_score

    const { data, error } = await adminClient
      .from('demo_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating demo request:', error)
      return NextResponse.json(
        { error: 'Failed to update demo request', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Demo request updated successfully')

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('💥 Update demo request error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}