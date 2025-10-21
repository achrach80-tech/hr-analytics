'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, UserMinus, RefreshCw, TrendingUp, TrendingDown, Briefcase, FileText, Repeat } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CyberSectionHeader } from './CyberSectionHeader'
import { CyberKPICard } from './CyberKPICard' // ✅ Import du composant global
import { createClient } from '@/lib/supabase/client'
import type { WorkforceKPIs } from '@/lib/types/dashboard'
import { CyberPieChart } from './CyberPieChart'

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

export const CyberWorkforceSection: React.FC<CyberWorkforceSectionProps> = React.memo(({ 
  data,
  historicalData = [],
  previousMonthData,
  previousYearData,
  loading = false 
}) => {
  const supabase = createClient()
  
  const [chartData, setChartData] = useState<Array<{month: string, etp: number}>>([])
  const [establishmentId, setEstablishmentId] = useState<string>('')

  useEffect(() => {
    const sessionStr = localStorage.getItem('company_session')
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        const fetchEstablishment = async () => {
          const { data: establishments } = await supabase
            .from('etablissements')
            .select('id')
            .eq('entreprise_id', session.company_id)
            .limit(1)
          
          if (establishments && establishments.length > 0) {
            setEstablishmentId(establishments[0].id)
          }
        }
        fetchEstablishment()
      } catch (error) {
        console.error('Error parsing session:', error)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (!establishmentId) return

    const fetchHistoricalData = async () => {
      const { data: snapshots, error } = await supabase
        .from('snapshots_workforce')
        .select('periode, etp_fin_mois')
        .eq('etablissement_id', establishmentId)
        .not('periode', 'is', null)
        .not('etp_fin_mois', 'is', null)
        .order('periode', { ascending: true })

      if (!error && snapshots && snapshots.length > 0) {
        const formattedData = snapshots.map(snap => {
          const date = new Date(snap.periode)
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return {
            month: `${month}-${year}`,
            etp: snap.etp_fin_mois || 0
          }
        })
        setChartData(formattedData)
      }
    }

    fetchHistoricalData()
  }, [establishmentId, supabase])

  const contractData = useMemo(() => {
    if (!data) return []
    
    const cdiPct = data.pctCDI || 0
    const precaritePct = 100 - cdiPct
    
    const cddPct = precaritePct * 0.60
    const altPct = precaritePct * 0.25
    const stagePct = precaritePct * 0.15
    
    const totalETP = data.etpTotal || data.headcountActif
    const cdiETP = (cdiPct / 100) * totalETP
    const cddETP = (cddPct / 100) * totalETP
    const altETP = (altPct / 100) * totalETP
    const staETP = (stagePct / 100) * totalETP
    
    return [
      { name: 'CDI', value: cdiETP, percentage: cdiPct, color: '#10b981' },
      { name: 'CDD', value: cddETP, percentage: cddPct, color: '#f59e0b' },
      { name: 'ALT', value: altETP, percentage: altPct, color: '#3b82f6' },
      { name: 'STA', value: staETP, percentage: stagePct, color: '#8b5cf6' }
    ]
  }, [data])

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

  const evolutionM1ETP = previousMonthData && previousMonthData.etpTotal > 0
    ? ((data.etpTotal - previousMonthData.etpTotal) / previousMonthData.etpTotal) * 100 
    : undefined
  const evolutionN1ETP = previousYearData && previousYearData.etpTotal > 0
    ? ((data.etpTotal - previousYearData.etpTotal) / previousYearData.etpTotal) * 100 
    : undefined

  const totalHeadcount = data.headcountActif + (data.nbEntrees - data.nbSorties)
  const previousMonthTotalHeadcount = previousMonthData 
    ? previousMonthData.headcountActif + (previousMonthData.nbEntrees - previousMonthData.nbSorties)
    : totalHeadcount
  const previousYearTotalHeadcount = previousYearData 
    ? previousYearData.headcountActif + (previousYearData.nbEntrees - previousYearData.nbSorties)
    : totalHeadcount

  const evolutionM1TotalHeadcount = previousMonthData && previousMonthTotalHeadcount > 0
    ? ((totalHeadcount - previousMonthTotalHeadcount) / previousMonthTotalHeadcount) * 100 
    : undefined
  const evolutionN1TotalHeadcount = previousYearData && previousYearTotalHeadcount > 0
    ? ((totalHeadcount - previousYearTotalHeadcount) / previousYearTotalHeadcount) * 100 
    : undefined

  const evolutionM1Headcount = previousMonthData && previousMonthData.headcountActif > 0
    ? ((data.headcountActif - previousMonthData.headcountActif) / previousMonthData.headcountActif) * 100 
    : undefined
  const evolutionN1Headcount = previousYearData && previousYearData.headcountActif > 0
    ? ((data.headcountActif - previousYearData.headcountActif) / previousYearData.headcountActif) * 100 
    : undefined

  const evolutionM1Turnover = previousMonthData 
    ? data.tauxTurnover - previousMonthData.tauxTurnover
    : undefined
  const evolutionN1Turnover = previousYearData 
    ? data.tauxTurnover - previousYearData.tauxTurnover
    : undefined

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
          value={totalHeadcount}
          format="number"
          icon={FileText}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          subtitle="Nombre de contrats"
          evolutionM1={evolutionM1TotalHeadcount}
          evolutionN1={evolutionN1TotalHeadcount}
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
              Évolution des ETP ({chartData.length} mois de données)
            </h3>
            
            <ResponsiveContainer width="100%" height={280}>
              <LineChart 
                data={chartData}
                margin={{ top: 30, right: 30, left: 35, bottom: 10 }}
              >
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
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                    fontWeight: 'bold',
                    offset: 15
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  <CyberKPICard
    title="Entrées du Mois"
    value={data.nbEntrees}
    format="number"
    icon={UserPlus}
    gradient="bg-gradient-to-r from-green-500 to-emerald-600"
    subtitle="Nouveaux collaborateurs"
    evolutionM1={
      previousMonthData && previousMonthData.nbEntrees > 0
        ? ((data.nbEntrees - previousMonthData.nbEntrees) / previousMonthData.nbEntrees) * 100
        : previousMonthData && previousMonthData.nbEntrees === 0 && data.nbEntrees > 0
        ? 100 // Si on passe de 0 à X, c'est +100%
        : undefined
    }
    evolutionN1={
      previousYearData && previousYearData.nbEntrees > 0
        ? ((data.nbEntrees - previousYearData.nbEntrees) / previousYearData.nbEntrees) * 100
        : previousYearData && previousYearData.nbEntrees === 0 && data.nbEntrees > 0
        ? 100
        : undefined
    }
  />

  <CyberKPICard
    title="Sorties du Mois"
    value={data.nbSorties}
    format="number"
    icon={UserMinus}
    gradient="bg-gradient-to-r from-red-500 to-red-600"
    subtitle="Départs"
    evolutionM1={
      previousMonthData && previousMonthData.nbSorties > 0
        ? ((data.nbSorties - previousMonthData.nbSorties) / previousMonthData.nbSorties) * 100
        : previousMonthData && previousMonthData.nbSorties === 0 && data.nbSorties > 0
        ? 100
        : undefined
    }
    evolutionN1={
      previousYearData && previousYearData.nbSorties > 0
        ? ((data.nbSorties - previousYearData.nbSorties) / previousYearData.nbSorties) * 100
        : previousYearData && previousYearData.nbSorties === 0 && data.nbSorties > 0
        ? 100
        : undefined
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6"
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-purple-500" />
          
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
                      <div className="text-xl font-bold text-white">
                        {contract.value.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {contract.percentage.toFixed(1)}%
                      </div>
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6"
        >
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-green-500 to-purple-500" />
          
          <div className="relative z-10">
            <CyberPieChart
              data={contractData}
              title="Distribution % Contrats"
              icon={Briefcase}
            />
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