// components/charts/EvolutionETChart.tsx
// Graphique évolution ETP (comme Dashboard)

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface EvolutionETChartProps {
  data: Array<{
    periode: string
    value: number
  }>
  className?: string
}

export function EvolutionETChart({ data, className = '' }: EvolutionETChartProps) {
  const formatDate = (dateStr: string) => {
    try {
      const [year, month] = dateStr.split('-')
      return `${month}/${year.slice(2)}`
    } catch {
      return dateStr
    }
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Évolution des ETP</h3>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="periode" 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={formatDate}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [value.toFixed(1), 'ETP']}
              labelFormatter={formatDate}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="url(#colorGradient)" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}