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

        // Calculer les périodes M-1 et N-1
        const currentDate = new Date(period)
        
        const previousMonthDate = new Date(currentDate)
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
        const previousMonthPeriod = previousMonthDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        const previousYearDate = new Date(currentDate)
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
        const previousYearPeriod = previousYearDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        // Récupérer les 3 snapshots en parallèle
        const [currentResult, previousMonthResult, previousYearResult] = await Promise.all([
          supabase
            .from('snapshots_mensuels')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
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

        if (currentResult.error) {
          console.error('Current snapshot error:', currentResult.error)
          throw currentResult.error
        }

        const snapshot = currentResult.data
        const previousMonthSnapshot = previousMonthResult.data
        const previousYearSnapshot = previousYearResult.data

        if (snapshot) {
          setData({
            workforce: {
              etpTotal: snapshot.etp_fin_mois || 0,
              headcountActif: snapshot.effectif_fin_mois || 0,
              nbEntrees: snapshot.nb_entrees || 0,
              nbSorties: snapshot.nb_sorties || 0,
              tauxTurnover: snapshot.taux_turnover || 0,
              pctCDI: snapshot.pct_cdi || 0,
              ageMoyen: snapshot.age_moyen || 0,
              ancienneteMoyenne: snapshot.anciennete_moyenne_mois || 0,
              pctHommes: snapshot.pct_hommes || 0,
              pctFemmes: snapshot.pct_femmes || 0
            },
            financials: {
              masseBrute: snapshot.masse_salariale_brute || 0,
              coutTotal: snapshot.cout_total_employeur || 0,
              salaireMoyen: snapshot.salaire_base_moyen || 0,
              coutMoyenFTE: snapshot.cout_moyen_par_fte || 0,
              partVariable: snapshot.part_variable || 0,
              tauxCharges: snapshot.taux_charges || 0,
              effetPrix: snapshot.effet_prix || 0,
              effetVolume: snapshot.effet_volume || 0,
              effetMix: snapshot.effet_mix || 0,
              variationMasseSalariale: snapshot.variation_masse_salariale || 0,
              variationMasseSalarialePct: snapshot.variation_masse_salariale_pct || 0
            },
            absences: {
              tauxAbsenteisme: snapshot.taux_absenteisme || 0,
              nbJoursAbsence: snapshot.nb_jours_absence || 0,
              nbAbsencesTotal: snapshot.nb_absences_total || 0,
              dureeMoyenne: snapshot.duree_moyenne_absence || 0,
              nbSalariesAbsents: snapshot.nb_salaries_absents || 0,
              nbJoursMaladie: snapshot.nb_jours_maladie || 0
            },
            previousMonthFinancials: previousMonthSnapshot ? {
              masseBrute: previousMonthSnapshot.masse_salariale_brute || 0,
              coutTotal: previousMonthSnapshot.cout_total_employeur || 0,
              salaireMoyen: previousMonthSnapshot.salaire_base_moyen || 0,
              coutMoyenFTE: previousMonthSnapshot.cout_moyen_par_fte || 0,
              partVariable: previousMonthSnapshot.part_variable || 0,
              tauxCharges: previousMonthSnapshot.taux_charges || 0,
              effetPrix: previousMonthSnapshot.effet_prix || 0,
              effetVolume: previousMonthSnapshot.effet_volume || 0,
              effetMix: previousMonthSnapshot.effet_mix || 0,
              variationMasseSalariale: previousMonthSnapshot.variation_masse_salariale || 0,
              variationMasseSalarialePct: previousMonthSnapshot.variation_masse_salariale_pct || 0
            } : null,
            previousYearFinancials: previousYearSnapshot ? {
              masseBrute: previousYearSnapshot.masse_salariale_brute || 0,
              coutTotal: previousYearSnapshot.cout_total_employeur || 0,
              salaireMoyen: previousYearSnapshot.salaire_base_moyen || 0,
              coutMoyenFTE: previousYearSnapshot.cout_moyen_par_fte || 0,
              partVariable: previousYearSnapshot.part_variable || 0,
              tauxCharges: previousYearSnapshot.taux_charges || 0,
              effetPrix: previousYearSnapshot.effet_prix || 0,
              effetVolume: previousYearSnapshot.effet_volume || 0,
              effetMix: previousYearSnapshot.effet_mix || 0,
              variationMasseSalariale: previousYearSnapshot.variation_masse_salariale || 0,
              variationMasseSalarialePct: previousYearSnapshot.variation_masse_salariale_pct || 0
            } : null,
            previousMonthWorkforce: previousMonthSnapshot ? {
              etpTotal: previousMonthSnapshot.etp_fin_mois || 0,
              headcountActif: previousMonthSnapshot.effectif_fin_mois || 0,
              nbEntrees: previousMonthSnapshot.nb_entrees || 0,
              nbSorties: previousMonthSnapshot.nb_sorties || 0,
              tauxTurnover: previousMonthSnapshot.taux_turnover || 0,
              pctCDI: previousMonthSnapshot.pct_cdi || 0,
              ageMoyen: previousMonthSnapshot.age_moyen || 0,
              ancienneteMoyenne: previousMonthSnapshot.anciennete_moyenne_mois || 0,
              pctHommes: previousMonthSnapshot.pct_hommes || 0,
              pctFemmes: previousMonthSnapshot.pct_femmes || 0
            } : null,
            previousYearWorkforce: previousYearSnapshot ? {
              etpTotal: previousYearSnapshot.etp_fin_mois || 0,
              headcountActif: previousYearSnapshot.effectif_fin_mois || 0,
              nbEntrees: previousYearSnapshot.nb_entrees || 0,
              nbSorties: previousYearSnapshot.nb_sorties || 0,
              tauxTurnover: previousYearSnapshot.taux_turnover || 0,
              pctCDI: previousYearSnapshot.pct_cdi || 0,
              ageMoyen: previousYearSnapshot.age_moyen || 0,
              ancienneteMoyenne: previousYearSnapshot.anciennete_moyenne_mois || 0,
              pctHommes: previousYearSnapshot.pct_hommes || 0,
              pctFemmes: previousYearSnapshot.pct_femmes || 0
            } : null
          })
        } else {
          setData({ 
            workforce: null, 
            financials: null, 
            absences: null,
            previousMonthFinancials: null,
            previousYearFinancials: null,
            previousMonthWorkforce: null,
            previousYearWorkforce: null
          })
        }
        console.log('🔍 DEBUG Payroll:')
console.log('Current period:', period)
console.log('Previous month period:', previousMonthPeriod)
console.log('Previous year period:', previousYearPeriod)
console.log('Current masse brute:', snapshot?.masse_salariale_brute)
console.log('Previous month masse brute:', previousMonthSnapshot?.masse_salariale_brute)
console.log('Previous year masse brute:', previousYearSnapshot?.masse_salariale_brute)

      } catch (err) {
        console.error('KPI fetch error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setData({ 
          workforce: null, 
          financials: null, 
          absences: null,
          previousMonthFinancials: null,
          previousYearFinancials: null,
          previousMonthWorkforce: null,
          previousYearWorkforce: null
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