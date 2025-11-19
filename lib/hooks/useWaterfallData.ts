'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface WaterfallData {
  // Périodes
  periodeCourante: string
  periodePrecedente: string
  
  // Base M-1
  masseSalarialeM1: number
  coutMoyenM1: number
  etpM1: number
  
  // Effets
  effetPrix: number
  effetVolume: number
  variation: number
  variationPct: number
  
  // Base M
  masseSalarialeM: number
  coutMoyenM: number
  etpM: number
  
  // Primes pour analyse intelligente
  primesExceptionnellesM: number
  primesExceptionnellesM1: number
  
  // Cohérence
  coherenceOk: boolean
  ecartCoherence: number
  ecartCoherencePct: number
}

interface UseWaterfallDataResult {
  data: WaterfallData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * ✅ Hook pour récupérer les données waterfall avec v2.5
 * 
 * CORRECTIONS:
 * - Normalisation de la période au format YYYY-MM-01
 * - Appel à get_waterfall_data() v2.5 (bug période M-1 corrigé)
 * - Gestion d'erreurs robuste
 * - Logs de debug pour diagnostic
 * 
 * @param establishmentId UUID de l'établissement
 * @param period Période au format YYYY-MM-DD ou YYYY-MM-01
 */
export function useWaterfallData(
  establishmentId: string,
  period: string
): UseWaterfallDataResult {
  const [data, setData] = useState<WaterfallData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchData = async () => {
    if (!establishmentId || !period) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // ✅ Normaliser la période au format YYYY-MM-01
      const normalizedPeriod = period.substring(0, 7) + '-01'

      console.group('🌊 TALVIO - Waterfall Data Fetch')
      console.log('📅 Période demandée:', period)
      console.log('📅 Période normalisée:', normalizedPeriod)
      console.log('🏢 Établissement:', establishmentId)

      // ✅ Appeler la fonction SQL get_waterfall_data v2.5
      const { data: waterfallResult, error: waterfallError } = await supabase
        .rpc('get_waterfall_data', {
          p_etablissement_id: establishmentId,
          p_periode: normalizedPeriod
        })

      if (waterfallError) {
        console.error('❌ Erreur get_waterfall_data:', waterfallError)
        throw new Error(`Erreur SQL: ${waterfallError.message}`)
      }

      if (!waterfallResult || waterfallResult.length === 0) {
        console.warn('⚠️ Aucune donnée waterfall retournée')
        console.warn('   Vérifiez que les snapshots existent pour:', normalizedPeriod)
        
        // Calculer M-1 pour le message d'erreur
        const periodeDate = new Date(normalizedPeriod)
        const periodeM1Date = new Date(periodeDate)
        periodeM1Date.setMonth(periodeM1Date.getMonth() - 1)
        const periodeM1 = periodeM1Date.toISOString().substring(0, 7) + '-01'
        
        throw new Error(
          `Aucune donnée pour ${normalizedPeriod}. ` +
          `Vérifiez que les snapshots existent pour ${normalizedPeriod} et ${periodeM1}.`
        )
      }

      const result = waterfallResult[0]

      // ✅ Logs de debug détaillés
      console.log('📊 Données reçues:')
      console.log('   Période courante:', result.periode_courante)
      console.log('   Période M-1:', result.periode_precedente)
      console.log('   Masse M:', result.masse_m)
      console.log('   Masse M-1:', result.masse_m_moins_1)
      console.log('   Effet Prix:', result.effet_prix)
      console.log('   Effet Volume:', result.effet_volume)
      console.log('   Variation:', result.variation)
      console.log('   Cohérence:', result.coherence_ok ? '✅' : '❌')

      // ✅ Validation des données critiques
      if (result.masse_m === 0 && result.masse_m_moins_1 === 0) {
        console.warn('⚠️ Masses salariales à 0 - données potentiellement incorrectes')
      }

      // ✅ Détection anomalies
      if (result.primes_exceptionnelles_m > result.masse_m * 0.3) {
        console.log('🎁 13ème mois détecté:', result.primes_exceptionnelles_m, '€')
      }

      if (!result.coherence_ok) {
        console.warn('⚠️ INCOHÉRENCE détectée!')
        console.warn('   Écart:', result.ecart_coherence, '€')
        console.warn('   Écart %:', result.ecart_coherence_pct, '%')
        console.warn('   💡 Exécutez: SELECT calculate_payroll_effects_v4()')
      } else {
        console.log('✅ Données cohérentes (écart:', result.ecart_coherence, '€)')
      }

      console.groupEnd()

      // ✅ Construire l'objet WaterfallData
      setData({
        periodeCourante: result.periode_courante,
        periodePrecedente: result.periode_precedente,
        
        masseSalarialeM1: parseFloat(result.masse_m_moins_1) || 0,
        coutMoyenM1: parseFloat(result.cout_moyen_m_moins_1) || 0,
        etpM1: parseFloat(result.etp_m_moins_1) || 0,
        
        effetPrix: parseFloat(result.effet_prix) || 0,
        effetVolume: parseFloat(result.effet_volume) || 0,
        variation: parseFloat(result.variation) || 0,
        variationPct: parseFloat(result.variation_pct) || 0,
        
        masseSalarialeM: parseFloat(result.masse_m) || 0,
        coutMoyenM: parseFloat(result.cout_moyen_m) || 0,
        etpM: parseFloat(result.etp_m) || 0,
        
        primesExceptionnellesM: parseFloat(result.primes_exceptionnelles_m) || 0,
        primesExceptionnellesM1: parseFloat(result.primes_exceptionnelles_m1) || 0,
        
        coherenceOk: result.coherence_ok,
        ecartCoherence: parseFloat(result.ecart_coherence) || 0,
        ecartCoherencePct: parseFloat(result.ecart_coherence_pct) || 0
      })

    } catch (err) {
      console.error('❌ Erreur fatale waterfall fetch:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des données waterfall'
      setError(errorMessage)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [establishmentId, period])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}