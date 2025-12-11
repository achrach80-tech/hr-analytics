// Path: lib/hooks/useVisionData.ts
// lib/hooks/useVisionData.ts
// Hook simplifié pour charger les données des visions

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    waterfallM1: any | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    waterfallN1: any | null
  }
  absences: {
    tauxAbsenteisme: number
    joursAbsences: number
    joursConges: number
  }
  demographics: {
    ageGroups: Array<any>
    seniorityGroups: Array<any>
  }
}

export function useVisionData(etablissementId: string, periode: string) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!etablissementId || !periode) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('📊 Chargement données:', { etablissementId, periode })

        const supabase = createClient()

        // ✅ Charger depuis snapshots_mensuels (comme le Dashboard)
        const { data: snapshot, error: snapError } = await supabase
          .from('snapshots_mensuels')
          .select('*')
          .eq('etablissement_id', etablissementId)
          .eq('periode', periode)
          .single()

        if (snapError) {
          console.error('❌ Erreur snapshot:', snapError)
          throw new Error('Aucune donnée pour cette période')
        }

        if (!snapshot) {
          throw new Error('Snapshot vide')
        }

        console.log('✅ Snapshot chargé:', snapshot)

        // Construire DashboardData depuis snapshot
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
            // ✅ Charger les VRAIS waterfalls depuis le snapshot
            waterfallM1: snapshot.waterfall_m1 ? {
              effectifDebut: snapshot.waterfall_m1.base_m1 || 0,
              entrees: {
                value: 0,
                label: 'Entrées'
              },
              sorties: {
                value: 0,
                label: 'Sorties'
              },
              effetPrix: {
                value: snapshot.waterfall_m1.effet_prix || 0,
                label: 'Effet Prix'
              },
              effetVolume: {
                value: snapshot.waterfall_m1.effet_volume || 0,
                label: 'Effet Volume'
              },
              effectifFin: snapshot.waterfall_m1.base_m || 0
            } : null,
            waterfallN1: snapshot.waterfall_n1 ? {
              effectifDebut: snapshot.waterfall_n1.base_n1 || 0,
              entrees: {
                value: 0,
                label: 'Entrées'
              },
              sorties: {
                value: 0,
                label: 'Sorties'
              },
              effetPrix: {
                value: snapshot.waterfall_n1.effet_prix || 0,
                label: 'Effet Prix'
              },
              effetVolume: {
                value: snapshot.waterfall_n1.effet_volume || 0,
                label: 'Effet Volume'
              },
              effectifFin: snapshot.waterfall_n1.base_n || 0
            } : null
          },
          absences: {
            tauxAbsenteisme: snapshot.taux_absenteisme || 0,
            joursAbsences: snapshot.jours_absences || 0,
            joursConges: snapshot.jours_conges || 0
          },
          demographics: {
            ageGroups: snapshot.pyramide_ages || [],
            seniorityGroups: snapshot.pyramide_anciennetes || []
          }
        }

        console.log('✅ Dashboard data construit:', dashboardData)
        console.log('🔍 Waterfalls:', {
          m1: dashboardData.payroll.waterfallM1,
          n1: dashboardData.payroll.waterfallN1
        })

        setData(dashboardData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(errorMessage)
        console.error('❌ Erreur useVisionData:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [etablissementId, periode])

  return { data, loading, error }
}