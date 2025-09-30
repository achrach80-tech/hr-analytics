'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

interface WaterfallDataPoint {
  label: string
  value: number
  isTotal?: boolean
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  height?: number
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ 
  data, 
  height = 350
}) => {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value))
  }

  const chartData = useMemo(() => {
    let runningTotal = 0
    const bars = data.map((point, index) => {
      let startValue: number
      let endValue: number
      
      if (point.isTotal) {
        // Pour les totaux, la barre part de 0
        startValue = 0
        endValue = point.value
        runningTotal = point.value
      } else {
        // Pour les variations, la barre part du running total
        startValue = runningTotal
        endValue = runningTotal + point.value
        runningTotal = endValue
      }

      return {
        ...point,
        startValue,
        endValue,
        barHeight: Math.abs(endValue - startValue),
        isPositive: point.value >= 0,
        isIncrease: point.value > 0,
        index
      }
    })

    // Calcul de l'échelle
    const allValues = bars.flatMap(b => [b.startValue, b.endValue])
    const maxValue = Math.max(...allValues)
    const minValue = Math.min(...allValues, 0)
    const range = maxValue - minValue
    const scale = (height - 100) / range
    const baseY = maxValue * scale + 20

    return bars.map(bar => {
      const barTop = Math.min(bar.startValue, bar.endValue)
      const barBottom = Math.max(bar.startValue, bar.endValue)
      
      return {
        ...bar,
        displayHeight: bar.barHeight * scale,
        displayY: baseY - (barBottom * scale),
        baselineY: baseY
      }
    })
  }, [data, height])

  const barWidth = 80
  const gap = 60
  const totalWidth = chartData.length * (barWidth + gap) + gap * 2

  return (
    <div className="w-full overflow-x-auto pb-4">
      <svg 
        width={totalWidth} 
        height={height} 
        className="mx-auto"
        style={{ minWidth: '100%' }}
      >
        <defs>
  {/* Gradients corporate - couleurs professionnelles et sobres */}
  <linearGradient id="grad-increase" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.85" />
    <stop offset="100%" stopColor="#991b1b" stopOpacity="0.95" />
  </linearGradient>
  <linearGradient id="grad-decrease" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="#059669" stopOpacity="0.85" />
    <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
  </linearGradient>
  <linearGradient id="grad-total" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.85" />
    <stop offset="100%" stopColor="#0e7490" stopOpacity="0.95" />
  </linearGradient>
  
  {/* Glow effect réduit pour un look plus corporate */}
  <filter id="neon-glow">
    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>

        {/* Ligne de base (axe zéro) */}
        <line
          x1={0}
          y1={chartData[0]?.baselineY || height / 2}
          x2={totalWidth}
          y2={chartData[0]?.baselineY || height / 2}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.3"
        />

        {chartData.map((bar, index) => {
          const x = gap + index * (barWidth + gap)
          const nextBar = chartData[index + 1]
          
          // Déterminer la couleur
          let fillGradient: string
let strokeColor: string
let glowColor: string

if (bar.isTotal) {
  fillGradient = "url(#grad-total)"
  strokeColor = "#0891b2"
  glowColor = "rgba(8, 145, 178, 0.3)"
} else if (bar.isIncrease) {
  fillGradient = "url(#grad-increase)"
  strokeColor = "#dc2626"
  glowColor = "rgba(220, 38, 38, 0.3)"
} else {
  fillGradient = "url(#grad-decrease)"
  strokeColor = "#059669"
  glowColor = "rgba(5, 150, 105, 0.3)"
}

          return (
            <g key={index}>
              {/* Ligne de connexion pointillée vers la barre suivante */}
              {nextBar && !bar.isTotal && (
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ delay: index * 0.15 + 0.5, duration: 0.3 }}
                  x1={x + barWidth}
                  y1={bar.displayY + (bar.isIncrease ? 0 : bar.displayHeight)}
                  x2={x + barWidth + gap}
                  y2={bar.displayY + (bar.isIncrease ? 0 : bar.displayHeight)}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              )}

              {/* Barre invisible de base (pour le hover) */}
              {!bar.isTotal && (
                <motion.rect
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: bar.displayY + bar.displayHeight - bar.baselineY, opacity: 0.1 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  x={x}
                  y={bar.baselineY}
                  width={barWidth}
                  height={bar.displayY + bar.displayHeight - bar.baselineY}
                  fill="#1e293b"
                  rx="6"
                />
              )}

              {/* Barre principale avec animation */}
              <motion.rect
                initial={{ height: 0, y: bar.displayY + bar.displayHeight }}
                animate={{ height: bar.displayHeight, y: bar.displayY }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
                x={x}
                y={bar.displayY}
                width={barWidth}
                height={bar.displayHeight}
                fill={fillGradient}
                rx="6"
                filter="url(#neon-glow)"
              />

              {/* Bordure lumineuse */}
              <motion.rect
                initial={{ height: 0, y: bar.displayY + bar.displayHeight, opacity: 0 }}
                animate={{ height: bar.displayHeight, y: bar.displayY, opacity: 1 }}
                transition={{ delay: index * 0.15 + 0.2, duration: 0.5 }}
                x={x}
                y={bar.displayY}
                width={barWidth}
                height={bar.displayHeight}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                rx="6"
                style={{
                  filter: `drop-shadow(0 0 8px ${glowColor})`
                }}
              />

              {/* Valeur au-dessus de la barre */}
              <motion.text
                initial={{ opacity: 0, y: bar.displayY - 5 }}
                animate={{ opacity: 1, y: bar.displayY - 12 }}
                transition={{ delay: index * 0.15 + 0.4, duration: 0.3 }}
                x={x + barWidth / 2}
                y={bar.displayY - 12}
                textAnchor="middle"
                className="text-xs font-bold font-mono"
                fill={bar.isTotal ? "#0891b2" : bar.isIncrease ? "#c5003c" : "#39c4b6"}
                  style={{
                   filter: `drop-shadow(0 0 2px ${glowColor})`,  // Réduit de 4px à 2px
                    textShadow: `0 0 4px ${glowColor}`  // Réduit de 10px à 4px
                }}
              >
                {!bar.isTotal && bar.isIncrease ? '+' : !bar.isTotal && !bar.isIncrease ? '-' : ''}
                {formatValue(bar.value)}
              </motion.text>

              {/* Label en dessous */}
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.15 + 0.5, duration: 0.3 }}
                x={x + barWidth / 2}
                y={height - 35}
                textAnchor="middle"
                className="text-sm font-medium"
                fill="#cbd5e1"
              >
                {bar.label}
              </motion.text>

              {/* Valeur totale en dessous du label pour les totaux */}
              {bar.isTotal && (
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.6, duration: 0.3 }}
                  x={x + barWidth / 2}
                  y={height - 18}
                  textAnchor="middle"
                  className="text-xs font-bold"
                  fill="#06b6d4"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))'
                  }}
                >
                  {formatValue(bar.endValue)}
                </motion.text>
              )}

              {/* Grid lines horizontales (optionnel) */}
              {index === 0 && (
                <>
                  <line
                    x1={0}
                    y1={bar.displayY}
                    x2={totalWidth}
                    y2={bar.displayY}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="2,4"
                    opacity="0.2"
                  />
                  <line
                    x1={0}
                    y1={bar.displayY + bar.displayHeight}
                    x2={totalWidth}
                    y2={bar.displayY + bar.displayHeight}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="2,4"
                    opacity="0.2"
                  />
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}