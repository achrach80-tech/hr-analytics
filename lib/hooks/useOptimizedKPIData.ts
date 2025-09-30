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

        // Calculer la période précédente
        const currentDate = new Date(period)
        const previousDate = new Date(currentDate)
        previousDate.setMonth(previousDate.getMonth() - 1)
        const previousPeriod = previousDate.toISOString().split('T')[0].substring(0, 7) + '-01'

        // Récupérer snapshot actuel et précédent
        const [currentResult, previousResult] = await Promise.all([
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
            .eq('periode', previousPeriod)
            .maybeSingle()
        ])

        if (currentResult.error) {
          console.error('Current snapshot error:', currentResult.error)
          throw currentResult.error
        }

        const snapshot = currentResult.data
        const previousSnapshot = previousResult.data

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
            previousMonthFinancials: previousSnapshot ? {
              masseBrute: previousSnapshot.masse_salariale_brute || 0,
              coutTotal: previousSnapshot.cout_total_employeur || 0,
              salaireMoyen: previousSnapshot.salaire_base_moyen || 0,
              coutMoyenFTE: previousSnapshot.cout_moyen_par_fte || 0,
              partVariable: previousSnapshot.part_variable || 0,
              tauxCharges: previousSnapshot.taux_charges || 0,
              effetPrix: previousSnapshot.effet_prix || 0,
              effetVolume: previousSnapshot.effet_volume || 0,
              effetMix: previousSnapshot.effet_mix || 0,
              variationMasseSalariale: previousSnapshot.variation_masse_salariale || 0,
              variationMasseSalarialePct: previousSnapshot.variation_masse_salariale_pct || 0
            } : null
          })
        } else {
          setData({ 
            workforce: null, 
            financials: null, 
            absences: null,
            previousMonthFinancials: null 
          })
        }

      } catch (err) {
        console.error('KPI fetch error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setData({ 
          workforce: null, 
          financials: null, 
          absences: null,
          previousMonthFinancials: null 
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
    previousMonthData: data?.previousMonthFinancials || null, // ✅ Correction
    previousYearData: null  
  }
}