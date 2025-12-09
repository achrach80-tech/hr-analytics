// lib/api/visions.ts - VERSION FINALE ULTRA-RIGOUREUSE
import { createClient } from '@/lib/supabase/client'
import type { CanvasState, CanvasComponent } from '@/lib/store/builderStore'

export interface VisionTemplate {
  canvas: CanvasState
  components: CanvasComponent[]
  defaultEstablishment?: string
  defaultPeriod?: string
}

// ✅ TYPE EXACT basé sur le schema SQL Talvio v5.1
export interface Vision {
  id: string
  etablissement_id: string
  
  nom: string
  description: string | null
  color: string
  is_default: boolean
  
  layout: any | null                 // Legacy - lecture seule
  template: VisionTemplate | null    // Nouveau builder
  
  view_count: number
  export_count: number
  last_viewed_at: string | null
  last_exported_at: string | null
  
  created_at: string
  updated_at: string
}

// ✅ CORRECTION CRITIQUE: CreateVisionInput ne doit PAS avoir 'layout'
export interface CreateVisionInput {
  nom: string
  description?: string | null
  color?: string
  template: VisionTemplate          // ✅ Obligatoire
  etablissement_id?: string
  // ❌ PAS DE 'layout' ici (c'est legacy, lecture seule)
}

export const visionsApi = {
  async getAll(etablissementId?: string): Promise<Vision[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('visions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (etablissementId) {
      query = query.eq('etablissement_id', etablissementId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Vision> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('visions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(input: CreateVisionInput): Promise<Vision> {
    const supabase = createClient()
    
    let etablissementId = input.etablissement_id
    
    if (!etablissementId) {
      // TODO: Récupérer depuis le contexte utilisateur
      // Pour l'instant, lancer une erreur claire
      throw new Error('etablissement_id est requis. Passez-le dans CreateVisionInput ou configurez votre système d\'authentification.')
    }

    // ✅ INSERTION CORRECTE - Seulement les colonnes qui existent
    const { data, error } = await supabase
      .from('visions')
      .insert({
        nom: input.nom,
        description: input.description || null,
        color: input.color || '#06b6d4',
        template: input.template as any,    // JSONB
        etablissement_id: etablissementId,
        is_default: false,
        view_count: 0,
        export_count: 0
        // ❌ PAS de 'layout' ici (legacy)
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }
    
    return data
  },

  async update(id: string, input: Partial<CreateVisionInput>): Promise<Vision> {
    const supabase = createClient()
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (input.nom !== undefined) updateData.nom = input.nom
    if (input.description !== undefined) updateData.description = input.description
    if (input.color !== undefined) updateData.color = input.color
    if (input.template !== undefined) updateData.template = input.template
    
    const { data, error } = await supabase
      .from('visions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('visions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async incrementExportCount(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error: rpcError } = await supabase.rpc('increment_vision_export_count', {
      vision_id: id
    })
    
    if (rpcError) {
      console.warn('RPC failed, using fallback')
      
      const { data: vision } = await supabase
        .from('visions')
        .select('export_count')
        .eq('id', id)
        .single()
      
      if (vision) {
        await supabase
          .from('visions')
          .update({ 
            export_count: (vision.export_count || 0) + 1,
            last_exported_at: new Date().toISOString()
          })
          .eq('id', id)
      }
    }
  },

  async setDefault(id: string, etablissementId: string): Promise<void> {
    const supabase = createClient()
    
    await supabase
      .from('visions')
      .update({ is_default: false })
      .eq('etablissement_id', etablissementId)
      .neq('id', id)
    
    const { error } = await supabase
      .from('visions')
      .update({ is_default: true })
      .eq('id', id)
    
    if (error) throw error
  },

  async getDefault(etablissementId: string): Promise<Vision | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('visions')
      .select('*')
      .eq('etablissement_id', etablissementId)
      .eq('is_default', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return data
  }
}