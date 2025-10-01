'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, Calculator, Target, Percent, Shield
} from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import { WaterfallChart } from './WaterfallChart'
import type { PayrollKPIs } from '@/lib/types/dashboard'

interface CyberPayrollSectionProps {
  data: PayrollKPIs | null
  previousMonthData?: PayrollKPIs | null
  loading?: boolean
}

export const CyberPayrollSection: React.FC<CyberPayrollSectionProps> = React.memo(({ 
  data,
  previousMonthData,
  loading = false 
}) => {
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

  // ✅ FIX: Vérifier si les données d'effets EXISTENT (même si = 0)
  const hasEffectsData = (
    data.effetPrix !== undefined && data.effetPrix !== null &&
    data.effetVolume !== undefined && data.effetVolume !== null &&
    data.effetMix !== undefined && data.effetMix !== null
  )

  // Calculer la masse salariale M-1 pour le waterfall
  const masseSalarialeM1 = hasEffectsData 
    ? data.masseBrute - (data.effetPrix || 0) - (data.effetVolume || 0) - (data.effetMix || 0)
    : 0

  // ✅ Afficher le waterfall SI les données existent, même si les valeurs sont 0
  const shouldShowWaterfall = hasEffectsData && masseSalarialeM1 > 0

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
      
      {/* Row 1: KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CyberKPICard
          title="Masse Salariale Brute"
          value={data.masseBrute}
          format="currency"
          icon={DollarSign}
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          subtitle="Total payroll mensuel"
          size="large"
        />

        <CyberKPICard
          title="Coût Total Employeur"
          value={data.coutTotal}
          format="currency"
          icon={Calculator}
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
          subtitle="Charges incluses"
          size="large"
        />

        <CyberKPICard
          title="Coût Moyen par ETP"
          value={data.coutMoyenFTE}
          format="currency"
          icon={Target}
          gradient="bg-gradient-to-r from-teal-500 to-teal-600"
          subtitle="Coût employeur unitaire"
          size="large"
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
              masseSalarialeM1: masseSalarialeM1,
              effetPrix: data.effetPrix || 0,
              effetVolume: data.effetVolume || 0,
              effetMix: data.effetMix || 0,
              masseSalarialeM: data.masseBrute
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
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Les données d'effets Prix/Volume/Mix n'ont pas encore été calculées pour cette période. 
                {!hasEffectsData && " Elles seront disponibles après avoir importé au moins 2 mois de données."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Row 3: KPIs Complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberKPICard
          title="Part Variable"
          value={data.partVariable}
          format="percent"
          icon={Percent}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="Motivation & performance"
        />

        <CyberKPICard
          title="Taux Charges Sociales"
          value={data.tauxCharges}
          format="percent"
          icon={Shield}
          gradient="bg-gradient-to-r from-violet-500 to-violet-600"
          subtitle="Cotisations + taxes"
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