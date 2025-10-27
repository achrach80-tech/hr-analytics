'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

interface WaterfallData {
  masseSalarialeM1: number
  effetPrix: number
  effetVolume: number
  effetMix: number
  masseSalarialeM: number
}

interface WaterfallChartProps {
  data: WaterfallData
  loading?: boolean
}

interface WaterfallStep {
  label: string
  value: number
  cumulative: number
  color: string
  isBase: boolean
  isTarget: boolean
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, loading = false }) => {
  
  // ✅ CALCUL CORRECT avec validation
  const steps = useMemo((): WaterfallStep[] => {
    let cumulative = data.masseSalarialeM1
    
    return [
      {
        label: 'Base M-1',
        value: data.masseSalarialeM1,
        cumulative: data.masseSalarialeM1,
        color: 'from-slate-500 to-slate-600',
        isBase: true,
        isTarget: false
      },
      {
        label: 'Prix Pur',
        value: data.effetPrix,
        cumulative: (cumulative += data.effetPrix),
        color: data.effetPrix >= 0 ? 'from-red-400 to-red-500' : 'from-emerald-500 to-emerald-600',
        isBase: false,
        isTarget: false
      },
      {
        label: 'Volume',
        value: data.effetVolume,
        cumulative: (cumulative += data.effetVolume),
        color: data.effetVolume >= 0 ? 'from-red-400 to-red-500' : 'from-emerald-500 to-emerald-600',
        isBase: false,
        isTarget: false
      },
      {
        label: 'Mix',
        value: data.effetMix,
        cumulative: (cumulative += data.effetMix),
        color: data.effetMix === 0 ? 'from-amber-500 to-orange-500' : 
               data.effetMix >= 0 ? 'from-red-400 to-red-500' : 'from-emerald-500 to-emerald-600',
        isBase: false,
        isTarget: false
      },
      {
        label: 'Cible M',
        value: data.masseSalarialeM,
        cumulative: data.masseSalarialeM,
        color: 'from-sky-500 to-blue-600',
        isBase: false,
        isTarget: true
      }
    ]
  }, [data])
  
  // ✅ VÉRIFICATION COHÉRENCE
  const calculatedTotal = data.masseSalarialeM1 + data.effetPrix + data.effetVolume + data.effetMix
  const ecart = Math.abs(calculatedTotal - data.masseSalarialeM)
  const isCoherent = ecart < 100 // Tolérance de 100€
  
  const variation = data.masseSalarialeM - data.masseSalarialeM1
  const variationPct = data.masseSalarialeM1 > 0 
    ? (variation / data.masseSalarialeM1) * 100 
    : 0
  
  const effetPrixGlobal = data.effetPrix + data.effetMix
  
  // ✅ CALCUL HAUTEURS (max = valeur absolue la plus grande)
  const maxValue = Math.max(
    Math.abs(data.masseSalarialeM1),
    Math.abs(data.masseSalarialeM),
    Math.abs(data.effetPrix),
    Math.abs(data.effetVolume),
    Math.abs(data.effetMix)
  )
  
  const getBarHeight = (value: number): number => {
    if (maxValue === 0) return 0
    return (Math.abs(value) / maxValue) * 80 // Max 80% de la hauteur
  }
  
  const getBarBottom = (previousCumulative: number): number => {
    if (maxValue === 0) return 0
    const minCumulative = Math.min(data.masseSalarialeM1, calculatedTotal, data.masseSalarialeM)
    return ((previousCumulative - minCumulative) / maxValue) * 80
  }
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-slate-800/30 p-8 border border-slate-700/30">
        <div className="h-6 bg-slate-700/50 rounded w-48 mb-6" />
        <div className="h-96 bg-slate-700/30 rounded" />
      </div>
    )
  }
  
  return (
    <div className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-2xl">Waterfall Masse Salariale</h3>
            <p className="text-slate-400 text-sm mt-1">Décomposition Prix Pur + Volume + Mix</p>
          </div>
        </div>
        
        <div className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
          isCoherent 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {isCoherent ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {isCoherent ? 'COHÉRENT' : `ÉCART: ${formatCurrency(ecart)}`}
        </div>
      </div>
      
      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2">
          <div className="relative h-[400px] bg-slate-950/50 rounded-xl p-8 border border-slate-800/50">
            <div className="absolute inset-0 flex items-end justify-around gap-4 px-10 pb-10">
              {steps.map((step, index) => {
                const previousCumulative = index > 0 ? steps[index - 1].cumulative : 0
                const barHeight = getBarHeight(step.value)
                const barBottom = step.isBase || step.isTarget ? 0 : getBarBottom(previousCumulative)
                
                return (
                  <div key={step.label} className="flex-1 flex flex-col items-center relative h-full">
                    {/* Bar */}
                    <div className="relative w-full flex-1 flex items-end">
                      <motion.div
                        className={`absolute left-0 right-0 rounded-t-xl bg-gradient-to-t ${step.color} border-2 border-white/20 shadow-2xl`}
                        style={{
                          height: `${barHeight}%`,
                          bottom: `${barBottom}%`
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                        whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.5)' }}
                      />
                      
                      {/* Value Label */}
                      <motion.div
                        className={`absolute left-1/2 -translate-x-1/2 font-bold text-sm whitespace-nowrap px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-xl ${
                          step.value >= 0 
                            ? 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        }`}
                        style={{
                          bottom: `${barBottom + barHeight + 2}%`
                        }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
                      >
                        {!step.isBase && !step.isTarget && (
                          <span className="mr-1">{step.value >= 0 ? '▲' : '▼'}</span>
                        )}
                        {formatCurrency(Math.abs(step.value))}
                      </motion.div>
                      
                      {/* Connector Line */}
                      {!step.isBase && !step.isTarget && index > 0 && (
                        <div 
                          className="absolute left-0 w-full border-t-2 border-dashed border-slate-600/50"
                          style={{ bottom: `${barBottom}%` }}
                        />
                      )}
                    </div>
                    
                    {/* Label */}
                    <motion.div
                      className="mt-4 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.4 }}
                    >
                      <p className="text-slate-300 text-sm font-bold">{step.label}</p>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="space-y-4">
          <motion.div 
            className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-bold">BASE M-1</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(data.masseSalarialeM1)}</p>
          </motion.div>
          
          <motion.div 
            className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-bold">EFFETS CUMULÉS</p>
            <p className="text-slate-300 text-2xl font-bold">
              {formatCurrency(data.effetPrix + data.effetVolume + data.effetMix)}
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Prix Pur:</span>
                <span className={data.effetPrix >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {data.effetPrix >= 0 ? '+' : ''}{formatCurrency(data.effetPrix)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volume:</span>
                <span className={data.effetVolume >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {data.effetVolume >= 0 ? '+' : ''}{formatCurrency(data.effetVolume)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mix:</span>
                <span className={data.effetMix >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {data.effetMix >= 0 ? '+' : ''}{formatCurrency(data.effetMix)}
                </span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-bold">CIBLE M</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(data.masseSalarialeM)}</p>
          </motion.div>
          
          <motion.div 
            className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 font-bold">VARIATION TOTALE</p>
            <div className="flex items-center gap-3">
              {variation >= 0 ? (
                <TrendingUp size={24} className="text-red-400" />
              ) : (
                <TrendingDown size={24} className="text-emerald-400" />
              )}
              <div>
                <p className={`text-2xl font-bold ${variation >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {variation >= 0 ? '+' : ''}{formatCurrency(variation)}
                </p>
                <p className={`text-sm ${variation >= 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                  {variation >= 0 ? '+' : ''}{variationPct.toFixed(2)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Note méthodologique */}
      <motion.div 
        className="mt-8 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-400 font-bold text-sm mb-3">Note méthodologique</p>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="font-bold text-slate-200">Prix Pur</span>
                <p className="mt-1.5 text-slate-400">{formatCurrency(data.effetPrix)} = augmentations sur socle stable</p>
              </div>
              <div>
                <span className="font-bold text-slate-200">Mix</span>
                <p className="mt-1.5 text-slate-400">{formatCurrency(data.effetMix)} = différence coût entrants/sortants</p>
              </div>
              <div>
                <span className="font-bold text-slate-200">Prix Global</span>
                <p className="mt-1.5 text-slate-400">{formatCurrency(effetPrixGlobal)} = Prix Pur + Mix</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}