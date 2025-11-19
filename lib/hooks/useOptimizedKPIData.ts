'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkforceKPIs {
  etpTotal: number
  headcountActif: number
  nbEntrees: number
  nbSorties: number
  tauxTurnover: number
  pctCDI: number
  ageMoyen: number
  ancienneteMoyenne: number
  pctHommes: number
  pctFemmes: number
}

interface PayrollKPIs {
  masseBrute: number
  coutTotal: number
  salaireMoyen: number
  coutMoyenFTE: number
  partVariable: number
  tauxCharges: number
  effetPrix: number
  effetVolume: number
  effetMix: number
  variationMasseSalariale: number
  variationMasseSalarialePct: number
  // ✅ AJOUT: Données pour analyse intelligente du waterfall
  primesExceptionnelles?: number
  primesMois13?: number
}

interface AbsenceKPIs {
  tauxAbsenteisme: number
  nbJoursAbsence: number
  nbAbsencesTotal: number
  dureeMoyenne: number
  nbSalariesAbsents: number
  nbJoursMaladie: number
}

interface KPIData {
  workforce: WorkforceKPIs | null
  financials: PayrollKPIs | null
  absences: AbsenceKPIs | null
  previousMonthFinancials: PayrollKPIs | null
  previousYearFinancials: PayrollKPIs | null
  previousMonthWorkforce: WorkforceKPIs | null
  previousYearWorkforce: WorkforceKPIs | null
  previousMonthAbsences: AbsenceKPIs | null
  previousYearAbsences: AbsenceKPIs | null
}

