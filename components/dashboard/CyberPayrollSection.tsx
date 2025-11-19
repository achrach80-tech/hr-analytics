'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, Calculator, Target, Percent, Shield
} from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import { WaterfallChart } from './WaterfallChart'

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
  primesExceptionnelles?: number
  primesMois13?: number
}

interface CyberPayrollSectionProps {
  data: PayrollKPIs | null
  previousMonthData?: PayrollKPIs | null
  previousYearData?: PayrollKPIs | null
  loading?: boolean
}

export const CyberPayrollSection: React.FC<CyberPayrollSectionProps> = React.memo(({ 
  data,
  previousMonthData,
  previousYearData,
  loading = false 
}) => {
  
  // 🔍 DEBUG: Log des données reçues
  useEffect(() => {
    if (data && !loading) {
      console.group('💰 CyberPayrollSection - Données reçues')
      console.log('Masse Brute (M):', data.masseBrute)
      console.log('Masse Brute (M-1):', previousMonthData?.masseBrute || 'N/A')
      console.log('Effet Prix:', data.effetPrix)
      console.log('Effet Volume:', data.effetVolume)
      console.log('Variation stockée:', data.variationMasseSalariale)
      
      if (previousMonthData) {
        const variationCalculee = data.masseBrute - previousMonthData.masseBrute
        const effetsTotal = data.effetPrix + data.effetVolume
        const ecart = Math.abs(variationCalculee - effetsTotal)
        
        console.log('🧮 Vérification:')
        console.log('   Variation calculée:', variationCalculee)
        console.log('   Effets (Prix + Volume):', effetsTotal)
        console.log('   Écart:', ecart)
        console.log('   Cohérence:', ecart < 100 ? '✅' : '❌')
      }
      console.groupEnd()
    }
  }, [data, previousMonthData, loading])

  if (loading) {
    return <PayrollSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée payroll disponible</p>
      </div>
    )
  }

  // Calculs des évolutions pour Masse Brute
  const evolutionM1MasseBrute = previousMonthData && previousMonthData.masseBrute > 0
    ? ((data.masseBrute - previousMonthData.masseBrute) / previousMonthData.masseBrute) * 100 
    : undefined
  const evolutionN1MasseBrute = previousYearData && previousYearData.masseBrute > 0
    ? ((data.masseBrute - previousYearData.masseBrute) / previousYearData.masseBrute) * 100 
    : undefined

  // Calculs des évolutions pour Coût Total
  const evolutionM1CoutTotal = previousMonthData && previousMonthData.coutTotal > 0
    ? ((data.coutTotal - previousMonthData.coutTotal) / previousMonthData.coutTotal) * 100 
    : undefined
  const evolutionN1CoutTotal = previousYearData && previousYearData.coutTotal > 0
    ? ((data.coutTotal - previousYearData.coutTotal) / previousYearData.coutTotal) * 100 
    : undefined

  // Calculs des évolutions pour Coût Moyen FTE
  const evolutionM1CoutMoyenFTE = previousMonthData && previousMonthData.coutMoyenFTE > 0
    ? ((data.coutMoyenFTE - previousMonthData.coutMoyenFTE) / previousMonthData.coutMoyenFTE) * 100 
    : undefined
  const evolutionN1CoutMoyenFTE = previousYearData && previousYearData.coutMoyenFTE > 0
    ? ((data.coutMoyenFTE - previousYearData.coutMoyenFTE) / previousYearData.coutMoyenFTE) * 100 
    : undefined

  // Calculs des évolutions pour Part Variable
  const evolutionM1PartVariable = previousMonthData
    ? data.partVariable - previousMonthData.partVariable
    : undefined
  const evolutionN1PartVariable = previousYearData
    ? data.partVariable - previousYearData.partVariable
    : undefined

  // Calculs des évolutions pour Taux Charges
  const evolutionM1TauxCharges = previousMonthData
    ? data.tauxCharges - previousMonthData.tauxCharges
    : undefined
  const evolutionN1TauxCharges = previousYearData
    ? data.tauxCharges - previousYearData.tauxCharges
    : undefined

  // ✅ CORRECTION: Validation stricte des conditions d'affichage waterfall
  const hasEffectsData = (
    typeof data.effetPrix === 'number' && 
    typeof data.effetVolume === 'number'
  )

  const hasPreviousMonthData = (
    previousMonthData !== null && 
    previousMonthData !== undefined &&
    previousMonthData.masseBrute > 0
  )

  const shouldShowWaterfall = hasEffectsData && hasPreviousMonthData

  // 🔍 DEBUG: Log de la décision d'affichage
  console.log('🎯 Waterfall Display Decision:', {
    shouldShow: shouldShowWaterfall,
    hasEffects: hasEffectsData,
    hasPrevMonth: hasPreviousMonthData,
    masseBruteM: data.masseBrute,
    masseBruteM1: previousMonthData?.masseBrute || 0
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <CyberSectionHeader 
        title="Masse Salariale & Analyse" 
        icon={DollarSign} 
        gradient="bg-gradient-to-r from-emerald-500 to-cyan-600" 
      />
      
      {/* Row 1: KPIs Principaux avec évolutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CyberKPICard
          title="Masse Salariale Brute"
          value={data.masseBrute}
          format="currency"
          icon={DollarSign}
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle="Total payroll mensuel"
          size="large"
          evolutionM1={evolutionM1MasseBrute}
          evolutionN1={evolutionN1MasseBrute}
        />

        <CyberKPICard
          title="Coût Total Employeur"
          value={data.coutTotal}
          format="currency"
          icon={Calculator}
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
          subtitle="Charges incluses"
          size="large"
          evolutionM1={evolutionM1CoutTotal}
          evolutionN1={evolutionN1CoutTotal}
        />

        <CyberKPICard
          title="Coût Moyen par ETP"
          value={data.coutMoyenFTE}
          format="currency"
          icon={Target}
          gradient="bg-gradient-to-r from-teal-500 to-teal-600"
          subtitle="Coût employeur unitaire"
          size="large"
          evolutionM1={evolutionM1CoutMoyenFTE}
          evolutionN1={evolutionN1CoutMoyenFTE}
        />
      </div>

      {/* Row 2: Waterfall Chart */}
      {shouldShowWaterfall ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WaterfallChart
            data={{
              masseSalarialeM1: previousMonthData!.masseBrute,
              effetPrix: data.effetPrix,
              effetVolume: data.effetVolume,
              masseSalarialeM: data.masseBrute,
              primesExceptionnelles: data.primesExceptionnelles,
              primesMois13: data.primesMois13
            }}
            loading={false}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 bg-slate-800/30 rounded-xl border border-slate-700/30 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
              <DollarSign size={32} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Waterfall non disponible
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                {!hasPreviousMonthData 
                  ? "📅 Les données du mois précédent sont nécessaires. Importez au moins 2 mois consécutifs."
                  : !hasEffectsData
                  ? "⚙️ Les effets Prix/Volume n'ont pas été calculés."
                  : "❌ Données insuffisantes pour afficher le waterfall."}
              </p>
              
              {/* Instructions SQL pour recalcul */}
              {!hasEffectsData && (
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600/30 text-left max-w-2xl mx-auto">
                  <div className="text-xs text-slate-300 mb-2 font-semibold">
                    💡 Action requise - Exécutez cette fonction SQL:
                  </div>
                  <code className="block text-xs text-cyan-400 bg-slate-950 p-3 rounded overflow-x-auto">
                    SELECT calculate_payroll_effects_v3(<br/>
                    &nbsp;&nbsp;'votre-etablissement-id',<br/>
                    &nbsp;&nbsp;'2024-11-01'::DATE<br/>
                    );
                  </code>
                  <div className="text-xs text-slate-400 mt-2">
                    Puis rafraîchissez cette page (F5)
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Row 3: KPIs Complémentaires avec évolutions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberKPICard
          title="Part Variable"
          value={data.partVariable}
          format="percent"
          icon={Percent}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="Motivation & performance"
          evolutionM1={evolutionM1PartVariable}
          evolutionN1={evolutionN1PartVariable}
        />

        <CyberKPICard
          title="Taux Charges Sociales"
          value={data.tauxCharges}
          format="percent"
          icon={Shield}
          gradient="bg-gradient-to-r from-violet-500 to-violet-600"
          subtitle="Cotisations + taxes"
          evolutionM1={evolutionM1TauxCharges}
          evolutionN1={evolutionN1TauxCharges}
        />
      </div>
    </motion.section>
  )
})

const PayrollSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-slate-700 rounded w-64" />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 bg-slate-800 rounded-2xl" />
      ))}
    </div>
    <div className="h-96 bg-slate-800 rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl" />
      ))}
    </div>
  </div>
)

CyberPayrollSection.displayName = 'CyberPayrollSection'