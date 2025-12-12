import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardData {
  workforce: {
    etpTotal: number
    etpActif: number
    etpInactif: number
    variationM1Pct: number
    variationN1Pct: number
    tauxTurnover: number
    entreesMois: number
    sortiesMois: number
    turnoverMensuel: number
  }
  payroll: {
    masseSalariale: number
    coutMoyen: number
    variationM1Pct: number
    variationN1Pct: number
    waterfallM1: {
      effectifDebut: number
      entrees: { value: number; label: string }
      sorties: { value: number; label: string }
      effetPrix: { value: number; label: string }
      effetVolume: { value: number; label: string }
      effectifFin: number
    } | null
    waterfallN1: {
      effectifDebut: number
      entrees: { value: number; label: string }
      sorties: { value: number; label: string }
      effetPrix: { value: number; label: string }
      effetVolume: { value: number; label: string }
      effectifFin: number
    } | null
  }
  absences: {
    tauxAbsenteisme: number
    joursAbsences: number
    joursConges: number
  }
  demographics: {
    ageGroups: Array<{
      range: string
      hommes: number
      femmes: number
    }>
    seniorityGroups: Array<{
      range: string
      hommes: number
      femmes: number
    }>
  }
}

export function useDashboardData(etablissementId: string, periode: string) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const { data: snapshotData, error: snapshotError } = await supabase
          .rpc('calculate_snapshot_for_period', {
            p_etablissement_id: etablissementId,
            p_periode: periode
          })

        if (snapshotError) throw snapshotError

        if (!snapshotData || snapshotData.length === 0) {
          throw new Error('Aucune donnée disponible pour cette période')
        }

        const snapshot = snapshotData[0]

        const { data: demographicsData, error: demoError } = await supabase
          .from('demographics_snapshots')
          .select('*')
          .eq('etablissement_id', etablissementId)
          .eq('periode', periode)
          .single()

        if (demoError) console.error('Erreur chargement démographie:', demoError)

        const dashboardData: DashboardData = {
          workforce: {
            etpTotal: snapshot.effectif_moyen || 0,
            etpActif: snapshot.effectif_actif || 0,
            etpInactif: (snapshot.effectif_moyen || 0) - (snapshot.effectif_actif || 0),
            variationM1Pct: snapshot.variation_effectif_m1_pct || 0,
            variationN1Pct: snapshot.variation_effectif_n1_pct || 0,
            tauxTurnover: snapshot.taux_turnover || 0,
            entreesMois: snapshot.entrees || 0,
            sortiesMois: snapshot.sorties || 0,
            turnoverMensuel: ((snapshot.entrees || 0) + (snapshot.sorties || 0)) / 2 / (snapshot.effectif_moyen || 1) * 100
          },
          payroll: {
            masseSalariale: snapshot.masse_salariale_totale || 0,
            coutMoyen: (snapshot.masse_salariale_totale || 0) / (snapshot.effectif_moyen || 1),
            variationM1Pct: snapshot.variation_masse_m1_pct || 0,
            variationN1Pct: snapshot.variation_masse_n1_pct || 0,
            waterfallM1: snapshot.waterfall_m1 || null,
            waterfallN1: snapshot.waterfall_n1 || null
          },
          absences: {
            tauxAbsenteisme: snapshot.taux_absenteisme || 0,
            joursAbsences: snapshot.jours_absences || 0,
            joursConges: snapshot.jours_conges || 0
          },
          demographics: {
            ageGroups: demographicsData?.age_groups || [],
            seniorityGroups: demographicsData?.seniority_groups || []
          }
        }

        setData(dashboardData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
        console.error('Erreur useDashboardData:', err)
      } finally {
        setLoading(false)
      }
    }

    if (etablissementId && periode) {
      loadData()
    }
  }, [etablissementId, periode])

  return { data, loading, error }
}