// lib/hooks/useCurrentEtablissement.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseCurrentEtablissementReturn {
  etablissementId: string | null
  loading: boolean
  error: string | null
}

/**
 * Hook pour récupérer l'etablissement_id courant
 * 
 * Ordre de priorité:
 * 1. localStorage (dernière sélection)
 * 2. Premier établissement de l'utilisateur
 * 3. Null si aucun établissement trouvé
 */
export function useCurrentEtablissement(): UseCurrentEtablissementReturn {
  const [etablissementId, setEtablissementId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEtablissement() {
      try {
        // 1. Vérifier localStorage
        const stored = localStorage.getItem('current_etablissement_id')
        if (stored) {
          setEtablissementId(stored)
          setLoading(false)
          return
        }

        // 2. Récupérer depuis Supabase
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('Utilisateur non connecté')
          setLoading(false)
          return
        }

        // 3. Charger l'entreprise via le token
        const { data: entreprises, error: entrepriseError } = await supabase
          .from('entreprises')
          .select('id')
          .limit(1)
          .single()

        if (entrepriseError) {
          console.error('Erreur chargement entreprise:', entrepriseError)
          setError('Impossible de charger l\'entreprise')
          setLoading(false)
          return
        }

        // 4. Charger le premier établissement
        const { data: etablissements, error: etabError } = await supabase
          .from('etablissements')
          .select('id')
          .eq('entreprise_id', entreprises.id)
          .eq('statut', 'Actif')
          .order('is_headquarters', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(1)

        if (etabError || !etablissements || etablissements.length === 0) {
          console.error('Erreur chargement établissement:', etabError)
          setError('Aucun établissement actif trouvé')
          setLoading(false)
          return
        }

        const etabId = etablissements[0].id
        setEtablissementId(etabId)
        localStorage.setItem('current_etablissement_id', etabId)
        setLoading(false)

      } catch (err) {
        console.error('Erreur useCurrentEtablissement:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setLoading(false)
      }
    }

    loadEtablissement()
  }, [])

  return { etablissementId, loading, error }
}

/**
 * Fonction utilitaire pour changer l'établissement courant
 */
export function setCurrentEtablissement(etablissementId: string): void {
  localStorage.setItem('current_etablissement_id', etablissementId)
  // Recharger la page pour appliquer le changement
  window.location.reload()
}

/**
 * Hook synchrone qui retourne l'ID depuis localStorage
 * ⚠️ Peut retourner null si jamais set
 */
export function useCurrentEtablissementSync(): string | null {
  const [etablissementId, setEtablissementId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('current_etablissement_id')
    setEtablissementId(stored)
  }, [])

  return etablissementId
}