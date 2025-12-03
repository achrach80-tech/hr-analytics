'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CyberKPICardProps {
  title: string
  value: number
  format: 'currency' | 'percent' | 'number' | 'decimal'
  icon: LucideIcon
  gradient: string
  alert?: boolean
  subtitle?: string
  size?: 'normal' | 'large'
  evolutionM1?: number
  evolutionN1?: number
  evolution?: {
    value: number
    label: string
  }
}

const formatValue = (value: number, format: string): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(1)
    case 'number':
    default:
      return new Intl.NumberFormat('fr-FR').format(Math.round(value))
  }
}

export const CyberKPICard: React.FC<CyberKPICardProps> = React.memo(({ 
  title, 
  value, 
  format, 
  icon: IconComponent,  // ✅ RENOMMER pour éviter confusion avec balise <Icon>
  gradient, 
  alert = false,
  subtitle,
  size = 'normal',
  evolutionM1,
  evolutionN1,
  evolution
}) => {
  const formattedValue = formatValue(value, format)
  const isLarge = size === 'large'

  const getTrendIcon = () => {
    if (!evolution || evolution.value === 0) return Minus
    return evolution.value > 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = () => {
    if (!evolution || evolution.value === 0) return 'text-slate-400'
    return evolution.value > 0 ? 'text-emerald-400' : 'text-red-400'
  }

  const TrendIcon = getTrendIcon()
  const trendColor = getTrendColor()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 ${isLarge ? 'p-8' : 'p-6'}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 ${gradient} -z-10`} />
      
      {/* Alert indicator */}
      {alert && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
        </div>
      )}
      
      {/* Evolution badges M-1 et N-1 */}
      {(evolutionM1 !== undefined || evolutionN1 !== undefined) && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
          {evolutionM1 !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-xs font-mono font-bold ${
              evolutionM1 === 0 
                ? 'bg-slate-700/50 border-slate-600/30 text-slate-400'
                : evolutionM1 > 0
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}>
              {evolutionM1 !== 0 && (
                evolutionM1 > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />
              )}
              <span>M-1 {evolutionM1 > 0 ? '+' : ''}{evolutionM1.toFixed(1)}%</span>
            </div>
          )}
          {evolutionN1 !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-xs font-mono font-bold ${
              evolutionN1 === 0 
                ? 'bg-slate-700/50 border-slate-600/30 text-slate-400'
                : evolutionN1 > 0
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}>
              {evolutionN1 !== 0 && (
                evolutionN1 > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />
              )}
              <span>N-1 {evolutionN1 > 0 ? '+' : ''}{evolutionN1.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Evolution badge ancien format */}
      {evolution && !evolutionM1 && !evolutionN1 && (
        <div className={`absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border ${
          evolution.value === 0 
            ? 'bg-slate-700/30 border-slate-600/30' 
            : evolution.value > 0
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <TrendIcon size={12} className={trendColor} />
          <span className={`text-xs font-semibold ${trendColor}`}>
            {evolution.value > 0 ? '+' : ''}{evolution.value.toFixed(1)}%
          </span>
        </div>
      )}
      
      {/* Content principal */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${gradient} ${
              isLarge ? 'w-14 h-14' : 'w-12 h-12'
            }`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {/* ✅ FIX : Utiliser IconComponent directement */}
            <IconComponent size={isLarge ? 26 : 22} className="text-white drop-shadow-lg" />
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
            {title}
          </p>
          <p className={`font-bold text-white drop-shadow-md ${isLarge ? 'text-4xl' : 'text-2xl'}`}>
            {formattedValue}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10">
        <div className={`absolute inset-0 ${gradient} opacity-5 blur-xl`} />
      </div>
    </motion.div>
  )
})

CyberKPICard.displayName = 'CyberKPICard'