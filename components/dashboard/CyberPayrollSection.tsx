'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, Calculator, Target, Percent, Shield, 
  TrendingUp, TrendingDown, BarChart3, Minus, Info
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

  const getEffectColor = (value: number) => {
    if (value > 0) return 'text-red-400'
    if (value < 0) return 'text-green-400'
    return 'text-slate-400'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Calculer l'effet prix moyen (hors mix)
  const effetPrixMoyen = useMemo(() => {
    return data.effetPrix - data.effetMix
  }, [data.effetPrix, data.effetMix])

  // Données pour le waterfall - SIMPLIFIÉ
  const waterfallData = useMemo(() => {
    const points = []
    
    // Point de départ
    if (previousMonthData && previousMonthData.coutTotal > 0) {
      points.push({
        label: 'M-1',
        value: previousMonthData.coutTotal,
        isTotal: true
      })
    } else {
      points.push({
        label: 'Base',
        value: data.coutTotal - data.variationMasseSalariale,
        isTotal: true
      })
    }

    // Effet Volume
    if (data.effetVolume !== 0) {
      points.push({
        label: 'Volume',
        value: data.effetVolume,
        isTotal: false
      })
    }

    // Effet Prix Moyen
    if (effetPrixMoyen !== 0) {
      points.push({
        label: 'Prix',
        value: effetPrixMoyen,
        isTotal: false
      })
    }

    // Effet Mix
    if (data.effetMix !== 0) {
      points.push({
        label: 'Mix',
        value: data.effetMix,
        isTotal: false
      })
    }

    // Point d'arrivée
    points.push({
      label: 'M',
      value: data.coutTotal,
      isTotal: true
    })

    return points
  }, [data, previousMonthData, effetPrixMoyen])

  const hasEffects = data.effetPrix !== 0 || data.effetVolume !== 0 || data.effetMix !== 0

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
      {hasEffects && waterfallData.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
        >
          <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />
          
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl">
                  <BarChart3 size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl font-mono">
                    Waterfall Analysis
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Décomposition Prix • Volume • Mix
                  </p>
                </div>
              </div>
              
              {/* Variation Badge */}
              <div className="flex items-center gap-4 px-6 py-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-1 font-mono">VARIATION M/M-1</p>
                  <p className={`font-bold text-2xl font-mono ${getEffectColor(data.variationMasseSalariale)}`}>
                    {data.variationMasseSalariale > 0 ? '+' : ''}
                    {formatCurrency(data.variationMasseSalariale)}
                  </p>
                  <p className={`text-sm font-mono ${getEffectColor(data.variationMasseSalariale)}`}>
                    ({data.variationMasseSalarialePct > 0 ? '+' : ''}
                    {data.variationMasseSalarialePct.toFixed(1)}%)
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  data.variationMasseSalariale > 0 
                    ? 'bg-red-500/20 border-2 border-red-500/50' 
                    : data.variationMasseSalariale < 0 
                    ? 'bg-green-500/20 border-2 border-green-500/50' 
                    : 'bg-slate-500/20 border-2 border-slate-500/50'
                }`}>
                  {data.variationMasseSalariale > 0 ? (
                    <TrendingUp size={28} className="text-red-400" />
                  ) : data.variationMasseSalariale < 0 ? (
                    <TrendingDown size={28} className="text-green-400" />
                  ) : (
                    <Minus size={28} className="text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="bg-slate-950/50 rounded-2xl p-8 mb-6 border border-slate-800/50">
              <WaterfallChart data={waterfallData} height={380} />
            </div>

            {/* Légende explicative cyberpunk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-900/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-purple-400 font-semibold text-sm font-mono">VOLUME</span>
                </div>
                <p className="text-xs text-slate-400">
                  Variation ETP (entrées/sorties)
                </p>
              </div>

              <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-blue-400 font-semibold text-sm font-mono">PRIX</span>
                </div>
                <p className="text-xs text-slate-400">
                  Augmentations salariales
                </p>
              </div>

              <div className="p-4 bg-orange-900/10 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-orange-400 font-semibold text-sm font-mono">MIX</span>
                </div>
                <p className="text-xs text-slate-400">
                  Changement structure effectif
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-cyan-900/10 rounded-xl border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 font-mono">
                  <span className="text-red-400 font-bold">ROUGE</span> = Impact négatif (coût ↑) • 
                  <span className="text-green-400 font-bold"> VERT</span> = Impact positif (coût ↓)
                </p>
              </div>
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
    <div className="h-8 bg-slate-700 rounded w-64"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
    <div className="h-96 bg-slate-800 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberPayrollSection.displayName = 'CyberPayrollSection'