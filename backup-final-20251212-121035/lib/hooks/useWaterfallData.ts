// Path: lib/hooks/useWaterfallData.ts
/**
 * 🌊 WATERFALL DATA HOOK v5.1 - PRIX/VOLUME UNIQUEMENT
 * 
 * ✅ FORMULES CORRECTES SANS MIX:
 * 
 * Effet Prix    = (Coût Moyen M - Coût Moyen M-1) × ETP M
 * Effet Volume  = (ETP M - ETP M-1) × Coût Moyen M-1
 * 
 * Vérification: Prix + Volume = Variation Totale ✓
 * 
 * @module useWaterfallData
 * @version 5.1
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
 * Hook Waterfall v5.1 - Prix/Volume uniquement (sans Mix)
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
   * ✅ FORMULES CORRECTES Prix/Volume (SANS Mix)
   * 
   * Ces formules garantissent que:
   * effetPrix + effetVolume = variation
   * 
   * IMPORTANT: 
   * - Effet Prix utilise ETP M (période courante)
   * - Effet Volume utilise Coût Moyen M-1 (période référence)
   */
  const calculateEffects = (
    masseM: number,
    etpM: number,
    masseM1: number,
    etpM1: number
  ): { effetPrix: number; effetVolume: number } => {
    
    // ============================================
    // VALIDATION DES ENTRÉES
    // ============================================
    if (etpM1 === 0 || etpM === 0) {
      console.warn('⚠️ calculateEffects: ETP = 0, impossible de calculer')
      return { effetPrix: 0, effetVolume: 0 }
    }
    
    if (masseM < 0 || masseM1 < 0 || etpM < 0 || etpM1 < 0) {
      console.error('❌ calculateEffects: Valeurs négatives détectées!', {
        masseM, masseM1, etpM, etpM1
      })
      return { effetPrix: 0, effetVolume: 0 }
    }
    
    // ============================================
    // CALCUL DES COÛTS MOYENS
    // ============================================
    const coutMoyenM = masseM / etpM
    const coutMoyenM1 = masseM1 / etpM1
    
    // ============================================
    // FORMULES CORRECTES (SANS MIX)
    // ============================================
    // Effet Prix: changement de coût moyen × effectif COURANT
    const effetPrix = (coutMoyenM - coutMoyenM1) * etpM
    
    // Effet Volume: changement d'effectif × coût moyen RÉFÉRENCE
    const effetVolume = (etpM - etpM1) * coutMoyenM1
    
    // ============================================
    // VALIDATION MATHÉMATIQUE
    // ============================================
    const variation = masseM - masseM1
    const sommeEffets = effetPrix + effetVolume
    const ecart = Math.abs(variation - sommeEffets)
    const ecartPct = Math.abs(variation) > 0 ? (ecart / Math.abs(variation)) * 100 : 0
    
    console.log('🧮 Calcul Effets Prix/Volume (sans Mix):', {
      masseM: masseM.toFixed(2),
      masseM1: masseM1.toFixed(2),
      etpM: etpM.toFixed(2),
      etpM1: etpM1.toFixed(2),
      coutMoyenM: coutMoyenM.toFixed(2),
      coutMoyenM1: coutMoyenM1.toFixed(2),
      '---': '---',
      effetPrix: effetPrix.toFixed(2),
      effetVolume: effetVolume.toFixed(2),
      sommeEffets: sommeEffets.toFixed(2),
      '---2': '---',
      variation: variation.toFixed(2),
      ecart: ecart.toFixed(2),
      ecartPct: ecartPct.toFixed(4) + '%',
      coherence: ecartPct < 0.01 ? '✅ OK' : '❌ ERREUR'
    })
    
    // Alerte si incohérence
    if (ecartPct > 0.01) {
      console.error('❌ INCOHÉRENCE MATHÉMATIQUE!', {
        variation_attendue: variation.toFixed(2),
        somme_effets_calculee: sommeEffets.toFixed(2),
        ecart_absolu: ecart.toFixed(2),
        ecart_pourcentage: ecartPct.toFixed(2) + '%'
      })
    }
    
    return {
      effetPrix: Math.round(effetPrix * 100) / 100,
      effetVolume: Math.round(effetVolume * 100) / 100
    }
  }

  /**
   * Construit un objet WaterfallData avec validation stricte
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildWaterfallData = (
    snapshotM: any,
    snapshotPrevious: any,
    periodLabel: string,
    previousLabel: string
  ): WaterfallData => {
    
    // ============================================
    // EXTRACTION DES DONNÉES
    // ============================================
    const masseM = parseFloat(snapshotM.masse_salariale_brute) || 0
    const etpM = parseFloat(snapshotM.etp_fin_mois) || 0
    const massePrevious = parseFloat(snapshotPrevious.masse_salariale_brute) || 0
    const etpPrevious = parseFloat(snapshotPrevious.etp_fin_mois) || 0
    
    console.log('🔍 Données Période:', {
      periode_courante: periodLabel,
      periode_precedente: previousLabel,
      masseM,
      etpM,
      massePrevious,
      etpPrevious
    })
    
    // ============================================
    // VALIDATION
    // ============================================
    if (masseM <= 0 || massePrevious <= 0) {
      console.error('❌ ERREUR: Masse salariale <= 0!')
    }
    
    if (etpM <= 0 || etpPrevious <= 0) {
      console.error('❌ ERREUR: ETP <= 0!')
    }
    
    // ============================================
    // RECALCUL SYSTÉMATIQUE AVEC FORMULES CORRECTES
    // ============================================
    const variation = masseM - massePrevious
    
    console.log('🔄 Recalcul automatique avec formules v5.1 (Prix/Volume uniquement)...')
    
    const { effetPrix, effetVolume } = calculateEffects(
      masseM,
      etpM,
      massePrevious,
      etpPrevious
    )
    
    // ============================================
    // VALIDATION FINALE
    // ============================================
    const sommeEffets = effetPrix + effetVolume
    const ecart = Math.abs(variation - sommeEffets)
    const ecartPct = Math.abs(variation) > 0 ? (ecart / Math.abs(variation)) * 100 : 0
    const coherenceOk = ecartPct < 0.01 // Tolérance 0.01%
    
    if (!coherenceOk) {
      console.error('❌ VALIDATION ÉCHOUÉE!', {
        periode: periodLabel,
        variation_reelle: variation.toFixed(2),
        somme_effets: sommeEffets.toFixed(2),
        ecart: ecart.toFixed(2),
        ecart_pct: ecartPct.toFixed(4) + '%'
      })
    } else {
      console.log('✅ Validation réussie (écart < 0.01%)')
    }
    
    // ============================================
    // CONSTRUCTION DU RÉSULTAT
    // ============================================
    const coutMoyenM = etpM > 0 ? masseM / etpM : 0
    const coutMoyenPrevious = etpPrevious > 0 ? massePrevious / etpPrevious : 0
    const variationPct = massePrevious > 0 ? (variation / massePrevious) * 100 : 0
    
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
      ecartCoherence: Math.round(ecart * 100) / 100,
      ecartCoherencePct: Math.round(ecartPct * 10000) / 10000,
      
      recalculated: true
    }
  }

  const fetchData = async () => {
    if (!establishmentId || !period) {
      console.warn('⚠️ useWaterfallData: Paramètres manquants')
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

      console.group('🌊 WATERFALL v5.1 - PRIX/VOLUME UNIQUEMENT')
      console.log('🏢 Établissement:', establishmentId)
      console.log('📅 Période M:', normalizedPeriod)
      console.log('📅 Période M-1:', monthBefore)
      console.log('📅 Période N-1:', yearBefore)

      // ============================================
      // REQUÊTE SUPABASE
      // ============================================
      const { data: snapshots, error: selectError } = await supabase
        .from('snapshots_mensuels')
        .select(`
          periode,
          masse_salariale_brute,
          etp_fin_mois,
          primes_exceptionnelles_total
        `)
        .eq('etablissement_id', establishmentId)
        .in('periode', [normalizedPeriod, monthBefore, yearBefore])

      if (selectError) {
        throw new Error(`Erreur DB: ${selectError.message}`)
      }
      
      if (!snapshots || snapshots.length === 0) {
        throw new Error(`Aucune donnée pour ${establishmentId} sur ${normalizedPeriod}`)
      }

      console.log('📦 Snapshots récupérés:', snapshots.length)

      const snapshotCurrent = snapshots.find(s => s.periode === normalizedPeriod)
      const snapshotMonthBefore = snapshots.find(s => s.periode === monthBefore)
      const snapshotYearBefore = snapshots.find(s => s.periode === yearBefore)

      if (!snapshotCurrent) {
        throw new Error(`Snapshot manquant pour ${normalizedPeriod}`)
      }

      console.log('📊 Disponibilité:', {
        M: snapshotCurrent ? '✅' : '❌',
        'M-1': snapshotMonthBefore ? '✅' : '❌',
        'N-1': snapshotYearBefore ? '✅' : '❌'
      })

      // ============================================
      // CONSTRUCTION WATERFALLS
      // ============================================
      let vsMonthBefore: WaterfallData | null = null
      let vsYearBefore: WaterfallData | null = null

      if (snapshotMonthBefore) {
        console.log('\n--- Waterfall vs M-1 ---')
        vsMonthBefore = buildWaterfallData(
          snapshotCurrent,
          snapshotMonthBefore,
          normalizedPeriod,
          monthBefore
        )
        
        console.log('✅ Résultat M-1:', {
          effetPrix: vsMonthBefore.effetPrix,
          effetVolume: vsMonthBefore.effetVolume,
          variation: vsMonthBefore.variation,
          coherence: vsMonthBefore.coherenceOk ? '✅' : '❌'
        })
      }

      if (snapshotYearBefore) {
        console.log('\n--- Waterfall vs N-1 ---')
        vsYearBefore = buildWaterfallData(
          snapshotCurrent,
          snapshotYearBefore,
          normalizedPeriod,
          yearBefore
        )
        
        console.log('✅ Résultat N-1:', {
          effetPrix: vsYearBefore.effetPrix,
          effetVolume: vsYearBefore.effetVolume,
          variation: vsYearBefore.variation,
          coherence: vsYearBefore.coherenceOk ? '✅' : '❌'
        })
      }

      console.groupEnd()

      setData({
        vsMonthBefore,
        vsYearBefore,
        hasMonthBefore: !!snapshotMonthBefore,
        hasYearBefore: !!snapshotYearBefore
      })

    } catch (err) {
      console.error('❌ Erreur waterfall:', err)
      setError(err instanceof Error ? err.message : 'Erreur waterfall')
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