'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Building2,
  RefreshCw, ChevronDown, Heart, AlertTriangle, Euro, Percent,
  Calendar, Sparkles, Brain, Clock, Shield, Target, BarChart3,
  PieChart, Activity, Award, Briefcase, MapPin, Zap, Gauge,
  DollarSign, Calculator, Stethoscope, UserCheck, FileText
} from 'lucide-react'
import ReactDOM from 'react-dom'
import { useRouter } from 'next/navigation'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts'

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface Employee {
  id: string
  matricule: string
  periode: string
  date_entree: string
  date_sortie?: string
  temps_travail: number
  type_contrat: string
  age_at_periode?: number
  anciennete_mois?: number
  code_cost_center?: string
  code_site?: string
  statut_emploi: string
}

interface Remuneration {
  id: string
  matricule: string
  mois_paie: string
  salaire_de_base: number
  primes_fixes: number
  primes_variables: number
  heures_supp_payees: number
  avantages_nature: number
  indemnites: number
  cotisations_sociales: number
  taxes_sur_salaire: number
  autres_charges: number
  total_brut: number
  cout_total_employeur: number
}

interface Absence {
  id: string
  matricule: string
  type_absence: string
  date_debut: string
  date_fin: string
  nb_jours_calendaires: number
  nb_jours_ouvres: number
}

interface Company {
  id: string
  nom: string
  subscription_plan: string
}

interface Establishment {
  id: string
  nom: string
}

interface KPIEvolution {
  value: number
  momPercent: number
  yoyPercent: number
  trend: 'up' | 'down' | 'neutral'
}

interface KPIData {
  // Workforce
  effectifTotal: KPIEvolution
  entreesSorties: { entrees: number, sorties: number, evolution: KPIEvolution }
  tauxRotation: KPIEvolution
  
  // Payroll
  masseSalarialeBrute: KPIEvolution
  coutTotalEmployeur: KPIEvolution
  salaireMoyenETP: KPIEvolution
  partVariable: KPIEvolution
  
  // Absences
  tauxAbsenteisme: KPIEvolution
  coutAbsences: KPIEvolution
  topAbsences: Array<{ type: string, jours: number, percentage: number }>
  
  // Demographics
  ageMoyen: KPIEvolution
  ancienneteMoyenne: KPIEvolution
  repartitionContrats: Array<{ type: string, count: number, percentage: number }>
  repartitionSites: Array<{ site: string, count: number, percentage: number }>
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num))
}

