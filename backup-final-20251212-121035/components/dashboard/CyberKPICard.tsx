// components/dashboard/CyberKPICard.tsx
'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

interface CyberKPICardProps {
  title: string
  value: number | string
  format: 'currency' | 'percent' | 'number' | 'decimal'
  icon: LucideIcon
  gradient: string
  evolution?: {
    value: number
    label: string
  }
  evolutionM1?: number
  evolutionN1?: number
  subtitle?: string
  size?: 'normal' | 'large'
}

export function CyberKPICard({
  title,
  value,
  format,
  icon: Icon,
  gradient,
  evolution,
  evolutionM1,
  evolutionN1,
  subtitle,
  size = 'normal'
}: CyberKPICardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0
        }).format(val)
      
      case 'percent':
        return `${val.toFixed(1)}%`
      
      case 'decimal':
        return val.toFixed(1)
      
      case 'number':
      default:
        return Math.round(val).toString()
    }
  }

  const getEvolutionColor = (val: number): string => {
    if (val > 0) return 'text-green-400'
    if (val < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  const getEvolutionBg = (val: number): string => {
    if (val > 0) return 'bg-green-500/10 border-green-500/30'
    if (val < 0) return 'bg-red-500/10 border-red-500/30'
    return 'bg-slate-500/10 border-slate-500/30'
  }

  // Use evolution prop if provided, otherwise use evolutionM1
  const mainEvolution = evolution || (evolutionM1 !== undefined ? {
    value: evolutionM1,
    label: 'vs M-1'
  } : undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border border-cyan-500/20 backdrop-blur-sm ${
        size === 'large' ? 'p-6' : 'p-4'
      }`}
      style={{
        background: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.7))'
      }}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />

      {/* Icon */}
      <div className="relative mb-3">
        <div className={`inline-flex p-2 rounded-lg ${gradient} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>
      </div>

      {/* Title */}
      <h3 className="relative text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </h3>

      {/* Value */}
      <div className="relative">
        <p className={`font-bold text-white ${
          size === 'large' ? 'text-4xl' : 'text-2xl'
        }`}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Evolution badges */}
      {(mainEvolution || evolutionN1 !== undefined) && (
        <div className="relative flex items-center gap-2 mt-3">
          {mainEvolution && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${
              getEvolutionBg(mainEvolution.value)
            } ${getEvolutionColor(mainEvolution.value)}`}>
              {mainEvolution.value > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : mainEvolution.value < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>
                {mainEvolution.value > 0 ? '+' : ''}{mainEvolution.value.toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">{mainEvolution.label}</span>
            </div>
          )}

          {evolutionN1 !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold ${
              getEvolutionBg(evolutionN1)
            } ${getEvolutionColor(evolutionN1)}`}>
              {evolutionN1 > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : evolutionN1 < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>
                {evolutionN1 > 0 ? '+' : ''}{evolutionN1.toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">vs N-1</span>
            </div>
          )}
        </div>
      )}

      {/* Glow effect */}
      <div className={`absolute -bottom-2 -right-2 w-32 h-32 ${gradient} opacity-5 blur-3xl rounded-full`} />
    </motion.div>
  )
}