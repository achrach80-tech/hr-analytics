/**
 * 🌊 WATERFALL DATA HOOK v4.2
 * 
 * Hook React pour récupérer et calculer les données du double waterfall
 * Affiche 2 waterfalls : vs M-1 (mois précédent) ET vs N-1 (année précédente)
 * 
 * ✅ CORRECTIONS v4.2:
 * - Validation stricte des données Supabase
 * - Logs détaillés pour debugging
 * - Recalcul automatique amélioré
 * - Gestion erreurs robuste
 * 
 * @module useWaterfallData
 * @version 4.2
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WaterfallData, DualWaterfallData } from '@/lib/types/dashboard'

interface UseWaterfallDataResult {
  data: DualWaterfallData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook Waterfall v4.2 - Double waterfall avec validation stricte
 */
export function useWaterfallData(
  establishmentId: string,
  period: string
): UseWaterfallDataResult {
  const [data, setData] = useState<DualWaterfallData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  /**
   * Calcule les effets Prix/Volume avec validation stricte
   */
  const calculateEffects = (
    masseM: number,
    etpM: number,
    masseM1: number,
    etpM1: number
  ): { effetPrix: number; effetVolume: number } => {
    // Validation entrées
    if (etpM1 === 0 || etpM === 0) {
      console.warn('⚠️ calculateEffects: ETP = 0, impossible de calculer')
      return { effetPrix: 0, effetVolume: 0 }
    }
    
    if (masseM < 0 || masseM1 < 0 || etpM < 0 || etpM1 < 0) {
      console.error('❌ calculateEffects: Valeurs négatives détectées!')
      return { effetPrix: 0, effetVolume: 0 }
    }
    
    // Calcul coûts moyens
    const coutMoyenM = masseM / etpM
    const coutMoyenM1 = masseM1 / etpM1
    
    // Formules v2.4
    const effetPrix = (coutMoyenM - coutMoyenM1) * etpM1
    const effetVolume = (etpM - etpM1) * coutMoyenM
    
    console.log('🧮 Recalcul Effets:', {
      masseM: masseM.toFixed(2),
      masseM1: masseM1.toFixed(2),
      etpM: etpM.toFixed(2),
      etpM1: etpM1.toFixed(2),
      coutMoyenM: coutMoyenM.toFixed(2),
      coutMoyenM1: coutMoyenM1.toFixed(2),
      effetPrix: effetPrix.toFixed(2),
      effetVolume: effetVolume.toFixed(2)
    })
    
    return {
      effetPrix: Math.round(effetPrix * 100) / 100,
      effetVolume: Math.round(effetVolume * 100) / 100
    }
  }

  /**
   * Construit un objet WaterfallData avec validation
   */
  const buildWaterfallData = (
    snapshotM: any,
    snapshotPrevious: any,
    periodLabel: string,
    previousLabel: string
  ): WaterfallData => {
    
    // ============================================
    // EXTRACTION ET VALIDATION DES DONNÉES
    // ============================================
    const masseM = parseFloat(snapshotM.masse_salariale_brute) || 0
    const etpM = parseFloat(snapshotM.etp_fin_mois) || 0
    const massePrevious = parseFloat(snapshotPrevious.masse_salariale_brute) || 0
    const etpPrevious = parseFloat(snapshotPrevious.etp_fin_mois) || 0
    
    console.log('🔍 Données Extraites:', {
      periode_m: periodLabel,
      periode_previous: previousLabel,
      masseM,
      etpM,
      massePrevious,
      etpPrevious
    })
    
    // Validation: détecter valeurs aberrantes
    if (masseM <= 0 || massePrevious <= 0) {
      console.error('❌ ERREUR: Masse salariale <= 0 détectée!')
    }
    
    if (etpM <= 0 || etpPrevious <= 0) {
      console.error('❌ ERREUR: ETP <= 0 détecté!')
    }
    
    // Récupérer les effets stockés en DB
    let effetPrix = parseFloat(snapshotM.effet_prix) || 0
    let effetVolume = parseFloat(snapshotM.effet_volume) || 0
    let recalculated = false
    
    console.log('📊 Effets stockés en DB:', {
      effet_prix: effetPrix,
      effet_volume: effetVolume
    })
    
    // ============================================
    // RECALCUL AUTOMATIQUE si effets = 0 mais variation existe
    // ============================================
    const variation = masseM - massePrevious
    
    // Condition recalcul: variation > 100€ ET (effet_prix = 0 OU effet_volume = 0)
    // ⚠️ Important: on recalcule même si UN SEUL effet est à 0
    if (Math.abs(variation) > 100 && (effetPrix === 0 || effetVolume === 0)) {
      console.warn('⚠️ RECALCUL AUTOMATIQUE DÉCLENCHÉ', {
        raison: 'Effets manquants ou nuls en DB',
        variation: variation.toFixed(2),
        effet_prix_db: effetPrix,
        effet_volume_db: effetVolume
      })
      
      const calculated = calculateEffects(masseM, etpM, massePrevious, etpPrevious)
      effetPrix = calculated.effetPrix
      effetVolume = calculated.effetVolume
      recalculated = true
      
      console.log('✅ Recalcul terminé:', {
        nouveau_effet_prix: effetPrix,
        nouveau_effet_volume: effetVolume
      })
    }
    
    // Calculs dérivés
    const coutMoyenM = etpM > 0 ? masseM / etpM : 0
    const coutMoyenPrevious = etpPrevious > 0 ? massePrevious / etpPrevious : 0
    const variationPct = massePrevious > 0 ? (variation / massePrevious) * 100 : 0
    
    // ============================================
    // VALIDATION COHÉRENCE MATHÉMATIQUE
    // ============================================
    const sommeEffets = effetPrix + effetVolume
    const ecartCoherence = Math.abs(variation - sommeEffets)
    const ecartCoherencePct = variation !== 0 ? (ecartCoherence / Math.abs(variation)) * 100 : 0
    const coherenceOk = ecartCoherencePct < 1
    
    if (!coherenceOk) {
      console.error('❌ INCOHÉRENCE MATHÉMATIQUE DÉTECTÉE!', {
        periode: periodLabel,
        variation_reelle: variation.toFixed(2),
        somme_effets: sommeEffets.toFixed(2),
        ecart: ecartCoherence.toFixed(2),
        ecart_pct: ecartCoherencePct.toFixed(2) + '%',
        message: 'La somme Prix + Volume ne correspond pas à la variation!'
      })
    } else {
      console.log('✅ Cohérence mathématique validée', {
        ecart: ecartCoherence.toFixed(2),
        ecart_pct: ecartCoherencePct.toFixed(4) + '%'
      })
    }
    
    return {
      periodeCourante: periodLabel,
      periodePrecedente: previousLabel,
      
      masseSalarialeM1: Math.round(massePrevious * 100) / 100,
      coutMoyenM1: Math.round(coutMoyenPrevious * 100) / 100,
      etpM1: Math.round(etpPrevious * 100) / 100,
      
      effetPrix: Math.round(effetPrix * 100) / 100,
      effetVolume: Math.round(effetVolume * 100) / 100,
      variation: Math.round(variation * 100) / 100,
      variationPct: Math.round(variationPct * 100) / 100,
      
      masseSalarialeM: Math.round(masseM * 100) / 100,
      coutMoyenM: Math.round(coutMoyenM * 100) / 100,
      etpM: Math.round(etpM * 100) / 100,
      
      primesExceptionnellesM: Math.round((parseFloat(snapshotM.primes_exceptionnelles_total) || 0) * 100) / 100,
      primesExceptionnellesM1: Math.round((parseFloat(snapshotPrevious.primes_exceptionnelles_total) || 0) * 100) / 100,
      
      coherenceOk,
      ecartCoherence: Math.round(ecartCoherence * 100) / 100,
      ecartCoherencePct: Math.round(ecartCoherencePct * 100) / 100,
      
      recalculated
    }
  }

  const fetchData = async () => {
    if (!establishmentId || !period) {
      console.warn('⚠️ useWaterfallData: Paramètres manquants', { establishmentId, period })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Normaliser les périodes
      const normalizedPeriod = period.substring(0, 7) + '-01'
      const currentDate = new Date(normalizedPeriod)
      
      // M-1 (mois précédent)
      const monthBeforeDate = new Date(currentDate)
      monthBeforeDate.setMonth(monthBeforeDate.getMonth() - 1)
      const monthBefore = monthBeforeDate.toISOString().substring(0, 7) + '-01'
      
      // N-1 (année précédente)
      const yearBeforeDate = new Date(currentDate)
      yearBeforeDate.setFullYear(yearBeforeDate.getFullYear() - 1)
      const yearBefore = yearBeforeDate.toISOString().substring(0, 7) + '-01'

      console.group('🌊 TALVIO - Waterfall v4.2 (Validation Stricte)')
      console.log('🏢 Établissement:', establishmentId)
      console.log('📅 Période courante:', normalizedPeriod)
      console.log('📅 M-1 (mois précédent):', monthBefore)
      console.log('📅 N-1 (année précédente):', yearBefore)

      // ============================================
      // REQUÊTE SUPABASE
      // ============================================
      const { data: snapshots, error: selectError } = await supabase
        .from('snapshots_mensuels')
        .select(`
          periode,
          masse_salariale_brute,
          etp_fin_mois,
          effet_prix,
          effet_volume,
          primes_exceptionnelles_total
        `)
        .eq('etablissement_id', establishmentId)
        .in('periode', [normalizedPeriod, monthBefore, yearBefore])

      if (selectError) {
        throw new Error(`Erreur DB: ${selectError.message}`)
      }
      
      if (!snapshots || snapshots.length === 0) {
        throw new Error(`Aucune donnée trouvée pour l'établissement ${establishmentId} sur la période ${normalizedPeriod}`)
      }

      console.log('📦 Snapshots récupérés:', snapshots.length)

      // Recherche des snapshots
      const snapshotCurrent = snapshots.find(s => s.periode === normalizedPeriod)
      const snapshotMonthBefore = snapshots.find(s => s.periode === monthBefore)
      const snapshotYearBefore = snapshots.find(s => s.periode === yearBefore)

      if (!snapshotCurrent) {
        throw new Error(`Snapshot manquant pour la période courante ${normalizedPeriod}`)
      }

      console.log('📊 Disponibilité Snapshots:', {
        M: snapshotCurrent ? '✅' : '❌',
        'M-1': snapshotMonthBefore ? '✅' : '❌',
        'N-1': snapshotYearBefore ? '✅' : '❌'
      })

      // ============================================
      // CONSTRUCTION DES WATERFALLS
      // ============================================
      let vsMonthBefore: WaterfallData | null = null
      let vsYearBefore: WaterfallData | null = null

      if (snapshotMonthBefore) {
        console.log('\n--- Construction Waterfall vs M-1 ---')
        vsMonthBefore = buildWaterfallData(
          snapshotCurrent,
          snapshotMonthBefore,
          normalizedPeriod,
          monthBefore
        )
        
        console.log('✅ Waterfall M-1:', {
          effet_prix: vsMonthBefore.effetPrix,
          effet_volume: vsMonthBefore.effetVolume,
          variation: vsMonthBefore.variation,
          recalculated: vsMonthBefore.recalculated ? '🔄 OUI' : '📊 Non (DB)'
        })
      } else {
        console.warn('⚠️ Snapshot M-1 indisponible')
      }

      if (snapshotYearBefore) {
        console.log('\n--- Construction Waterfall vs N-1 ---')
        vsYearBefore = buildWaterfallData(
          snapshotCurrent,
          snapshotYearBefore,
          normalizedPeriod,
          yearBefore
        )
        
        console.log('✅ Waterfall N-1:', {
          effet_prix: vsYearBefore.effetPrix,
          effet_volume: vsYearBefore.effetVolume,
          variation: vsYearBefore.variation,
          recalculated: vsYearBefore.recalculated ? '🔄 OUI' : '📊 Non (DB)'
        })
      } else {
        console.warn('⚠️ Snapshot N-1 indisponible (historique < 12 mois)')
      }

      console.groupEnd()

      // Mise à jour state
      setData({
        vsMonthBefore,
        vsYearBefore,
        hasMonthBefore: !!snapshotMonthBefore,
        hasYearBefore: !!snapshotYearBefore
      })

    } catch (err) {
      console.error('❌ Erreur waterfall:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement des données waterfall')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [establishmentId, period])

  return { data, loading, error, refetch: fetchData }
}