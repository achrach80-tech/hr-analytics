// app/api/visions/[visionId]/view/route.ts
// API pour incrémenter le compteur de vues

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ visionId: string }> }
) {
  try {
    const { visionId } = await context.params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer le view_count actuel
    const { data: vision, error: fetchError } = await supabase
      .from('visions')
      .select('view_count')
      .eq('id', visionId)
      .single()

    if (fetchError || !vision) {
      return NextResponse.json(
        { error: 'Vision introuvable' },
        { status: 404 }
      )
    }

    // Incrémenter le compteur
    const { error: updateError } = await supabase
      .from('visions')
      .update({
        view_count: (vision.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', visionId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Erreur mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('View count error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}