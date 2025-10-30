// lib/hooks/useOptimizedKPIData.ts
// FIXED: Proper data loading with company context

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient, getCompanyId } from '@/lib/supabase/client'

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
    // Reset if no params
    if (!establishmentId || !period) {
      setLoading(false)
      setData(null)
      return
    }

    // CRITICAL FIX: Check company authentication
    const companyId = getCompanyId()
    if (!companyId) {
      setError('Non authentifié - veuillez vous reconnecter')
      setLoading(false)
      return
    }

    // Skip if same params
    if (prevParamsRef.current.establishmentId === establishmentId && 
        prevParamsRef.current.period === period) {
      return
    }

    prevParamsRef.current = { establishmentId, period }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // CRITICAL FIX: Verify establishment belongs to company
        const { data: establishment, error: estError } = await supabase
          .from('etablissements')
          .select('entreprise_id')
          .eq('id', establishmentId)
          .single()

        if (estError || !establishment) {
          throw new Error('Établissement non trouvé')
        }

        if (establishment.entreprise_id !== companyId) {
          throw new Error('Accès non autorisé à cet établissement')
        }

        // Calculate comparison periods
        const currentDate = new Date(period)
        
        const previousMonthDate = new Date(currentDate)
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
        const previousMonthPeriod = previousMonthDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        const previousYearDate = new Date(currentDate)
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1)
        const previousYearPeriod = previousYearDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        // OPTIMIZATION: Parallel queries with proper error handling
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
        ] = await Promise.allSettled([
          // Current period
          supabase
            .from('snapshots_workforce')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle(),
          
          supabase
            .from('snapshots_financials')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle(),
          
          supabase
            .from('snapshots_absences')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', period)
            .maybeSingle(),
          
          // Previous month
          supabase
            .from('snapshots_workforce')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousMonthPeriod)
            .maybeSingle(),
          
          // Previous year
          supabase
            .from('snapshots_workforce')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousYearPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_financials')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousMonthPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_financials')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousYearPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_absences')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousMonthPeriod)
            .maybeSingle(),
          
          supabase
            .from('snapshots_absences')
            .select('*')
            .eq('etablissement_id', establishmentId)
            .eq('periode', previousYearPeriod)
            .maybeSingle()
        ])

        // Extract data from settled promises
        const workforce = workforceResult.status === 'fulfilled' ? workforceResult.value.data : null
        const financials = financialsResult.status === 'fulfilled' ? financialsResult.value.data : null
        const absences = absencesResult.status === 'fulfilled' ? absencesResult.value.data : null
        const prevMonthWorkforce = prevMonthWorkforceResult.status === 'fulfilled' ? prevMonthWorkforceResult.value.data : null
        const prevYearWorkforce = prevYearWorkforceResult.status === 'fulfilled' ? prevYearWorkforceResult.value.data : null
        const prevMonthFinancials = prevMonthFinancialsResult.status === 'fulfilled' ? prevMonthFinancialsResult.value.data : null
        const prevYearFinancials = prevYearFinancialsResult.status === 'fulfilled' ? prevYearFinancialsResult.value.data : null
        const prevMonthAbsences = prevMonthAbsencesResult.status === 'fulfilled' ? prevMonthAbsencesResult.value.data : null
        const prevYearAbsences = prevYearAbsencesResult.status === 'fulfilled' ? prevYearAbsencesResult.value.data : null

        // Log any errors but don't fail
        if (workforceResult.status === 'rejected') {
          console.warn('Workforce snapshot error:', workforceResult.reason)
        }
        if (financialsResult.status === 'rejected') {
          console.warn('Financials snapshot error:', financialsResult.reason)
        }
        if (absencesResult.status === 'rejected') {
          console.warn('Absences snapshot error:', absencesResult.reason)
        }

        // Build response data
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
          
          previousMonthWorkforce: prevMonthWorkforce ? {
            etpTotal: prevMonthWorkforce.etp_fin_mois || 0,
            headcountActif: prevMonthWorkforce.effectif_fin_mois || 0,
            nbEntrees: prevMonthWorkforce.nb_entrees || 0,
            nbSorties: prevMonthWorkforce.nb_sorties || 0,
            tauxTurnover: prevMonthWorkforce.taux_turnover || 0,
            pctCDI: prevMonthWorkforce.pct_cdi || 0,
            ageMoyen: prevMonthWorkforce.age_moyen || 0,
            ancienneteMoyenne: prevMonthWorkforce.anciennete_moyenne_mois || 0,
            pctHommes: prevMonthWorkforce.pct_hommes || 0,
            pctFemmes: prevMonthWorkforce.pct_femmes || 0
          } : null,
          
          previousYearWorkforce: prevYearWorkforce ? {
            etpTotal: prevYearWorkforce.etp_fin_mois || 0,
            headcountActif: prevYearWorkforce.effectif_fin_mois || 0,
            nbEntrees: prevYearWorkforce.nb_entrees || 0,
            nbSorties: prevYearWorkforce.nb_sorties || 0,
            tauxTurnover: prevYearWorkforce.taux_turnover || 0,
            pctCDI: prevYearWorkforce.pct_cdi || 0,
            ageMoyen: prevYearWorkforce.age_moyen || 0,
            ancienneteMoyenne: prevYearWorkforce.anciennete_moyenne_mois || 0,
            pctHommes: prevYearWorkforce.pct_hommes || 0,
            pctFemmes: prevYearWorkforce.pct_femmes || 0
          } : null,
          
          previousMonthFinancials: prevMonthFinancials ? {
            masseBrute: prevMonthFinancials.masse_salariale_brute || 0,
            coutTotal: prevMonthFinancials.cout_total_employeur || 0,
            salaireMoyen: prevMonthFinancials.salaire_base_moyen || 0,
            coutMoyenFTE: prevMonthFinancials.cout_moyen_par_fte || 0,
            partVariable: prevMonthFinancials.part_variable || 0,
            tauxCharges: prevMonthFinancials.taux_charges || 0,
            effetPrix: prevMonthFinancials.effet_prix || 0,
            effetVolume: prevMonthFinancials.effet_volume || 0,
            effetMix: prevMonthFinancials.effet_mix || 0,
            variationMasseSalariale: prevMonthFinancials.variation_masse_salariale || 0,
            variationMasseSalarialePct: prevMonthFinancials.variation_masse_salariale_pct || 0
          } : null,
          
          previousYearFinancials: prevYearFinancials ? {
            masseBrute: prevYearFinancials.masse_salariale_brute || 0,
            coutTotal: prevYearFinancials.cout_total_employeur || 0,
            salaireMoyen: prevYearFinancials.salaire_base_moyen || 0,
            coutMoyenFTE: prevYearFinancials.cout_moyen_par_fte || 0,
            partVariable: prevYearFinancials.part_variable || 0,
            tauxCharges: prevYearFinancials.taux_charges || 0,
            effetPrix: prevYearFinancials.effet_prix || 0,
            effetVolume: prevYearFinancials.effet_volume || 0,
            effetMix: prevYearFinancials.effet_mix || 0,
            variationMasseSalariale: prevYearFinancials.variation_masse_salariale || 0,
            variationMasseSalarialePct: prevYearFinancials.variation_masse_salariale_pct || 0
          } : null,
          
          previousMonthAbsences: prevMonthAbsences ? {
            tauxAbsenteisme: prevMonthAbsences.taux_absenteisme || 0,
            nbJoursAbsence: prevMonthAbsences.nb_jours_absence || 0,
            nbAbsencesTotal: prevMonthAbsences.nb_absences_total || 0,
            dureeMoyenne: prevMonthAbsences.duree_moyenne_absence || 0,
            nbSalariesAbsents: prevMonthAbsences.nb_salaries_absents || 0,
            nbJoursMaladie: prevMonthAbsences.nb_jours_maladie || 0
          } : null,
          
          previousYearAbsences: prevYearAbsences ? {
            tauxAbsenteisme: prevYearAbsences.taux_absenteisme || 0,
            nbJoursAbsence: prevYearAbsences.nb_jours_absence || 0,
            nbAbsencesTotal: prevYearAbsences.nb_absences_total || 0,
            dureeMoyenne: prevYearAbsences.duree_moyenne_absence || 0,
            nbSalariesAbsents: prevYearAbsences.nb_salaries_absents || 0,
            nbJoursMaladie: prevYearAbsences.nb_jours_maladie || 0
          } : null
        })

      } catch (err) {
        console.error('KPI fetch error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement'
        setError(errorMessage)
        
        // Set empty data structure on error
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