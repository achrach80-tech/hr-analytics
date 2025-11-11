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

        const currentDate = new Date(period)
        
        const previousMonthDate = new Date(currentDate)
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
        const previousMonthPeriod = previousMonthDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        const previousYearDate = new Date(currentDate)
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
        const previousYearPeriod = previousYearDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        // ✅ NOUVELLE MÉTHODE : 3 requêtes séparées au lieu d'1
        const [
          workforceResult,
          financialsResult, 
          absencesResult,
          prevMonthWorkforceResult,
          prevYearWorkforceResult,
          prevMonthFinancialsResult,
          prevYearFinancialsResult,
          prevMonthAbsencesResult,
          prevYearAbsencesResult
        ] = await Promise.all([
          // Période actuelle
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', period).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', period).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', period).maybeSingle(),
          
          // Mois précédent
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousMonthPeriod).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousYearPeriod).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousMonthPeriod).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousYearPeriod).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousMonthPeriod).maybeSingle(),
          supabase.from('snapshots_mensuels').select('*').eq('etablissement_id', establishmentId).eq('periode', previousYearPeriod).maybeSingle()
        ])

        if (workforceResult.error) {
          console.error('Workforce snapshot error:', workforceResult.error)
          throw workforceResult.error
        }

        const workforce = workforceResult.data
        const financials = financialsResult.data
        const absences = absencesResult.data

        if (workforce || financials || absences) {
          setData({
            workforce: workforce ? {
              etpTotal: workforce.etp_fin_mois || 0,
              headcountActif: workforce.effectif_fin_mois || 0,
              nbEntrees: workforce.nb_entrees || 0,
              nbSorties: workforce.nb_sorties || 0,
              tauxTurnover: workforce.taux_turnover || 0,
              pctCDI: workforce.pct_cdi || 0,
              ageMoyen: workforce.age_moyen || 0,
              ancienneteMoyenne: workforce.anciennete_moyenne_mois || 0,
              pctHommes: workforce.pct_hommes || 0,
              pctFemmes: workforce.pct_femmes || 0
            } : null,
            
            financials: financials ? {
              masseBrute: financials.masse_salariale_brute || 0,
              coutTotal: financials.cout_total_employeur || 0,
              salaireMoyen: financials.salaire_base_moyen || 0,
              coutMoyenFTE: financials.cout_moyen_par_fte || 0,
              partVariable: financials.part_variable || 0,
              tauxCharges: financials.taux_charges || 0,
              effetPrix: financials.effet_prix || 0,
              effetVolume: financials.effet_volume || 0,
              effetMix: financials.effet_mix || 0,
              variationMasseSalariale: financials.variation_masse_salariale || 0,
              variationMasseSalarialePct: financials.variation_masse_salariale_pct || 0
            } : null,
            
            absences: absences ? {
              tauxAbsenteisme: absences.taux_absenteisme || 0,
              nbJoursAbsence: absences.nb_jours_absence || 0,
              nbAbsencesTotal: absences.nb_absences_total || 0,
              dureeMoyenne: absences.duree_moyenne_absence || 0,
              nbSalariesAbsents: absences.nb_salaries_absents || 0,
              nbJoursMaladie: absences.nb_jours_maladie || 0
            } : null,
            
            previousMonthWorkforce: prevMonthWorkforceResult.data ? {
              etpTotal: prevMonthWorkforceResult.data.etp_fin_mois || 0,
              headcountActif: prevMonthWorkforceResult.data.effectif_fin_mois || 0,
              nbEntrees: prevMonthWorkforceResult.data.nb_entrees || 0,
              nbSorties: prevMonthWorkforceResult.data.nb_sorties || 0,
              tauxTurnover: prevMonthWorkforceResult.data.taux_turnover || 0,
              pctCDI: prevMonthWorkforceResult.data.pct_cdi || 0,
              ageMoyen: prevMonthWorkforceResult.data.age_moyen || 0,
              ancienneteMoyenne: prevMonthWorkforceResult.data.anciennete_moyenne_mois || 0,
              pctHommes: prevMonthWorkforceResult.data.pct_hommes || 0,
              pctFemmes: prevMonthWorkforceResult.data.pct_femmes || 0
            } : null,
            
            previousYearWorkforce: prevYearWorkforceResult.data ? {
              etpTotal: prevYearWorkforceResult.data.etp_fin_mois || 0,
              headcountActif: prevYearWorkforceResult.data.effectif_fin_mois || 0,
              nbEntrees: prevYearWorkforceResult.data.nb_entrees || 0,
              nbSorties: prevYearWorkforceResult.data.nb_sorties || 0,
              tauxTurnover: prevYearWorkforceResult.data.taux_turnover || 0,
              pctCDI: prevYearWorkforceResult.data.pct_cdi || 0,
              ageMoyen: prevYearWorkforceResult.data.age_moyen || 0,
              ancienneteMoyenne: prevYearWorkforceResult.data.anciennete_moyenne_mois || 0,
              pctHommes: prevYearWorkforceResult.data.pct_hommes || 0,
              pctFemmes: prevYearWorkforceResult.data.pct_femmes || 0
            } : null,
            
            previousMonthFinancials: prevMonthFinancialsResult.data ? {
              masseBrute: prevMonthFinancialsResult.data.masse_salariale_brute || 0,
              coutTotal: prevMonthFinancialsResult.data.cout_total_employeur || 0,
              salaireMoyen: prevMonthFinancialsResult.data.salaire_base_moyen || 0,
              coutMoyenFTE: prevMonthFinancialsResult.data.cout_moyen_par_fte || 0,
              partVariable: prevMonthFinancialsResult.data.part_variable || 0,
              tauxCharges: prevMonthFinancialsResult.data.taux_charges || 0,
              effetPrix: prevMonthFinancialsResult.data.effet_prix || 0,
              effetVolume: prevMonthFinancialsResult.data.effet_volume || 0,
              effetMix: prevMonthFinancialsResult.data.effet_mix || 0,
              variationMasseSalariale: prevMonthFinancialsResult.data.variation_masse_salariale || 0,
              variationMasseSalarialePct: prevMonthFinancialsResult.data.variation_masse_salariale_pct || 0
            } : null,
            
            previousYearFinancials: prevYearFinancialsResult.data ? {
              masseBrute: prevYearFinancialsResult.data.masse_salariale_brute || 0,
              coutTotal: prevYearFinancialsResult.data.cout_total_employeur || 0,
              salaireMoyen: prevYearFinancialsResult.data.salaire_base_moyen || 0,
              coutMoyenFTE: prevYearFinancialsResult.data.cout_moyen_par_fte || 0,
              partVariable: prevYearFinancialsResult.data.part_variable || 0,
              tauxCharges: prevYearFinancialsResult.data.taux_charges || 0,
              effetPrix: prevYearFinancialsResult.data.effet_prix || 0,
              effetVolume: prevYearFinancialsResult.data.effet_volume || 0,
              effetMix: prevYearFinancialsResult.data.effet_mix || 0,
              variationMasseSalariale: prevYearFinancialsResult.data.variation_masse_salariale || 0,
              variationMasseSalarialePct: prevYearFinancialsResult.data.variation_masse_salariale_pct || 0
            } : null,
            
            previousMonthAbsences: prevMonthAbsencesResult.data ? {
              tauxAbsenteisme: prevMonthAbsencesResult.data.taux_absenteisme || 0,
              nbJoursAbsence: prevMonthAbsencesResult.data.nb_jours_absence || 0,
              nbAbsencesTotal: prevMonthAbsencesResult.data.nb_absences_total || 0,
              dureeMoyenne: prevMonthAbsencesResult.data.duree_moyenne_absence || 0,
              nbSalariesAbsents: prevMonthAbsencesResult.data.nb_salaries_absents || 0,
              nbJoursMaladie: prevMonthAbsencesResult.data.nb_jours_maladie || 0
            } : null,
            
            previousYearAbsences: prevYearAbsencesResult.data ? {
              tauxAbsenteisme: prevYearAbsencesResult.data.taux_absenteisme || 0,
              nbJoursAbsence: prevYearAbsencesResult.data.nb_jours_absence || 0,
              nbAbsencesTotal: prevYearAbsencesResult.data.nb_absences_total || 0,
              dureeMoyenne: prevYearAbsencesResult.data.duree_moyenne_absence || 0,
              nbSalariesAbsents: prevYearAbsencesResult.data.nb_salaries_absents || 0,
              nbJoursMaladie: prevYearAbsencesResult.data.nb_jours_maladie || 0
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
            previousYearWorkforce: null,
            previousMonthAbsences: null,
            previousYearAbsences: null
          })
        }

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