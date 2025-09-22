'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Building2,
  RefreshCw, ChevronDown, Heart, AlertTriangle, Euro, Percent,
  Calendar, Sparkles, Brain, Clock, Shield, Target, BarChart3,
  PieChart, Activity, Award, Briefcase, MapPin, Zap, Gauge,
  DollarSign, Calculator, Stethoscope, UserCheck, FileText, UserPlus, UserMinus, Shuffle, UserX, Users2, 
  TrendingUp as TrendingUpIcon, RotateCcw, AlertCircle, Timer, Repeat, TrendingDown as TrendingDownIcon,
  CalendarX, UsersIcon, User
} from 'lucide-react'
import ReactDOM from 'react-dom'
import { useRouter } from 'next/navigation'
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  ComposedChart
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
  sexe?: string
  poste?: string
  metier?: string
  intitule_poste?: string
}

interface HistoricalEmployee {
  periode: string
  temps_travail: number
  type_contrat: string
  statut_emploi: string
  sexe?: string
  age_at_periode?: number
  intitule_poste?: string
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

interface RefAbsence {
  id: string
  type_absence: string
  taux_indemnisation: number
  is_paid: boolean
  description: string
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

interface AdvancedAbsenceKPIs {
  tauxAbsenteisme: KPIEvolution
  coutTotalAbsences: KPIEvolution
  dureeMoyenneAbsences: KPIEvolution
  frequenceMoyenneAbsences: KPIEvolution
  tauxAbsentsRecurrents: KPIEvolution
  topMotifsAbsence: Array<{ 
    type: string
    jours: number
    pourcentage: number
    cout: number
  }>
  indiceAbsenteismeCritique: KPIEvolution
  evolutionMensuelle: Array<{
    periode: string
    taux: number
    cout: number
    nb_absences: number
    etp_reel: number
    jours_theoriques: number
  }>
  evolutionGlissante13Mois: Array<{
    periode: string
    taux: number
    moisLabel: string
    etp_reel: number
    jours_theoriques: number
  }>
}

interface AdvancedWorkforceKPIs {
  // Effectifs
  etpTotal: KPIEvolution
  headcountActif: KPIEvolution
  headcountInactif: KPIEvolution
  
  // Mouvements
  entreesDelaPeriode: KPIEvolution
  sortiesDelaPeriode: KPIEvolution
  mobilitesInternes: KPIEvolution
  tauxTurnover: KPIEvolution
  
  // Démographie
  ancienneteMoyenne: KPIEvolution
  repartitionSexe: {
    hommes: { count: number, percentage: number }
    femmes: { count: number, percentage: number }
  }
  pyramideAges: {
    moins30: { count: number, percentage: number, hommes: number, femmes: number }
    entre30et45: { count: number, percentage: number, hommes: number, femmes: number }
    plus45: { count: number, percentage: number, hommes: number, femmes: number }
  }
  
  // Top postes
  top3Postes: Array<{
    poste: string
    etp: number
    count: number
    pourcentage: number
  }>
  
  // Évolution historique 2 ans
  evolutionEffectifs24Mois: Array<{
    periode: string
    headcount: number
    etp: number
    entrees: number
    sorties: number
    moisLabel: string
  }>
}

interface KPIData {
  // Workforce Advanced
  workforceAdvanced: AdvancedWorkforceKPIs
  
  // Payroll
  masseSalarialeBrute: KPIEvolution
  coutTotalEmployeur: KPIEvolution
  salaireMoyenETP: KPIEvolution
  partVariable: KPIEvolution
  tauxChargesSociales: KPIEvolution
  