export const useOptimizedKPIData = (establishmentId: string, period: string) => {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const prevParamsRef = useRef({ establishmentId: '', period: '' })

  useEffect(() => {
    if (!establishmentId || !period) {
      setLoading(false)
      return
    }

    if (prevParamsRef.current.establishmentId === establishmentId && 
        prevParamsRef.current.period === period) {
      return
    }

    prevParamsRef.current = { establishmentId, period }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // ✅ CORRECTION: Normaliser la période au format YYYY-MM-01
        const normalizedPeriod = period.substring(0, 7) + '-01'
        const currentDate = new Date(normalizedPeriod)
        
        // Calculer les périodes de référence
        const previousMonthDate = new Date(currentDate)
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
        const previousMonthPeriod = previousMonthDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        const previousYearDate = new Date(currentDate)
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
        const previousYearPeriod = previousYearDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        // 🔍 DEBUG: Log des périodes calculées
        console.group('🔍 TALVIO - Chargement KPI Data')
        console.log('📅 Période actuelle:', normalizedPeriod)
        console.log('📅 Période M-1:', previousMonthPeriod)
        console.log('📅 Période N-1:', previousYearPeriod)
        console.log('🏢 Établissement ID:', establishmentId)

        // ✅ Requêtes optimisées avec Promise.all
        const [
          currentSnapshot,
          prevMonthSnapshot,
          prevYearSnapshot
        ] = await Promise.all([
          supabase
            .from('snapshots_mensuels')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', normalizedPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_mensuels')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousMonthPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_mensuels')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousYearPeriod)
            .maybeSingle()
        ])

        // Vérification des erreurs
        if (currentSnapshot.error) {
          console.error('❌ Erreur snapshot actuel:', currentSnapshot.error)
          throw currentSnapshot.error
        }

        if (prevMonthSnapshot.error) {
          console.warn('⚠️ Erreur snapshot M-1:', prevMonthSnapshot.error)
        }

        if (prevYearSnapshot.error) {
          console.warn('⚠️ Erreur snapshot N-1:', prevYearSnapshot.error)
        }

        const current = currentSnapshot.data
        const prevMonth = prevMonthSnapshot.data
        const prevYear = prevYearSnapshot.data

        // 🔍 DEBUG: Log des masses salariales récupérées
        console.log('💰 Masse salariale actuelle (M):', current?.masse_salariale_brute || 0)
        console.log('💰 Masse salariale M-1:', prevMonth?.masse_salariale_brute || 0)
        console.log('💰 Masse salariale N-1:', prevYear?.masse_salariale_brute || 0)
        
        if (current) {
          console.log('📊 Effet Prix:', current.effet_prix || 0)
          console.log('📊 Effet Volume:', current.effet_volume || 0)
          console.log('📊 Variation:', current.variation_masse_salariale || 0)
        }

        // ✅ Vérification cohérence waterfall
        if (current && prevMonth) {
          const calculatedVariation = (current.masse_salariale_brute || 0) - (prevMonth.masse_salariale_brute || 0)
          const storedVariation = current.variation_masse_salariale || 0
          const ecart = Math.abs(calculatedVariation - storedVariation)
          
          if (ecart > 100) {
            console.warn('⚠️ INCOHÉRENCE détectée!')
            console.warn('   Variation calculée:', calculatedVariation)
            console.warn('   Variation stockée:', storedVariation)
            console.warn('   Écart:', ecart)
            console.warn('   💡 Action requise: Exécuter calculate_payroll_effects_v3()')
          } else {
            console.log('✅ Cohérence waterfall validée (écart:', ecart, '€)')
          }
        }

        console.groupEnd()

        // Construction de l'objet KPIData
        if (current || prevMonth || prevYear) {
          setData({
            workforce: current ? {
              etpTotal: current.etp_fin_mois || 0,
              headcountActif: current.effectif_fin_mois || 0,
              nbEntrees: current.nb_entrees || 0,
              nbSorties: current.nb_sorties || 0,
              tauxTurnover: current.taux_turnover || 0,
              pctCDI: current.pct_cdi || 0,
              ageMoyen: current.age_moyen || 0,
              ancienneteMoyenne: current.anciennete_moyenne_mois || 0,
              pctHommes: current.pct_hommes || 0,
              pctFemmes: current.pct_femmes || 0
            } : null,
            
            financials: current ? {
              masseBrute: current.masse_salariale_brute || 0,
              coutTotal: current.cout_total_employeur || 0,
              salaireMoyen: current.salaire_base_moyen || 0,
              coutMoyenFTE: current.cout_moyen_par_fte || 0,
              partVariable: current.part_variable || 0,
              tauxCharges: current.taux_charges || 0,
              effetPrix: current.effet_prix || 0,
              effetVolume: current.effet_volume || 0,
              effetMix: current.effet_mix || 0,
              variationMasseSalariale: current.variation_masse_salariale || 0,
              variationMasseSalarialePct: current.variation_masse_salariale_pct || 0,
              // ✅ AJOUT: Primes pour analyse intelligente
              primesExceptionnelles: current.primes_exceptionnelles_total || 0,
              primesMois13: current.primes_exceptionnelles_total || 0 // À affiner selon vos données
            } : null,
            
            absences: current ? {
              tauxAbsenteisme: current.taux_absenteisme || 0,
              nbJoursAbsence: current.nb_jours_absence || 0,
              nbAbsencesTotal: current.nb_absences_total || 0,
              dureeMoyenne: current.duree_moyenne_absence || 0,
              nbSalariesAbsents: current.nb_salaries_absents || 0,
              nbJoursMaladie: current.nb_jours_maladie || 0
            } : null,
            
            previousMonthWorkforce: prevMonth ? {
              etpTotal: prevMonth.etp_fin_mois || 0,
              headcountActif: prevMonth.effectif_fin_mois || 0,
              nbEntrees: prevMonth.nb_entrees || 0,
              nbSorties: prevMonth.nb_sorties || 0,
              tauxTurnover: prevMonth.taux_turnover || 0,
              pctCDI: prevMonth.pct_cdi || 0,
              ageMoyen: prevMonth.age_moyen || 0,
              ancienneteMoyenne: prevMonth.anciennete_moyenne_mois || 0,
              pctHommes: prevMonth.pct_hommes || 0,
              pctFemmes: prevMonth.pct_femmes || 0
            } : null,
            
            previousYearWorkforce: prevYear ? {
              etpTotal: prevYear.etp_fin_mois || 0,
              headcountActif: prevYear.effectif_fin_mois || 0,
              nbEntrees: prevYear.nb_entrees || 0,
              nbSorties: prevYear.nb_sorties || 0,
              tauxTurnover: prevYear.taux_turnover || 0,
              pctCDI: prevYear.pct_cdi || 0,
              ageMoyen: prevYear.age_moyen || 0,
              ancienneteMoyenne: prevYear.anciennete_moyenne_mois || 0,
              pctHommes: prevYear.pct_hommes || 0,
              pctFemmes: prevYear.pct_femmes || 0
            } : null,
            
            previousMonthFinancials: prevMonth ? {
              masseBrute: prevMonth.masse_salariale_brute || 0,
              coutTotal: prevMonth.cout_total_employeur || 0,
              salaireMoyen: prevMonth.salaire_base_moyen || 0,
              coutMoyenFTE: prevMonth.cout_moyen_par_fte || 0,
              partVariable: prevMonth.part_variable || 0,
              tauxCharges: prevMonth.taux_charges || 0,
              effetPrix: prevMonth.effet_prix || 0,
              effetVolume: prevMonth.effet_volume || 0,
              effetMix: prevMonth.effet_mix || 0,
              variationMasseSalariale: prevMonth.variation_masse_salariale || 0,
              variationMasseSalarialePct: prevMonth.variation_masse_salariale_pct || 0,
              primesExceptionnelles: prevMonth.primes_exceptionnelles_total || 0,
              primesMois13: prevMonth.primes_exceptionnelles_total || 0
            } : null,
            
            previousYearFinancials: prevYear ? {
              masseBrute: prevYear.masse_salariale_brute || 0,
              coutTotal: prevYear.cout_total_employeur || 0,
              salaireMoyen: prevYear.salaire_base_moyen || 0,
              coutMoyenFTE: prevYear.cout_moyen_par_fte || 0,
              partVariable: prevYear.part_variable || 0,
              tauxCharges: prevYear.taux_charges || 0,
              effetPrix: prevYear.effet_prix || 0,
              effetVolume: prevYear.effet_volume || 0,
              effetMix: prevYear.effet_mix || 0,
              variationMasseSalariale: prevYear.variation_masse_salariale || 0,
              variationMasseSalarialePct: prevYear.variation_masse_salariale_pct || 0,
              primesExceptionnelles: prevYear.primes_exceptionnelles_total || 0,
              primesMois13: prevYear.primes_exceptionnelles_total || 0
            } : null,
            
            previousMonthAbsences: prevMonth ? {
              tauxAbsenteisme: prevMonth.taux_absenteisme || 0,
              nbJoursAbsence: prevMonth.nb_jours_absence || 0,
              nbAbsencesTotal: prevMonth.nb_absences_total || 0,
              dureeMoyenne: prevMonth.duree_moyenne_absence || 0,
              nbSalariesAbsents: prevMonth.nb_salaries_absents || 0,
              nbJoursMaladie: prevMonth.nb_jours_maladie || 0
            } : null,
            
            previousYearAbsences: prevYear ? {
              tauxAbsenteisme: prevYear.taux_absenteisme || 0,
              nbJoursAbsence: prevYear.nb_jours_absence || 0,
              nbAbsencesTotal: prevYear.nb_absences_total || 0,
              dureeMoyenne: prevYear.duree_moyenne_absence || 0,
              nbSalariesAbsents: prevYear.nb_salaries_absents || 0,
              nbJoursMaladie: prevYear.nb_jours_maladie || 0
            } : null
          })
        } else {
          console.warn('⚠️ Aucune donnée snapshot trouvée pour ces périodes')
          setData({ 
            workforce: null, 
            financials: null, 
            absences: null,
            previousMonthFinancials: null,
            previousYearFinancials: null,
            previousMonthWorkforce: null,
            previousYearWorkforce: null,
            previousMonthAbsences: null,
            previousYearAbsences: null
          })
        }

      } catch (err) {
        console.error('❌ Erreur fatale KPI fetch:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setData({ 
          workforce: null, 
          financials: null, 
          absences: null,
          previousMonthFinancials: null,
          previousYearFinancials: null,
          previousMonthWorkforce: null,
          previousYearWorkforce: null,
          previousMonthAbsences: null,
          previousYearAbsences: null
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [establishmentId, period, supabase])

  return { 
    data, 
    loading, 
    error,  
    historicalData: [],
    previousMonthData: data?.previousMonthWorkforce || null,
    previousYearData: data?.previousYearWorkforce || null
  }
}