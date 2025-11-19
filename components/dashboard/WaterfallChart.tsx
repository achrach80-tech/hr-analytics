'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

interface WaterfallData {
  masseSalarialeM1: number
  effetPrix: number
  effetVolume: number
  masseSalarialeM: number
  primesExceptionnelles?: number
  primesMois13?: number
}

interface WaterfallChartProps {
  data: WaterfallData
  loading?: boolean
  periodeM?: string
  periodeM1?: string
}

/**
 * ✅ VRAI WATERFALL EN CASCADE TALVIO
 * Style "bridge" où les barres s'empilent visuellement
 * Montre le passage de Base M-1 → Base M
 */
export const WaterfallChart: React.FC<WaterfallChartProps> = ({ 
  data, 
  loading = false,
  periodeM,
  periodeM1
}) => {
  
  // ============================================
  // CALCULS
  // ============================================
  const analysis = useMemo(() => {
    const { masseSalarialeM1, effetPrix, effetVolume, masseSalarialeM } = data
    
    const variationReelle = masseSalarialeM - masseSalarialeM1
    const sommeEffets = effetPrix + effetVolume
    const ecart = Math.abs(variationReelle - sommeEffets)
    const ecartPct = variationReelle !== 0 ? (ecart / Math.abs(variationReelle)) * 100 : 0
    const coherenceOk = ecartPct < 5
    const variationPct = masseSalarialeM1 !== 0 ? (variationReelle / masseSalarialeM1) * 100 : 0
    
    return {
      variationReelle,
      sommeEffets,
      ecart,
      ecartPct,
      coherenceOk,
      variationPct
    }
  }, [data])

  // ============================================
  // COMMENTAIRES INTELLIGENTS
  // ============================================
  const commentary = useMemo(() => {
    const comments: string[] = []
    const { effetPrix, effetVolume, masseSalarialeM1, primesExceptionnelles, primesMois13 } = data
    const { variationReelle, variationPct } = analysis
    
    if (primesMois13 && primesMois13 > 0 && primesMois13 > masseSalarialeM1 * 0.3) {
      comments.push(`🎁 13ème mois versé: ${formatEuro(primesMois13)} (impact majeur sur la masse)`)
    } else if (primesExceptionnelles && primesExceptionnelles > masseSalarialeM1 * 0.2) {
      comments.push(`✨ Prime exceptionnelle: ${formatEuro(primesExceptionnelles)} (${((primesExceptionnelles / masseSalarialeM1) * 100).toFixed(0)}% de la base M-1)`)
    }
    
    if (Math.abs(effetPrix) > Math.abs(effetVolume) * 3) {
      if (effetPrix > 0) {
        comments.push(`📈 Hausse significative des coûts salariaux (+${formatEuro(effetPrix)}) - Impact négatif`)
      } else {
        comments.push(`📉 Économie réalisée sur les coûts salariaux (${formatEuro(effetPrix)}) - Impact positif`)
      }
    }
    
    if (Math.abs(effetVolume) > Math.abs(effetPrix) * 3) {
      if (effetVolume > 0) {
        comments.push(`👥 Hausse de l'effectif = augmentation de coût (+${formatEuro(effetVolume)})`)
      } else {
        comments.push(`👥 Baisse d'effectif = économie réalisée (${formatEuro(effetVolume)})`)
      }
    }
    
    if (Math.abs(variationPct) > 50) {
      comments.push(`⚡ Variation exceptionnelle de ${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(0)}% vs mois précédent`)
    }
    
    if (effetPrix !== 0 && effetVolume !== 0 && 
        Math.abs(effetPrix - effetVolume) < Math.abs(effetPrix) * 0.3) {
      comments.push(`⚖️ Effets Prix et Volume contribuent de manière équilibrée`)
    }
    
    if (comments.length === 0) {
      if (variationReelle > 0) {
        comments.push(`📊 Augmentation normale de la masse salariale (+${variationPct.toFixed(1)}%)`)
      } else if (variationReelle < 0) {
        comments.push(`📊 Diminution de la masse salariale (${variationPct.toFixed(1)}%)`)
      } else {
        comments.push(`📊 Masse salariale stable ce mois`)
      }
    }
    
    return comments
  }, [data, analysis])

  // ============================================
  // DONNÉES WATERFALL CASCADE
  // ============================================
  const { masseSalarialeM1, effetPrix, effetVolume, masseSalarialeM } = data
  
  // Calculer les hauteurs et positions
  const maxValue = Math.max(masseSalarialeM1, masseSalarialeM, masseSalarialeM1 + Math.abs(effetPrix) + Math.abs(effetVolume))
  const chartHeight = 400
  const barWidth = 120
  const gap = 80
  
  // Fonction pour convertir une valeur en pixels
  const valueToHeight = (value: number) => {
    return (value / maxValue) * (chartHeight - 100)
  }
  
  // Calculer les positions
  let cumulative = masseSalarialeM1
  
  const bars = [
    {
      name: 'Base M-1',
      x: 0,
      bottom: 0,
      height: valueToHeight(masseSalarialeM1),
      value: masseSalarialeM1,
      fill: '#64748b',
      isBase: true,
      label: formatEuroShort(masseSalarialeM1)
    },
    {
      name: 'Effet Prix',
      x: barWidth + gap,
      bottom: valueToHeight(cumulative),
      height: valueToHeight(Math.abs(effetPrix)),
      value: effetPrix,
      fill: effetPrix >= 0 ? '#ef4444' : '#10b981', // ✅ Inversé : + = rouge (coût), - = vert (économie)
      isBase: false,
      isPositive: effetPrix >= 0,
      label: (effetPrix >= 0 ? '+' : '') + formatEuroShort(effetPrix),
      connectFrom: cumulative
    },
    {
      name: 'Effet Volume',
      x: (barWidth + gap) * 2,
      bottom: valueToHeight(cumulative + effetPrix),
      height: valueToHeight(Math.abs(effetVolume)),
      value: effetVolume,
      fill: effetVolume >= 0 ? '#f59e0b' : '#10b981', // ✅ Inversé : + = orange (coût), - = vert (économie)
      isBase: false,
      isPositive: effetVolume >= 0,
      label: (effetVolume >= 0 ? '+' : '') + formatEuroShort(effetVolume),
      connectFrom: cumulative + effetPrix
    },
    {
      name: 'Base M',
      x: (barWidth + gap) * 3,
      bottom: 0,
      height: valueToHeight(masseSalarialeM),
      value: masseSalarialeM,
      fill: '#06b6d4',
      isBase: true,
      label: formatEuroShort(masseSalarialeM)
    }
  ]

  if (loading) {
    return <WaterfallSkeleton />
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles size={24} className="text-emerald-400" />
              Waterfall - Analyse Prix/Volume
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Décomposition en cascade de la variation de masse salariale
            </p>
          </div>
          
          {/* Badge de cohérence */}
          {analysis.coherenceOk ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle2 className="text-emerald-400" size={18} />
              <span className="text-emerald-300 text-sm font-semibold">Calculs vérifiés</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle className="text-red-400" size={18} />
              <span className="text-red-300 text-sm font-semibold">Incohérence {analysis.ecartPct.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Waterfall Chart SVG Custom */}
      <div className="relative p-8">
        <svg 
          width="100%" 
          height={chartHeight}
          viewBox={`0 0 ${(barWidth + gap) * 4} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto"
          style={{ maxWidth: '900px' }}
        >
          {/* Définitions pour les effets */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradients pour les barres */}
            <linearGradient id="grad-base" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Grille horizontale subtile */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <line
              key={i}
              x1="0"
              y1={chartHeight - 80 - (chartHeight - 100) * fraction}
              x2={(barWidth + gap) * 4}
              y2={chartHeight - 80 - (chartHeight - 100) * fraction}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.2"
            />
          ))}

          {/* Lignes de connexion (bridges) */}
          {bars.slice(0, -1).map((bar, index) => {
            const nextBar = bars[index + 1]
            if (bar.isBase || nextBar.isBase) return null
            
            const startX = bar.x + barWidth
            const startY = chartHeight - 80 - bar.bottom - (bar.isPositive ? bar.height : 0)
            const endX = nextBar.x
            const endY = chartHeight - 80 - nextBar.bottom
            
            return (
              <g key={`connector-${index}`}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.5"
                />
              </g>
            )
          })}

          {/* Barres du waterfall */}
          {bars.map((bar, index) => {
            const y = chartHeight - 80 - bar.bottom - bar.height
            const gradientId = bar.isBase 
              ? (bar.name === 'Base M-1' ? 'grad-base' : 'grad-cyan')
              : (bar.fill.includes('ef4444') ? 'grad-red' :     // Rouge pour augmentation de coût
                 bar.fill.includes('f59e0b') ? 'grad-orange' :  // Orange pour augmentation de coût (volume)
                 bar.fill.includes('10b981') ? 'grad-green' :   // Vert pour économie
                 'grad-base')

            return (
              <g key={index}>
                {/* Barre principale */}
                <rect
                  x={bar.x}
                  y={y}
                  width={barWidth}
                  height={bar.height}
                  fill={`url(#${gradientId})`}
                  rx="12"
                  opacity="0.9"
                  filter="url(#glow)"
                />
                
                {/* Bordure brillante */}
                <rect
                  x={bar.x}
                  y={y}
                  width={barWidth}
                  height={bar.height}
                  fill="none"
                  stroke={bar.fill}
                  strokeWidth="2"
                  rx="12"
                  opacity="0.6"
                />

                {/* Label avec valeur */}
                <g transform={`translate(${bar.x + barWidth / 2}, ${y + bar.height / 2})`}>
                  {/* Background du label */}
                  <rect
                    x="-50"
                    y="-16"
                    width="100"
                    height="32"
                    fill="rgba(15, 23, 42, 0.95)"
                    rx="8"
                    stroke={bar.fill}
                    strokeWidth="2"
                  />
                  {/* Texte */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="700"
                    style={{ textShadow: `0 0 10px ${bar.fill}` }}
                  >
                    {bar.label}
                  </text>
                </g>

                {/* Nom de la barre en dessous */}
                <text
                  x={bar.x + barWidth / 2}
                  y={chartHeight - 50}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="13"
                  fontWeight="600"
                >
                  {bar.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* SUMMARY CARDS */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* BASE M-1 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
          >
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Base M-1
            </div>
            <div className="text-white text-2xl font-bold">
              {formatEuro(data.masseSalarialeM1)}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              {periodeM1 ? formatDate(periodeM1) : 'Mois précédent'}
            </div>
          </motion.div>

          {/* EFFETS COMBINÉS */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-xl p-4 border border-cyan-500/30"
          >
            <div className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
              Variation totale
            </div>
            <div className={`text-2xl font-bold ${analysis.variationReelle >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {analysis.variationReelle >= 0 ? '+' : ''}{formatEuro(analysis.variationReelle)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${data.effetPrix >= 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <span className="text-slate-300">
                  {data.effetPrix >= 0 ? '+' : ''}{formatEuroShort(data.effetPrix)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${data.effetVolume >= 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <span className="text-slate-300">
                  {data.effetVolume >= 0 ? '+' : ''}{formatEuroShort(data.effetVolume)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* BASE M */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/30"
          >
            <div className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              Base M
            </div>
            <div className="text-white text-2xl font-bold">
              {formatEuro(data.masseSalarialeM)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {analysis.variationReelle >= 0 ? (
                <TrendingUp className="text-emerald-400" size={16} />
              ) : (
                <TrendingDown className="text-red-400" size={16} />
              )}
              <span className={`text-sm font-medium ${analysis.variationReelle >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {analysis.variationPct >= 0 ? '+' : ''}{analysis.variationPct.toFixed(1)}%
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* COMMENTAIRES INTELLIGENTS */}
      {commentary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-6 mb-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-indigo-500/30"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-indigo-400" size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                Analyse intelligente
              </h4>
              <div className="space-y-1.5">
                {commentary.map((comment, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-slate-300 text-sm leading-relaxed"
                  >
                    {comment}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ALERTE INCOHÉRENCE */}
      {!analysis.coherenceOk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-6 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold mb-1">Incohérence détectée</h4>
              <p className="text-slate-300 text-sm mb-2">
                Écart de {formatEuro(analysis.ecart)} ({analysis.ecartPct.toFixed(1)}%) 
                entre la variation réelle et la somme Prix + Volume.
              </p>
              <p className="text-slate-400 text-xs">
                💡 Exécutez <code className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400">SELECT calculate_payroll_effects_v3('{'{etablissement_id}'}'::UUID, '{'{periode}'}'::DATE);</code>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

const WaterfallSkeleton: React.FC = () => (
  <div className="animate-pulse bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-6">
    <div className="flex justify-between">
      <div>
        <div className="h-6 bg-slate-700 rounded w-64 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-48"></div>
      </div>
      <div className="h-10 bg-slate-700 rounded w-32"></div>
    </div>
    <div className="h-96 bg-slate-700/30 rounded-xl"></div>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-700/30 rounded-xl"></div>
      ))}
    </div>
  </div>
)

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function formatEuroShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`
  }
  return formatEuro(value)
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

WaterfallChart.displayName = 'WaterfallChart'