  // Advanced Absences
  absencesAdvanced: AdvancedAbsenceKPIs
  
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
  return `${Math.round(num * 10) / 10}%` // Une décimale pour plus de précision
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

const getWorkingDaysInMonth = (periode: string): number => {
  const date = new Date(periode)
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  let workingDays = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day)
    const dayOfWeek = currentDate.getDay()
    // 0 = dimanche, 6 = samedi
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
  }
  return workingDays
}

// Nouvelle fonction utilitaire pour calculer le taux d'absentéisme de manière cohérente
const calculateAbsenceRate = (absences: Absence[], employees: Employee[], periode: string): number => {
  const activeEmployees = employees.filter(emp => emp.statut_emploi === 'Actif')
  const totalETP = activeEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
  const workingDays = getWorkingDaysInMonth(periode)
  const theoreticalWorkDays = totalETP * workingDays
  
  const totalAbsenceDays = absences.reduce((sum, abs) => sum + abs.nb_jours_ouvres, 0)
  
  return theoreticalWorkDays > 0 ? (totalAbsenceDays / theoreticalWorkDays) * 100 : 0
}

// ==========================================
// KPI CARD COMPONENT
// ==========================================

interface KPICardProps {
  title: string
  value: string | number
  format: 'currency' | 'percent' | 'number' | 'text' | 'days'
  icon: React.ElementType
  gradient: string
  evolution?: KPIEvolution
  subtitle?: string
  alert?: boolean
  size?: 'normal' | 'large'
  className?: string
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
  size = 'normal',
  className = ''
}) => {
  const formattedValue = 
    format === 'currency' ? formatCurrency(Number(value)) :
    format === 'percent' ? formatPercentage(Number(value)) :
    format === 'number' ? formatNumber(Number(value)) :
    format === 'days' ? `${Number(value).toFixed(1)} jours` :
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
      } ${isLarge ? 'p-8 col-span-2' : 'p-6'} ${className}`}
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
// ADVANCED CHART COMPONENTS
// ==========================================

const WorkforceEvolution24MonthsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <motion.div 
    className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
      <TrendingUpIcon size={20} className="text-cyan-400" />
      Évolution Effectifs - 24 Derniers Mois
    </h3>
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="headcountGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="etpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
        <XAxis 
          dataKey="moisLabel" 
          stroke="rgba(148,163,184,0.8)" 
          fontSize={11}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="rgba(148,163,184,0.8)" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(15,23,42,0.95)', 
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'headcount') return [value, 'Headcount']
            if (name === 'etp') return [Number(value).toFixed(1), 'ETP']
            return [value, name]
          }}
        />
        <Area
          type="monotone"
          dataKey="headcount"
          stroke="#06b6d4"
          strokeWidth={3}
          fill="url(#headcountGradient)"
        />
        <Line
          type="monotone"
          dataKey="etp"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </motion.div>
)

// Composant amélioré pour la répartition par sexe - Style Cyberpunk Professionnel
const GenderDistributionChart: React.FC<{ 
  data: { hommes: {count: number, percentage: number}, femmes: {count: number, percentage: number} }
}> = ({ data }) => {
  const total = data.hommes.count + data.femmes.count

  return (
    <motion.div 
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Background holographique */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/10 to-pink-500/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,255,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,20,147,0.1),transparent_50%)] pointer-events-none" />
      </div>
      
      <div className="relative z-10">
        {/* Header avec animation holographique */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <motion.div
              animate={{
                textShadow: [
                  '0 0 10px rgba(0,255,255,0.5)',
                  '0 0 20px rgba(255,20,147,0.5)',
                  '0 0 10px rgba(0,255,255,0.5)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <User size={20} className="text-pink-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              Répartition par Sexe
            </span>
          </h3>
          <motion.div 
            className="text-sm text-slate-400 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-600/30"
            animate={{
              boxShadow: [
                '0 0 10px rgba(139,92,246,0.2)',
                '0 0 20px rgba(139,92,246,0.4)',
                '0 0 10px rgba(139,92,246,0.2)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Total: {total}
          </motion.div>
        </motion.div>
        
        {/* Graphique principal avec effets holographiques */}
        <div className="relative">
          {/* Cercles d'arrière-plan animés */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-slate-600/20"
                style={{
                  width: `${120 + i * 40}px`,
                  height: `${120 + i * 40}px`,
                }}
                animate={{
                  rotate: [0, 360],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 3 + i, repeat: Infinity }
                }}
              />
            ))}
          </div>

          {/* Barres horizontales modernes */}
          <div className="space-y-8 py-8">
            {/* Hommes */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(0,255,255,0.5)',
                        '0 0 25px rgba(0,255,255,0.8)',
                        '0 0 10px rgba(0,255,255,0.5)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-white font-semibold tracking-wide">HOMMES</span>
                </div>
                <div className="text-right">
                  <motion.div 
                    className="text-xl font-bold text-cyan-300"
                    animate={{
                      textShadow: [
                        '0 0 5px rgba(0,255,255,0.5)',
                        '0 0 15px rgba(0,255,255,0.8)',
                        '0 0 5px rgba(0,255,255,0.5)'
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {data.hommes.count}
                  </motion.div>
                  <div className="text-xs text-slate-400">{data.hommes.percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="relative h-8 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.hommes.percentage}%` }}
                  transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                >
                  {/* Effet de brillance */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Pulsation cyberpunk */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-blue-400/40 rounded-full blur-sm"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Femmes */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-lg"
                    animate={{
                      boxShadow: [
                        '0 0 10px rgba(255,20,147,0.5)',
                        '0 0 25px rgba(255,20,147,0.8)',
                        '0 0 10px rgba(255,20,147,0.5)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <span className="text-white font-semibold tracking-wide">FEMMES</span>
                </div>
                <div className="text-right">
                  <motion.div 
                    className="text-xl font-bold text-pink-300"
                    animate={{
                      textShadow: [
                        '0 0 5px rgba(255,20,147,0.5)',
                        '0 0 15px rgba(255,20,147,0.8)',
                        '0 0 5px rgba(255,20,147,0.5)'
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  >
                    {data.femmes.count}
                  </motion.div>
                  <div className="text-xs text-slate-400">{data.femmes.percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="relative h-8 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/30">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${data.femmes.percentage}%` }}
                  transition={{ delay: 1.0, duration: 1.5, ease: "easeOut" }}
                >
                  {/* Effet de brillance */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  />
                  {/* Pulsation cyberpunk */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-pink-400/40 to-rose-400/40 rounded-full blur-sm"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer avec stats avancées */}
        <motion.div 
          className="mt-6 pt-4 border-t border-slate-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="text-center p-3 bg-slate-800/30 rounded-lg backdrop-blur-sm border border-cyan-500/20"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(30,41,59,0.5)' }}
            >
              <div className="text-xs text-slate-400 mb-1">Ratio H/F</div>
              <div className="text-sm font-bold text-cyan-300">
                {total > 0 ? (data.hommes.count / data.femmes.count || 0).toFixed(2) : '0'}
              </div>
            </motion.div>
            <motion.div 
              className="text-center p-3 bg-slate-800/30 rounded-lg backdrop-blur-sm border border-pink-500/20"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(30,41,59,0.5)' }}
            >
              <div className="text-xs text-slate-400 mb-1">Parité</div>
              <div className="text-sm font-bold text-pink-300">
                {Math.abs(data.hommes.percentage - data.femmes.percentage).toFixed(1)}% écart
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Particules flottantes cyberpunk */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: i % 2 === 0 ? '#00FFFF' : '#FF1493',
            left: `${15 + (i * 7)}%`,
            top: `${20 + (i * 6)}%`,
            boxShadow: `0 0 6px ${i % 2 === 0 ? '#00FFFF' : '#FF1493'}80`
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.sin(i) * 10, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.5, 0.8]
          }}
          transition={{
            duration: 4 + (i * 0.3),
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

// Pyramide des âges Cyberpunk Professionnel
const AgePyramidCyberpunk: React.FC<{ 
  data: { 
    moins30: {count: number, percentage: number, hommes: number, femmes: number}, 
    entre30et45: {count: number, percentage: number, hommes: number, femmes: number}, 
    plus45: {count: number, percentage: number, hommes: number, femmes: number} 
  }
}> = ({ data }) => {
  const pyramidData = [
    { 
      label: '45+ ans', 
      hommes: data.plus45.hommes,
      femmes: data.plus45.femmes,
      total: data.plus45.count,
      color: {
        base: 'from-emerald-400 via-green-500 to-teal-600',
        neon: '#10b981',
        shadow: 'rgba(16,185,129,0.4)'
      },
      position: 'top'
    },
    { 
      label: '30-45 ans', 
      hommes: data.entre30et45.hommes,
      femmes: data.entre30et45.femmes,
      total: data.entre30et45.count,
      color: {
        base: 'from-purple-400 via-violet-500 to-indigo-600',
        neon: '#8b5cf6',
        shadow: 'rgba(139,92,246,0.4)'
      },
      position: 'middle'
    },
    { 
      label: '< 30 ans', 
      hommes: data.moins30.hommes,
      femmes: data.moins30.femmes,
      total: data.moins30.count,
      color: {
        base: 'from-cyan-400 via-blue-500 to-sky-600',
        neon: '#06b6d4',
        shadow: 'rgba(6,182,212,0.4)'
      },
      position: 'bottom'
    }
  ]

  const maxValue = Math.max(...pyramidData.map(d => Math.max(d.hommes, d.femmes)))
  const totalCount = data.moins30.count + data.entre30et45.count + data.plus45.count

  return (
    <motion.div 
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Background holographique */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-emerald-500/5" />
        <motion.div 
          className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(139,92,246,0.1),transparent,rgba(6,182,212,0.1),transparent)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="relative z-10">
        {/* Header amélioré */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <motion.div
              animate={{
                textShadow: [
                  '0 0 10px rgba(6,182,212,0.5)',
                  '0 0 20px rgba(139,92,246,0.5)',
                  '0 0 10px rgba(16,185,129,0.5)',
                  '0 0 20px rgba(6,182,212,0.5)'
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <BarChart3 size={20} className="text-cyan-400" />
            </motion.div>
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
              Pyramide des Âges
            </span>
          </h3>
          <motion.div 
            className="text-sm text-slate-400 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-600/30 backdrop-blur-sm"
            animate={{
              boxShadow: [
                '0 0 10px rgba(139,92,246,0.2)',
                '0 0 20px rgba(139,92,246,0.4)',
                '0 0 10px rgba(139,92,246,0.2)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="text-white font-semibold">{totalCount}</span> collaborateurs
          </motion.div>
        </motion.div>
        
        {/* Labels des sexes avec style cyberpunk */}
        <div className="flex justify-between mb-6 px-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-sm font-bold text-cyan-300 mb-2 tracking-wider">HOMMES</div>
            <motion.div 
              className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(0,255,255,0.5)',
                  '0 0 20px rgba(0,255,255,0.8)',
                  '0 0 10px rgba(0,255,255,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-sm font-bold text-pink-300 mb-2 tracking-wider">FEMMES</div>
            <motion.div 
              className="w-20 h-1 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mx-auto"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(255,20,147,0.5)',
                  '0 0 20px rgba(255,20,147,0.8)',
                  '0 0 10px rgba(255,20,147,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        </div>
        
        <div className="relative h-96">
          {/* Axe central avec effet holographique */}
          <motion.div 
            className="absolute left-1/2 top-0 bottom-0 w-1 transform -translate-x-0.5 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #10b981, #8b5cf6, #06b6d4)',
            }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(139,92,246,0.5)',
                '0 0 30px rgba(6,182,212,0.7)',
                '0 0 20px rgba(16,185,129,0.5)',
                '0 0 30px rgba(139,92,246,0.7)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Barres de la pyramide */}
          <div className="absolute inset-0 flex flex-col justify-center gap-12 px-16">
            {pyramidData.map((item, index) => {
              const hommesWidth = maxValue > 0 ? (item.hommes / maxValue) * 140 : 0
              const femmesWidth = maxValue > 0 ? (item.femmes / maxValue) * 140 : 0
              
              return (
                <motion.div 
                  key={item.label}
                  className="relative flex items-center justify-center h-16"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.3, duration: 0.8, type: "spring" }}
                >
                  {/* Label central avec effet holographique */}
                  <motion.div
                    className="absolute z-30 bg-slate-900/95 px-4 py-2 rounded-xl border border-slate-600/50 backdrop-blur-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.3 + 0.5 }}
                    style={{
                      boxShadow: `0 0 20px ${item.color.shadow}`
                    }}
                  >
                    <div className="text-white font-bold text-sm text-center">{item.label}</div>
                    <div className="text-slate-400 text-xs text-center">{item.total} pers.</div>
                  </motion.div>
                  
                  {/* Barre hommes (gauche) */}
                  <motion.div 
                    className="absolute right-1/2 mr-3 h-12 rounded-l-2xl overflow-hidden backdrop-blur-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${hommesWidth}px` }}
                    transition={{ delay: index * 0.3 + 0.6, duration: 1.5, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div 
                      className={`w-full h-full bg-gradient-to-l ${item.color.base} border-2 border-cyan-400/40 relative overflow-hidden`}
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(0,255,255,0.4))'
                      }}
                    >
                      {/* Effet holographique */}
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-l ${item.color.base} rounded-l-2xl blur-md opacity-60`}
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      />
                      
                      {/* Effet de scan cyberpunk */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut",
                          delay: index * 0.7
                        }}
                      />
                      
                      {/* Count display */}
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-end pr-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.3 + 1.5 }}
                      >
                        <span className="relative z-20 text-white font-bold text-sm drop-shadow-lg">
                          {item.hommes}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                  
                  {/* Barre femmes (droite) */}
                  <motion.div 
                    className="absolute left-1/2 ml-3 h-12 rounded-r-2xl overflow-hidden backdrop-blur-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${femmesWidth}px` }}
                    transition={{ delay: index * 0.3 + 0.6, duration: 1.5, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div 
                      className={`w-full h-full bg-gradient-to-r ${item.color.base} border-2 border-pink-400/40 relative overflow-hidden`}
                      style={{
                        filter: 'drop-shadow(0 0 15px rgba(255,20,147,0.4))'
                      }}
                    >
                      {/* Effet holographique */}
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-r ${item.color.base} rounded-r-2xl blur-md opacity-60`}
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5 + 0.5
                        }}
                      />
                      
                      {/* Effet de scan cyberpunk */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-l from-transparent via-pink-300/30 to-transparent"
                        animate={{
                          x: ['200%', '-100%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut",
                          delay: index * 0.7 + 1
                        }}
                      />
                      
                      {/* Count display */}
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-start pl-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.3 + 1.5 }}
                      >
                        <span className="relative z-20 text-white font-bold text-sm drop-shadow-lg">
                          {item.femmes}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
        
        {/* Footer avec statistiques avancées */}
        <motion.div 
          className="mt-8 pt-6 border-t border-slate-700/50 bg-slate-800/20 rounded-xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stats par tranche d'âge */}
            {pyramidData.reverse().map((item, index) => (
              <motion.div 
                key={index} 
                className="text-center p-4 bg-slate-800/40 rounded-xl hover:bg-slate-700/40 transition-all cursor-pointer border border-slate-600/30"
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: `0 10px 25px ${item.color.shadow}`
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.color.base} mx-auto mb-2 shadow-lg`}
                  animate={{
                    boxShadow: [
                      `0 0 10px ${item.color.shadow}`,
                      `0 0 20px ${item.color.shadow}`,
                      `0 0 10px ${item.color.shadow}`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                />
                <div className="text-white text-sm font-semibold mb-1">{item.label}</div>
                <div className="text-xs text-slate-400">{item.total} personnes</div>
                <div className="text-xs text-slate-500 mt-1">
                  {((item.total / totalCount) * 100).toFixed(1)}%
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Stats globales */}
          <motion.div 
            className="mt-6 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Effectif total:</span>
              <motion.span 
                className="text-white font-bold text-xl"
                animate={{ 
                  textShadow: [
                    '0 0 5px rgba(255,255,255,0.5)',
                    '0 0 15px rgba(139,92,246,0.6)',
                    '0 0 25px rgba(6,182,212,0.4)',
                    '0 0 15px rgba(139,92,246,0.6)',
                    '0 0 5px rgba(255,255,255,0.5)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {totalCount} collaborateurs
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Particules cyberpunk avancées */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{
            background: ['#00FFFF', '#8b5cf6', '#10b981', '#FF1493'][i % 4],
            left: `${10 + (i * 5)}%`,
            top: `${15 + (i * 4)}%`,
            boxShadow: `0 0 8px ${['#00FFFF', '#8b5cf6', '#10b981', '#FF1493'][i % 4]}80`
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, Math.sin(i) * 8, 0],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.8, 0.8]
          }}
          transition={{
            duration: 5 + (i * 0.4),
            repeat: Infinity,
            delay: i * 0.9,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

// Évolution des absences - 13 mois glissants avec style ComposedChart CORRIGÉ
const AbsenceEvolution13MonthsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <motion.div 
    className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
      <TrendingDownIcon size={20} className="text-red-400" />
      Évolution du Taux d'Absentéisme - 13 Mois Glissants
    </h3>
    
    {/* Ajout d'informations sur le calcul */}
    <div className="mb-4 p-3 bg-slate-800/30 rounded-lg">
      <p className="text-xs text-slate-400">
        <strong className="text-slate-300">Formule:</strong> (Jours d'absence / Jours théoriques) × 100 
        <br />
        <strong className="text-slate-300">Jours théoriques:</strong> ETP réel × Jours ouvrés du mois
      </p>
    </div>
    
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="absenceAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="absenceLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
            <stop offset="50%" stopColor="#f97316" stopOpacity={0.9}/>
            <stop offset="100%" stopColor="#eab308" stopOpacity={0.8}/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
        <XAxis 
          dataKey="moisLabel" 
          stroke="rgba(148,163,184,0.8)" 
          fontSize={11}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="rgba(148,163,184,0.8)" 
          fontSize={12}
          tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(15,23,42,0.95)', 
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'taux') return [`${Number(value).toFixed(1)}%`, 'Taux d\'absentéisme']
            return [value, name]
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload[0] && payload[0].payload) {
              const data = payload[0].payload
              return `${label} - ETP: ${data.etp_reel?.toFixed(1) || 'N/A'} - Jours théo: ${data.jours_theoriques || 'N/A'}`
            }
            return `Période: ${label}`
          }}
        />
        <Area
          type="monotone"
          dataKey="taux"
          stroke="#ef4444"
          strokeWidth={3}
          fill="url(#absenceAreaGradient)"
        />
        <Line
          type="monotone"
          dataKey="taux"
          stroke="url(#absenceLineGradient)"
          strokeWidth={2}
          dot={{ 
            fill: '#ef4444', 
            strokeWidth: 2, 
            r: 4,
            filter: "url(#glow)"
          }}
          activeDot={{ 
            r: 6, 
            fill: '#f97316', 
            strokeWidth: 3, 
            stroke: '#fff',
            filter: "url(#glow)"
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </motion.div>
)

// Top 3 Postes Component
const Top3PostesCard: React.FC<{ data: any[] }> = ({ data }) => (
  <motion.div 
    className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.1 }}
  >
    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
      <Award size={20} className="text-yellow-400" />
      Top 3 Postes Critiques (ETP)
    </h3>
    <div className="space-y-4">
      {data.map((poste, index) => (
        <motion.div 
          key={poste.poste} 
          className={`relative p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
            index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
            index === 1 ? 'bg-gradient-to-r from-slate-600/20 to-slate-500/20 border border-slate-500/30' :
            'bg-gradient-to-r from-orange-600/20 to-red-500/20 border border-orange-500/30'
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                  index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white' :
                  'bg-gradient-to-r from-orange-400 to-red-500 text-white'
                } shadow-lg`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {index + 1}
              </motion.div>
              <div>
                <h4 className="text-white font-semibold">{poste.poste}</h4>
                <p className="text-slate-400 text-sm">{poste.count} personnes • {Math.round(poste.pourcentage)}% de l'effectif</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{poste.etp.toFixed(1)}</div>
              <div className="text-xs text-slate-400">ETP</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <motion.div 
            className="mt-3 h-1 bg-slate-700/50 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.2 + 0.3 }}
          >
            <motion.div 
              className={`h-full ${
                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-600' :
                'bg-gradient-to-r from-orange-400 to-red-500'
              } rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${poste.pourcentage}%` }}
              transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
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

      // Load all required data
      const [
        currentEmployees, prevEmployees, prevYearEmployees,
        currentRem, prevRem, prevYearRem,
        currentAbs, prevAbs, prevYearAbs,
        refAbsences, historicalAbs, historicalEmployees
      ] = await Promise.all([
        // Current period employees
        supabase.from('employes').select('*').eq('etablissement_id', establishmentId).eq('periode', normalizedPeriod),
        supabase.from('employes').select('*').eq('etablissement_id', establishmentId).eq('periode', prevPeriod),
        supabase.from('employes').select('*').eq('etablissement_id', establishmentId).eq('periode', prevYearPeriod),
        
        // Remunerations
        supabase.from('remunerations').select('*').eq('etablissement_id', establishmentId).eq('mois_paie', normalizedPeriod),
        supabase.from('remunerations').select('*').eq('etablissement_id', establishmentId).eq('mois_paie', prevPeriod),
        supabase.from('remunerations').select('*').eq('etablissement_id', establishmentId).eq('mois_paie', prevYearPeriod),
        
        // Current period absences
        supabase.from('absences').select('*').eq('etablissement_id', establishmentId)
          .gte('date_debut', normalizedPeriod)
          .lt('date_debut', new Date(new Date(normalizedPeriod).getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Previous period absences  
        supabase.from('absences').select('*').eq('etablissement_id', establishmentId)
          .gte('date_debut', prevPeriod)
          .lt('date_debut', new Date(new Date(prevPeriod).getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Previous year absences
        supabase.from('absences').select('*').eq('etablissement_id', establishmentId)
          .gte('date_debut', prevYearPeriod)
          .lt('date_debut', new Date(new Date(prevYearPeriod).getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Reference absences for indemnification rates
        supabase.from('referentiel_absences').select('*').eq('etablissement_id', establishmentId),
        
        // Historical absences for charts (last 13 months)
        supabase.from('absences').select('*').eq('etablissement_id', establishmentId)
          .gte('date_debut', new Date(new Date(normalizedPeriod).getTime() - 395 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date_debut', { ascending: true }),

        // Historical employees for 24 months evolution
        supabase.from('employes').select('periode, temps_travail, type_contrat, statut_emploi, sexe, age_at_periode, intitule_poste')
          .eq('etablissement_id', establishmentId)
          .gte('periode', new Date(new Date(normalizedPeriod).getTime() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('periode', { ascending: true })
      ])

      // Calculate KPIs with advanced analytics
      const calculatedKPIs = calculateAdvancedKPIs(
        currentEmployees.data || [],
        prevEmployees.data || [],
        prevYearEmployees.data || [],
        currentRem.data || [],
        prevRem.data || [],
        prevYearRem.data || [],
        currentAbs.data || [],
        prevAbs.data || [],
        prevYearAbs.data || [],
        refAbsences.data || [],
        historicalAbs.data || [],
        historicalEmployees.data || [],
        normalizedPeriod,
        establishmentId
      )

      setKpiData(calculatedKPIs)
      
    } catch (err) {
      console.error('Load data error:', err)
      setError('Erreur lors du chargement des données')
    }
  }

  const calculateAdvancedKPIs = (
    currentEmployees: Employee[],
    prevEmployees: Employee[],
    prevYearEmployees: Employee[],
    currentRem: Remuneration[],
    prevRem: Remuneration[],
    prevYearRem: Remuneration[],
    currentAbs: Absence[],
    prevAbs: Absence[],
    prevYearAbs: Absence[],
    refAbsences: RefAbsence[],
    historicalAbs: Absence[],
    historicalEmployees: HistoricalEmployee[],
    currentPeriod: string,
    establishmentId: string
  ): KPIData => {

    // ==========================================
    // ADVANCED WORKFORCE CALCULATIONS
    // ==========================================
    
    const calculateWorkforceMetrics = (
      employees: Employee[], 
      prevEmployees: Employee[], 
      prevYearEmployees: Employee[],
      currentPeriod: string,
      historicalEmployees: HistoricalEmployee[]
    ) => {
      // Effectifs
      const activeEmployees = employees.filter(emp => emp.statut_emploi === 'Actif')
      const inactiveEmployees = employees.filter(emp => emp.statut_emploi !== 'Actif')
      
      const etpTotal = activeEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
      const headcountActif = activeEmployees.length
      const headcountInactif = inactiveEmployees.length
      
      const prevActiveEmployees = prevEmployees.filter(emp => emp.statut_emploi === 'Actif')
      const prevInactiveEmployees = prevEmployees.filter(emp => emp.statut_emploi !== 'Actif')
      const prevEtpTotal = prevActiveEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
      const prevHeadcountActif = prevActiveEmployees.length
      const prevHeadcountInactif = prevInactiveEmployees.length
      
      const prevYearActiveEmployees = prevYearEmployees.filter(emp => emp.statut_emploi === 'Actif')
      const prevYearInactiveEmployees = prevYearEmployees.filter(emp => emp.statut_emploi !== 'Actif')
      const prevYearEtpTotal = prevYearActiveEmployees.reduce((sum, emp) => sum + emp.temps_travail, 0)
      const prevYearHeadcountActif = prevYearActiveEmployees.length
      const prevYearHeadcountInactif = prevYearInactiveEmployees.length

      // Mouvements
      const currentMonth = currentPeriod.substring(0, 7)
      const entreesDuMois = employees.filter(emp => emp.date_entree.substring(0, 7) === currentMonth).length
      const sortiesDuMois = employees.filter(emp => emp.date_sortie?.substring(0, 7) === currentMonth).length
      
      // Mobilités internes (approximation)
      const mobilitesInternes = 0
      
      // Nouveau calcul du Taux de Turnover: (Sorties / Effectif moyen) * 100
      const effectifMoyen = headcountActif > 0 ? headcountActif : 1
      const tauxTurnover = (sortiesDuMois / effectifMoyen) * 100

      // Calculs précédents pour évolutions
      const prevPeriodMonth = getPreviousPeriod(currentPeriod).substring(0, 7)
      const prevEntrees = prevEmployees.filter(emp => emp.date_entree.substring(0, 7) === prevPeriodMonth).length
      const prevSorties = prevEmployees.filter(emp => emp.date_sortie?.substring(0, 7) === prevPeriodMonth).length
      const prevEffectifMoyen = prevHeadcountActif > 0 ? prevHeadcountActif : 1
      const prevTauxTurnover = (prevSorties / prevEffectifMoyen) * 100

      // Année précédente (simplifié)
      const prevYearEntrees = 0
      const prevYearSorties = 0
      const prevYearTauxTurnover = 0

      // Démographie
      const ancienneteMoyenne = activeEmployees.length > 0 
        ? activeEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0) / activeEmployees.length / 12 
        : 0
      
      const prevAncienneteMoyenne = prevActiveEmployees.length > 0
        ? prevActiveEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0) / prevActiveEmployees.length / 12
        : 0
      
      const prevYearAncienneteMoyenne = prevYearActiveEmployees.length > 0
        ? prevYearActiveEmployees.reduce((sum, emp) => sum + (emp.anciennete_mois || 0), 0) / prevYearActiveEmployees.length / 12
        : 0

      // Répartition par sexe
      const hommes = activeEmployees.filter(emp => emp.sexe === 'M' || emp.sexe === 'H').length
      const femmes = activeEmployees.filter(emp => emp.sexe === 'F').length
      const totalForGender = hommes + femmes

      // Pyramide des âges avec répartition par sexe
      const getAgeGenderStats = (ageFilter: (age: number) => boolean) => {
        const filtered = activeEmployees.filter(emp => ageFilter(emp.age_at_periode || 0))
        const hommesCount = filtered.filter(emp => emp.sexe === 'M' || emp.sexe === 'H').length
        const femmesCount = filtered.filter(emp => emp.sexe === 'F').length
        return {
          count: filtered.length,
          percentage: activeEmployees.length > 0 ? (filtered.length / activeEmployees.length) * 100 : 0,
          hommes: hommesCount,
          femmes: femmesCount
        }
      }

      const moins30 = getAgeGenderStats(age => age < 30)
      const entre30et45 = getAgeGenderStats(age => age >= 30 && age < 45)
      const plus45 = getAgeGenderStats(age => age >= 45)

      // Top 3 postes par ETP en utilisant intitule_poste
      const posteStats = activeEmployees.reduce((acc, emp) => {
        const poste = emp.intitule_poste || emp.poste || emp.metier || 'Non défini'
        if (!acc[poste]) {
          acc[poste] = { count: 0, etp: 0 }
        }
        acc[poste].count++
        acc[poste].etp += emp.temps_travail
        return acc
      }, {} as Record<string, { count: number, etp: number }>)

      const top3Postes = Object.entries(posteStats)
        .map(([poste, stats]) => ({
          poste,
          count: stats.count,
          etp: stats.etp,
          pourcentage: activeEmployees.length > 0 ? (stats.count / activeEmployees.length) * 100 : 0
        }))
        .sort((a, b) => b.etp - a.etp)
        .slice(0, 3)

      // Évolution historique 24 mois
      const groupedByPeriod = historicalEmployees.reduce((acc: any, emp) => {
        if (!acc[emp.periode]) {
          acc[emp.periode] = { 
            periode: emp.periode, 
            effectifs: 0, 
            etp: 0,
            headcount: 0,
            entrees: 0,
            sorties: 0
          }
        }
        if (emp.statut_emploi === 'Actif') {
          acc[emp.periode].effectifs += 1
          acc[emp.periode].etp += emp.temps_travail
          acc[emp.periode].headcount += 1
        }
        return acc
      }, {})

      const evolutionEffectifs24Mois = Object.values(groupedByPeriod)
        .map((period: any) => ({
          ...period,
          moisLabel: new Date(period.periode).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        }))
        .sort((a: any, b: any) => a.periode.localeCompare(b.periode))

      return {
        etpTotal: calculateEvolution(etpTotal, prevEtpTotal, prevYearEtpTotal),
        headcountActif: calculateEvolution(headcountActif, prevHeadcountActif, prevYearHeadcountActif),
        headcountInactif: calculateEvolution(headcountInactif, prevHeadcountInactif, prevYearHeadcountInactif),
        entreesDelaPeriode: calculateEvolution(entreesDuMois, prevEntrees, prevYearEntrees),
        sortiesDelaPeriode: calculateEvolution(sortiesDuMois, prevSorties, prevYearSorties),
        mobilitesInternes: calculateEvolution(mobilitesInternes, 0, 0),
        tauxTurnover: calculateEvolution(tauxTurnover, prevTauxTurnover, prevYearTauxTurnover),
        ancienneteMoyenne: calculateEvolution(ancienneteMoyenne, prevAncienneteMoyenne, prevYearAncienneteMoyenne),
        repartitionSexe: {
          hommes: { 
            count: hommes, 
            percentage: totalForGender > 0 ? (hommes / totalForGender) * 100 : 0 
          },
          femmes: { 
            count: femmes, 
            percentage: totalForGender > 0 ? (femmes / totalForGender) * 100 : 0 
          }
        },
        pyramideAges: {
          moins30,
          entre30et45,
          plus45
        },
        top3Postes,
        evolutionEffectifs24Mois
      }
    }

    const workforceAdvanced = calculateWorkforceMetrics(
      currentEmployees, 
      prevEmployees, 
      prevYearEmployees, 
      currentPeriod,
      historicalEmployees
    )

    // Payroll calculations with charges sociales
    const currentMasseBrute = currentRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)
    const prevMasseBrute = prevRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)
    const prevYearMasseBrute = prevYearRem.reduce((sum, rem) => sum + (rem.salaire_de_base + rem.primes_fixes + rem.primes_variables + rem.heures_supp_payees + rem.avantages_nature + rem.indemnites), 0)

    const currentCoutTotal = currentRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)
    const prevCoutTotal = prevRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)
    const prevYearCoutTotal = prevYearRem.reduce((sum, rem) => sum + rem.cout_total_employeur, 0)

    // Calcul du taux de charges sociales et taxes
    const currentCharges = currentRem.reduce((sum, rem) => sum + rem.cotisations_sociales + rem.taxes_sur_salaire + rem.autres_charges, 0)
    const prevCharges = prevRem.reduce((sum, rem) => sum + rem.cotisations_sociales + rem.taxes_sur_salaire + rem.autres_charges, 0)
    const prevYearCharges = prevYearRem.reduce((sum, rem) => sum + rem.cotisations_sociales + rem.taxes_sur_salaire + rem.autres_charges, 0)

    const currentTauxCharges = currentMasseBrute > 0 ? (currentCharges / currentMasseBrute) * 100 : 0
    const prevTauxCharges = prevMasseBrute > 0 ? (prevCharges / prevMasseBrute) * 100 : 0
    const prevYearTauxCharges = prevYearMasseBrute > 0 ? (prevYearCharges / prevYearMasseBrute) * 100 : 0

    const currentFTE = workforceAdvanced.etpTotal.value
    const prevFTE = workforceAdvanced.etpTotal.value - (workforceAdvanced.etpTotal.momPercent * workforceAdvanced.etpTotal.value / 100)
    const prevYearFTE = workforceAdvanced.etpTotal.value - (workforceAdvanced.etpTotal.yoyPercent * workforceAdvanced.etpTotal.value / 100)

    const currentSalaireMoyenETP = currentFTE > 0 ? currentCoutTotal / currentFTE : 0
    const prevSalaireMoyenETP = prevFTE > 0 ? prevCoutTotal / prevFTE : 0
    const prevYearSalaireMoyenETP = prevYearFTE > 0 ? prevYearCoutTotal / prevYearFTE : 0

    const currentPartVariable = currentMasseBrute > 0 ? (currentRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / currentMasseBrute) * 100 : 0
    const prevPartVariable = prevMasseBrute > 0 ? (prevRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / prevMasseBrute) * 100 : 0
    const prevYearPartVariable = prevYearMasseBrute > 0 ? (prevYearRem.reduce((sum, rem) => sum + rem.primes_variables, 0) / prevYearMasseBrute) * 100 : 0

    // ==========================================
    // ADVANCED ABSENCE CALCULATIONS CORRIGÉES
    // ==========================================

    // 1. Taux d'absentéisme - Calcul principal cohérent
    const currentTauxAbsenteisme = calculateAbsenceRate(currentAbs, currentEmployees, currentPeriod)
    const prevTauxAbsenteisme = calculateAbsenceRate(prevAbs, prevEmployees, getPreviousPeriod(currentPeriod))
    const prevYearTauxAbsenteisme = calculateAbsenceRate(prevYearAbs, prevYearEmployees, getPreviousYearPeriod(currentPeriod))

    // 2. Coût total des absences avec taux d'indemnisation
    const calculateAbsenceCost = (absences: Absence[], remunerations: Remuneration[], periode: string) => {
      const workingDays = getWorkingDaysInMonth(periode)
      const salaryMap = remunerations.reduce((map, rem) => {
        map[rem.matricule] = rem.cout_total_employeur / workingDays
        return map
      }, {} as Record<string, number>)
      
      return absences.reduce((total, abs) => {
        const dailySalary = salaryMap[abs.matricule] || 0
        const refAbsence = refAbsences.find(ref => ref.type_absence === abs.type_absence)
        const indemnificationRate = refAbsence ? refAbsence.taux_indemnisation : 1
        return total + (dailySalary * abs.nb_jours_ouvres * indemnificationRate)
      }, 0)
    }

    const currentCoutAbsences = calculateAbsenceCost(currentAbs, currentRem, currentPeriod)
    const prevCoutAbsences = calculateAbsenceCost(prevAbs, prevRem, getPreviousPeriod(currentPeriod))
    const prevYearCoutAbsences = calculateAbsenceCost(prevYearAbs, prevYearRem, getPreviousYearPeriod(currentPeriod))

    // 3. Durée moyenne des absences
    const calculateAvgDuration = (absences: Absence[]) => {
      if (absences.length === 0) return 0
      return absences.reduce((sum, abs) => sum + abs.nb_jours_ouvres, 0) / absences.length
    }

    const currentDureeMoyenne = calculateAvgDuration(currentAbs)
    const prevDureeMoyenne = calculateAvgDuration(prevAbs)
    const prevYearDureeMoyenne = calculateAvgDuration(prevYearAbs)

    // 4. Fréquence moyenne des absences
    const calculateAvgFrequency = (absences: Absence[]) => {
      const employeeAbsenceCount = absences.reduce((map, abs) => {
        map[abs.matricule] = (map[abs.matricule] || 0) + 1
        return map
      }, {} as Record<string, number>)
      
      const absentEmployees = Object.keys(employeeAbsenceCount)
      if (absentEmployees.length === 0) return 0
      
      const totalAbsences = Object.values(employeeAbsenceCount).reduce((sum, count) => sum + count, 0)
      return totalAbsences / absentEmployees.length
    }

    const currentFrequenceMoyenne = calculateAvgFrequency(currentAbs)
    const prevFrequenceMoyenne = calculateAvgFrequency(prevAbs)
    const prevYearFrequenceMoyenne = calculateAvgFrequency(prevYearAbs)

    // 5. Taux d'absents récurrents
    const calculateRecurrentRate = (employees: Employee[], yearAbsences: Absence[]) => {
      const employeeAbsenceCount = yearAbsences.reduce((map, abs) => {
        map[abs.matricule] = (map[abs.matricule] || 0) + 1
        return map
      }, {} as Record<string, number>)
      
      const recurrentEmployees = Object.entries(employeeAbsenceCount)
        .filter(([_, count]) => count >= 3)
        .length
      
      return employees.length > 0 ? (recurrentEmployees / employees.length) * 100 : 0
    }

    const currentYearStart = currentPeriod.substring(0, 4) + '-01-01'
    const yearAbsences = historicalAbs.filter(abs => abs.date_debut >= currentYearStart)
    const currentTauxRecurrents = calculateRecurrentRate(currentEmployees, yearAbsences)
    const prevTauxRecurrents = calculateRecurrentRate(prevEmployees, prevAbs)
    const prevYearTauxRecurrents = calculateRecurrentRate(prevYearEmployees, prevYearAbs)

    // 6. Top motifs d'absence pondérés
    const totalAbsenceDays = currentAbs.reduce((sum, abs) => sum + abs.nb_jours_ouvres, 0)
    const topMotifsAbsence = currentAbs.reduce((acc, abs) => {
      if (!acc[abs.type_absence]) {
        acc[abs.type_absence] = { jours: 0, cout: 0, count: 0 }
      }
      acc[abs.type_absence].jours += abs.nb_jours_ouvres
      acc[abs.type_absence].count += 1
      
      const rem = currentRem.find(r => r.matricule === abs.matricule)
      const dailySalary = rem ? rem.cout_total_employeur / getWorkingDaysInMonth(currentPeriod) : 0
      const refAbsence = refAbsences.find(ref => ref.type_absence === abs.type_absence)
      const indemnificationRate = refAbsence ? refAbsence.taux_indemnisation : 1
      
      acc[abs.type_absence].cout += dailySalary * abs.nb_jours_ouvres * indemnificationRate
      
      return acc
    }, {} as Record<string, { jours: number, cout: number, count: number }>)

    const topMotifsArray = Object.entries(topMotifsAbsence)
      .map(([type, data]) => ({
        type,
        jours: data.jours,
        pourcentage: totalAbsenceDays > 0 ? (data.jours / totalAbsenceDays) * 100 : 0,
        cout: data.cout
      }))
      .sort((a, b) => b.jours - a.jours)
      .slice(0, 3)

    // 7. Indice d'absentéisme critique
    const criticalAbsences = currentAbs.filter(abs => abs.nb_jours_ouvres > 30)
    const currentIndiceCritique = currentAbs.length > 0 ? (criticalAbsences.length / currentAbs.length) * 100 : 0
    
    const prevCriticalAbsences = prevAbs.filter(abs => abs.nb_jours_ouvres > 30)
    const prevIndiceCritique = prevAbs.length > 0 ? (prevCriticalAbsences.length / prevAbs.length) * 100 : 0
    
    const prevYearCriticalAbsences = prevYearAbs.filter(abs => abs.nb_jours_ouvres > 30)
    const prevYearIndiceCritique = prevYearAbs.length > 0 ? (prevYearCriticalAbsences.length / prevYearAbs.length) * 100 : 0

    // ==========================================
    // ÉVOLUTION HISTORIQUE CORRIGÉE
    // ==========================================

    // Regrouper les données par période pour l'évolution mensuelle
    const evolutionData = historicalEmployees.reduce((acc: any, emp) => {
      if (!acc[emp.periode]) {
        acc[emp.periode] = { 
          periode: emp.periode,
          employees: [],
          absences: []
        }
      }
      if (emp.statut_emploi === 'Actif') {
        acc[emp.periode].employees.push(emp)
      }
      return acc
    }, {})

    // Ajouter les absences par période
    historicalAbs.forEach(abs => {
      const periode = abs.date_debut.substring(0, 7) + '-01'
      if (evolutionData[periode]) {
        evolutionData[periode].absences.push(abs)
      }
    })

    // Calculer les taux d'absentéisme pour chaque période avec les vraies données
    const evolutionMensuelle = Object.entries(evolutionData)
      .map(([periode, data]: [string, any]) => {
        const employees = data.employees || []
        const absences = data.absences || []
        
        const etp_reel = employees.reduce((sum: number, emp: any) => sum + emp.temps_travail, 0)
        const workingDays = getWorkingDaysInMonth(periode)
        const jours_theoriques = etp_reel * workingDays
        const jours_absence = absences.reduce((sum: number, abs: any) => sum + abs.nb_jours_ouvres, 0)
        
        const taux = jours_theoriques > 0 ? (jours_absence / jours_theoriques) * 100 : 0
        
        // Calculer le coût des absences pour cette période
        const cout = absences.reduce((total: number, abs: any) => {
          const refAbsence = refAbsences.find(ref => ref.type_absence === abs.type_absence)
          const indemnificationRate = refAbsence ? refAbsence.taux_indemnisation : 1
          // Estimation du coût journalier (on pourrait améliorer avec les vraies rémunérations)
          const estimatedDailyCost = 200 // €/jour en moyenne
          return total + (estimatedDailyCost * abs.nb_jours_ouvres * indemnificationRate)
        }, 0)

        return {
          periode,
          taux: Number(taux.toFixed(1)),
          cout,
          nb_absences: absences.length,
          etp_reel: Number(etp_reel.toFixed(1)),
          jours_theoriques
        }
      })
      .filter(item => item.periode >= new Date(new Date(currentPeriod).getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .sort((a, b) => a.periode.localeCompare(b.periode))
      .slice(-12)

    // Evolution 13 mois glissants pour le nouveau graphique avec calcul cohérent
    const currentDate = new Date(currentPeriod)
    const evolutionGlissante13Mois = []
    
    for (let i = 12; i >= 0; i--) {
      const targetDate = new Date(currentDate)
      targetDate.setMonth(targetDate.getMonth() - i)
      const targetPeriod = targetDate.toISOString().substring(0, 7) + '-01'
      
      const monthData = evolutionData[targetPeriod]
      if (monthData) {
        const employees = monthData.employees || []
        const absences = monthData.absences || []
        
        const etp_reel = employees.reduce((sum: number, emp: any) => sum + emp.temps_travail, 0)
        const workingDays = getWorkingDaysInMonth(targetPeriod)
        const jours_theoriques = etp_reel * workingDays
        const jours_absence = absences.reduce((sum: number, abs: any) => sum + abs.nb_jours_ouvres, 0)
        
        const taux = jours_theoriques > 0 ? (jours_absence / jours_theoriques) * 100 : 0
        
        evolutionGlissante13Mois.push({
          periode: targetPeriod,
          taux: Number(taux.toFixed(1)),
          moisLabel: targetDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          etp_reel: Number(etp_reel.toFixed(1)),
          jours_theoriques
        })
      }
    }

    // Demographics
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
      workforceAdvanced,
      masseSalarialeBrute: calculateEvolution(currentMasseBrute, prevMasseBrute, prevYearMasseBrute),
      coutTotalEmployeur: calculateEvolution(currentCoutTotal, prevCoutTotal, prevYearCoutTotal),
      salaireMoyenETP: calculateEvolution(currentSalaireMoyenETP, prevSalaireMoyenETP, prevYearSalaireMoyenETP),
      partVariable: calculateEvolution(currentPartVariable, prevPartVariable, prevYearPartVariable),
      tauxChargesSociales: calculateEvolution(currentTauxCharges, prevTauxCharges, prevYearTauxCharges),
      
      absencesAdvanced: {
        tauxAbsenteisme: calculateEvolution(currentTauxAbsenteisme, prevTauxAbsenteisme, prevYearTauxAbsenteisme),
        coutTotalAbsences: calculateEvolution(currentCoutAbsences, prevCoutAbsences, prevYearCoutAbsences),
        dureeMoyenneAbsences: calculateEvolution(currentDureeMoyenne, prevDureeMoyenne, prevYearDureeMoyenne),
        frequenceMoyenneAbsences: calculateEvolution(currentFrequenceMoyenne, prevFrequenceMoyenne, prevYearFrequenceMoyenne),
        tauxAbsentsRecurrents: calculateEvolution(currentTauxRecurrents, prevTauxRecurrents, prevYearTauxRecurrents),
        topMotifsAbsence: topMotifsArray,
        indiceAbsenteismeCritique: calculateEvolution(currentIndiceCritique, prevIndiceCritique, prevYearIndiceCritique),
        evolutionMensuelle: evolutionMensuelle,
        evolutionGlissante13Mois: evolutionGlissante13Mois
      },
      
      ageMoyen: calculateEvolution(currentAgeMoyen, prevAgeMoyen, prevYearAgeMoyen),
      ancienneteMoyenne: calculateEvolution(currentAncienneteMoyenne / 12, prevAncienneteMoyenne / 12, prevYearAncienneteMoyenne / 12),
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
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Sélectionner une période</span>
                  </div>
                </div>
                
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
            {/* 👥 EFFECTIF & MOUVEMENTS AVANCÉS */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <SectionHeader 
                title="Effectif & Mouvements" 
                icon={Users2} 
                gradient="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" 
              />
              
              {/* Effectifs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <KPICard
                  title="ETP Total"
                  value={kpiData.workforceAdvanced.etpTotal.value.toFixed(1)}
                  format="text"
                  icon={Users}
                  gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
                  evolution={kpiData.workforceAdvanced.etpTotal}
                  subtitle="Équivalent Temps Plein"
                />

                <KPICard
                  title="Headcount Actif"
                  value={kpiData.workforceAdvanced.headcountActif.value}
                  format="number"
                  icon={UsersIcon}
                  gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                  evolution={kpiData.workforceAdvanced.headcountActif}
                  subtitle="Salariés en poste"
                />

                <KPICard
                  title="Headcount Inactif"
                  value={kpiData.workforceAdvanced.headcountInactif.value}
                  format="number"
                  icon={UserX}
                  gradient="bg-gradient-to-r from-slate-500 to-slate-600"
                  evolution={kpiData.workforceAdvanced.headcountInactif}
                  subtitle="Suspendus, congés, etc."
                  alert={kpiData.workforceAdvanced.headcountInactif.value > 0}
                />
              </div>

              {/* Mouvements Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <KPICard
                  title="Entrées du Mois"
                  value={kpiData.workforceAdvanced.entreesDelaPeriode.value}
                  format="number"
                  icon={UserPlus}
                  gradient="bg-gradient-to-r from-green-500 to-emerald-600"
                  evolution={kpiData.workforceAdvanced.entreesDelaPeriode}
                  subtitle="Nouveaux collaborateurs"
                />

                <KPICard
                  title="Sorties du Mois"
                  value={kpiData.workforceAdvanced.sortiesDelaPeriode.value}
                  format="number"
                  icon={UserMinus}
                  gradient="bg-gradient-to-r from-red-500 to-red-600"
                  evolution={kpiData.workforceAdvanced.sortiesDelaPeriode}
                  subtitle="Départs"
                />

                <KPICard
                  title="Mobilités Internes"
                  value={kpiData.workforceAdvanced.mobilitesInternes.value}
                  format="number"
                  icon={Shuffle}
                  gradient="bg-gradient-to-r from-orange-500 to-orange-600"
                  evolution={kpiData.workforceAdvanced.mobilitesInternes}
                  subtitle="Changements de poste"
                />

                <KPICard
                  title="Taux de Turnover"
                  value={kpiData.workforceAdvanced.tauxTurnover.value.toFixed(1)}
                  format="percent"
                  icon={RefreshCw}
                  gradient="bg-gradient-to-r from-purple-500 to-purple-600"
                  evolution={kpiData.workforceAdvanced.tauxTurnover}
                  subtitle="Sorties / Effectif moyen"
                  alert={kpiData.workforceAdvanced.tauxTurnover.value > 15}
                />
              </div>

              {/* Top 3 Postes + Evolution Chart Row */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <Top3PostesCard data={kpiData.workforceAdvanced.top3Postes} />
                {kpiData.workforceAdvanced.evolutionEffectifs24Mois.length > 0 && (
                  <WorkforceEvolution24MonthsChart data={kpiData.workforceAdvanced.evolutionEffectifs24Mois} />
                )}
              </div>
            </motion.section>

            {/* 💶 PAYROLL & COST */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SectionHeader 
                title="Masse Salariale" 
                icon={DollarSign} 
                gradient="bg-gradient-to-r from-emerald-500 to-cyan-600" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
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
                  value={kpiData.partVariable.value.toFixed(1)}
                  format="percent"
                  icon={Percent}
                  gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
                  evolution={kpiData.partVariable}
                  subtitle="Motivation & performance"
                />

                <KPICard
                  title="Taux Charges Sociales"
                  value={kpiData.tauxChargesSociales.value.toFixed(1)}
                  format="percent"
                  icon={Shield}
                  gradient="bg-gradient-to-r from-violet-500 to-violet-600"
                  evolution={kpiData.tauxChargesSociales}
                  subtitle="Cotisations + taxes"
                />
              </div>
            </motion.section>

            {/* 🏥 ABSENCES AVANCÉES */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SectionHeader 
                title="Analytics Absences" 
                icon={CalendarX} 
                gradient="bg-gradient-to-r from-red-500 via-pink-500 to-rose-600" 
              />
              
              {/* Primary KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <KPICard
                  title="Taux d'Absentéisme"
                  value={kpiData.absencesAdvanced.tauxAbsenteisme.value.toFixed(1)}
                  format="percent"
                  icon={Activity}
                  gradient="bg-gradient-to-r from-red-500 to-red-600"
                  evolution={kpiData.absencesAdvanced.tauxAbsenteisme}
                  subtitle="Jours absents / Jours théoriques"
                  alert={kpiData.absencesAdvanced.tauxAbsenteisme.value > 8}
                />

                <KPICard
                  title="Coût Total Absences"
                  value={kpiData.absencesAdvanced.coutTotalAbsences.value}
                  format="currency"
                  icon={DollarSign}
                  gradient="bg-gradient-to-r from-orange-500 to-orange-600"
                  evolution={kpiData.absencesAdvanced.coutTotalAbsences}
                  subtitle="Impact financier mensuel"
                />

                <KPICard
                  title="Durée Moyenne"
                  value={kpiData.absencesAdvanced.dureeMoyenneAbsences.value}
                  format="days"
                  icon={Timer}
                  gradient="bg-gradient-to-r from-yellow-500 to-yellow-600"
                  evolution={kpiData.absencesAdvanced.dureeMoyenneAbsences}
                  subtitle="Durée moyenne des absences"
                />

                <KPICard
                  title="Fréquence Moyenne"
                  value={kpiData.absencesAdvanced.frequenceMoyenneAbsences.value.toFixed(1)}
                  format="text"
                  icon={Repeat}
                  gradient="bg-gradient-to-r from-purple-500 to-purple-600"
                  evolution={kpiData.absencesAdvanced.frequenceMoyenneAbsences}
                  subtitle="Absences / employé absent"
                />
              </div>

              {/* Secondary KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <KPICard
                  title="Taux d'Absents Récurrents"
                  value={kpiData.absencesAdvanced.tauxAbsentsRecurrents.value.toFixed(1)}
                  format="percent"
                  icon={AlertCircle}
                  gradient="bg-gradient-to-r from-red-600 to-pink-600"
                  evolution={kpiData.absencesAdvanced.tauxAbsentsRecurrents}
                  subtitle="≥ 3 absences dans l'année"
                  alert={kpiData.absencesAdvanced.tauxAbsentsRecurrents.value > 20}
                />

                <KPICard
                  title="Indice Critique"
                  value={kpiData.absencesAdvanced.indiceAbsenteismeCritique.value.toFixed(1)}
                  format="percent"
                  icon={AlertTriangle}
                  gradient="bg-gradient-to-r from-rose-500 to-rose-600"
                  evolution={kpiData.absencesAdvanced.indiceAbsenteismeCritique}
                  subtitle="Absences > 30 jours"
                  alert={kpiData.absencesAdvanced.indiceAbsenteismeCritique.value > 10}
                />

                {/* Top Motifs Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-cyan-400" />
                    Top 3 Motifs Pondérés
                  </h3>
                  <div className="space-y-3">
                    {kpiData.absencesAdvanced.topMotifsAbsence.map((motif, index) => (
                      <motion.div 
                        key={motif.type} 
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-red-500' : 
                            index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`} />
                          <span className="text-slate-300 text-sm">{motif.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium text-sm">{motif.jours} jours</div>
                          <div className="text-xs text-slate-400">{formatCurrency(motif.cout)}</div>
                          <div className="text-[10px] text-slate-500">{Math.round(motif.pourcentage)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart évolution 13 mois */}
              {kpiData.absencesAdvanced.evolutionGlissante13Mois.length > 0 && (
                <div className="mb-8">
                  <AbsenceEvolution13MonthsChart data={kpiData.absencesAdvanced.evolutionGlissante13Mois} />
                </div>
              )}
            </motion.section>

            {/* 📊 DEMOGRAPHICS */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <SectionHeader 
                title="Démographie" 
                icon={UserCheck} 
                gradient="bg-gradient-to-r from-violet-500 to-purple-600" 
              />
              
              {/* KPIs démographiques */}
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

                {/* Répartition par sexe cyberpunk optimisée */}
                <GenderDistributionChart data={kpiData.workforceAdvanced.repartitionSexe} />

                {/* Répartition par contrats */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-400" />
                    Répartition par Contrat
                  </h3>
                  <div className="space-y-3">
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
                          <div className="text-xs text-slate-400">{Math.round(contract.percentage)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pyramide des âges Cyberpunk optimisée */}
              <div className="mb-8">
                <AgePyramidCyberpunk data={kpiData.workforceAdvanced.pyramideAges} />
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
                        <div className="text-xs text-slate-400">{Math.round(site.percentage)}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

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