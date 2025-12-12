// components/charts/WaterfallChart.tsx
// Waterfall Prix/Volume

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface WaterfallChartProps {
  data: {
    effectifDebut: number
    entrees: { value: number; label: string }
    sorties: { value: number; label: string }
    effetPrix: { value: number; label: string }
    effetVolume: { value: number; label: string }
    effectifFin: number
  }
  title: string
  type: 'm1' | 'n1'
  className?: string
}

export function SimpleWaterfallChart({ data, title, type, className = '' }: WaterfallChartProps) {
  const chartData = [
    { name: 'Début', value: data.effectifDebut, fill: '#64748b' },
    { name: data.entrees.label, value: data.entrees.value, fill: '#10b981' },
    { name: data.sorties.label, value: data.sorties.value, fill: '#ef4444' },
    { name: data.effetPrix.label, value: data.effetPrix.value, fill: data.effetPrix.value >= 0 ? '#10b981' : '#ef4444' },
    { name: data.effetVolume.label, value: data.effetVolume.value, fill: data.effetVolume.value >= 0 ? '#10b981' : '#ef4444' },
    { name: 'Fin', value: data.effectifFin, fill: '#8b5cf6' },
  ]

  const gradient = type === 'm1'
    ? { from: '#10b981', to: '#059669' }
    : { from: '#8b5cf6', to: '#7c3aed' }

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${type === 'm1' ? 'from-green-500 to-emerald-600' : 'from-purple-500 to-violet-600'}`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [formatValue(value), 'Montant']}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}