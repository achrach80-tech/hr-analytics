'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, UserMinus, RefreshCw, TrendingUp, TrendingDown, Briefcase, FileText, Repeat } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { CyberSectionHeader } from './CyberSectionHeader'
import type { WorkforceKPIs } from '@/lib/types/dashboard'

interface CyberWorkforceSectionProps {
  data: WorkforceKPIs | null
  historicalData?: WorkforceKPIs[]
  previousMonthData?: WorkforceKPIs | null
  previousYearData?: WorkforceKPIs | null
  loading?: boolean
}

interface EvolutionBadgeProps {
  value: number
  label: string
  position: 'top-right' | 'bottom-right'
}

const EvolutionBadge: React.FC<EvolutionBadgeProps> = ({ value, label, position }) => {
  const isPositive = value > 0
  const isNeutral = value === 0
  
  const positionClasses = position === 'top-right' 
    ? 'absolute top-2 right-2' 
    : 'absolute bottom-2 right-2'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${positionClasses} flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md ${
        isNeutral 
          ? 'bg-slate-700/50 border border-slate-600/30'
          : isPositive 
          ? 'bg-green-500/20 border border-green-500/30' 
          : 'bg-red-500/20 border border-red-500/30'
      }`}
    >
      {!isNeutral && (
        isPositive ? <TrendingUp size={10} className="text-green-400" /> : <TrendingDown size={10} className="text-red-400" />
      )}
      <span className={`text-xs font-mono font-bold ${
        isNeutral ? 'text-slate-400' : isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {label} {isPositive ? '+' : ''}{value.toFixed(1)}%
      </span>
    </motion.div>
  )
}

interface CyberKPICardProps {
  title: string
  value: number
  format: 'number' | 'decimal' | 'percent'
  icon: React.ElementType
  gradient: string
  subtitle?: string
  evolutionM1?: number
  evolutionN1?: number
}

