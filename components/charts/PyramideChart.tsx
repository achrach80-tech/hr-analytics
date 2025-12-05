// components/charts/PyramideChart.tsx
// Pyramide des âges ou anciennetés

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PyramideChartProps {
  data: Array<{
    range: string
    hommes: number
    femmes: number
  }>
  title: string
  type: 'ages' | 'anciennetes'
  className?: string
}

export function PyramideChart({ data, title, type, className = '' }: PyramideChartProps) {
  const gradient = type === 'ages' 
    ? { from: '#06b6d4', to: '#3b82f6' }
    : { from: '#3b82f6', to: '#6366f1' }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${type === 'ages' ? 'from-cyan-500 to-blue-500' : 'from-blue-500 to-indigo-500'}`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="range" 
              stroke="#64748b"
              fontSize={12}
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
            />
            <Legend 
              wrapperStyle={{ color: '#94a3b8' }}
            />
            <Bar dataKey="hommes" fill={gradient.from} name="Hommes" radius={[8, 8, 0, 0]} />
            <Bar dataKey="femmes" fill={gradient.to} name="Femmes" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}