// components/builder/ComponentRenderer.tsx
'use client'

import React from 'react'
import type { CanvasComponent } from '@/lib/store/builderStore'
import { getComponentById } from '@/lib/config/builderComponents'

interface ComponentRendererProps {
  component: CanvasComponent
  isPreview?: boolean
  kpiData?: any // Données KPI depuis le hook useOptimizedKPIData
  period?: string // Période sélectionnée
}

export function ComponentRenderer({ component, isPreview = false, kpiData, period }: ComponentRendererProps) {
  const definition = getComponentById(component.componentName)
  
  if (!definition) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-500/10 border-2 border-red-500 rounded-lg">
        <p className="text-red-400 text-sm">Component non trouvé: {component.componentName}</p>
      </div>
    )
  }

  // KPI Cards - Utiliser les vraies données si disponibles
  if (component.type === 'kpi_card') {
    return <KPICardPreview definition={definition} kpiData={kpiData} />
  }

  // Charts - Utiliser les vraies données si disponibles
  if (component.type === 'chart') {
    return <ChartPreview definition={definition} componentName={component.componentName} kpiData={kpiData} />
  }

  // Text
  if (component.type === 'text' || component.type === 'title') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-4 bg-slate-900/50 border border-cyan-500/20 rounded-lg"
        style={{
          fontSize: component.style?.fontSize || (component.type === 'title' ? 32 : 16),
          fontWeight: component.style?.fontWeight || (component.type === 'title' ? 'bold' : 'normal'),
          color: component.style?.color || '#06b6d4'
        }}
      >
        {component.content || (component.type === 'title' ? 'Titre du rapport' : 'Zone de texte...')}
      </div>
    )
  }

  return null
}

