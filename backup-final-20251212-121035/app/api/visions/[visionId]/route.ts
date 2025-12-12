// app/api/visions/[visionId]/route.ts
// API pour récupérer, modifier et supprimer une vision

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET - Récupérer une vision
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ visionId: string }> }
) {
  try {
    const { visionId } = await context.params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer la vision
    const { data: vision, error } = await supabase
      .from('visions')
      .select('*')
      .eq('id', visionId)
      .single()

    if (error || !vision) {
      console.error('Vision not found:', error)
      return NextResponse.json(
        { error: 'Vision introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(vision)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Modifier une vision
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ visionId: string }> }
) {
  try {
    const { visionId } = await context.params
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('visions')
      .update(body)
      .eq('id', visionId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Erreur mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une vision
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ visionId: string }> }
) {
  try {
    const { visionId } = await context.params
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
      .from('visions')
      .delete()
      .eq('id', visionId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Erreur suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}