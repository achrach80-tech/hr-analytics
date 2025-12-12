'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Calendar, ChevronDown, Sparkles, Brain,
  AlertTriangle, Zap, BarChart3, X, RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactDOM from 'react-dom'

// Import optimized components
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { CyberWorkforceSection } from '@/components/dashboard/CyberWorkforceSection'
import { CyberPayrollSection } from '@/components/dashboard/CyberPayrollSection'
import { CyberAbsenceSection } from '@/components/dashboard/CyberAbsenceSection'
import { CyberDemographicsSection } from '@/components/dashboard/CyberDemographicsSection'
import type { Company, Establishment } from '@/lib/types/dashboard'

const INIT_TIMEOUT_MS = 15000

export default function CyberDashboard() {
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimedOut, setIsTimedOut] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const mountedRef = useRef(true)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isInitialized, setIsInitialized] = useState(false)

  const establishmentId = useMemo(() => 
    selectedEstablishment?.id || '', 
    [selectedEstablishment?.id]
  )

  const shouldFetchKPI = isInitialized && !initialLoading && !!establishmentId && !!selectedPeriod
  
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    shouldFetchKPI ? establishmentId : '',
    shouldFetchKPI ? selectedPeriod : ''
  )

  const loadPeriodsForEstablishment = useCallback(async (estId: string) => {
    if (!estId || !mountedRef.current) return
    
    try {
      const { data: periodData, error: snapError } = await supabase
        .from('snapshots_mensuels')
        .select('periode')
        .eq('etablissement_id', estId)
        .not('periode', 'is', null)
        .order('periode', { ascending: false })

      if (!mountedRef.current) return

      if (snapError) {
        throw new Error('Impossible de charger les périodes disponibles')
      }

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      
      if (uniquePeriods.length === 0) {
        setError('Aucune donnée importée. Veuillez commencer par importer vos fichiers Excel.')
        setTimeout(() => router.push('/import'), 2000)
        return
      }

      setPeriods(uniquePeriods)
      setSelectedPeriod(uniquePeriods[0])
      
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err.message : 'Erreur de chargement des périodes')
    }
  }, [supabase, router])

  useEffect(() => {
    mountedRef.current = true
    
    const initializeData = async () => {
      try {
        setInitialLoading(true)
        setError(null)
        setIsTimedOut(false)
        setIsInitialized(false)

        initTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && initialLoading) {
            setIsTimedOut(true)
            setInitialLoading(false)
            setError('Le chargement prend trop de temps. Veuillez réessayer.')
          }
        }, INIT_TIMEOUT_MS)

        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current)
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)

        const { data: companyData, error: companyError } = await supabase
          .from('entreprises')
          .select(`
            id,
            nom,
            subscription_plan,
            etablissements (
              id,
              nom,
              is_headquarters
            )
          `)
          .eq('id', session.company_id)
          .single()

        if (companyError) {
          throw new Error('Impossible de charger les informations de l\'entreprise')
        }

        if (!mountedRef.current) return

        setCompany(companyData as Company)
        const establishments = companyData.etablissements || []
        
        if (establishments.length === 0) {
          throw new Error('Aucun établissement configuré pour votre entreprise')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
        setSelectedEstablishment(defaultEst as Establishment)
        
        await loadPeriodsForEstablishment(defaultEst.id)
        
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
        }
        
        setIsInitialized(true)

      } catch (err) {
        if (!mountedRef.current) return
        setError(err instanceof Error ? err.message : 'Erreur d\'initialisation')
      } finally {
        if (mountedRef.current) {
          setInitialLoading(false)
        }
      }
    }

    initializeData()

    return () => {
      mountedRef.current = false
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [])

  const handlePeriodChange = useCallback((newPeriod: string) => {
    setSelectedPeriod(newPeriod)
    setShowPeriodSelector(false)
  }, [])

  const formatPeriodDisplay = useCallback((period: string) => {
    if (!period) return 'Sélectionner une période'
    try {
      const date = new Date(period)
      return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' }).format(date)
    } catch {
      return period
    }
  }, [])

  // Loading initial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl mb-8 shadow-2xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw size={64} className="text-white" />
            </motion.div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Initialisation Dashboard
          </h2>
          <p className="text-slate-400 text-lg">Chargement de vos données RH...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error && !isTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <motion.div
          className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-red-500/30 p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">Erreur de chargement</h2>
          <p className="text-slate-300 text-center mb-8">{error}</p>
          <div className="flex gap-4">
            <motion.button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Réessayer
            </motion.button>
            <motion.button
              onClick={() => router.push('/import')}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Importer des données
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Header */}
      <div className="relative z-20 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/30">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
              <BarChart3 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Dashboard Analytics
              </h1>
              
              <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                <Building2 size={14} />
                {company?.nom || 'Chargement...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Period selector */}
            <div className="relative">
              <motion.button
                onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 flex items-center gap-3 hover:border-purple-500/50 transition-all group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar size={20} className="text-purple-400" />
                <div className="text-left">
                  <div className="text-xs text-slate-400 font-medium">Période</div>
                  <div className="text-sm font-bold text-white">{formatPeriodDisplay(selectedPeriod)}</div>
                </div>
                <ChevronDown size={18} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
              </motion.button>
            </div>

            {/* Visions button */}
            <motion.button
              onClick={() => router.push('/visions')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={18} />
              Mes Visions
            </motion.button>
          </div>
        </div>
      </div>

      {/* Period selector modal */}
      {showPeriodSelector && ReactDOM.createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPeriodSelector(false)}
          >
            <motion.div
              className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Sélectionner une période</h3>
                <button
                  onClick={() => setShowPeriodSelector(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
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
        </AnimatePresence>,
        document.body
      )}

      {/* Main content */}
      <div className="relative z-10 p-8 space-y-12">
        {kpiError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-300 font-medium">Erreur de chargement des KPIs</p>
                <p className="text-red-400/80 text-sm mt-1">{kpiError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Recharger
              </button>
            </div>
          </motion.div>
        )}

        {kpiData ? (
          <>
            <CyberWorkforceSection 
              data={kpiData.workforce} 
              loading={kpiLoading}
              previousMonthData={kpiData.previousMonthWorkforce}
              previousYearData={kpiData.previousYearWorkforce}
            />
            
            <CyberPayrollSection 
              establishmentId={establishmentId}
              period={selectedPeriod}
              data={kpiData?.financials || null}
              previousMonthData={kpiData?.previousMonthFinancials || null}
              previousYearData={kpiData?.previousYearFinancials || null}
              loading={kpiLoading} 
            />
            
            <CyberAbsenceSection 
              data={kpiData.absences} 
              loading={kpiLoading}
              previousMonthData={kpiData.previousMonthAbsences}
              previousYearData={kpiData.previousYearAbsences}
            />
            
            <CyberDemographicsSection 
              data={kpiData.workforce} 
              loading={kpiLoading}
              previousMonthData={kpiData.previousMonthWorkforce}
              previousYearData={kpiData.previousYearWorkforce}
            />
          </>
        ) : kpiLoading ? (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl mb-6 shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={48} className="text-white" />
              </motion.div>
            </div>
            <p className="text-slate-400 text-lg">Chargement des KPIs...</p>
          </motion.div>
        ) : (
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
              Importez vos fichiers Excel RH pour générer automatiquement vos KPIs cyberpunk
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
                <Zap size={24} />
              </div>
            </motion.button>
          </motion.div>
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
                <span>Dashboard cyber en temps réel</span>
              </div>
              <span>Période: {formatPeriodDisplay(selectedPeriod)}</span>
              <span>Mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-purple-400" />
              <span>Talvio Analytics v5.0</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}