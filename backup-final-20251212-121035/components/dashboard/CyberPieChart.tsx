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
  
  // Filter out zero values
  const validData = data.filter(item => item.percentage > 0)
  
  let currentAngle = -90
  const segments = validData.map(item => {
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
    // Special case: if it's 100%, draw a full circle
    if (Math.abs(endAngle - startAngle) >= 359.9) {
      return `
        M ${150 + outerRadius} 150
        A ${outerRadius} ${outerRadius} 0 1 1 ${150 - outerRadius} 150
        A ${outerRadius} ${outerRadius} 0 1 1 ${150 + outerRadius} 150
        M ${150 + innerRadius} 150
        A ${innerRadius} ${innerRadius} 0 1 0 ${150 - innerRadius} 150
        A ${innerRadius} ${innerRadius} 0 1 0 ${150 + innerRadius} 150
        Z
      `
    }

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

  // Distribute labels evenly around the chart to avoid collisions
  const getLabelPosition = (segment: typeof segments[0], index: number) => {
    const midAngle = (segment.startAngle + segment.endAngle) / 2
    const midRad = (midAngle * Math.PI) / 180
    
    // Base radius for label positioning
    let radius = 135
    
    // For very small segments, push them further out and distribute evenly
    if (segment.percentage < 10) {
      radius = 155
      
      // If multiple small segments are close together, stagger them vertically
      const hasCloseNeighbor = segments.some((other, otherIndex) => {
        if (otherIndex === index) return false
        const otherMidAngle = (other.startAngle + other.endAngle) / 2
        const angleDiff = Math.abs(midAngle - otherMidAngle)
        return other.percentage < 10 && (angleDiff < 40 || angleDiff > 320)
      })
      
      if (hasCloseNeighbor) {
        // Alternate positions for close neighbors
        const stagger = index % 2 === 0 ? 10 : -10
        radius += stagger
      }
    }
    
    const x = 150 + radius * Math.cos(midRad)
    const y = 150 + radius * Math.sin(midRad)
    
    // Determine text anchor
    let anchor: 'start' | 'middle' | 'end' = 'middle'
    if (midAngle > -80 && midAngle < 80) {
      anchor = 'start'
    } else if (midAngle > 100 || midAngle < -100) {
      anchor = 'end'
    }
    
    return { x, y, anchor, radius }
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
          <svg width="380" height="380" viewBox="0 0 380 380" className="overflow-visible">
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

            <g transform="translate(40, 40)">
              {segments.map((segment, index) => {
                const labelPos = getLabelPosition(segment, index)
                const midAngle = (segment.startAngle + segment.endAngle) / 2
                const midRad = (midAngle * Math.PI) / 180
                
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

                    {segment.percentage < 100 && (
                      <motion.line
                        x1={150 + 100 * Math.cos(midRad)}
                        y1={150 + 100 * Math.sin(midRad)}
                        x2={labelPos.x - (labelPos.anchor === 'start' ? 8 : labelPos.anchor === 'end' ? -8 : 0)}
                        y2={labelPos.y}
                        stroke={segment.color}
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        opacity="0.7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                      />
                    )}

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
                        fontSize={segment.percentage < 8 ? "12" : "13"}
                        fontWeight="600"
                        style={{ 
                          textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8)',
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
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}