const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`
}

const formatPeriodDisplay = (periode: string): string => {
  if (!periode) return ''
  try {
    const date = new Date(periode)
    return date.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return periode
  }
}

const calculateEvolution = (current: number, previous: number, previousYear: number): KPIEvolution => {
  const momPercent = previous ? ((current - previous) / previous) * 100 : 0
  const yoyPercent = previousYear ? ((current - previousYear) / previousYear) * 100 : 0
  
  return {
    value: current,
    momPercent,
    yoyPercent,
    trend: momPercent > 0 ? 'up' : momPercent < 0 ? 'down' : 'neutral'
  }
}

const getPreviousPeriod = (periode: string): string => {
  const date = new Date(periode)
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0].substring(0, 7) + '-01'
}

const getPreviousYearPeriod = (periode: string): string => {
  const date = new Date(periode)
  date.setFullYear(date.getFullYear() - 1)
  return date.toISOString().split('T')[0].substring(0, 7) + '-01'
}

// ==========================================
// KPI CARD COMPONENT
// ==========================================

interface KPICardProps {
  title: string
  value: string | number
  format: 'currency' | 'percent' | 'number' | 'text'
  icon: React.ElementType
  gradient: string
  evolution?: KPIEvolution
  subtitle?: string
  alert?: boolean
  size?: 'normal' | 'large'
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  format, 
  icon: Icon, 
  gradient, 
  evolution, 
  subtitle, 
  alert = false,
  size = 'normal'
}) => {
  const formattedValue = 
    format === 'currency' ? formatCurrency(Number(value)) :
    format === 'percent' ? formatPercentage(Number(value)) :
    format === 'number' ? formatNumber(Number(value)) :
    String(value)

  const isLarge = size === 'large'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group border ${
        alert 
          ? 'border-red-500/40 bg-gradient-to-br from-red-900/20 via-slate-900/50 to-red-800/10' 
          : 'border-slate-700/50 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/20'
      } ${isLarge ? 'p-8 col-span-2' : 'p-6'}`}
    >
      {/* Animated background glow */}
      <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${gradient}`} />
      
      {/* Neon border effect */}
      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Alert pulse */}
      {alert && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
        </div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            className={`rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ${gradient} ${
              isLarge ? 'w-16 h-16' : 'w-12 h-12'
            }`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon size={isLarge ? 28 : 24} className="text-white drop-shadow-lg" />
          </motion.div>
          
          {evolution && (
            <div className="flex flex-col gap-1">
              {/* MoM Evolution */}
              <motion.div 
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  evolution.momPercent > 0 ? 'text-green-400 bg-green-500/10' : 
                  evolution.momPercent < 0 ? 'text-red-400 bg-red-500/10' : 'text-gray-400 bg-gray-500/10'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {evolution.momPercent > 0 ? <ArrowUp size={12} /> : 
                 evolution.momPercent < 0 ? <ArrowDown size={12} /> : null}
                <span>{Math.abs(evolution.momPercent).toFixed(1)}%</span>
              </motion.div>
              
              {/* YoY Evolution */}
              <motion.div 
                className={`flex items-center gap-1 text-xs font-medium opacity-75 px-2 py-1 rounded-full ${
                  evolution.yoyPercent > 0 ? 'text-green-400 bg-green-500/5' : 
                  evolution.yoyPercent < 0 ? 'text-red-400 bg-red-500/5' : 'text-gray-400 bg-gray-500/5'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-[10px]">YoY</span>
                <span>{evolution.yoyPercent > 0 ? '+' : ''}{evolution.yoyPercent.toFixed(1)}%</span>
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Content */}
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
            className={`font-bold text-white drop-shadow-md ${isLarge ? 'text-4xl' : 'text-2xl'}`}
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
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

// ==========================================
// SECTION HEADER COMPONENT
// ==========================================

const SectionHeader: React.FC<{ title: string; icon: React.ElementType; gradient: string }> = ({ 
  title, 
  icon: Icon, 
  gradient 
}) => (
  <motion.div 
    className="flex items-center gap-4 mb-6"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg`}>
      <Icon size={24} className="text-white" />
    </div>
    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
      {title}
    </h2>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent" />
  </motion.div>
)

// ==========================================
// CHART COMPONENTS
// ==========================================

const EvolutionChart: React.FC<{ data: any[], title: string, dataKey: string, color: string }> = ({
  data, title, dataKey, color
}) => (
  <motion.div 
    className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
      <BarChart3 size={20} className={color} />
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
        <XAxis 
          dataKey="periode" 
          stroke="rgba(148,163,184,0.8)" 
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
        />
        <YAxis stroke="rgba(148,163,184,0.8)" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(15,23,42,0.95)', 
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#8b5cf6"
          strokeWidth={2}
          fill={`url(#gradient-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
)

const DistributionChart: React.FC<{ data: any[], title: string, colors: string[] }> = ({
  data, title, colors
}) => (
  <motion.div 
    className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
  >
    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
      <PieChart size={20} className="text-purple-400" />
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={250}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(1) : 0}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </RechartsPieChart>
    </ResponsiveContainer>
  </motion.div>
)

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

