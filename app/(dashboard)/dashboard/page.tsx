'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Calendar, ChevronDown, Sparkles, Brain,
  AlertTriangle, Zap, BarChart3, X
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

export default function CyberDashboard() {
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const mountedRef = useRef(true)
  const initializedRef = useRef(false)

  // OPTIMIZATION: Memoize establishment ID to prevent unnecessary re-renders
  const establishmentId = useMemo(() => 
    selectedEstablishment?.id || '', 
    [selectedEstablishment?.id]
  )

  // OPTIMIZATION: Use optimized KPI hook - only triggers when deps change
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    establishmentId,
    selectedPeriod
  )

  // OPTIMIZATION: Memoized period loading function
  const loadPeriodsForEstablishment = useCallback(async (estId: string) => {
    if (!estId || !mountedRef.current) return
    
    try {
      // FIXED: Create client fresh each time to ensure headers are included
      const supabase = createClient()
      
      // Try snapshots first
      const { data: periodData, error: snapError } = await supabase
        .from('snapshots_workforce')
        .select('periode')
        .eq('etablissement_id', estId)
        .not('periode', 'is', null)
        .order('periode', { ascending: false })

      if (!mountedRef.current) return

      if (snapError) {
        console.error('Snapshot query error:', snapError)
        
        // Fallback to employes table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('employes')
          .select('periode')
          .eq('etablissement_id', estId)
          .not('periode', 'is', null)
          .order('periode', { ascending: false })

        if (!mountedRef.current) return

        if (fallbackError) {
          console.error('Fallback error:', fallbackError)
          setError('Aucune période trouvée. Importez vos données.')
          return
        }
        
        const uniquePeriods = [...new Set(fallbackData?.map(p => p.periode) || [])]
        setPeriods(uniquePeriods)
        
        if (uniquePeriods.length > 0) {
          setSelectedPeriod(uniquePeriods[0])
        } else {
          setError('Aucune donnée disponible.')
        }
        return
      }

      // Success path
      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      setPeriods(uniquePeriods)

      if (uniquePeriods.length > 0) {
        setSelectedPeriod(uniquePeriods[0])
      } else {
        setError('Aucune période disponible. Importez vos données.')
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Unexpected error loading periods:', err)
      setError('Erreur système')
    }
  }, [])

  // OPTIMIZATION: Single useEffect for initialization - only runs once
  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeData = async () => {
      try {
        setInitialLoading(true)
        setError(null)

        console.log('🔄 Initializing dashboard...')

        // Check session
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          console.log('❌ No session found, redirecting to login')
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)
        console.log('✅ Session found for company:', session.company_id)

        // FIXED: Create Supabase client AFTER we have the session
        // This ensures the x-company-token header is included
        const supabase = createClient()

        console.log('🔄 Loading company data...')

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
          console.error('❌ Company load error:', companyError)
          console.error('Error details:', {
            message: companyError.message,
            details: companyError.details,
            hint: companyError.hint,
            code: companyError.code
          })
          throw companyError
        }

        console.log('✅ Company loaded:', companyData.nom)

        if (!mountedRef.current) return

        setCompany(companyData as Company)
        const establishments = companyData.etablissements || []
        
        console.log('✅ Found', establishments.length, 'establishment(s)')

        const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
        if (defaultEst) {
          console.log('✅ Selected establishment:', defaultEst.nom)
          setSelectedEstablishment(defaultEst as Establishment)
          await loadPeriodsForEstablishment(defaultEst.id)
        } else {
          console.log('⚠️ No establishments found')
          setError('Aucun établissement trouvé. Contactez le support.')
        }
      } catch (err) {
        if (!mountedRef.current) return
        console.error('❌ Initialize error:', err)
        
        if (err && typeof err === 'object' && 'code' in err) {
          const error = err as any
          if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
            setError('Entreprise introuvable. Vérifiez votre token d\'accès.')
          } else if (error.code === '42501' || error.message?.includes('permission')) {
            setError('Accès refusé. Reconnectez-vous.')
            setTimeout(() => router.push('/login'), 2000)
          } else {
            setError('Erreur de chargement. Réessayez.')
          }
        } else {
          setError('Erreur d\'initialisation')
        }
      } finally {
        if (mountedRef.current) {
          setInitialLoading(false)
        }
      }
    }

    initializeData()

    return () => {
      mountedRef.current = false
    }
  }, [router, loadPeriodsForEstablishment])

  // OPTIMIZATION: Separate useEffect for modal overflow management
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = showPeriodSelector ? 'hidden' : 'unset'
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset'
      }
    }
  }, [showPeriodSelector])

  // OPTIMIZATION: Memoized format function
  const formatPeriodDisplay = useCallback((periode: string): string => {
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
  }, [])

  // OPTIMIZATION: Memoized period change handler
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period)
    setShowPeriodSelector(false)
  }, [])

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain size={64} className="text-white" />
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Initialisation du Dashboard
          </h2>
          <p className="text-slate-400 text-lg">
            Chargement des données cyberpunk...
          </p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error && !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Erreur de Chargement
          </h2>
          <p className="text-slate-300 text-center mb-6">
            {error}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all"
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/login')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 rounded-xl text-white font-semibold transition-all"
            >
              Se Reconnecter
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden">
      {/* Cyber grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-20 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Brain size={24} className="text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {company?.nom || 'Dashboard'}
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Plan: {company?.subscription_plan || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className="px-6 py-3 bg-slate-800/50 backdrop-blur-xl border border-slate-700 hover:border-purple-500/50 rounded-xl flex items-center gap-3 transition-all shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calendar size={18} className="text-purple-400" />
                  <span className="text-white font-medium">
                    {selectedPeriod ? formatPeriodDisplay(selectedPeriod) : 'Sélectionner période'}
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

      {/* Period Selector Portal */}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-400" />
                      <span className="text-sm font-medium text-slate-300">Sélectionner une période</span>
                    </div>
                    <button
                      onClick={() => setShowPeriodSelector(false)}
                      className="p-1 hover:bg-slate-700/50 rounded"
                    >
                      <X size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
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
    <CyberWorkforceSection 
      data={kpiData.workforce} 
      loading={kpiLoading}
      previousMonthData={kpiData.previousMonthWorkforce}
      previousYearData={kpiData.previousYearWorkforce}
    />
    
    <CyberPayrollSection 
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