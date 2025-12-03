'use client'

import { useWaterfallData } from '@/lib/hooks/useWaterfallData'
import type { WaterfallData } from '@/lib/types/dashboard'
import { TrendingUp, TrendingDown, MessageSquare, AlertCircle, AlertTriangle } from 'lucide-react'

interface WaterfallChartProps {
  establishmentId: string
  period: string
}

export default function WaterfallChart({ establishmentId, period }: WaterfallChartProps) {
  const { data, loading, error } = useWaterfallData(establishmentId, period)

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l'analyse...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-semibold">Erreur de chargement</h3>
        </div>
        <p className="text-red-300/80 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl p-6">
        <p className="text-slate-400 text-center">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* En-tête section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          Analyse Prix / Volume
        </h2>
        <p className="text-slate-400 text-sm">
          Décomposition de la variation de masse salariale
        </p>
      </div>

      {/* Grid 2 waterfalls */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Waterfall M-1 */}
        {data.hasMonthBefore && data.vsMonthBefore ? (
          <WaterfallCard
            title="vs Mois Précédent"
            data={data.vsMonthBefore}
            color="cyan"
          />
        ) : (
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Données M-1 insuffisantes</p>
          </div>
        )}

        {/* Waterfall N-1 */}
        {data.hasYearBefore && data.vsYearBefore ? (
          <WaterfallCard
            title="vs Année Précédente"
            data={data.vsYearBefore}
            color="purple"
          />
        ) : (
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Historique insuffisant (&lt; 12 mois)</p>
          </div>
        )}

      </div>
    </div>
  )
}

export { WaterfallChart }