// ============================================
// KPI CARD PREVIEW - AVEC DONNÉES RÉELLES
// ============================================
function KPICardPreview({ definition, kpiData }: { definition: any; kpiData?: any }) {
  const { preview } = definition

  // 🔥 Extraire les vraies valeurs depuis kpiData selon le componentName
  let realValue = preview.value
  let realTrend = preview.trend
  
  if (kpiData) {
    // Mapper les component names aux vraies données
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
      default:
        // Garder les valeurs preview par défaut
        break
    }
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
      <div className="p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-cyan-400/70 text-sm font-medium uppercase tracking-wider">
              {preview.label}
            </span>
            {realTrend && (
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                realTrend.toString().startsWith('+') || parseFloat(realTrend) > 0
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {realTrend}
              </span>
            )}
          </div>
          
          <div className="mb-2">
            <div 
              className="text-4xl font-bold"
              style={{ color: preview.color }}
            >
              {realValue}
            </div>
          </div>
          
          {preview.subtitle && (
            <div className="text-slate-400 text-sm">
              {preview.subtitle}
            </div>
          )}
        </div>

        {/* Mini sparkline decorative */}
        <div className="mt-4 h-12">
          <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${definition.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={preview.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={preview.color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M0,30 Q50,25 100,20 T200,10 L200,40 L0,40 Z"
              fill={`url(#gradient-${definition.id})`}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CHART PREVIEWS - AVEC DONNÉES RÉELLES
// ============================================
function ChartPreview({ definition, componentName, kpiData }: { definition: any; componentName: string; kpiData?: any }) {
  const { preview } = definition

  if (componentName === 'waterfall_m1' || componentName === 'waterfall_n1') {
    return <WaterfallPreview label={preview.label} />
  }

  if (componentName === 'evolution_etp') {
    return <EvolutionETPPreview kpiData={kpiData} />
  }

  if (componentName === 'pyramide_ages' || componentName === 'pyramide_anciennetes') {
    return <PyramidePreview label={preview.label} />
  }

  if (componentName === 'repartition_genre') {
    return <RepartitionGenrePreview kpiData={kpiData} />
  }

  if (componentName === 'distribution_contrats') {
    return <DistributionContratsPreview kpiData={kpiData} />
  }

  return <GenericChartPreview label={preview.label} color={preview.color} />
}

// WATERFALL CHART
function WaterfallPreview({ label }: { label: string }) {
  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold text-lg mb-4">{label}</div>
      <svg width="100%" height="85%" viewBox="0 0 400 200">
        {/* Base M-1 */}
        <rect x="20" y="120" width="60" height="80" fill="#06b6d4" opacity="0.8" />
        <text x="50" y="110" textAnchor="middle" fill="#06b6d4" fontSize="12">193k</text>
        
        {/* Effet Prix */}
        <rect x="100" y="60" width="60" height="60" fill="#ef4444" opacity="0.8" />
        <text x="130" y="50" textAnchor="middle" fill="#ef4444" fontSize="12">+160k</text>
        
        {/* Pont invisible */}
        <line x1="80" y1="120" x2="100" y2="120" stroke="#64748b" strokeWidth="1" strokeDasharray="2" />
        <line x1="160" y1="60" x2="180" y2="60" stroke="#64748b" strokeWidth="1" strokeDasharray="2" />
        
        {/* Effet Volume */}
        <rect x="180" y="58" width="60" height="2" fill="#64748b" opacity="0.5" />
        <text x="210" y="50" textAnchor="middle" fill="#64748b" fontSize="12">0</text>
        
        {/* Base M */}
        <rect x="260" y="20" width="60" height="180" fill="#06b6d4" opacity="0.8" />
        <text x="290" y="10" textAnchor="middle" fill="#06b6d4" fontSize="12">353k</text>
        
        {/* Labels X */}
        <text x="50" y="215" textAnchor="middle" fill="#94a3b8" fontSize="10">Base M-1</text>
        <text x="130" y="215" textAnchor="middle" fill="#94a3b8" fontSize="10">Prix</text>
        <text x="210" y="215" textAnchor="middle" fill="#94a3b8" fontSize="10">Volume</text>
        <text x="290" y="215" textAnchor="middle" fill="#94a3b8" fontSize="10">Base M</text>
      </svg>
    </div>
  )
}

// ÉVOLUTION ETP - AVEC LABELS AU-DESSUS DES POINTS
function EvolutionETPPreview({ kpiData }: { kpiData?: any }) {
  // Valeurs par défaut
  const months = ['01/23', '02/23', '03/23', '04/23', '05/23', '06/23', '07/23', '08/23', '09/23', '10/23', '11/23', '12/23',
                  '01/24', '02/24', '03/24', '04/24', '05/24', '06/24', '07/24', '08/24', '09/24', '10/24', '11/24', '12/24']
  const defaultValues = [38.8, 42.2, 43.2, 44.2, 44.2, 46.2, 47, 47, 47, 48, 50, 49, 51, 52, 52, 49, 49, 49, 50, 50, 49, 50, 50, 50]
  
  // 🔥 TODO: Utiliser les vraies données d'évolution depuis kpiData si disponibles
  const values = defaultValues
  
  const width = 1200
  const height = 300
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const minValue = Math.min(...values) - 5
  const maxValue = Math.max(...values) + 5
  
  const points = values.map((val, i) => {
    const x = padding + (i * chartWidth / (values.length - 1))
    const y = height - padding - ((val - minValue) / (maxValue - minValue) * chartHeight)
    return { x, y, val, month: months[i] }
  })

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <div className="text-white font-semibold text-lg">Évolution des ETP</div>
      </div>
      <svg width="100%" height="85%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        
        {/* Grid horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - padding - (chartHeight * ratio)
          return (
            <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" opacity="0.2" />
          )
        })}
        
        {/* Line */}
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
        />
        
        {/* Points avec labels AU-DESSUS */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#a855f7" stroke="#fff" strokeWidth="2" />
            {/* LABEL AU-DESSUS DU POINT */}
            <text 
              x={p.x} 
              y={p.y - 12} 
              textAnchor="middle" 
              fill="#a855f7" 
              fontSize="14" 
              fontWeight="bold"
            >
              {p.val}
            </text>
          </g>
        ))}
        
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth="2" />
        
        {/* Labels X - TOUS LES MOIS EN BAS */}
        {months.map((month, i) => {
          const x = padding + (i * chartWidth / (values.length - 1))
          return (
            <text 
              key={month} 
              x={x} 
              y={height - padding + 25} 
              textAnchor="middle" 
              fill="#94a3b8" 
              fontSize="11"
              transform={`rotate(-45, ${x}, ${height - padding + 25})`}
            >
              {month}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// PYRAMIDE DES AGES/ANCIENNETES
function PyramidePreview({ label }: { label: string }) {
  const ageGroups = [
    { label: '<25', men: 15, women: 12 },
    { label: '25-35', men: 25, women: 22 },
    { label: '35-45', men: 35, women: 30 },
    { label: '45-55', men: 20, women: 25 },
    { label: '>55', men: 10, women: 15 }
  ]

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold text-lg mb-4">{label}</div>
      <svg width="100%" height="85%" viewBox="0 0 400 250">
        {ageGroups.map((group, i) => {
          const y = 30 + i * 40
          return (
            <g key={i}>
              {/* Hommes (gauche) */}
              <rect
                x={200 - group.men * 3}
                y={y}
                width={group.men * 3}
                height="30"
                fill="url(#menGradient)"
              />
              
              {/* Femmes (droite) */}
              <rect
                x="200"
                y={y}
                width={group.women * 3}
                height="30"
                fill="url(#womenGradient)"
              />
              
              {/* Label groupe */}
              <text x="200" y={y + 20} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                {group.label}
              </text>
            </g>
          )
        })}
        
        {/* Gradients */}
        <defs>
          <linearGradient id="menGradient" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="womenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Axe central */}
        <line x1="200" y1="20" x2="200" y2="230" stroke="#64748b" strokeWidth="2" />
        
        {/* Légende */}
        <text x="100" y="245" textAnchor="middle" fill="#06b6d4" fontSize="11">Hommes</text>
        <text x="300" y="245" textAnchor="middle" fill="#a855f7" fontSize="11">Femmes</text>
      </svg>
    </div>
  )
}

// RÉPARTITION GENRE - BARRES HORIZONTALES AVEC DONNÉES RÉELLES
function RepartitionGenrePreview({ kpiData }: { kpiData?: any }) {
  // Valeurs par défaut
  let pctHommes = 45.1
  let pctFemmes = 54.9

  // 🔥 Utiliser les vraies données si disponibles
  if (kpiData?.workforce) {
    pctHommes = kpiData.workforce.pctHommes || pctHommes
    pctFemmes = kpiData.workforce.pctFemmes || pctFemmes
  }

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold text-lg mb-6">Répartition Genre</div>
      <div className="h-full flex flex-col justify-center space-y-8">
        {/* Hommes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium">Hommes</span>
            <span className="text-cyan-400 font-bold">{pctHommes.toFixed(1)}%</span>
          </div>
          <div className="h-12 rounded-lg bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-lg"
              style={{
                width: `${pctHommes}%`,
                background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)'
              }}
            />
          </div>
        </div>
        
        {/* Femmes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 font-medium">Femmes</span>
            <span className="text-pink-400 font-bold">{pctFemmes.toFixed(1)}%</span>
          </div>
          <div className="h-12 rounded-lg bg-slate-800 overflow-hidden">
            <div 
              className="h-full rounded-lg"
              style={{
                width: `${pctFemmes}%`,
                background: 'linear-gradient(90deg, #ec4899 0%, #a855f7 100%)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// DISTRIBUTION CONTRATS - DONUT SIMPLE AVEC DONNÉES RÉELLES
function DistributionContratsPreview({ kpiData }: { kpiData?: any }) {
  // Valeurs par défaut
  let contracts = [
    { label: 'CDI', value: 68.6, color: '#10b981' },
    { label: 'CDD', value: 18.8, color: '#f59e0b' },
    { label: 'ALT', value: 7.8, color: '#3b82f6' },
    { label: 'STA', value: 4.7, color: '#a855f7' }
  ]

  let etpTotal = '50.0'

  // 🔥 Utiliser les vraies données si disponibles
  if (kpiData?.workforce) {
    const pctCDI = kpiData.workforce.pctCDI || 68.6
    // Pour l'instant, ces propriétés n'existent pas dans WorkforceKPIs
    // On utilise des calculs approximatifs
    const pctCDD = 18.8
    const pctALT = 7.8
    const pctSTA = 4.7

    contracts = [
      { label: 'CDI', value: pctCDI, color: '#10b981' },
      { label: 'CDD', value: pctCDD, color: '#f59e0b' },
      { label: 'ALT', value: pctALT, color: '#3b82f6' },
      { label: 'STA', value: pctSTA, color: '#a855f7' }
    ]

    etpTotal = kpiData.workforce.etpTotal?.toFixed(1) || '50.0'
  }

  const width = 600
  const height = 600
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = 180
  const innerRadius = 100

  let currentAngle = -90 // Commencer en haut

  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💼</span>
        <div className="text-white font-semibold text-lg">Distribution % Contrats</div>
      </div>
      <svg width="100%" height="85%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
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
          
          // Label position
          const midAngle = (startAngle + endAngle) / 2
          const midRad = (midAngle * Math.PI) / 180
          const labelRadius = outerRadius + 40
          const labelX = centerX + labelRadius * Math.cos(midRad)
          const labelY = centerY + labelRadius * Math.sin(midRad)
          
          currentAngle = endAngle
          
          return (
            <g key={i}>
              <path
                d={path}
                fill={`url(#grad${i})`}
                stroke="#0f172a"
                strokeWidth="3"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={contract.color}
                fontSize="16"
                fontWeight="bold"
              >
                {contract.label}: {contract.value.toFixed(1)}%
              </text>
            </g>
          )
        })}
        
        {/* Centre */}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="#0f172a" />
        <text x={centerX} y={centerY - 10} textAnchor="middle" fill="#94a3b8" fontSize="16">TOTAL ETP</text>
        <text x={centerX} y={centerY + 15} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">{etpTotal}</text>
      </svg>
    </div>
  )
}

// GENERIC CHART FALLBACK
function GenericChartPreview({ label, color }: { label: string; color: string }) {
  return (
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/20 p-6">
      <div className="text-cyan-400 font-semibold text-lg mb-4">{label}</div>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
          >
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