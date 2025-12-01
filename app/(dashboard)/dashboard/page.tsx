'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Calendar, ChevronDown, Sparkles, Brain,
  AlertTriangle, Zap, BarChart3, X, RefreshCw, Download
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactDOM from 'react-dom'

// Import optimized components
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { CyberWorkforceSection } from '@/components/dashboard/CyberWorkforceSection'
import { CyberPayrollSection } from '@/components/dashboard/CyberPayrollSection'
import { CyberAbsenceSection } from '@/components/dashboard/CyberAbsenceSection'
import { CyberDemographicsSection } from '@/components/dashboard/CyberDemographicsSection'
import { ExportBuilder } from '@/components/dashboard/ExportBuilder'
import { logger } from '@/lib/utils/logger'
import type { Company, Establishment } from '@/lib/types/dashboard'

// ============================================
// CONSTANTES DE CONFIGURATION
// ============================================
const INIT_TIMEOUT_MS = 15000 // 15 secondes max pour l'initialisation
const KPI_TIMEOUT_MS = 10000  // 10 secondes max pour les KPIs

export default function CyberDashboard() {
  const [company, setCompany] = useState<Company | null>(null)
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [periods, setPeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [showPeriodSelector, setShowPeriodSelector] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Nouveau: État pour gérer les timeouts
  const [isTimedOut, setIsTimedOut] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const mountedRef = useRef(true)
  const initializedRef = useRef(false)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // OPTIMIZATION: Memoize establishment ID to prevent unnecessary re-renders
  const establishmentId = useMemo(() => 
    selectedEstablishment?.id || '', 
    [selectedEstablishment?.id]
  )

  // FIX: Only call KPI hook when we have valid data to prevent infinite loading
  const shouldFetchKPI = !initialLoading && establishmentId && selectedPeriod
  
  // OPTIMIZATION: Use optimized KPI hook - only triggers when deps change
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    shouldFetchKPI ? establishmentId : '',
    shouldFetchKPI ? selectedPeriod : ''
  )

  // ============================================
  // FONCTION: Charger les périodes disponibles
  // ============================================
  const loadPeriodsForEstablishment = useCallback(async (estId: string) => {
    if (!estId || !mountedRef.current) return
    
    try {
      logger.debug('Chargement périodes pour établissement:', estId, 'Dashboard')
      
      // Essayer d'abord snapshots_mensuels
      const { data: periodData, error: snapError } = await supabase
        .from('snapshots_mensuels')
        .select('periode')
        .eq('etablissement_id', estId)
        .not('periode', 'is', null)
        .order('periode', { ascending: false })

      if (!mountedRef.current) return

      if (snapError) {
        logger.error('Erreur query snapshots:', snapError, 'Dashboard')
        throw new Error('Impossible de charger les périodes disponibles')
      }

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      
      if (uniquePeriods.length === 0) {
        logger.warn('Aucune période trouvée - Redirection /import', null, 'Dashboard')
        setError('Aucune donnée importée. Veuillez commencer par importer vos fichiers Excel.')
        setTimeout(() => router.push('/import'), 2000)
        return
      }

      console.log(`✅ [Dashboard] ${uniquePeriods.length} périodes trouvées`)
      setPeriods(uniquePeriods)
      setSelectedPeriod(uniquePeriods[0])
      
    } catch (err) {
      if (!mountedRef.current) return
      logger.error('Erreur chargement périodes:', err, 'Dashboard')
      setError(err instanceof Error ? err.message : 'Erreur de chargement des périodes')
    }
  }, [supabase, router])

  // ============================================
  // EFFET: Initialisation avec timeout
  // ============================================
  useEffect(() => {
    // Éviter la double initialisation
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeData = async () => {
      try {
        logger.debug('Démarrage initialisation...', null, 'Dashboard')
        setInitialLoading(true)
        setError(null)
        setIsTimedOut(false)

        // Timeout pour l'initialisation complète
        initTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && initialLoading) {
            logger.error('TIMEOUT - Initialisation trop longue', null, 'Dashboard')
            setIsTimedOut(true)
            setInitialLoading(false)
            setError('Le chargement prend trop de temps. Veuillez réessayer.')
          }
        }, INIT_TIMEOUT_MS)

        // Vérifier la session
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          logger.warn('Pas de session - Redirection /login', null, 'Dashboard')
          clearTimeout(initTimeoutRef.current)
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)
        logger.debug('Session trouvée:', session.company_name, 'Dashboard')

        // Charger les données entreprise avec timeout
        logger.debug('Requête entreprise + établissements...', null, 'Dashboard')
        
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
          logger.error('Erreur chargement entreprise:', companyError, 'Dashboard')
          throw new Error('Impossible de charger les informations de l\'entreprise')
        }

        if (!mountedRef.current) return

        logger.debug('Entreprise chargée:', companyData.nom, 'Dashboard')
        logger.debug('Établissements:', companyData.etablissements?.length || 0, 'Dashboard')

        setCompany(companyData as Company)
        const establishments = companyData.etablissements || []
        
        if (establishments.length === 0) {
          throw new Error('Aucun établissement configuré pour votre entreprise')
        }

        // Sélectionner l'établissement par défaut
        const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
        logger.debug('Établissement sélectionné:', defaultEst.nom, 'Dashboard')
        
        setSelectedEstablishment(defaultEst as Establishment)
        
        // Charger les périodes disponibles
        await loadPeriodsForEstablishment(defaultEst.id)
        
        // Succès - clear timeout
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
        }
        
        logger.debug('Initialisation terminée avec succès', null, 'Dashboard')

      } catch (err) {
        if (!mountedRef.current) return
        logger.error('Erreur initialisation:', err, 'Dashboard')
        setError(err instanceof Error ? err.message : 'Erreur d\'initialisation du dashboard')
        
        // Clear timeout en cas d'erreur
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
        }
      } finally {
        if (mountedRef.current) {
          setInitialLoading(false)
        }
      }
    }

    initializeData()

    // Cleanup
    return () => {
      mountedRef.current = false
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [router, supabase, loadPeriodsForEstablishment])

  // ============================================
  // EFFET: Gestion overflow modal
  // ============================================
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

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
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

  const handlePeriodChange = useCallback((period: string) => {
    logger.debug('Changement période:', period, 'Dashboard')
    setSelectedPeriod(period)
    setShowPeriodSelector(false)
  }, [])

  // Fonction de rechargement manuel
  const handleRetry = useCallback(() => {
    console.log('🔄 [Dashboard] Rechargement manuel demandé')
    initializedRef.current = false
    setError(null)
    setIsTimedOut(false)
    window.location.reload()
  }, [])

  // ============================================
  // RENDER: État de chargement initial
  // ============================================
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl shadow-2xl"
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {isTimedOut ? 'Chargement trop long...' : 'Initialisation du Dashboard'}
            </h2>
            <p className="text-slate-400">
              {isTimedOut ? 'Vérification de la connexion...' : 'Chargement de vos données RH...'}
            </p>
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>

          {/* Bouton de rechargement après timeout */}
          {isTimedOut && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleRetry}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={18} />
              Réessayer
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: État d'erreur
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <motion.div 
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <AlertTriangle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Erreur de chargement
          </h2>
          <p className="text-slate-300 mb-6">
            {error}
          </p>

          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={handleRetry}
              className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={18} />
              Réessayer
            </motion.button>

            <motion.button
              onClick={() => router.push('/import')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Aller à l'import
            </motion.button>
          </div>

          {/* Détails techniques (console) */}
          <p className="mt-6 text-xs text-slate-500">
            Consultez la console (F12) pour plus de détails techniques
          </p>
        </motion.div>
      </div>
    )
  }

  // ============================================
  // RENDER: Dashboard principal
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1.2, 1, 1.2]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-20 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Brain size={32} className="text-white" />
              </motion.div>
              
              <div>
                <motion.h1 
                  className="text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Dashboard Analytique
                </motion.h1>
                <motion.div 
                  className="flex items-center gap-3 mt-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Building2 size={14} className="text-purple-400" />
                    <span>{company?.nom}</span>
                  </div>
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                  <div className="text-slate-400 text-sm">
                    {selectedEstablishment?.nom}
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50 transition-all duration-200 flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar size={18} className="text-purple-400" />
                  <span className="text-white font-medium">
                    {formatPeriodDisplay(selectedPeriod)}
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
                onClick={() => setShowExport(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl transition-all duration-200 flex items-center gap-2 text-white font-semibold shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={18} />
                Exporter
              </motion.button>

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
        {/* Message d'erreur KPI si présent */}
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

        {/* Sections KPI */}
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

      {/* Export Modal */}
      <ExportBuilder
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        period={selectedPeriod}
        establishmentName={selectedEstablishment?.nom || ''}
      />
    </div>
  )
}