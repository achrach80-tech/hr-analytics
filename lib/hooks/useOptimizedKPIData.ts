'use client'

import { useState, useEffect } from 'react'
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
}

export const useOptimizedKPIData = (establishmentId: string, period: string) => {
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!establishmentId || !period) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use the unified snapshots_mensuels table
        const { data: snapshot, error } = await supabase
          .from('snapshots_mensuels')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('periode', period)
          .maybeSingle()

        if (error) throw error

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
              tauxCharges: snapshot.taux_charges || 0
            },
            absences: {
              tauxAbsenteisme: snapshot.taux_absenteisme || 0,
              nbJoursAbsence: snapshot.nb_jours_absence || 0,
              nbAbsencesTotal: snapshot.nb_absences_total || 0,
              dureeMoyenne: snapshot.duree_moyenne_absence || 0,
              nbSalariesAbsents: snapshot.nb_salaries_absents || 0,
              nbJoursMaladie: snapshot.nb_jours_maladie || 0
            }
          })
        } else {
          setData({ workforce: null, financials: null, absences: null })
        }

      } catch (err) {
        console.error('KPI fetch error:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [establishmentId, period, supabase])

  return { data, loading, error }
}