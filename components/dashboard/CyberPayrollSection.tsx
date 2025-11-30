'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, Calculator, Target, Percent, Shield
} from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import WaterfallChart from './WaterfallChart'  // ← CHANGEMENT 1: Enlever les {}

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
  establishmentId: string  // ← CHANGEMENT 2: Ajout prop (nécessaire pour nouveau waterfall)
  period: string           // ← CHANGEMENT 3: Ajout prop (nécessaire pour nouveau waterfall)
  data: PayrollKPIs | null
  previousMonthData?: PayrollKPIs | null
  previousYearData?: PayrollKPIs | null
  loading?: boolean
}

export const CyberPayrollSection: React.FC<CyberPayrollSectionProps> = React.memo(({ 
  establishmentId,  // ← CHANGEMENT 4: Déstructurer nouvelle prop
  period,           // ← CHANGEMENT 5: Déstructurer nouvelle prop
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

  // ✅ SIMPLIFICATION: Toujours afficher le waterfall si on a les IDs
  const shouldShowWaterfall = establishmentId && period

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
      {/* ← CHANGEMENT 6: Simplification totale du bloc waterfall */}
      {shouldShowWaterfall ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WaterfallChart
            establishmentId={establishmentId}
            period={period}
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
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Les données nécessaires ne sont pas disponibles.
              </p>
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