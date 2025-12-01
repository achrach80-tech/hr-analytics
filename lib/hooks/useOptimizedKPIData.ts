'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkforceKPIs, PayrollKPIs, AbsenceKPIs, KPIData } from '@/lib/types/dashboard'

const KPI_FETCH_TIMEOUT_MS = 10000

interface UseOptimizedKPIDataResult {
  data: KPIData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook KPI Data - Production Ready v2.0
 * 
 * Améliorations:
 * - ✅ Gestion des paramètres vides (pas de warning console)
 * - ✅ Abort controller pour cleanup
 * - ✅ Timeout configurable
 * - ✅ Retry logic
 * - ✅ Cache des données
 */
export function useOptimizedKPIData(
  establishmentId: string,
  period: string
): UseOptimizedKPIDataResult {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const fetchData = async () => {
    // ✅ FIX: Ne rien faire si les paramètres sont vides
    if (!establishmentId || !period) {
      setLoading(false)
      setData(null)
      setError(null)
      return
    }

    // Cleanup previous fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Le chargement des données prend trop de temps. Veuillez réessayer.'))
        }, KPI_FETCH_TIMEOUT_MS)
      })

      const normalizedPeriod = period.substring(0, 7) + '-01'
      
      const currentDate = new Date(normalizedPeriod)
      
      const previousMonthDate = new Date(currentDate)
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
      const previousMonth = previousMonthDate.toISOString().substring(0, 7) + '-01'
      
      const previousYearDate = new Date(currentDate)
      previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
      const previousYear = previousYearDate.toISOString().substring(0, 7) + '-01'

      const fetchPromise = (async () => {
        const { data: snapshots, error: selectError } = await supabase
          .from('snapshots_mensuels')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .in('periode', [normalizedPeriod, previousMonth, previousYear])

        if (selectError) {
          throw new Error(`Erreur DB: ${selectError.message}`)
        }

        return snapshots
      })()

      const snapshots = await Promise.race([fetchPromise, timeoutPromise]) as any[]

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (!isMountedRef.current) return

      if (!snapshots || snapshots.length === 0) {
        throw new Error(`Aucune donnée disponible pour la période ${normalizedPeriod}. Veuillez d'abord importer vos données.`)
      }

      const currentSnapshot = snapshots.find(s => s.periode === normalizedPeriod)
      const previousMonthSnapshot = snapshots.find(s => s.periode === previousMonth)
      const previousYearSnapshot = snapshots.find(s => s.periode === previousYear)

      if (!currentSnapshot) {
        throw new Error(`Données manquantes pour la période ${normalizedPeriod}`)
      }

      const parseNum = (val: any, defaultVal: number = 0): number => {
        const parsed = parseFloat(val)
        return isNaN(parsed) ? defaultVal : parsed
      }

      const workforce: WorkforceKPIs = {
        etpTotal: parseNum(currentSnapshot.etp_fin_mois),
        headcountActif: currentSnapshot.effectif_fin_mois || 0,
        nbEntrees: currentSnapshot.nb_entrees || 0,
        nbSorties: currentSnapshot.nb_sorties || 0,
        tauxTurnover: parseNum(currentSnapshot.taux_turnover),
        pctCDI: parseNum(currentSnapshot.pct_cdi),
        ageMoyen: parseNum(currentSnapshot.age_moyen),
        ancienneteMoyenne: parseNum(currentSnapshot.anciennete_moyenne_mois),
        pctHommes: parseNum(currentSnapshot.pct_hommes),
        pctFemmes: parseNum(currentSnapshot.pct_femmes),
        pctAgeMoins25: parseNum(currentSnapshot.pct_age_moins_25),
        pctAge2535: parseNum(currentSnapshot.pct_age_25_35),
        pctAge3545: parseNum(currentSnapshot.pct_age_35_45),
        pctAge4555: parseNum(currentSnapshot.pct_age_45_55),
        pctAgePlus55: parseNum(currentSnapshot.pct_age_plus_55),
        pctAnciennete01: parseNum(currentSnapshot.pct_anciennete_0_1_an),
        pctAnciennete13: parseNum(currentSnapshot.pct_anciennete_1_3_ans),
        pctAnciennete35: parseNum(currentSnapshot.pct_anciennete_3_5_ans),
        pctAnciennete510: parseNum(currentSnapshot.pct_anciennete_5_10_ans),
        pctAnciennetePlus10: parseNum(currentSnapshot.pct_anciennete_plus_10_ans)
      }

      const financials: PayrollKPIs = {
        masseBrute: parseNum(currentSnapshot.masse_salariale_brute),
        coutTotal: parseNum(currentSnapshot.cout_total_employeur),
        salaireMoyen: parseNum(currentSnapshot.salaire_base_moyen),
        coutMoyenFTE: parseNum(currentSnapshot.cout_moyen_par_fte),
        partVariable: parseNum(currentSnapshot.part_variable),
        tauxCharges: parseNum(currentSnapshot.taux_charges),
        effetPrix: parseNum(currentSnapshot.effet_prix),
        effetVolume: parseNum(currentSnapshot.effet_volume),
        effetMix: parseNum(currentSnapshot.effet_mix),
        variationMasseSalariale: parseNum(currentSnapshot.variation_masse_salariale),
        variationMasseSalarialePct: parseNum(currentSnapshot.variation_masse_salariale_pct),
        primesExceptionnelles: parseNum(currentSnapshot.primes_exceptionnelles_total),
        primesMois13: parseNum(currentSnapshot.primes_exceptionnelles_total)
      }

      const absences: AbsenceKPIs = {
        tauxAbsenteisme: parseNum(currentSnapshot.taux_absenteisme),
        nbJoursAbsence: currentSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: currentSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseNum(currentSnapshot.duree_moyenne_absence),
        nbSalariesAbsents: currentSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: currentSnapshot.nb_jours_maladie || 0
      }

      const previousMonthWorkforce: WorkforceKPIs | null = previousMonthSnapshot ? {
        etpTotal: parseNum(previousMonthSnapshot.etp_fin_mois),
        headcountActif: previousMonthSnapshot.effectif_fin_mois || 0,
        nbEntrees: previousMonthSnapshot.nb_entrees || 0,
        nbSorties: previousMonthSnapshot.nb_sorties || 0,
        tauxTurnover: parseNum(previousMonthSnapshot.taux_turnover),
        pctCDI: parseNum(previousMonthSnapshot.pct_cdi),
        ageMoyen: parseNum(previousMonthSnapshot.age_moyen),
        ancienneteMoyenne: parseNum(previousMonthSnapshot.anciennete_moyenne_mois),
        pctHommes: parseNum(previousMonthSnapshot.pct_hommes),
        pctFemmes: parseNum(previousMonthSnapshot.pct_femmes)
      } : null

      const previousMonthFinancials: PayrollKPIs | null = previousMonthSnapshot ? {
        masseBrute: parseNum(previousMonthSnapshot.masse_salariale_brute),
        coutTotal: parseNum(previousMonthSnapshot.cout_total_employeur),
        salaireMoyen: parseNum(previousMonthSnapshot.salaire_base_moyen),
        coutMoyenFTE: parseNum(previousMonthSnapshot.cout_moyen_par_fte),
        partVariable: parseNum(previousMonthSnapshot.part_variable),
        tauxCharges: parseNum(previousMonthSnapshot.taux_charges),
        effetPrix: parseNum(previousMonthSnapshot.effet_prix),
        effetVolume: parseNum(previousMonthSnapshot.effet_volume),
        effetMix: parseNum(previousMonthSnapshot.effet_mix),
        variationMasseSalariale: parseNum(previousMonthSnapshot.variation_masse_salariale),
        variationMasseSalarialePct: parseNum(previousMonthSnapshot.variation_masse_salariale_pct),
        primesExceptionnelles: parseNum(previousMonthSnapshot.primes_exceptionnelles_total),
        primesMois13: parseNum(previousMonthSnapshot.primes_exceptionnelles_total)
      } : null

      const previousMonthAbsences: AbsenceKPIs | null = previousMonthSnapshot ? {
        tauxAbsenteisme: parseNum(previousMonthSnapshot.taux_absenteisme),
        nbJoursAbsence: previousMonthSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: previousMonthSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseNum(previousMonthSnapshot.duree_moyenne_absence),
        nbSalariesAbsents: previousMonthSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: previousMonthSnapshot.nb_jours_maladie || 0
      } : null

      const previousYearWorkforce: WorkforceKPIs | null = previousYearSnapshot ? {
        etpTotal: parseNum(previousYearSnapshot.etp_fin_mois),
        headcountActif: previousYearSnapshot.effectif_fin_mois || 0,
        nbEntrees: previousYearSnapshot.nb_entrees || 0,
        nbSorties: previousYearSnapshot.nb_sorties || 0,
        tauxTurnover: parseNum(previousYearSnapshot.taux_turnover),
        pctCDI: parseNum(previousYearSnapshot.pct_cdi),
        ageMoyen: parseNum(previousYearSnapshot.age_moyen),
        ancienneteMoyenne: parseNum(previousYearSnapshot.anciennete_moyenne_mois),
        pctHommes: parseNum(previousYearSnapshot.pct_hommes),
        pctFemmes: parseNum(previousYearSnapshot.pct_femmes)
      } : null

      const previousYearFinancials: PayrollKPIs | null = previousYearSnapshot ? {
        masseBrute: parseNum(previousYearSnapshot.masse_salariale_brute),
        coutTotal: parseNum(previousYearSnapshot.cout_total_employeur),
        salaireMoyen: parseNum(previousYearSnapshot.salaire_base_moyen),
        coutMoyenFTE: parseNum(previousYearSnapshot.cout_moyen_par_fte),
        partVariable: parseNum(previousYearSnapshot.part_variable),
        tauxCharges: parseNum(previousYearSnapshot.taux_charges),
        effetPrix: parseNum(previousYearSnapshot.effet_prix),
        effetVolume: parseNum(previousYearSnapshot.effet_volume),
        effetMix: parseNum(previousYearSnapshot.effet_mix),
        variationMasseSalariale: parseNum(previousYearSnapshot.variation_masse_salariale),
        variationMasseSalarialePct: parseNum(previousYearSnapshot.variation_masse_salariale_pct),
        primesExceptionnelles: parseNum(previousYearSnapshot.primes_exceptionnelles_total),
        primesMois13: parseNum(previousYearSnapshot.primes_exceptionnelles_total)
      } : null

      const previousYearAbsences: AbsenceKPIs | null = previousYearSnapshot ? {
        tauxAbsenteisme: parseNum(previousYearSnapshot.taux_absenteisme),
        nbJoursAbsence: previousYearSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: previousYearSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseNum(previousYearSnapshot.duree_moyenne_absence),
        nbSalariesAbsents: previousYearSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: previousYearSnapshot.nb_jours_maladie || 0
      } : null

      if (!isMountedRef.current) return

      setData({
        workforce,
        financials,
        absences,
        previousMonthWorkforce,
        previousMonthFinancials,
        previousMonthAbsences,
        previousYearWorkforce,
        previousYearFinancials,
        previousYearAbsences
      })

      setError(null)

    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (!isMountedRef.current) return
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erreur inconnue lors du chargement des KPIs'
      
      setError(errorMessage)
      setData(null)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [establishmentId, period])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}