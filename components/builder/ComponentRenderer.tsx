// components/builder/ComponentRenderer.tsx
// ✅ FINAL CORRIGÉ - Import WaterfallData ajouté

'use client'

import React from 'react'
import type { CanvasComponent } from '@/lib/store/builderStore'
import { getComponentById } from '@/lib/config/builderComponents'
import type { DualWaterfallData, WaterfallData } from '@/lib/types/dashboard'

interface ComponentRendererProps {
  component: CanvasComponent
  isPreview?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kpiData?: any
  waterfallData?: DualWaterfallData | null
  period?: string
}

export function ComponentRenderer({ component, isPreview = false, kpiData, waterfallData, period }: ComponentRendererProps) {
  const definition = getComponentById(component.componentName)
  
  if (!definition) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-500/10 border-2 border-red-500 rounded-lg">
        <p className="text-red-400 text-sm">Component non trouvé: {component.componentName}</p>
      </div>
    )
  }

  if (component.type === 'kpi_card') {
    return <KPICardPreview definition={definition} kpiData={kpiData} />
  }

  if (component.type === 'chart') {
    return <ChartPreview 
      definition={definition} 
      componentName={component.componentName} 
      componentSize={component.size} 
      kpiData={kpiData}
      waterfallData={waterfallData}
    />
  }

  if (component.type === 'text' || component.type === 'title') {
    return (
      <div 
        className="w-full h-full flex items-center p-4 bg-slate-900/50 border border-cyan-500/20 rounded-lg"
        style={{
          fontSize: component.style?.fontSize || (component.type === 'title' ? 32 : 16),
          fontWeight: component.style?.fontWeight || (component.type === 'title' ? 'bold' : 'normal'),
          textAlign: (component.style?.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left'
        }}
      >
        <div 
          dangerouslySetInnerHTML={{ 
            __html: component.content || (component.type === 'title' ? 'Titre du rapport' : 'Zone de texte...') 
          }}
          style={{
            width: '100%',
            color: component.style?.color || '#06b6d4'
          }}
        />
      </div>
    )
  }

  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KPICardPreview({ definition, kpiData }: { definition: any; kpiData?: any }) {
  const { preview } = definition
  let realValue = preview.value
  let realTrend = preview.trend
  
  if (kpiData) {
    switch (definition.id) {
      case 'etp_total':
        realValue = kpiData.workforce?.etpTotal?.toFixed(1) || preview.value
        realTrend = kpiData.workforce?.etpTotalEvolution || preview.trend
        break
      case 'effectif_actif':
        realValue = kpiData.workforce?.headcountActif || preview.value
        realTrend = kpiData.workforce?.headcountActifEvolution || preview.trend
        break
      case 'age_moyen':
        realValue = `${kpiData.workforce?.ageMoyen?.toFixed(1) || preview.value.replace(' ans', '')} ans`
        break
      case 'turnover':
        realValue = `${kpiData.workforce?.tauxTurnover?.toFixed(1) || preview.value.replace('%', '')}%`
        break
      case 'pct_cdi':
        realValue = `${kpiData.workforce?.pctCDI?.toFixed(1) || preview.value.replace('%', '')}%`
        break
      case 'taux_absence':
        realValue = `${kpiData.absences?.tauxAbsenteisme?.toFixed(1) || preview.value.replace('%', '')}%`
        realTrend = kpiData.absences?.tauxAbsenteismeEvolution || preview.trend
        break
      case 'jours_absence':
        realValue = kpiData.absences?.nbJoursAbsence?.toFixed(0) || preview.value
        realTrend = kpiData.absences?.nbJoursAbsenceEvolution || preview.trend
        break
    }
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <div className="p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-cyan-400/70 text-sm font-medium uppercase tracking-wider">{preview.label}</span>
            {realTrend && (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                realTrend.toString().startsWith('+') || parseFloat(realTrend) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>{realTrend}</span>
            )}
          </div>
          <div className="mb-2">
            <div className="text-4xl font-bold" style={{ color: preview.color }}>{realValue}</div>
          </div>
          {preview.subtitle && <div className="text-slate-400 text-sm">{preview.subtitle}</div>}
        </div>
        <div className="mt-4 h-12">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${definition.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={preview.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={preview.color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,30 Q50,25 100,20 T200,10 L200,40 L0,40 Z" fill={`url(#gradient-${definition.id})`} />
          </svg>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartPreview({ definition, componentName, componentSize, kpiData, waterfallData }: { 
  definition: any
  componentName: string
  componentSize: { width: number; height: number }
  kpiData?: any
  waterfallData?: DualWaterfallData | null
}) {
  const { preview } = definition

  if (componentName === 'waterfall_m1') {
    return <WaterfallPreview label="vs Mois Précédent" height={componentSize.height} data={waterfallData?.vsMonthBefore || null} />
  }
  if (componentName === 'waterfall_n1') {
    return <WaterfallPreview label="vs Année Précédente" height={componentSize.height} data={waterfallData?.vsYearBefore || null} />
  }
  if (componentName === 'evolution_etp') {
    return <EvolutionETPPreview height={componentSize.height} kpiData={kpiData} />
  }
  if (componentName === 'pyramide_ages') {
    return <PyramideAgesPreview kpiData={kpiData} />
  }
  if (componentName === 'pyramide_anciennetes') {
    return <PyramideAnciennetesPreview kpiData={kpiData} />
  }
  if (componentName === 'repartition_genre') {
    return <RepartitionGenrePreview height={componentSize.height} kpiData={kpiData} />
  }
  if (componentName === 'distribution_contrats') {
    return <DistributionContratsPreview height={componentSize.height} kpiData={kpiData} />
  }

  return <GenericChartPreview label={preview.label} color={preview.color} />
}

function WaterfallPreview({ label, height, data }: { label: string; height: number; data: WaterfallData | null }) {
  const titleSize = Math.max(14, Math.min(24, height * 0.06))

  if (!data) {
    return (
      <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Données insuffisantes pour {label}</p>
          <p className="text-slate-500 text-xs mt-2">Historique requis</p>
        </div>
      </div>
    )
  }

  // Helpers
  const formatEuros = (value: number, short = false): string => {
    const absValue = Math.abs(value)
    if (short && absValue >= 1000) return `${(absValue / 1000).toFixed(0)}k €`
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(absValue)
  }

  const getColor = (value: number): string => {
    if (value === 0) return '#64748b'
    return value > 0 ? '#ef4444' : '#10b981'
  }

  // Calcul des positions Y pour les colonnes (échelle dynamique)
  const values = [
    data.masseSalarialeM1,
    Math.abs(data.effetPrix),
    Math.abs(data.effetVolume),
    data.masseSalarialeM
  ]
  const maxValue = Math.max(...values)
  const scale = maxValue > 0 ? 160 / maxValue : 1

  // Positions des colonnes
  const baseM1Height = data.masseSalarialeM1 * scale
  const baseM1Y = 180 - baseM1Height

  // Prix: part de baseM1Y si positif, sinon en dessous
  let currentTop = baseM1Y
  const prixHeight = Math.abs(data.effetPrix) * scale
  const prixY = data.effetPrix > 0 ? currentTop - prixHeight : currentTop
  currentTop = data.effetPrix > 0 ? prixY : prixY + prixHeight

  // Volume: continue depuis currentTop
  const volumeHeight = Math.abs(data.effetVolume) * scale
  const volumeY = data.effetVolume > 0 ? currentTop - volumeHeight : currentTop

  // Base M
  const baseMHeight = data.masseSalarialeM * scale
  const baseMY = 180 - baseMHeight

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold mb-4" style={{ fontSize: `${titleSize}px` }}>{label}</div>
      
      <svg width="100%" height="85%" viewBox="0 0 400 200">
        {/* Base M-1 */}
        <rect 
          x="20" 
          y={baseM1Y} 
          width="60" 
          height={baseM1Height} 
          fill="#06b6d4" 
          opacity="0.9" 
          rx="2" 
        />
        <text 
          x="50" 
          y={baseM1Y - 8} 
          textAnchor="middle" 
          fill="#06b6d4" 
          fontSize="12" 
          fontWeight="bold"
        >
          {formatEuros(data.masseSalarialeM1, true)}
        </text>
        
        {/* Pont M-1 → Prix */}
        <line 
          x1="80" 
          y1={baseM1Y + baseM1Height} 
          x2="100" 
          y2={baseM1Y + baseM1Height} 
          stroke="#475569" 
          strokeWidth="1.5" 
          strokeDasharray="3" 
        />
        
        {/* Prix */}
        <rect 
          x="100" 
          y={prixY} 
          width="60" 
          height={prixHeight || 2} 
          fill={getColor(data.effetPrix)} 
          opacity="0.9" 
          rx="2" 
        />
        <text 
          x="130" 
          y={prixY - 8} 
          textAnchor="middle" 
          fill={getColor(data.effetPrix)} 
          fontSize="12" 
          fontWeight="bold"
        >
          {data.effetPrix >= 0 ? '+' : '-'}{formatEuros(data.effetPrix, true)}
        </text>
        
        {/* Pont Prix → Volume */}
        <line 
          x1="160" 
          y1={currentTop} 
          x2="180" 
          y2={currentTop} 
          stroke="#475569" 
          strokeWidth="1.5" 
          strokeDasharray="3" 
        />
        
        {/* Volume */}
        <rect 
          x="180" 
          y={volumeY} 
          width="60" 
          height={volumeHeight || 2} 
          fill={getColor(data.effetVolume)} 
          opacity="0.9" 
          rx="2" 
        />
        <text 
          x="210" 
          y={volumeY - 8} 
          textAnchor="middle" 
          fill={getColor(data.effetVolume)} 
          fontSize="12" 
          fontWeight="bold"
        >
          {data.effetVolume === 0 ? '0€' : `${data.effetVolume >= 0 ? '+' : '-'}${formatEuros(data.effetVolume, true)}`}
        </text>
        
        {/* Pont Volume → Base M */}
        <line 
          x1="240" 
          y1={data.effetVolume > 0 ? volumeY : volumeY + volumeHeight} 
          x2="260" 
          y2={data.effetVolume > 0 ? volumeY : volumeY + volumeHeight} 
          stroke="#475569" 
          strokeWidth="1.5" 
          strokeDasharray="3" 
        />
        
        {/* Base M */}
        <rect 
          x="260" 
          y={baseMY} 
          width="60" 
          height={baseMHeight} 
          fill="#06b6d4" 
          opacity="0.9" 
          rx="2" 
        />
        <text 
          x="290" 
          y={baseMY - 8} 
          textAnchor="middle" 
          fill="#06b6d4" 
          fontSize="12" 
          fontWeight="bold"
        >
          {formatEuros(data.masseSalarialeM, true)}
        </text>
        
        {/* Labels X */}
        <text x="50" y="198" textAnchor="middle" fill="#94a3b8" fontSize="10">Base M-1</text>
        <text x="130" y="198" textAnchor="middle" fill="#94a3b8" fontSize="10">Prix</text>
        <text x="210" y="198" textAnchor="middle" fill="#94a3b8" fontSize="10">Volume</text>
        <text x="290" y="198" textAnchor="middle" fill="#94a3b8" fontSize="10">Base M</text>
      </svg>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EvolutionETPPreview({ height, kpiData }: { height: number; kpiData?: any }) {
  const titleSize = Math.max(14, Math.min(24, height * 0.06))
  const months = ['01/24', '02/24', '03/24', '04/24', '05/24', '06/24', '07/24', '08/24', '09/24', '10/24', '11/24', '12/24']
  const values = [51, 52, 52, 49, 49, 49, 50, 50, 49, 50, 50, 50]
  const width = 1000
  const chartHeight = 400
  const padding = 80
  const chartWidth = width - padding * 2
  const innerHeight = chartHeight - padding * 2
  const minValue = Math.floor(Math.min(...values) - 2)
  const maxValue = Math.ceil(Math.max(...values) + 2)
  const points = values.map((val, i) => ({
    x: padding + (i * chartWidth / (values.length - 1)),
    y: chartHeight - padding - ((val - minValue) / (maxValue - minValue) * innerHeight),
    val,
    month: months[i]
  }))
  const yTicks = []
  for (let i = 0; i <= 5; i++) {
    yTicks.push({
      value: (minValue + (maxValue - minValue) * (i / 5)).toFixed(1),
      y: chartHeight - padding - (innerHeight * i / 5)
    })
  }

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <div className="text-white font-semibold" style={{ fontSize: `${titleSize}px` }}>Évolution des ETP</div>
      </div>
      <svg width="100%" height="85%" viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding} y1={tick.y} x2={width - padding} y2={tick.y} stroke="#334155" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
            <text x={padding - 10} y={tick.y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" fontSize="14" fontWeight="500">{tick.value}</text>
          </g>
        ))}
        <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="url(#lineGradient)" strokeWidth="4" filter="url(#glow)" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="7" fill="#8b5cf6" stroke="#fff" strokeWidth="3" />
            <text x={p.x} y={p.y - 20} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{p.val.toFixed(1)}</text>
          </g>
        ))}
        <line x1={padding} y1={chartHeight - padding} x2={width - padding} y2={chartHeight - padding} stroke="#475569" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#475569" strokeWidth="2" />
        {points.map((p, i) => (
          <text key={i} x={p.x} y={chartHeight - padding + 25} textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="500">{months[i]}</text>
        ))}
      </svg>
    </div>
  )
}

