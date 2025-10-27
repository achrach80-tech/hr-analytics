'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Wallet,
  PieChart, ArrowUpRight, ArrowDownRight, Zap,
  Target, Award, Users, Percent
} from 'lucide-react'

// ============================================
// TYPES - Définitions des données
// ============================================

interface FinancialsData {
  // Totaux mensuels
  total_salaire_brut: number
  total_salaire_de_base: number
  total_primes_fixes: number
  total_primes_variables: number
  total_primes_exceptionnelles: number
  total_heures_supp_payees: number
  total_avantages_nature: number
  total_indemnites: number
  
  // Charges
  total_cotisations_sociales: number
  total_taxes_sur_salaire: number
  total_autres_charges: number
  total_masse_salariale_chargee: number
  
  // Moyennes
  salaire_brut_moyen: number
  salaire_net_moyen: number
  masse_salariale_moyenne: number
  
  // Métadonnées
  nombre_bulletins: number
  periode: string
}

interface CyberPayrollSectionProps {
  data: FinancialsData | null
  previousMonthData: FinancialsData | null
  previousYearData: FinancialsData | null
  loading: boolean
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Formate un nombre en euros
 * Exemple : 123456.78 → "123 457 €"
 */
const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Calcule le pourcentage de variation entre deux valeurs
 * Exemple : ancien=100, nouveau=120 → +20%
 */
const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * 🔧 FIX BUG WATERFALL
 * Calcule le VRAI salaire brut en additionnant TOUS les composants
 */
const calculateTrueSalaireBrut = (data: FinancialsData): number => {
  return (
    (data.total_salaire_de_base || 0) +
    (data.total_primes_fixes || 0) +
    (data.total_primes_variables || 0) +
    (data.total_primes_exceptionnelles || 0) +
    (data.total_heures_supp_payees || 0) +
    (data.total_avantages_nature || 0) +
    (data.total_indemnites || 0)
  )
}

/**
 * Calcule le salaire net estimé (environ 78% du brut)
 */
const calculateSalaireNet = (salaireBrut: number): number => {
  return salaireBrut * 0.78
}

/**
 * Calcule le coût total employeur
 */
const calculateCoutTotal = (data: FinancialsData): number => {
  const salaireBrut = calculateTrueSalaireBrut(data)
  return (
    salaireBrut +
    (data.total_cotisations_sociales || 0) +
    (data.total_taxes_sur_salaire || 0) +
    (data.total_autres_charges || 0)
  )
}

// ============================================
// COMPOSANTS
// ============================================

/**
 * Carte métrique avec animation
 */
const CyberMetric: React.FC<{
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  gradient: string
  trend?: { value: number; period: string }
}> = ({ title, value, subtitle, icon: Icon, gradient, trend }) => (
  <motion.div
    className="relative p-6 rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40"
    whileHover={{ y: -4 }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <div className={`absolute inset-0 opacity-10 ${gradient} rounded-xl`} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <Icon size={24} className="text-cyan-400" />
        {trend && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            trend.value >= 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {trend.value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </motion.div>
)

/**
 * Graphique Waterfall (cascade)
 */
const WaterfallChart: React.FC<{ data: FinancialsData }> = ({ data }) => {
  // 🔧 CALCUL CORRIGÉ
  const salaireBrut = calculateTrueSalaireBrut(data)
  const charges = (data.total_cotisations_sociales || 0) + 
                 (data.total_taxes_sur_salaire || 0) + 
                 (data.total_autres_charges || 0)
  const coutTotal = salaireBrut + charges
  
  // Composants du salaire pour le détail
  const components = [
    { 
      label: 'Salaire Base', 
      value: data.total_salaire_de_base || 0,
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'Primes Fixes', 
      value: data.total_primes_fixes || 0,
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'Primes Variables', 
      value: data.total_primes_variables || 0,
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      label: 'Primes Except.', 
      value: data.total_primes_exceptionnelles || 0,
      color: 'from-yellow-500 to-orange-500' 
    },
    { 
      label: 'Heures Supp', 
      value: data.total_heures_supp_payees || 0,
      color: 'from-orange-500 to-red-500' 
    },
    { 
      label: 'Avantages', 
      value: data.total_avantages_nature || 0,
      color: 'from-pink-500 to-rose-500' 
    },
    { 
      label: 'Indemnités', 
      value: data.total_indemnites || 0,
      color: 'from-indigo-500 to-purple-500' 
    }
  ].filter(c => c.value > 0) // Ne montrer que les composants non nuls

  const maxValue = coutTotal
  
  return (
    <div className="space-y-6">
      {/* Visualisation en cascade */}
      <div className="space-y-3">
        {/* Salaire Brut */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-cyan-400 font-mono">Salaire Brut Total</span>
            <span className="text-white font-bold">{formatCurrency(salaireBrut)}</span>
          </div>
          <div className="h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl relative overflow-hidden"
               style={{ width: `${(salaireBrut / maxValue) * 100}%` }}>
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>

        {/* Détail des composants */}
        <div className="pl-8 space-y-2">
          {components.map((comp, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-mono">↳ {comp.label}</span>
                <span className="text-slate-300 text-sm">{formatCurrency(comp.value)}</span>
              </div>
              <div className={`h-6 bg-gradient-to-r ${comp.color} rounded-lg opacity-60`}
                   style={{ width: `${(comp.value / maxValue) * 100}%` }} />
            </div>
          ))}
        </div>

        {/* Charges Sociales */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-mono">+ Charges Sociales</span>
            <span className="text-white font-bold">{formatCurrency(charges)}</span>
          </div>
          <div className="h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
               style={{ width: `${(charges / maxValue) * 100}%` }} />
        </div>

        {/* Coût Total */}
        <div className="relative pt-4 border-t-2 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-green-400 font-mono font-bold">= Coût Total Employeur</span>
            <span className="text-white font-bold text-xl">{formatCurrency(coutTotal)}</span>
          </div>
          <div className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/20"
               style={{ width: '100%' }}>
            <motion.div
              className="h-full bg-gradient-to-r from-white/20 to-transparent rounded-xl"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-slate-500 text-xs mb-1">Charges/Brut</p>
          <p className="text-purple-400 font-bold">
            {salaireBrut > 0 ? ((charges / salaireBrut) * 100).toFixed(1) : '0'}%
          </p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-slate-500 text-xs mb-1">Net Estimé</p>
          <p className="text-cyan-400 font-bold">
            {formatCurrency(calculateSalaireNet(salaireBrut))}
          </p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-slate-500 text-xs mb-1">Coût/Brut</p>
          <p className="text-green-400 font-bold">
            {salaireBrut > 0 ? ((coutTotal / salaireBrut) * 100).toFixed(0) : '0'}%
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const CyberPayrollSection: React.FC<CyberPayrollSectionProps> = ({
  data,
  previousMonthData,
  previousYearData,
  loading
}) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800/50 p-8"
      >
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-t-purple-500 rounded-full animate-spin" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-orange-500/30 p-12 text-center"
      >
        <DollarSign size={64} className="text-orange-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-2xl font-bold text-white mb-2">Aucune donnée financière</h3>
        <p className="text-slate-400">Importez vos données de rémunération pour voir les analyses</p>
      </motion.div>
    )
  }

  // 🔧 CALCULS CORRIGÉS
  const salaireBrut = calculateTrueSalaireBrut(data)
  const coutTotal = calculateCoutTotal(data)
  const salaireNet = calculateSalaireNet(salaireBrut)

  // Calcul des tendances
  const brutTrendVsPrevMonth = previousMonthData 
    ? calculatePercentageChange(salaireBrut, calculateTrueSalaireBrut(previousMonthData))
    : 0

  const brutTrendVsPrevYear = previousYearData
    ? calculatePercentageChange(salaireBrut, calculateTrueSalaireBrut(previousYearData))
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800/50"
    >
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <DollarSign size={32} className="text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Masse Salariale</h2>
              <p className="text-slate-400">Analyse financière cyberpunk</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-sm font-mono">
              {data.nombre_bulletins || 0} bulletins
            </span>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CyberMetric
            title="Salaire Brut Total"
            value={formatCurrency(salaireBrut)}
            subtitle="Tous composants inclus"
            icon={Wallet}
            gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
            trend={{ value: brutTrendVsPrevMonth, period: 'vs mois dernier' }}
          />

          <CyberMetric
            title="Charges Sociales"
            value={formatCurrency(data.total_cotisations_sociales || 0)}
            subtitle="Cotisations + taxes"
            icon={PieChart}
            gradient="bg-gradient-to-r from-purple-500 to-pink-500"
          />

          <CyberMetric
            title="Coût Total"
            value={formatCurrency(coutTotal)}
            subtitle="Charge complète employeur"
            icon={Target}
            gradient="bg-gradient-to-r from-green-500 to-emerald-500"
          />

          <CyberMetric
            title="Salaire Net Moyen"
            value={formatCurrency(data.salaire_net_moyen || salaireNet / (data.nombre_bulletins || 1))}
            subtitle="Par employé"
            icon={Users}
            gradient="bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>

        {/* Graphique Waterfall */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-cyan-400" />
            Décomposition de la masse salariale
          </h3>
          <WaterfallChart data={data} />
        </div>

        {/* Footer stats */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Évolution M-1</p>
              <p className={`font-bold ${brutTrendVsPrevMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {brutTrendVsPrevMonth >= 0 ? '+' : ''}{brutTrendVsPrevMonth.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Évolution A-1</p>
              <p className={`font-bold ${brutTrendVsPrevYear >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {brutTrendVsPrevYear >= 0 ? '+' : ''}{brutTrendVsPrevYear.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Taux de charges</p>
              <p className="font-bold text-purple-400">
                {salaireBrut > 0 ? (((data.total_cotisations_sociales || 0) / salaireBrut) * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Coût employeur</p>
              <p className="font-bold text-cyan-400">
                {formatCurrency(coutTotal / (data.nombre_bulletins || 1))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default CyberPayrollSection