export default function RHQuantumDashboard() {
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])

  const supabase = createClient()
  const router = useRouter()

  // Initialize
  useEffect(() => {
    initializeData()
  }, [])

  useEffect(() => {
    if (showPeriodSelector) {
      // Prevent body scroll when dropdown is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [showPeriodSelector])

  const initializeData = async () => {
    try {
      setLoading(true)
      setError(null)

      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)

      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select(`*, etablissements (*)`)
        .eq('id', session.company_id)
        .single()

      if (companyError) throw companyError

      setCompany(companyData)
      const establishments = companyData.etablissements || []
      
      const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
      if (defaultEst) {
        setSelectedEstablishment(defaultEst)
        await loadPeriodsForEstablishment(defaultEst.id)
      }
    } catch (err) {
      console.error('Initialize error:', err)
      setError('Erreur d\'initialisation')
    } finally {
      setLoading(false)
    }
  }

  const loadPeriodsForEstablishment = async (establishmentId: string) => {
    try {
      // Get available periods from employees table
      const { data: periodData, error } = await supabase
        .from('employes')
        .select('periode')
        .eq('etablissement_id', establishmentId)
        .order('periode', { ascending: false })

      if (error) throw error

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      setPeriods(uniquePeriods)

      if (uniquePeriods.length > 0) {
        setSelectedPeriod(uniquePeriods[0])
        await loadDataForPeriod(establishmentId, uniquePeriods[0])
      } else {
        setError('Aucune donnée disponible. Veuillez importer des données.')
      }
    } catch (err) {
      console.error('Load periods error:', err)
      setError('Erreur lors du chargement des périodes')
    }
  }

  const loadDataForPeriod = async (establishmentId: string, period: string) => {
    try {
      const normalizedPeriod = period.substring(0, 7) + '-01'
      const prevPeriod = getPreviousPeriod(normalizedPeriod)
      const prevYearPeriod = getPreviousYearPeriod(normalizedPeriod)

      // Load current, previous month, and previous year data
      const [currentEmployees, prevEmployees, prevYearEmployees, currentRem, prevRem, prevYearRem, currentAbs] = await Promise.all([
        // Current period employees
        supabase
          .from('employes')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('periode', normalizedPeriod),
        
        // Previous month employees
        supabase
          .from('employes')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('periode', prevPeriod),
        
        // Previous year employees
        supabase
          .from('employes')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('periode', prevYearPeriod),
        
        // Current remunerations
        supabase
          .from('remunerations')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('mois_paie', normalizedPeriod),
        
        // Previous month remunerations
        supabase
          .from('remunerations')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('mois_paie', prevPeriod),
        
        // Previous year remunerations
        supabase
          .from('remunerations')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .eq('mois_paie', prevYearPeriod),
        
        // Current absences
        supabase
          .from('absences')
          .select('*')
          .eq('etablissement_id', establishmentId)
          .gte('date_debut', normalizedPeriod)
          .lt('date_debut', new Date(new Date(normalizedPeriod).getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ])

      // Calculate KPIs
      const calculatedKPIs = calculateKPIs(
        currentEmployees.data || [],
        prevEmployees.data || [],
        prevYearEmployees.data || [],
        currentRem.data || [],
        prevRem.data || [],
        prevYearRem.data || [],
        currentAbs.data || []
      )

      setKpiData(calculatedKPIs)

      // Load historical data for charts
      const { data: historicalEmployees } = await supabase
        .from('employes')
        .select('periode, temps_travail, type_contrat')
        .eq('etablissement_id', establishmentId)
        .order('periode', { ascending: true })

      if (historicalEmployees) {
        const groupedByPeriod = historicalEmployees.reduce((acc: any, emp) => {
          if (!acc[emp.periode]) {
            acc[emp.periode] = { periode: emp.periode, effectifs: 0, contracts: {} }
          }
          acc[emp.periode].effectifs += emp.temps_travail
          acc[emp.periode].contracts[emp.type_contrat] = (acc[emp.periode].contracts[emp.type_contrat] || 0) + 1
          return acc
        }, {})

        setHistoricalData(Object.values(groupedByPeriod))
      }

    } catch (err) {
      console.error('Load data error:', err)
      setError('Erreur lors du chargement des données')
    }
  }

  const calculateKPIs = (
    currentEmployees: Employee[],
    prevEmployees: Employee[],
    prevYearEmployees: Employee[],
    currentRem: Remuneration[],
    prevRem: Remuneration[],
    prevYearRem: Remuneration[],
    currentAbs: Absence[]
  ): KPIData => {
    
    // EFFECTIF & WORKFORCE
    const currentFTE = currentEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
    const prevFTE = prevEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
    const prevYearFTE = prevYearEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)

    const currentEntrees = currentEmployees.filter(emp => {
      const entryMonth = emp.date_entree.substring(0, 7)
      const currentMonth = currentEmployees[0]?.periode.substring(0, 7)
      return entryMonth === currentMonth
    }).length

    const currentSorties = currentEmployees.filter(emp => {
      if (!emp.date_sortie) return false
      const exitMonth = emp.date_sortie.substring(0, 7)
      const currentMonth = currentEmployees[0]?.periode.substring(0, 7)
      return exitMonth === currentMonth
    }).length

    const currentTurnover = currentFTE > 0 ? (currentSorties / currentFTE) * 100 : 0
    const prevTurnover = prevFTE > 0 ? (prevEmployees.filter(emp => emp.date_sortie?.substring(0, 7) === prevEmployees[0]?.periode.substring(0, 7)).length / prevFTE) * 100 : 0
    const prevYearTurnover = prevYearFTE > 0 ? (prevYearEmployees.filter(emp => emp.date_sortie?.substring(0, 7) === prevYearEmployees[0]?.periode.substring(0, 7)).length / prevYearFTE) * 100 : 0

    // PAYROLL & COST
    const currentMasseBrute = currentRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)
    const prevMasseBrute = prevRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)
    const prevYearMasseBrute = prevYearRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)

    const currentCoutTotal = currentRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)
    const prevCoutTotal = prevRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)
    const prevYearCoutTotal = prevYearRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)

    const currentSalaireMoyenETP = currentFTE > 0 ? currentCoutTotal / currentFTE : 0
    const prevSalaireMoyenETP = prevFTE > 0 ? prevCoutTotal / prevFTE : 0
    const prevYearSalaireMoyenETP = prevYearFTE > 0 ? prevYearCoutTotal / prevYearFTE : 0

    const currentPartVariable = currentMasseBrute > 0 ? (currentRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / currentMasseBrute) * 100 : 0
    const prevPartVariable = prevMasseBrute > 0 ? (prevRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / prevMasseBrute) * 100 : 0
    const prevYearPartVariable = prevYearMasseBrute > 0 ? (prevYearRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / prevYearMasseBrute) * 100 : 0

    // ABSENCES & WELLBEING
    const totalAbsenceDays = currentAbs.reduce((sum, abs) => sum + abs.nb_jours_ouvres, 0)
    const theoreticalWorkDays = currentFTE * 22 // Approximation: 22 working days per month
    const currentAbsenteisme = theoreticalWorkDays > 0 ? (totalAbsenceDays / theoreticalWorkDays) * 100 : 0

    // Estimate cost of absences (simplified)
    const averageDailySalary = currentFTE > 0 ? (currentMasseBrute / currentFTE) / 22 : 0
    const currentCoutAbsences = totalAbsenceDays * averageDailySalary

    // Top 3 absence types
    const absenceByType = currentAbs.reduce((acc: any, abs) => {
      acc[abs.type_absence] = (acc[abs.type_absence] || 0) + abs.nb_jours_ouvres
      return acc
    }, {})

    const topAbsences = Object.entries(absenceByType)
      .map(([type, jours]: [string, any]) => ({
        type,
        jours,
        percentage: totalAbsenceDays > 0 ? (jours / totalAbsenceDays) * 100 : 0
      }))
      .sort((a, b) => b.jours - a.jours)
      .slice(0, 3)

    // DEMOGRAPHICS
    const currentAgeSum = currentEmployees.reduce((sum, emp) => sum + (emp.age_at_periode || 0), 0)
    const currentAgeMoyen = currentEmployees.length > 0 ? currentAgeSum / currentEmployees.length : 0
    const prevAgeMoyen = prevEmployees.length > 0 ? prevEmployees.reduce((sum, emp) => sum + (emp.age_at_periode || 0), 0) / prevEmployees.length : 0
    const prevYearAgeMoyen = prevYearEmployees.length > 0 ? prevYearEmployees.reduce((sum, emp) => sum + (emp.age_at_periode || 0), 0) / prevYearEmployees.length : 0

    const currentAncienneteSum = currentEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0)
    const currentAncienneteMoyenne = currentEmployees.length > 0 ? currentAncienneteSum / currentEmployees.length : 0
    const prevAncienneteMoyenne = prevEmployees.length > 0 ? prevEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0) / prevEmployees.length : 0
    const prevYearAncienneteMoyenne = prevYearEmployees.length > 0 ? prevYearEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0) / prevYearEmployees.length : 0

    // Contract distribution
    const contractCounts = currentEmployees.reduce((acc: any, emp) => {
      acc[emp.type_contrat] = (acc[emp.type_contrat] || 0) + 1
      return acc
    }, {})

    const repartitionContrats = Object.entries(contractCounts).map(([type, count]: [string, any]) => ({
      type,
      count,
      percentage: currentEmployees.length > 0 ? (count / currentEmployees.length) * 100 : 0
    }))

    // Site distribution
    const siteCounts = currentEmployees.reduce((acc: any, emp) => {
      const site = emp.code_site || 'Non défini'
      acc[site] = (acc[site] || 0) + 1
      return acc
    }, {})

    const repartitionSites = Object.entries(siteCounts).map(([site, count]: [string, any]) => ({
      site,
      count,
      percentage: currentEmployees.length > 0 ? (count / currentEmployees.length) * 100 : 0
    }))

    return {
      effectifTotal: calculateEvolution(currentFTE, prevFTE, prevYearFTE),
      entreesSorties: {
        entrees: currentEntrees,
        sorties: currentSorties,
        evolution: calculateEvolution(currentSorties, 0, 0) // Simplified for turnover
      },
      tauxRotation: calculateEvolution(currentTurnover, prevTurnover, prevYearTurnover),
      masseSalarialeBrute: calculateEvolution(currentMasseBrute, prevMasseBrute, prevYearMasseBrute),
      coutTotalEmployeur: calculateEvolution(currentCoutTotal, prevCoutTotal, prevYearCoutTotal),
      salaireMoyenETP: calculateEvolution(currentSalaireMoyenETP, prevSalaireMoyenETP, prevYearSalaireMoyenETP),
      partVariable: calculateEvolution(currentPartVariable, prevPartVariable, prevYearPartVariable),
      tauxAbsenteisme: calculateEvolution(currentAbsenteisme, 0, 0), // Simplified
      coutAbsences: calculateEvolution(currentCoutAbsences, 0, 0), // Simplified
      topAbsences,
      ageMoyen: calculateEvolution(currentAgeMoyen, prevAgeMoyen, prevYearAgeMoyen),
      ancienneteMoyenne: calculateEvolution(currentAncienneteMoyenne / 12, prevAncienneteMoyenne / 12, prevYearAncienneteMoyenne / 12), // Convert to years
      repartitionContrats,
      repartitionSites
    }
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    setShowPeriodSelector(false)
    if (selectedEstablishment) {
      await loadDataForPeriod(selectedEstablishment.id, period)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-20 h-20 border-4 border-purple-500/30 rounded-full mb-6 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 border-4 border-t-purple-500 rounded-full animate-spin"></div>
          </motion.div>
          <motion.p 
            className="text-white text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Chargement de votre dashboard RH...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error && !kpiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-6">
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 max-w-lg text-center border border-red-500/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Erreur de chargement</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/import')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Importer des données
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '48px 48px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain size={32} className="text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  RH Quantum Analytics
                </motion.h1>
                <motion.div 
                  className="flex items-center gap-3 text-sm text-slate-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Building2 size={14} />
                  <span>{company?.nom}</span>
                  <span>•</span>
                  <span>{selectedEstablishment?.nom}</span>
                  <span>•</span>
                  <span className="text-green-400">Live Dashboard</span>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 ${
                    showPeriodSelector 
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20' 
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-white hover:border-purple-500/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar size={18} className="text-purple-400" />
                  <span className={showPeriodSelector ? 'text-purple-300' : 'text-white'}>
                    {selectedPeriod ? formatPeriodDisplay(selectedPeriod) : 'Sélectionner'}
                  </span>
                  <motion.div
                    animate={{ rotate: showPeriodSelector ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                </motion.button>
              </div>

              <motion.button
                onClick={() => router.push('/import')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  Import
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Portal-rendered dropdown */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(
        <AnimatePresence>
          {showPeriodSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-start justify-end pt-24 pr-8"
              onClick={() => setShowPeriodSelector(false)}
            >
              {/* Background overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              
              {/* Dropdown content */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Sélectionner une période</span>
                  </div>
                </div>
                
                {/* Period list */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {periods.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {periods.map(period => (
                        <motion.button
                          key={period}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePeriodChange(period)
                          }}
                          className={`w-full px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                            period === selectedPeriod 
                              ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white border border-purple-500/50 shadow-lg' 
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{formatPeriodDisplay(period)}</span>
                            {period === selectedPeriod && (
                              <motion.div 
                                className="w-3 h-3 bg-purple-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-slate-500">
                      <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-sm font-medium">Aucune période disponible</p>
                      <p className="text-xs mt-2 opacity-75">Importez vos données d'abord</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Main content */}
      <div className="relative z-10 p-8 space-y-12">
        {kpiData ? (
          <>
            {/* 👥 EFFECTIF & WORKFORCE */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <SectionHeader 
                title="👥 Effectif & Workforce" 
                icon={Users} 
                gradient="bg-gradient-to-r from-blue-500 to-purple-600" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <KPICard
                  title="Effectif Total (ETP)"
                  value={kpiData.effectifTotal.value}
                  format="number"
                  icon={Users}
                  gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                  evolution={kpiData.effectifTotal}
                  subtitle="Équivalent Temps Plein"
                />

                <KPICard
                  title="Entrées / Sorties"
                  value={`${kpiData.entreesSorties.entrees} / ${kpiData.entreesSorties.sorties}`}
                  format="text"
                  icon={TrendingUp}
                  gradient="bg-gradient-to-r from-green-500 to-emerald-600"
                  subtitle="Mouvements du mois"
                />

                <KPICard
                  title="Taux de Rotation"
                  value={kpiData.tauxRotation.value}
                  format="percent"
                  icon={RefreshCw}
                  gradient="bg-gradient-to-r from-orange-500 to-red-600"
                  evolution={kpiData.tauxRotation}
                  subtitle="Benchmark industrie"
                  alert={kpiData.tauxRotation.value > 15}
                />
              </div>
            </motion.section>

            {/* 💶 PAYROLL & COST */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SectionHeader 
                title="💶 Payroll & Cost" 
                icon={DollarSign} 
                gradient="bg-gradient-to-r from-emerald-500 to-cyan-600" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KPICard
                  title="Masse Salariale Brute"
                  value={kpiData.masseSalarialeBrute.value}
                  format="currency"
                  icon={Euro}
                  gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
                  evolution={kpiData.masseSalarialeBrute}
                  subtitle="Total payroll mensuel"
                />

                <KPICard
                  title="Coût Total Employeur"
                  value={kpiData.coutTotalEmployeur.value}
                  format="currency"
                  icon={Calculator}
                  gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
                  evolution={kpiData.coutTotalEmployeur}
                  subtitle="Charges incluses"
                />

                <KPICard
                  title="Salaire Moyen par ETP"
                  value={kpiData.salaireMoyenETP.value}
                  format="currency"
                  icon={Target}
                  gradient="bg-gradient-to-r from-teal-500 to-teal-600"
                  evolution={kpiData.salaireMoyenETP}
                  subtitle="Coût employeur unitaire"
                />

                <KPICard
                  title="Part Variable"
                  value={kpiData.partVariable.value}
                  format="percent"
                  icon={Percent}
                  gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
                  evolution={kpiData.partVariable}
                  subtitle="Motivation & performance"
                />
              </div>
            </motion.section>

            {/* 🏥 ABSENCES & WELLBEING */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SectionHeader 
                title="🏥 Absences & Wellbeing" 
                icon={Stethoscope} 
                gradient="bg-gradient-to-r from-pink-500 to-rose-600" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <KPICard
                  title="Taux d'Absentéisme"
                  value={kpiData.tauxAbsenteisme.value}
                  format="percent"
                  icon={Heart}
                  gradient="bg-gradient-to-r from-pink-500 to-pink-600"
                  evolution={kpiData.tauxAbsenteisme}
                  subtitle="Engagement & santé"
                  alert={kpiData.tauxAbsenteisme.value > 8}
                />

                <KPICard
                  title="Coût des Absences"
                  value={kpiData.coutAbsences.value}
                  format="currency"
                  icon={DollarSign}
                  gradient="bg-gradient-to-r from-rose-500 to-rose-600"
                  evolution={kpiData.coutAbsences}
                  subtitle="Impact financier"
                />

                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-orange-400" />
                    Top 3 Motifs d'Absence
                  </h3>
                  <div className="space-y-3">
                    {kpiData.topAbsences.map((absence, index) => (
                      <motion.div 
                        key={absence.type} 
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-slate-300">{absence.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">{absence.jours} jours</div>
                          <div className="text-xs text-slate-400">{absence.percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* 📊 DEMOGRAPHICS */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <SectionHeader 
                title="📊 Demographics" 
                icon={UserCheck} 
                gradient="bg-gradient-to-r from-violet-500 to-purple-600" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <KPICard
                  title="Âge Moyen"
                  value={kpiData.ageMoyen.value.toFixed(1)}
                  format="text"
                  icon={Award}
                  gradient="bg-gradient-to-r from-violet-500 to-violet-600"
                  evolution={kpiData.ageMoyen}
                  subtitle="ans"
                />

                <KPICard
                  title="Ancienneté Moyenne"
                  value={kpiData.ancienneteMoyenne.value.toFixed(1)}
                  format="text"
                  icon={Clock}
                  gradient="bg-gradient-to-r from-purple-500 to-purple-600"
                  evolution={kpiData.ancienneteMoyenne}
                  subtitle="années"
                />

                <div className="col-span-1 md:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-400" />
                    Répartition par Contrat
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {kpiData.repartitionContrats.map((contract, index) => (
                      <motion.div 
                        key={contract.type} 
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-slate-300">{contract.type}</span>
                        <div className="text-right">
                          <div className="text-white font-medium">{contract.count}</div>
                          <div className="text-xs text-slate-400">{contract.percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sites Distribution */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-green-400" />
                  Répartition par Département & Site
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kpiData.repartitionSites.map((site, index) => (
                    <motion.div 
                      key={site.site} 
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
                        <span className="text-slate-300">{site.site}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{site.count} pers.</div>
                        <div className="text-xs text-slate-400">{site.percentage.toFixed(1)}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Charts Section */}
            {historicalData.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <SectionHeader 
                  title="📈 Évolution Temporelle" 
                  icon={BarChart3} 
                  gradient="bg-gradient-to-r from-cyan-500 to-blue-600" 
                />
                <div className="grid lg:grid-cols-2 gap-8">
                  <EvolutionChart
                    data={historicalData}
                    title="Évolution des Effectifs"
                    dataKey="effectifs"
                    color="text-purple-400"
                  />
                  
                  <DistributionChart
                    data={kpiData.repartitionContrats.map(c => ({ name: c.type, value: c.count }))}
                    title="Distribution des Contrats"
                    colors={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']}
                  />
                </div>
              </motion.section>
            )}

            {/* Footer */}
            <motion.div 
              className="mt-16 p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Dashboard en temps réel</span>
                  </div>
                  <span>Période: {formatPeriodDisplay(selectedPeriod)}</span>
                  <span>Mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-purple-400" />
                  <span>RH Quantum Analytics v4.0</span>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          /* No data state */
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div 
              className="w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BarChart3 size={64} className="text-white drop-shadow-lg" />
            </motion.div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-6">
              Aucune donnée disponible
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              Importez vos fichiers Excel RH pour générer automatiquement vos KPIs et analytics
            </p>
            <motion.button
              onClick={() => router.push('/import')}
              className="px-12 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={24} />
                Commencer l'import
                <ArrowUp size={24} className="rotate-45" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6, #06b6d4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a78bfa, #22d3ee);
        }
      `}</style>
    </div>
  )
}