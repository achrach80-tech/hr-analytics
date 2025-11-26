'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkforceKPIs, PayrollKPIs, AbsenceKPIs, KPIData } from '@/lib/types/dashboard'

interface UseOptimizedKPIDataResult {
  data: KPIData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * ✅ Hook KPI Data v4.0 - Simple SELECT queries (no RPC)
 * 
 * ARCHITECTURE v4.0:
 * - Backend API calculates ALL KPIs
 * - Database stores pre-calculated values
 * - Frontend reads via simple SELECT queries
 * - NO SQL functions/calculations
 * 
 * @param establishmentId UUID de l'établissement
 * @param period Période au format YYYY-MM-DD ou YYYY-MM-01
 */
export function useOptimizedKPIData(
  establishmentId: string,
  period: string
): UseOptimizedKPIDataResult {
  const [data, setData] = useState<KPIData | null>(null)
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

      // Normaliser la période au format YYYY-MM-01
      const normalizedPeriod = period.substring(0, 7) + '-01'
      
      // Calculer périodes de comparaison
      const currentDate = new Date(normalizedPeriod)
      
      const previousMonthDate = new Date(currentDate)
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
      const previousMonth = previousMonthDate.toISOString().substring(0, 7) + '-01'
      
      const previousYearDate = new Date(currentDate)
      previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
      const previousYear = previousYearDate.toISOString().substring(0, 7) + '-01'

      console.group('📊 TALVIO - KPI Data Fetch v4.0 (Pure SELECT)')
      console.log('📅 Période courante:', normalizedPeriod)
      console.log('📅 Mois précédent:', previousMonth)
      console.log('📅 Année précédente:', previousYear)
      console.log('🏢 Établissement:', establishmentId)

      // ============================================
      // SIMPLE SELECT - Get all 3 periods
      // ============================================
      const { data: snapshots, error: selectError } = await supabase
        .from('snapshots_mensuels')
        .select('*')
        .eq('etablissement_id', establishmentId)
        .in('periode', [normalizedPeriod, previousMonth, previousYear])

      if (selectError) {
        console.error('❌ Erreur SELECT snapshots:', selectError)
        throw new Error(`Erreur DB: ${selectError.message}`)
      }

      if (!snapshots || snapshots.length === 0) {
        console.warn('⚠️ Aucun snapshot trouvé')
        throw new Error(`Aucune donnée pour ${normalizedPeriod}`)
      }

      // ============================================
      // PARSE SNAPSHOTS
      // ============================================
      const currentSnapshot = snapshots.find(s => s.periode === normalizedPeriod)
      const previousMonthSnapshot = snapshots.find(s => s.periode === previousMonth)
      const previousYearSnapshot = snapshots.find(s => s.periode === previousYear)

      if (!currentSnapshot) {
        console.warn('⚠️ Snapshot courant manquant')
        throw new Error(`Snapshot manquant pour ${normalizedPeriod}`)
      }

      console.log('📊 Snapshots trouvés:')
      console.log('   Courant:', currentSnapshot ? '✅' : '❌')
      console.log('   Mois -1:', previousMonthSnapshot ? '✅' : '❌')
      console.log('   Année -1:', previousYearSnapshot ? '✅' : '❌')

      // ============================================
      // MAP TO TYPES - Current period
      // ============================================
      const workforce: WorkforceKPIs = {
        etpTotal: parseFloat(currentSnapshot.etp_fin_mois) || 0,
        headcountActif: currentSnapshot.effectif_fin_mois || 0,
        nbEntrees: currentSnapshot.nb_entrees || 0,
        nbSorties: currentSnapshot.nb_sorties || 0,
        tauxTurnover: parseFloat(currentSnapshot.taux_turnover) || 0,
        pctCDI: parseFloat(currentSnapshot.pct_cdi) || 0,
        ageMoyen: parseFloat(currentSnapshot.age_moyen) || 0,
        ancienneteMoyenne: parseFloat(currentSnapshot.anciennete_moyenne_mois) || 0,
        pctHommes: parseFloat(currentSnapshot.pct_hommes) || 0,
        pctFemmes: parseFloat(currentSnapshot.pct_femmes) || 0
      }

      const financials: PayrollKPIs = {
        masseBrute: parseFloat(currentSnapshot.masse_salariale_brute) || 0,
        coutTotal: parseFloat(currentSnapshot.cout_total_employeur) || 0,
        salaireMoyen: parseFloat(currentSnapshot.salaire_base_moyen) || 0,
        coutMoyenFTE: parseFloat(currentSnapshot.cout_moyen_par_fte) || 0,
        partVariable: parseFloat(currentSnapshot.part_variable) || 0,
        tauxCharges: parseFloat(currentSnapshot.taux_charges) || 0,
        effetPrix: parseFloat(currentSnapshot.effet_prix) || 0,
        effetVolume: parseFloat(currentSnapshot.effet_volume) || 0,
        effetMix: parseFloat(currentSnapshot.effet_mix) || 0,
        variationMasseSalariale: parseFloat(currentSnapshot.variation_masse_salariale) || 0,
        variationMasseSalarialePct: parseFloat(currentSnapshot.variation_masse_salariale_pct) || 0,
        primesExceptionnelles: parseFloat(currentSnapshot.primes_exceptionnelles_total) || 0,
        primesMois13: parseFloat(currentSnapshot.primes_exceptionnelles_total) || 0
      }

      const absences: AbsenceKPIs = {
        tauxAbsenteisme: parseFloat(currentSnapshot.taux_absenteisme) || 0,
        nbJoursAbsence: currentSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: currentSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseFloat(currentSnapshot.duree_moyenne_absence) || 0,
        nbSalariesAbsents: currentSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: currentSnapshot.nb_jours_maladie || 0
      }

      // ============================================
      // MAP TO TYPES - Previous month
      // ============================================
      const previousMonthWorkforce: WorkforceKPIs | null = previousMonthSnapshot ? {
        etpTotal: parseFloat(previousMonthSnapshot.etp_fin_mois) || 0,
        headcountActif: previousMonthSnapshot.effectif_fin_mois || 0,
        nbEntrees: previousMonthSnapshot.nb_entrees || 0,
        nbSorties: previousMonthSnapshot.nb_sorties || 0,
        tauxTurnover: parseFloat(previousMonthSnapshot.taux_turnover) || 0,
        pctCDI: parseFloat(previousMonthSnapshot.pct_cdi) || 0,
        ageMoyen: parseFloat(previousMonthSnapshot.age_moyen) || 0,
        ancienneteMoyenne: parseFloat(previousMonthSnapshot.anciennete_moyenne_mois) || 0,
        pctHommes: parseFloat(previousMonthSnapshot.pct_hommes) || 0,
        pctFemmes: parseFloat(previousMonthSnapshot.pct_femmes) || 0
      } : null

      const previousMonthFinancials: PayrollKPIs | null = previousMonthSnapshot ? {
        masseBrute: parseFloat(previousMonthSnapshot.masse_salariale_brute) || 0,
        coutTotal: parseFloat(previousMonthSnapshot.cout_total_employeur) || 0,
        salaireMoyen: parseFloat(previousMonthSnapshot.salaire_base_moyen) || 0,
        coutMoyenFTE: parseFloat(previousMonthSnapshot.cout_moyen_par_fte) || 0,
        partVariable: parseFloat(previousMonthSnapshot.part_variable) || 0,
        tauxCharges: parseFloat(previousMonthSnapshot.taux_charges) || 0,
        effetPrix: parseFloat(previousMonthSnapshot.effet_prix) || 0,
        effetVolume: parseFloat(previousMonthSnapshot.effet_volume) || 0,
        effetMix: parseFloat(previousMonthSnapshot.effet_mix) || 0,
        variationMasseSalariale: parseFloat(previousMonthSnapshot.variation_masse_salariale) || 0,
        variationMasseSalarialePct: parseFloat(previousMonthSnapshot.variation_masse_salariale_pct) || 0,
        primesExceptionnelles: parseFloat(previousMonthSnapshot.primes_exceptionnelles_total) || 0,
        primesMois13: parseFloat(previousMonthSnapshot.primes_exceptionnelles_total) || 0
      } : null

      const previousMonthAbsences: AbsenceKPIs | null = previousMonthSnapshot ? {
        tauxAbsenteisme: parseFloat(previousMonthSnapshot.taux_absenteisme) || 0,
        nbJoursAbsence: previousMonthSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: previousMonthSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseFloat(previousMonthSnapshot.duree_moyenne_absence) || 0,
        nbSalariesAbsents: previousMonthSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: previousMonthSnapshot.nb_jours_maladie || 0
      } : null

      // ============================================
      // MAP TO TYPES - Previous year
      // ============================================
      const previousYearWorkforce: WorkforceKPIs | null = previousYearSnapshot ? {
        etpTotal: parseFloat(previousYearSnapshot.etp_fin_mois) || 0,
        headcountActif: previousYearSnapshot.effectif_fin_mois || 0,
        nbEntrees: previousYearSnapshot.nb_entrees || 0,
        nbSorties: previousYearSnapshot.nb_sorties || 0,
        tauxTurnover: parseFloat(previousYearSnapshot.taux_turnover) || 0,
        pctCDI: parseFloat(previousYearSnapshot.pct_cdi) || 0,
        ageMoyen: parseFloat(previousYearSnapshot.age_moyen) || 0,
        ancienneteMoyenne: parseFloat(previousYearSnapshot.anciennete_moyenne_mois) || 0,
        pctHommes: parseFloat(previousYearSnapshot.pct_hommes) || 0,
        pctFemmes: parseFloat(previousYearSnapshot.pct_femmes) || 0
      } : null

      const previousYearFinancials: PayrollKPIs | null = previousYearSnapshot ? {
        masseBrute: parseFloat(previousYearSnapshot.masse_salariale_brute) || 0,
        coutTotal: parseFloat(previousYearSnapshot.cout_total_employeur) || 0,
        salaireMoyen: parseFloat(previousYearSnapshot.salaire_base_moyen) || 0,
        coutMoyenFTE: parseFloat(previousYearSnapshot.cout_moyen_par_fte) || 0,
        partVariable: parseFloat(previousYearSnapshot.part_variable) || 0,
        tauxCharges: parseFloat(previousYearSnapshot.taux_charges) || 0,
        effetPrix: parseFloat(previousYearSnapshot.effet_prix) || 0,
        effetVolume: parseFloat(previousYearSnapshot.effet_volume) || 0,
        effetMix: parseFloat(previousYearSnapshot.effet_mix) || 0,
        variationMasseSalariale: parseFloat(previousYearSnapshot.variation_masse_salariale) || 0,
        variationMasseSalarialePct: parseFloat(previousYearSnapshot.variation_masse_salariale_pct) || 0,
        primesExceptionnelles: parseFloat(previousYearSnapshot.primes_exceptionnelles_total) || 0,
        primesMois13: parseFloat(previousYearSnapshot.primes_exceptionnelles_total) || 0
      } : null

      const previousYearAbsences: AbsenceKPIs | null = previousYearSnapshot ? {
        tauxAbsenteisme: parseFloat(previousYearSnapshot.taux_absenteisme) || 0,
        nbJoursAbsence: previousYearSnapshot.nb_jours_absence || 0,
        nbAbsencesTotal: previousYearSnapshot.nb_absences_total || 0,
        dureeMoyenne: parseFloat(previousYearSnapshot.duree_moyenne_absence) || 0,
        nbSalariesAbsents: previousYearSnapshot.nb_salaries_absents || 0,
        nbJoursMaladie: previousYearSnapshot.nb_jours_maladie || 0
      } : null

      console.log('✅ Données parsées avec succès')
      console.groupEnd()

      // ============================================
      // RETURN COMPLETE KPI DATA
      // ============================================
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

    } catch (err) {
      console.error('❌ Erreur fatale KPI fetch:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des données KPI'
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