function PyramideAgesPreview({ kpiData }: { kpiData?: any }) {
  const ageGroups = [
    { label: '> 55 ans', hommes: 0.0, femmes: 0.0 },
    { label: '45-55 ans', hommes: 0.0, femmes: 0.0 },
    { label: '35-45 ans', hommes: 16.8, femmes: 20.5 },
    { label: '25-35 ans', hommes: 21.2, femmes: 25.8 },
    { label: '< 25 ans', hommes: 7.1, femmes: 8.6 }
  ]
  const maxValue = Math.max(...ageGroups.flatMap(g => [g.hommes, g.femmes]), 1)

  return (
    <div className="h-full w-full relative p-4 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-white font-bold text-base"><span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">Pyramide des Âges</span></h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" /><span className="text-slate-300 text-xs font-semibold">HOMMES</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" /><span className="text-slate-300 text-xs font-semibold">FEMMES</span></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2">
          {ageGroups.map((group) => (
            <div key={group.label} className="flex items-stretch gap-2 flex-1">
              <div className="flex-1 flex justify-end items-center">
                <div className="relative h-full bg-slate-800/50 rounded-l-xl overflow-hidden border-l border-y border-slate-700/30 w-full flex items-center">
                  <div className="absolute right-0 h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-700" style={{ width: `${(group.hommes / maxValue) * 100}%` }} />
                  {group.hommes > 0 && <div className="absolute inset-0 flex items-center justify-end pr-2"><span className="text-white font-bold text-xs z-10">{group.hommes.toFixed(1)}%</span></div>}
                </div>
              </div>
              <div className="px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-xl min-w-[90px] text-center flex items-center justify-center"><span className="text-white font-semibold text-xs">{group.label}</span></div>
              <div className="flex-1 flex items-center">
                <div className="relative h-full bg-slate-800/50 rounded-r-xl overflow-hidden border-r border-y border-slate-700/30 w-full flex items-center">
                  <div className="absolute left-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 transition-all duration-700" style={{ width: `${(group.femmes / maxValue) * 100}%` }} />
                  {group.femmes > 0 && <div className="absolute inset-0 flex items-center justify-start pl-2"><span className="text-white font-bold text-xs z-10">{group.femmes.toFixed(1)}%</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PyramideAnciennetesPreview({ kpiData }: { kpiData?: any }) {
  const seniorityGroups = [
    { label: '> 10 ans', hommes: 0.0, femmes: 0.0 },
    { label: '5-10 ans', hommes: 8.0, femmes: 9.7 },
    { label: '3-5 ans', hommes: 12.4, femmes: 15.1 },
    { label: '1-3 ans', hommes: 20.3, femmes: 24.8 },
    { label: '< 1 an', hommes: 4.4, femmes: 5.4 }
  ]
  const maxValue = Math.max(...seniorityGroups.flatMap(g => [g.hommes, g.femmes]), 1)

  return (
    <div className="h-full w-full relative p-4 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-white font-bold text-base"><span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">Pyramide des Anciennetés</span></h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" /><span className="text-slate-300 text-xs font-semibold">HOMMES</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" /><span className="text-slate-300 text-xs font-semibold">FEMMES</span></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-2">
          {seniorityGroups.map((group) => (
            <div key={group.label} className="flex items-stretch gap-2 flex-1">
              <div className="flex-1 flex justify-end items-center">
                <div className="relative h-full bg-slate-800/50 rounded-l-xl overflow-hidden border-l border-y border-slate-700/30 w-full flex items-center">
                  <div className="absolute right-0 h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-700" style={{ width: `${(group.hommes / maxValue) * 100}%` }} />
                  {group.hommes > 0 && <div className="absolute inset-0 flex items-center justify-end pr-2"><span className="text-white font-bold text-xs z-10">{group.hommes.toFixed(1)}%</span></div>}
                </div>
              </div>
              <div className="px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-xl min-w-[90px] text-center flex items-center justify-center"><span className="text-white font-semibold text-xs">{group.label}</span></div>
              <div className="flex-1 flex items-center">
                <div className="relative h-full bg-slate-800/50 rounded-r-xl overflow-hidden border-r border-y border-slate-700/30 w-full flex items-center">
                  <div className="absolute left-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 transition-all duration-700" style={{ width: `${(group.femmes / maxValue) * 100}%` }} />
                  {group.femmes > 0 && <div className="absolute inset-0 flex items-center justify-start pl-2"><span className="text-white font-bold text-xs z-10">{group.femmes.toFixed(1)}%</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RepartitionGenrePreview({ height, kpiData }: { height: number; kpiData?: any }) {
  const titleSize = Math.max(14, Math.min(24, height * 0.06))
  let pctHommes = 45.1
  let pctFemmes = 54.9
  if (kpiData?.workforce) {
    pctHommes = kpiData.workforce.pctHommes || pctHommes
    pctFemmes = kpiData.workforce.pctFemmes || pctFemmes
  }

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold mb-6" style={{ fontSize: `${titleSize}px` }}>Répartition Genre</div>
      <div className="h-full flex flex-col justify-center space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium">Hommes</span>
            <span className="text-cyan-400 font-bold">{pctHommes.toFixed(1)}%</span>
          </div>
          <div className="h-12 rounded-lg bg-slate-800 overflow-hidden">
            <div className="h-full rounded-lg" style={{ width: `${pctHommes}%`, background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium">Femmes</span>
            <span className="text-pink-400 font-bold">{pctFemmes.toFixed(1)}%</span>
          </div>
          <div className="h-12 rounded-lg bg-slate-800 overflow-hidden">
            <div className="h-full rounded-lg" style={{ width: `${pctFemmes}%`, background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DistributionContratsPreview({ height, kpiData }: { height: number; kpiData?: any }) {
  const titleSize = Math.max(14, Math.min(24, height * 0.06))
  const contracts = [
    { label: 'CDI', value: 68.6, color: '#10b981' },
    { label: 'CDD', value: 18.8, color: '#f59e0b' },
    { label: 'ALT', value: 7.8, color: '#3b82f6' },
    { label: 'STA', value: 4.7, color: '#a855f7' }
  ]
  let etpTotal = '50.0'
  if (kpiData?.workforce) {
    contracts[0].value = kpiData.workforce.pctCDI || 68.6
    etpTotal = kpiData.workforce.etpTotal?.toFixed(1) || '50.0'
  }

  const width = 600
  const svgHeight = 600
  const centerX = width / 2
  const centerY = svgHeight / 2
  const outerRadius = 180
  const innerRadius = 100
  let currentAngle = -90

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💼</span>
        <div className="text-white font-semibold" style={{ fontSize: `${titleSize}px` }}>Distribution % Contrats</div>
      </div>
      <svg width="100%" height="85%" viewBox={`0 0 ${width} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {contracts.map((c, i) => (
            <linearGradient key={i} id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        {contracts.map((contract, i) => {
          const angleSize = (contract.value / 100) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angleSize
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          const x1 = centerX + outerRadius * Math.cos(startRad)
          const y1 = centerY + outerRadius * Math.sin(startRad)
          const x2 = centerX + outerRadius * Math.cos(endRad)
          const y2 = centerY + outerRadius * Math.sin(endRad)
          const x3 = centerX + innerRadius * Math.cos(endRad)
          const y3 = centerY + innerRadius * Math.sin(endRad)
          const x4 = centerX + innerRadius * Math.cos(startRad)
          const y4 = centerY + innerRadius * Math.sin(startRad)
          const largeArc = angleSize > 180 ? 1 : 0
          const path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
          const midAngle = (startAngle + endAngle) / 2
          const midRad = (midAngle * Math.PI) / 180
          const labelRadius = outerRadius + 40
          const labelX = centerX + labelRadius * Math.cos(midRad)
          const labelY = centerY + labelRadius * Math.sin(midRad)
          currentAngle = endAngle
          return (
            <g key={i}>
              <path d={path} fill={`url(#grad${i})`} stroke="#0f172a" strokeWidth="3" />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill={contract.color} fontSize="16" fontWeight="bold">
                {contract.label}: {contract.value.toFixed(1)}%
              </text>
            </g>
          )
        })}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="#0f172a" />
        <text x={centerX} y={centerY - 10} textAnchor="middle" fill="#94a3b8" fontSize="16">TOTAL ETP</text>
        <text x={centerX} y={centerY + 15} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">{etpTotal}</text>
      </svg>
    </div>
  )
}

function GenericChartPreview({ label, color }: { label: string; color: string }) {
  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold text-lg mb-4">{label}</div>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}>
            <svg className="w-8 h-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Aperçu du graphique</p>
        </div>
      </div>
    </div>
  )
}