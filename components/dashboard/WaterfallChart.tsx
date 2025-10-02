'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, CheckCircle2, Info } from 'lucide-react'

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

interface ColorConfig {
  color: string
  border: string
  text: string
  bg: string
}

interface WaterfallStep {
  label: string
  value: number
  cumulative: number
  color: string
  borderColor: string
  textColor: string
  bgColor: string
  isBase: boolean
  isTarget: boolean
  description?: string
}

const COLORS: Record<'base' | 'positive' | 'negative' | 'target' | 'neutral', ColorConfig> = {
  base: {
    color: 'from-slate-500 to-slate-600',
    border: 'border-slate-400',
    text: 'text-slate-300',
    bg: 'bg-slate-600/15'
  },
  positive: {
    color: 'from-emerald-500 to-emerald-600',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15'
  },
  negative: {
    color: 'from-red-400 to-red-500',
    border: 'border-red-400',
    text: 'text-red-400',
    bg: 'bg-red-500/15'
  },
  target: {
    color: 'from-sky-500 to-blue-600',
    border: 'border-sky-400',
    text: 'text-sky-400',
    bg: 'bg-sky-500/15'
  },
  neutral: {
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-500/15'
  }
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, loading = false }) => {
  
  const steps = useMemo((): WaterfallStep[] => {
    let cumulative = 0
    
    const getColors = (value: number): ColorConfig => {
      return value >= 0 ? COLORS.negative : COLORS.positive
    }
    
    const baseColors = COLORS.base
    const targetColors = COLORS.target
    const prixColors = getColors(data.effetPrix)
    const volumeColors = getColors(data.effetVolume)
    const mixColors = data.effetMix === 0 ? COLORS.neutral : getColors(data.effetMix)
    
    return [
      {
        label: 'Base M-1',
        value: data.masseSalarialeM1,
        cumulative: data.masseSalarialeM1,
        color: baseColors.color,
        borderColor: baseColors.border,
        textColor: baseColors.text,
        bgColor: baseColors.bg,
        isBase: true,
        isTarget: false,
        description: 'Masse salariale du mois précédent'
      },
      {
        label: 'Prix Pur',
        value: data.effetPrix,
        cumulative: (cumulative = data.masseSalarialeM1 + data.effetPrix),
        color: prixColors.color,
        borderColor: prixColors.border,
        textColor: prixColors.text,
        bgColor: prixColors.bg,
        isBase: false,
        isTarget: false,
        description: 'Augmentations salariales du socle stable'
      },
      {
        label: 'Volume',
        value: data.effetVolume,
        cumulative: (cumulative = cumulative + data.effetVolume),
        color: volumeColors.color,
        borderColor: volumeColors.border,
        textColor: volumeColors.text,
        bgColor: volumeColors.bg,
        isBase: false,
        isTarget: false,
        description: 'Variation d\'effectif (ETP)'
      },
      {
        label: 'Mix',
        value: data.effetMix,
        cumulative: (cumulative = cumulative + data.effetMix),
        color: mixColors.color,
        borderColor: mixColors.border,
        textColor: mixColors.text,
        bgColor: mixColors.bg,
        isBase: false,
        isTarget: false,
        description: 'Différence coût entrants/sortants'
      },
      {
        label: 'Cible M',
        value: data.masseSalarialeM,
        cumulative: data.masseSalarialeM,
        color: targetColors.color,
        borderColor: targetColors.border,
        textColor: targetColors.text,
        bgColor: targetColors.bg,
        isBase: false,
        isTarget: true,
        description: 'Masse salariale du mois actuel'
      }
    ]
  }, [data])
  
  const chartMetrics = useMemo(() => {
    const values = steps.map(s => Math.abs(s.value))
    const maxValue = Math.max(...values)
    
    return {
      maxValue,
      scale: (value: number) => {
        if (maxValue === 0) return 0
        return (Math.abs(value) / maxValue) * 100
      }
    }
  }, [steps])
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  const calculatedTotal = data.masseSalarialeM1 + data.effetPrix + data.effetVolume + data.effetMix
  const isCoherent = Math.abs(calculatedTotal - data.masseSalarialeM) < 1
  const variation = data.masseSalarialeM - data.masseSalarialeM1
  const effetPrixGlobal = data.effetPrix + data.effetMix
  
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-slate-800/30 p-8 border border-slate-700/30">
        <div className="h-6 bg-slate-700/50 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-700/30 rounded" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700/30 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl bg-white/[0.02] border border-slate-700/30 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center">
            <Activity size={20} className="text-slate-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Waterfall Masse Salariale</h3>
            <p className="text-slate-400 text-sm">Décomposition Prix Pur + Volume + Mix</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
          isCoherent 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {isCoherent && <CheckCircle2 size={16} />}
          {isCoherent ? 'Cohérent' : `Écart: ${formatCurrency(Math.abs(calculatedTotal - data.masseSalarialeM))}`}
        </div>
      </div>
      
      {/* Layout: Waterfall + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2">
          <div className="relative h-96 bg-slate-900/30 rounded-lg p-6">
            <div className="absolute inset-0 flex items-end justify-around gap-6 px-8 pb-6">
              {steps.map((step, index) => {
                const previousCumulative = index > 0 ? steps[index - 1].cumulative : 0
                const barHeight = chartMetrics.scale(step.value)
                const barBottom = step.isBase || step.isTarget 
                  ? 0 
                  : chartMetrics.scale(Math.min(previousCumulative, step.cumulative))
                
                return (
                  <motion.div
                    key={step.label}
                    className="flex-1 flex flex-col items-center relative group"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    style={{ height: '100%' }}
                  >
                    <div className="relative w-full flex-1">
                      <motion.div
                        className={`absolute left-0 right-0 rounded-t-lg bg-gradient-to-t ${step.color} border ${step.borderColor} cursor-pointer`}
                        style={{
                          height: `${barHeight}%`,
                          bottom: `${barBottom}%`
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                      />
                      
                      {step.description && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 whitespace-nowrap shadow-xl">
                            {step.description}
                          </div>
                        </div>
                      )}
                      
                      <motion.div
                        className={`absolute left-1/2 -translate-x-1/2 ${step.textColor} font-semibold text-sm whitespace-nowrap`}
                        style={{
                          bottom: `${barBottom + barHeight + 2}%`
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded ${step.bgColor} backdrop-blur-sm border border-slate-700/30`}>
                          {!step.isBase && !step.isTarget && (
                            step.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />
                          )}
                          <span>{formatCurrency(Math.abs(step.value))}</span>
                        </div>
                      </motion.div>
                      
                      {!step.isBase && !step.isTarget && index > 0 && (
                        <div 
                          className="absolute left-0 w-full border-t border-dashed border-slate-600/40"
                          style={{
                            bottom: `${barBottom}%`
                          }}
                        />
                      )}
                    </div>
                    
                    <motion.div
                      className="mt-4 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <p className="text-slate-300 text-sm font-medium">{step.label}</p>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="space-y-4">
          <motion.div 
            className="p-5 rounded-lg bg-slate-800/20 border border-slate-700/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Base M-1</p>
            <p className="text-white text-xl font-semibold">{formatCurrency(data.masseSalarialeM1)}</p>
          </motion.div>
          
          <motion.div 
            className="p-5 rounded-lg bg-slate-800/20 border border-slate-700/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Prix Pur + Volume + Mix</p>
            <p className="text-slate-300 text-xl font-semibold">
              {formatCurrency(data.effetPrix + data.effetVolume + data.effetMix)}
            </p>
          </motion.div>
          
          <motion.div 
            className="p-5 rounded-lg bg-slate-800/20 border border-slate-700/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Cible M</p>
            <p className="text-white text-xl font-semibold">{formatCurrency(data.masseSalarialeM)}</p>
          </motion.div>
          
          <motion.div 
            className="p-5 rounded-lg bg-slate-800/20 border border-slate-700/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Variation Totale</p>
            <div className="flex items-center gap-2">
              {variation >= 0 ? (
                <TrendingUp size={16} className="text-red-400" />
              ) : (
                <TrendingDown size={16} className="text-emerald-400" />
              )}
              <p className={`text-xl font-semibold ${variation >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {variation >= 0 ? '+' : ''}{formatCurrency(variation)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Note méthodologique EN BAS */}
      <motion.div 
        className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-400 font-medium text-sm mb-2">Note méthodologique</p>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="font-semibold text-slate-200">Prix Pur</span>
                <p className="mt-1">{formatCurrency(data.effetPrix)} = augmentations sur socle stable (salariés présents M-1 et M)</p>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Mix</span>
                <p className="mt-1">{formatCurrency(data.effetMix)} = différence de coût entre entrants et sortants</p>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Prix Global</span>
                <p className="mt-1">{formatCurrency(effetPrixGlobal)} = Prix Pur + Mix (incluant effet de structure)</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}