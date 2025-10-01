'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ContractData {
  name: string
  value: number
  percentage: number
  color: string
}

interface CyberPieChartProps {
  data: ContractData[]
  title: string
  icon?: React.ElementType
}

export const CyberPieChart: React.FC<CyberPieChartProps> = ({ data, title, icon: Icon }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let currentAngle = -90
  const segments = data.map(item => {
    const angle = (item.percentage / 100) * 360
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      angle
    }
    currentAngle += angle
    return segment
  })

  const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = 150 + outerRadius * Math.cos(startRad)
    const y1 = 150 + outerRadius * Math.sin(startRad)
    const x2 = 150 + outerRadius * Math.cos(endRad)
    const y2 = 150 + outerRadius * Math.sin(endRad)

    const x3 = 150 + innerRadius * Math.cos(endRad)
    const y3 = 150 + innerRadius * Math.sin(endRad)
    const x4 = 150 + innerRadius * Math.cos(startRad)
    const y4 = 150 + innerRadius * Math.sin(startRad)

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    return `
      M ${x1} ${y1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `
  }

  // ✅ FIX: Typage strict pour textAnchor
  const getLabelPosition = (startAngle: number, endAngle: number, percentage: number): {
    x: number
    y: number
    anchor: 'start' | 'end'
  } => {
    const midAngle = (startAngle + endAngle) / 2
    const midRad = (midAngle * Math.PI) / 180
    const radius = percentage < 8 ? 135 : 125
    
    return {
      x: 150 + radius * Math.cos(midRad),
      y: 150 + radius * Math.sin(midRad),
      anchor: (midAngle > -90 && midAngle < 90) ? 'start' : 'end'
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6">
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-purple-500" />
      
      <div className="relative z-10">
        {Icon && (
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <Icon size={20} className="text-orange-400" />
            {title}
          </h3>
        )}
        
        <div className="flex items-center justify-center">
          <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
            <defs>
              {segments.map((segment, index) => (
                <linearGradient key={`gradient-${index}`} id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
                </linearGradient>
              ))}
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {segments.map((segment, index) => {
              const labelPos = getLabelPosition(segment.startAngle, segment.endAngle, segment.percentage)
              
              return (
                <g key={index}>
                  <motion.path
                    d={createArc(segment.startAngle, segment.endAngle, 70, 100)}
                    fill={`url(#grad-${index})`}
                    stroke={segment.color}
                    strokeWidth="2"
                    filter="url(#glow)"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05,
                      filter: 'url(#glow) brightness(1.2)'
                    }}
                    style={{ transformOrigin: '150px 150px', cursor: 'pointer' }}
                  />

                  <motion.line
                    x1={150 + 100 * Math.cos(((segment.startAngle + segment.endAngle) / 2) * Math.PI / 180)}
                    y1={150 + 100 * Math.sin(((segment.startAngle + segment.endAngle) / 2) * Math.PI / 180)}
                    x2={labelPos.x - (labelPos.anchor === 'start' ? 5 : -5)}
                    y2={labelPos.y}
                    stroke={segment.color}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    opacity="0.6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                  />

                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  >
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor={labelPos.anchor}
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={segment.percentage < 8 ? "11" : "13"}
                      fontWeight="600"
                      style={{ 
                        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                        pointerEvents: 'none'
                      }}
                    >
                      {`${segment.name}: ${segment.percentage.toFixed(1)}%`}
                    </text>
                  </motion.g>
                </g>
              )
            })}

            <circle
  cx="150"
  cy="150"
  r="70"
  fill="rgba(15, 23, 42, 0.8)"
  stroke="rgba(148, 163, 184, 0.3)"
  strokeWidth="1"
/>

<text
  x="150"
  y="135"
  textAnchor="middle"
  fill="#94a3b8"
  fontSize="12"
  fontWeight="500"
>
  TOTAL ETP
</text>

{/* ✅ FIX: Afficher 1 décimale */}
<text
  x="150"
  y="160"
  textAnchor="middle"
  fill="white"
  fontSize="20"
  fontWeight="bold"
>
  {total.toFixed(1)}
</text>
          </svg>
        </div>
      </div>
    </div>
  )
}