const CyberKPICard: React.FC<CyberKPICardProps> = ({ 
  title, 
  value, 
  format, 
  icon: Icon, 
  gradient,
  subtitle,
  evolutionM1,
  evolutionN1
}) => {
  const formattedValue = format === 'percent' 
    ? `${value.toFixed(1)}%`
    : format === 'decimal'
    ? value.toFixed(1)
    : new Intl.NumberFormat('fr-FR').format(Math.round(value))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group border border-slate-700/50 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/20 p-6"
    >
      <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${gradient}`} />
      
      {/* Evolution badges */}
      {evolutionM1 !== undefined && (
        <EvolutionBadge value={evolutionM1} label="M-1" position="top-right" />
      )}
      {evolutionN1 !== undefined && (
        <EvolutionBadge value={evolutionN1} label="N-1" position="bottom-right" />
      )}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 w-12 h-12 ${gradient}`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon size={24} className="text-white drop-shadow-lg" />
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <motion.p 
            className="text-slate-400 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.p>
          <motion.p 
            className="text-2xl font-bold text-white drop-shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {formattedValue}
          </motion.p>
          {subtitle && (
            <motion.p 
              className="text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export const CyberWorkforceSection: React.FC<CyberWorkforceSectionProps> = React.memo(({ 
  data,
  historicalData = [],
  previousMonthData,
  previousYearData,
  loading = false 
}) => {
  if (loading) {
    return <WorkforceSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée workforce disponible</p>
      </div>
    )
  }

  // Calculate evolutions
  const evolutionM1ETP = previousMonthData 
    ? ((data.etpTotal - previousMonthData.etpTotal) / previousMonthData.etpTotal) * 100 
    : 0
  const evolutionN1ETP = previousYearData 
    ? ((data.etpTotal - previousYearData.etpTotal) / previousYearData.etpTotal) * 100 
    : 0

  const evolutionM1Headcount = previousMonthData 
    ? ((data.headcountActif - previousMonthData.headcountActif) / previousMonthData.headcountActif) * 100 
    : 0
  const evolutionN1Headcount = previousYearData 
    ? ((data.headcountActif - previousYearData.headcountActif) / previousYearData.headcountActif) * 100 
    : 0

  const evolutionM1Turnover = previousMonthData 
    ? data.tauxTurnover - previousMonthData.tauxTurnover
    : 0
  const evolutionN1Turnover = previousYearData 
    ? data.tauxTurnover - previousYearData.tauxTurnover
    : 0

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return []
    
    return historicalData
      .slice(-12)
      .map((item, index) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (historicalData.length - 1 - index))
        return {
          month: date.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' }).replace('/', '-'),
          etp: item.etpTotal
        }
      })
  }, [historicalData])

  // Contract distribution data
  const contractData = useMemo(() => {
    const cdiCount = Math.round((data.pctCDI / 100) * data.headcountActif)
    const cddCount = data.headcountActif - cdiCount
    
    return [
      { name: 'CDI', value: cdiCount, percentage: data.pctCDI, color: '#10b981' },
      { name: 'CDD', value: cddCount, percentage: 100 - data.pctCDI, color: '#f59e0b' }
    ]
  }, [data])

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <CyberSectionHeader 
        title="Effectif & Mouvements" 
        icon={Users} 
        gradient="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" 
      />
      
      {/* Line 1: ETP Total, Total Headcount, Headcount Actif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CyberKPICard
          title="ETP Total"
          value={data.etpTotal}
          format="decimal"
          icon={Users}
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
          subtitle="Équivalent Temps Plein"
          evolutionM1={evolutionM1ETP}
          evolutionN1={evolutionN1ETP}
        />

        <CyberKPICard
          title="Total Headcount"
          value={data.headcountActif + (data.nbEntrees - data.nbSorties)}
          format="number"
          icon={FileText}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle="Nombre de contrats"
        />

        <CyberKPICard
          title="Headcount Actif"
          value={data.headcountActif}
          format="number"
          icon={Users}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="Salariés actifs"
          evolutionM1={evolutionM1Headcount}
          evolutionN1={evolutionN1Headcount}
        />
      </div>

      {/* Line 2: Evolution ETP Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6"
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-purple-500" />
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-cyan-400" />
              Évolution des ETP (12 derniers mois)
            </h3>
            
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="etp" 
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, fill: '#06b6d4' }}
                  label={{
                    position: 'top',
                    fill: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Line 3: Movements */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <CyberKPICard
          title="Entrées du Mois"
          value={data.nbEntrees}
          format="number"
          icon={UserPlus}
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
          subtitle="Nouveaux collaborateurs"
          evolutionM1={previousMonthData ? data.nbEntrees - previousMonthData.nbEntrees : 0}
          evolutionN1={previousYearData ? data.nbEntrees - previousYearData.nbEntrees : 0}
        />

        <CyberKPICard
          title="Sorties du Mois"
          value={data.nbSorties}
          format="number"
          icon={UserMinus}
          gradient="bg-gradient-to-r from-red-500 to-red-600"
          subtitle="Départs"
          evolutionM1={previousMonthData ? data.nbSorties - previousMonthData.nbSorties : 0}
          evolutionN1={previousYearData ? data.nbSorties - previousYearData.nbSorties : 0}
        />

        <CyberKPICard
          title="Taux de Turnover"
          value={data.tauxTurnover}
          format="percent"
          icon={RefreshCw}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="Mouvement mensuel"
          evolutionM1={evolutionM1Turnover}
          evolutionN1={evolutionN1Turnover}
        />

        <CyberKPICard
          title="Mobilités Internes"
          value={0}
          format="number"
          icon={Repeat}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          subtitle="Changements de poste"
        />
      </div>

      {/* Line 4: Contract Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6"
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-orange-500" />
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-green-400" />
              Répartition ETP par Contrat
            </h3>
            
            <div className="space-y-4">
              {contractData.map((contract, index) => (
                <div key={contract.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          backgroundColor: contract.color,
                          boxShadow: `0 0 10px ${contract.color}` 
                        }}
                      />
                      <span className="text-white font-semibold">{contract.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{contract.value}</div>
                      <div className="text-xs text-slate-400">{contract.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="relative h-8 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                    <motion.div
                      className="h-full rounded-full relative"
                      style={{ 
                        background: `linear-gradient(90deg, ${contract.color}, ${contract.color}dd)`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${contract.percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6"
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-orange-500" />
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-orange-400" />
              Distribution % Contrats
            </h3>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={contractData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  labelLine={{
                    stroke: '#94a3b8',
                    strokeWidth: 2
                  }}
                >
                  {contractData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
})

const WorkforceSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-slate-700 rounded w-64"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
    <div className="h-64 bg-slate-800 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberWorkforceSection.displayName = 'CyberWorkforceSection'