// ============================================
// WATERFALL CARD
// ============================================
function WaterfallCard({ 
  title, 
  data, 
  color 
}: {
  title: string
  data: WaterfallData
  color: 'cyan' | 'purple'
}) {
  const colors = color === 'cyan' ? {
    border: 'border-cyan-500/20',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  } : {
    border: 'border-purple-500/20',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10'
  }

  const comments = generateComments(data)

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border ${colors.border} rounded-xl p-6 space-y-6`}>
      
      {/* Header */}
      <div>
        <h3 className={`text-lg font-bold ${colors.accent} mb-1`}>
          {title}
        </h3>
        <p className="text-slate-500 text-xs">
          {formatPeriod(data.periodePrecedente)} → {formatPeriod(data.periodeCourante)}
        </p>
      </div>

      {/* Alerte incohérence */}
      {!data.coherenceOk && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-semibold text-sm">Incohérence mathématique</p>
              <p className="text-red-300/80 text-xs mt-1">
                Écart: {data.ecartCoherence.toFixed(2)} € ({data.ecartCoherencePct.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Variation */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <div className="text-slate-400 text-xs mb-2">Variation totale</div>
        <div className={`text-3xl font-bold flex items-center gap-3 ${
          data.variation === 0 ? 'text-slate-400' :
          data.variation > 0 ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {data.variation >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
          <span>{formatEuros(data.variation, true)}</span>
        </div>
        <div className="text-slate-500 text-sm mt-1">
          {data.variationPct >= 0 ? '+' : ''}{data.variationPct.toFixed(1)}% de variation
        </div>
      </div>

      {/* WATERFALL SVG */}
      <WaterfallSVG data={data} color={color} />

      {/* Détails ligne par ligne */}
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Base {formatPeriod(data.periodePrecedente)}</span>
          <span className="font-semibold text-white">{formatEuros(data.masseSalarialeM1)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Effet Prix (augmentations)</span>
          <span className={`font-semibold ${
            data.effetPrix === 0 ? 'text-slate-400' : 
            data.effetPrix > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatEuros(data.effetPrix, true)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Effet Volume (effectifs)</span>
          <span className={`font-semibold ${
            data.effetVolume === 0 ? 'text-slate-400' : 
            data.effetVolume > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatEuros(data.effetVolume, true)}
          </span>
        </div>
        
        <div className={`flex justify-between items-center py-3 ${colors.bg} rounded-lg px-4 mt-3`}>
          <span className="text-white font-semibold">Base {formatPeriod(data.periodeCourante)}</span>
          <span className={`font-bold text-xl ${colors.accent}`}>
            {formatEuros(data.masseSalarialeM)}
          </span>
        </div>
      </div>

      {/* Commentaires */}
      {comments.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-300">Analyse</span>
          </div>
          <ul className="space-y-2">
            {comments.map((comment, idx) => (
              <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{comment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/30">
        <div>
          <div className="text-xs text-slate-500 mb-1">Effectifs (ETP)</div>
          <div className="text-sm font-semibold text-white">
            {data.etpM1.toFixed(1)} → {data.etpM.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Coût moyen/ETP</div>
          <div className="text-sm font-semibold text-white">
            {formatEuros(data.coutMoyenM1, false, true)} → {formatEuros(data.coutMoyenM, false, true)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// WATERFALL SVG - ÉCHELLE OPTIMISÉE + GRIS POUR 0
// ============================================
function WaterfallSVG({
  data,
  color
}: {
  data: WaterfallData
  color: 'cyan' | 'purple'
}) {
  const baseColor = color === 'cyan' ? '#22d3ee' : '#c084fc'
  
  // Fonction pour obtenir couleur selon valeur (AVEC GRIS POUR 0)
  const getColor = (value: number) => {
    if (value === 0) return '#64748b'  // Gris slate-500
    return value > 0 ? '#ef4444' : '#10b981'  // Rouge ou Vert
  }
  
  const getTextColor = (value: number) => {
    if (value === 0) return '#94a3b8'  // Gris clair
    return value > 0 ? '#fca5a5' : '#6ee7b7'  // Rouge clair ou Vert clair
  }
  
  // Dimensions
  const WIDTH = 600
  const HEIGHT = 350
  const TOP_MARGIN = 50
  const BOTTOM_MARGIN = 60
  const BAR_WIDTH = 110
  const GAP = 25
  
  // Positions X
  const x1 = 40
  const x2 = x1 + BAR_WIDTH + GAP
  const x3 = x2 + BAR_WIDTH + GAP
  const x4 = x3 + BAR_WIDTH + GAP
  
  // ✅ ÉCHELLE OPTIMISÉE - Partir de 80% du minimum pour mieux voir les bases
  const values = [
    data.masseSalarialeM1,
    data.masseSalarialeM1 + data.effetPrix,
    data.masseSalarialeM1 + data.effetPrix + data.effetVolume,
    data.masseSalarialeM
  ]
  const minVal = Math.min(...values) * 0.80  // 80% au lieu de 95%
  const maxVal = Math.max(...values) * 1.05
  const range = maxVal - minVal
  
  const toY = (value: number) => {
    return TOP_MARGIN + (HEIGHT * (1 - (value - minVal) / range))
  }
  
  // Calculs positions
  const y1 = toY(data.masseSalarialeM1)
  const h1 = (TOP_MARGIN + HEIGHT) - y1
  
  const afterPrix = data.masseSalarialeM1 + data.effetPrix
  const y2 = toY(afterPrix)
  const y2Start = toY(data.masseSalarialeM1)
  const h2 = Math.abs(y2 - y2Start)
  
  const afterVolume = afterPrix + data.effetVolume
  const y3 = toY(afterVolume)
  const y3Start = toY(afterPrix)
  const h3 = Math.abs(y3 - y3Start)
  
  const y4 = toY(data.masseSalarialeM)
  const h4 = (TOP_MARGIN + HEIGHT) - y4

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl p-6 border border-slate-700/30 shadow-xl">
      <svg 
        viewBox={`0 0 ${WIDTH} ${HEIGHT + TOP_MARGIN + BOTTOM_MARGIN}`}
        className="w-full"
        style={{ height: '420px' }}
      >
        
        {/* Grille avec lignes horizontales subtiles */}
        {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
          const y = TOP_MARGIN + (ratio * HEIGHT)
          return (
            <line 
              key={i}
              x1={20} y1={y} x2={WIDTH - 20} y2={y}
              stroke="#1e293b" 
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.2}
            />
          )
        })}

        {/* Base M-1 */}
        <g>
          <rect
            x={x1} y={y1}
            width={BAR_WIDTH} height={h1}
            fill={baseColor}
            opacity={0.95}
            rx={8}
          />
          <text 
            x={x1 + BAR_WIDTH / 2} y={y1 - 12}
            textAnchor="middle" fill="#f1f5f9" fontSize="17" fontWeight="800"
          >
            {formatEuros(data.masseSalarialeM1, false, true)}
          </text>
          <text 
            x={x1 + BAR_WIDTH / 2} y={HEIGHT + TOP_MARGIN + 35}
            textAnchor="middle" fill="#cbd5e1" fontSize="15" fontWeight="700"
          >
            Base M-1
          </text>
        </g>

        {/* Connecteur 1→2 */}
        <line
          x1={x1 + BAR_WIDTH} y1={y2Start}
          x2={x2} y2={y2Start}
          stroke={getColor(data.effetPrix)}
          strokeWidth={3}
          strokeDasharray="6 4"
          opacity={0.6}
        />

        {/* Prix */}
        <g>
          <rect
            x={x2}
            y={Math.min(y2, y2Start)}
            width={BAR_WIDTH}
            height={Math.max(h2, 6)}
            fill={getColor(data.effetPrix)}
            opacity={0.95}
            rx={8}
          />
          <text 
            x={x2 + BAR_WIDTH / 2}
            y={Math.min(y2, y2Start) - 12}
            textAnchor="middle"
            fill={getTextColor(data.effetPrix)}
            fontSize="17"
            fontWeight="800"
          >
            {data.effetPrix === 0 ? '0 €' : formatEuros(data.effetPrix, true, true)}
          </text>
          <text 
            x={x2 + BAR_WIDTH / 2} y={HEIGHT + TOP_MARGIN + 35}
            textAnchor="middle" fill="#cbd5e1" fontSize="15" fontWeight="700"
          >
            Prix
          </text>
        </g>

        {/* Connecteur 2→3 */}
        <line
          x1={x2 + BAR_WIDTH} y1={y3Start}
          x2={x3} y2={y3Start}
          stroke={getColor(data.effetVolume)}
          strokeWidth={3}
          strokeDasharray="6 4"
          opacity={0.6}
        />

        {/* Volume */}
        <g>
          <rect
            x={x3}
            y={Math.min(y3, y3Start)}
            width={BAR_WIDTH}
            height={Math.max(h3, 6)}
            fill={getColor(data.effetVolume)}
            opacity={0.95}
            rx={8}
          />
          <text 
            x={x3 + BAR_WIDTH / 2}
            y={Math.min(y3, y3Start) - 12}
            textAnchor="middle"
            fill={getTextColor(data.effetVolume)}
            fontSize="17"
            fontWeight="800"
          >
            {data.effetVolume === 0 ? '0 €' : formatEuros(data.effetVolume, true, true)}
          </text>
          <text 
            x={x3 + BAR_WIDTH / 2} y={HEIGHT + TOP_MARGIN + 35}
            textAnchor="middle" fill="#cbd5e1" fontSize="15" fontWeight="700"
          >
            Volume
          </text>
        </g>

        {/* Connecteur 3→4 */}
        <line
          x1={x3 + BAR_WIDTH} y1={y4}
          x2={x4} y2={y4}
          stroke={baseColor}
          strokeWidth={3}
          strokeDasharray="6 4"
          opacity={0.6}
        />

        {/* Base M */}
        <g>
          <rect
            x={x4} y={y4}
            width={BAR_WIDTH} height={h4}
            fill={baseColor}
            opacity={0.95}
            rx={8}
          />
          <text 
            x={x4 + BAR_WIDTH / 2} y={y4 - 12}
            textAnchor="middle" fill="#f1f5f9" fontSize="17" fontWeight="800"
          >
            {formatEuros(data.masseSalarialeM, false, true)}
          </text>
          <text 
            x={x4 + BAR_WIDTH / 2} y={HEIGHT + TOP_MARGIN + 35}
            textAnchor="middle" fill="#cbd5e1" fontSize="15" fontWeight="700"
          >
            Base M
          </text>
        </g>

      </svg>
    </div>
  )
}

// ============================================
// GÉNÉRATION COMMENTAIRES
// ============================================
function generateComments(data: WaterfallData): string[] {
  const comments: string[] = []

  if (!data.coherenceOk) {
    comments.push(
      `⚠️ Incohérence mathématique (écart ${data.ecartCoherencePct.toFixed(2)}%)`
    )
  }

  const primesM = data.primesExceptionnellesM || 0
  const primesRatioM = primesM / data.masseSalarialeM
  
  if (primesRatioM > 0.05) {
    comments.push(
      `13ème mois ou primes: ${formatEuros(primesM)} (impacte effet prix)`
    )
  }

  if (Math.abs(data.effetPrix) > Math.abs(data.effetVolume) * 2 && Math.abs(data.effetPrix) > 5000) {
    comments.push(
      `Effet Prix dominant (${formatEuros(data.effetPrix, true)})`
    )
  } else if (Math.abs(data.effetVolume) > Math.abs(data.effetPrix) * 2 && Math.abs(data.effetVolume) > 5000) {
    const etpVar = data.etpM - data.etpM1
    comments.push(
      `Effet Volume dominant (${formatEuros(data.effetVolume, true)}) : ${Math.abs(etpVar).toFixed(1)} ETP`
    )
  }

  if (Math.abs(data.variationPct) > 30) {
    comments.push(
      `⚠️ Variation exceptionnelle de ${Math.abs(data.variationPct).toFixed(1)}%`
    )
  }

  return comments
}

// ============================================
// UTILITAIRES
// ============================================
function formatEuros(value: number, showSign = false, short = false): string {
  const absValue = Math.abs(value)
  
  if (short && absValue >= 1000) {
    const formatted = `${(absValue / 1000).toFixed(0)}k €`
    return showSign && value !== 0 
      ? (value >= 0 ? `+${formatted}` : `-${formatted}`)
      : formatted
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absValue)
  
  if (showSign && value !== 0) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return formatted
}

function formatPeriod(period: string): string {
  const date = new Date(period)
  return new Intl.DateTimeFormat('fr-FR', { 
    month: 'short', 
    year: 'numeric' 
  }).format(date)
}