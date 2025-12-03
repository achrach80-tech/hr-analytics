// ============================================
// lib/api/visions.ts
// API complète pour gérer les visions - Token-based auth
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { SavedVision } from '@/lib/types/visions'

export const visionsApi = {
  // ============================================
  // GET - Récupérer toutes les visions d'un établissement
  // ============================================
  async getVisions(etablissementId: string): Promise<SavedVision[]> {
    if (!etablissementId) {
      console.error('getVisions: etablissementId is required')
      return []
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visions')
        .select('*')
        .eq('etablissement_id', etablissementId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching visions:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('Exception in getVisions:', err)
      return []
    }
  },

  // ============================================
  // GET ONE - Récupérer une vision par ID
  // ============================================
  async getVision(visionId: string): Promise<SavedVision | null> {
    if (!visionId) {
      console.error('getVision: visionId is required')
      return null
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visions')
        .select('*')
        .eq('id', visionId)
        .single()

      if (error) {
        console.error('Error fetching vision:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Exception in getVision:', err)
      return null
    }
  },

  // ============================================
  // GET DEFAULT - Récupérer la vision par défaut
  // ============================================
  async getDefaultVision(etablissementId: string): Promise<SavedVision | null> {
    if (!etablissementId) {
      console.error('getDefaultVision: etablissementId is required')
      return null
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visions')
        .select('*')
        .eq('etablissement_id', etablissementId)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching default vision:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Exception in getDefaultVision:', err)
      return null
    }
  },

  // ============================================
  // CREATE - Créer une nouvelle vision
  // ============================================
  async createVision(vision: {
    etablissement_id: string
    nom: string
    description?: string
    color?: string
    layout: any
    is_default?: boolean
  }): Promise<SavedVision | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visions')
        .insert([vision])
        .select()
        .single()

      if (error) {
        console.error('Error creating vision:', error)
        throw new Error(`Erreur lors de la création: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Exception in createVision:', err)
      throw err
    }
  },

  // ============================================
  // UPDATE - Mettre à jour une vision
  // ============================================
  async updateVision(visionId: string, updates: Partial<SavedVision>): Promise<SavedVision | null> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('visions')
        .update(updates)
        .eq('id', visionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating vision:', error)
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Exception in updateVision:', err)
      throw err
    }
  },

  // ============================================
  // DELETE - Supprimer une vision
  // ============================================
  async deleteVision(visionId: string): Promise<boolean> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('visions')
        .delete()
        .eq('id', visionId)

      if (error) {
        console.error('Error deleting vision:', error)
        throw new Error(`Erreur lors de la suppression: ${error.message}`)
      }

      return true
    } catch (err) {
      console.error('Exception in deleteVision:', err)
      throw err
    }
  },

  // ============================================
  // DUPLICATE - Dupliquer une vision
  // ============================================
  async duplicateVision(visionId: string): Promise<SavedVision | null> {
    try {
      const supabase = createClient()
      
      // Récupérer la vision originale
      const { data: original, error: fetchError } = await supabase
        .from('visions')
        .select('*')
        .eq('id', visionId)
        .single()

      if (fetchError || !original) {
        throw new Error('Vision introuvable')
      }

      // Créer la copie
      const copy = {
        etablissement_id: original.etablissement_id,
        nom: `${original.nom} (copie)`,
        description: original.description,
        color: original.color,
        layout: original.layout,
        is_default: false
      }

      const { data, error } = await supabase
        .from('visions')
        .insert([copy])
        .select()
        .single()

      if (error) {
        throw new Error(`Erreur lors de la duplication: ${error.message}`)
      }

      return data
    } catch (err) {
      console.error('Exception in duplicateVision:', err)
      throw err
    }
  },

  // ============================================
  // SET DEFAULT - Définir une vision par défaut
  // ============================================
  async setDefaultVision(visionId: string, etablissementId: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Désactiver toutes les visions par défaut
      await supabase
        .from('visions')
        .update({ is_default: false })
        .eq('etablissement_id', etablissementId)

      // Activer la vision sélectionnée
      const { error } = await supabase
        .from('visions')
        .update({ is_default: true })
        .eq('id', visionId)

      if (error) {
        throw new Error(`Erreur: ${error.message}`)
      }

      return true
    } catch (err) {
      console.error('Exception in setDefaultVision:', err)
      throw err
    }
  },

  // ============================================
  // INCREMENT VIEW COUNT
  // ============================================
  async incrementViewCount(visionId: string): Promise<void> {
    try {
      const supabase = createClient()
      
      // Récupérer la vision actuelle
      const { data: vision } = await supabase
        .from('visions')
        .select('view_count')
        .eq('id', visionId)
        .single()

      if (vision) {
        await supabase
          .from('visions')
          .update({
            view_count: (vision.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', visionId)
      }
    } catch (err) {
      console.error('Exception in incrementViewCount:', err)
    }
  },

  // ============================================
  // INCREMENT EXPORT COUNT
  // ============================================
  async incrementExportCount(visionId: string): Promise<void> {
    try {
      const supabase = createClient()
      
      // Récupérer la vision actuelle
      const { data: vision } = await supabase
        .from('visions')
        .select('export_count')
        .eq('id', visionId)
        .single()

      if (vision) {
        await supabase
          .from('visions')
          .update({
            export_count: (vision.export_count || 0) + 1,
            last_exported_at: new Date().toISOString()
          })
          .eq('id', visionId)
      }
    } catch (err) {
      console.error('Exception in incrementExportCount:', err)
    }
  }
}