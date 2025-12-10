// app/(dashboard)/visions/[visionId]/page.tsx
// ✅ TOUS LES PROBLÈMES CORRIGÉS

'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { visionsApi, type Vision } from '@/lib/api/visions'
import { ComponentRenderer } from '@/components/builder/ComponentRenderer'
import { useExport, generateFilename, type ExportFormat } from '@/lib/hooks/useExport'
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { useWaterfallData } from '@/lib/hooks/useWaterfallData'
import { ArrowLeft, Download, Calendar, FileImage, FileText, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function VisionViewerPage() {
  const router = useRouter()
  const params = useParams()
  const visionId = params.visionId as string
  const supabase = createClient()
  const mountedRef = useRef(true)

  const canvasRef = useRef<HTMLDivElement>(null)
  const { exportElement, isExporting, progress } = useExport()

  const [vision, setVision] = useState<Vision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États période
  const [etablissementId, setEtablissementId] = useState<string>('')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number>(11) // Décembre par défaut
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Export options
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [exportQuality, setExportQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [showWatermark, setShowWatermark] = useState(false)

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  // Extraire années disponibles
  const availableYears = useMemo(() => {
    const years = availablePeriods.map(p => new Date(p).getFullYear())
    return [...new Set(years)].sort((a, b) => b - a)
  }, [availablePeriods])

  // Extraire mois disponibles pour l'année sélectionnée
  const availableMonthsForYear = useMemo(() => {
    const monthsSet = new Set<number>()
    availablePeriods.forEach(p => {
      const date = new Date(p)
      if (date.getFullYear() === selectedYear) {
        monthsSet.add(date.getMonth())
      }
    })
    return Array.from(monthsSet).sort((a, b) => b - a)
  }, [availablePeriods, selectedYear])

  const establishmentIdMemo = useMemo(() => etablissementId || '', [etablissementId])
  const shouldFetchKPI = isInitialized && !loading && !!establishmentIdMemo && !!selectedPeriod

  const { data: kpiData, loading: kpiLoading } = useOptimizedKPIData(
    shouldFetchKPI ? establishmentIdMemo : '',
    shouldFetchKPI ? selectedPeriod : ''
  )

  const { data: waterfallData, loading: waterfallLoading } = useWaterfallData(
    shouldFetchKPI ? establishmentIdMemo : '',
    shouldFetchKPI ? selectedPeriod : ''
  )

  // Charger périodes
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
      if (snapError) throw new Error('Impossible de charger les périodes')

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      
      if (uniquePeriods.length === 0) {
        setError('Aucune donnée importée')
        return
      }

      setAvailablePeriods(uniquePeriods)
      
      // Sélectionner la période la plus récente
      const latestPeriod = uniquePeriods[0]
      const latestDate = new Date(latestPeriod)
      setSelectedYear(latestDate.getFullYear())
      setSelectedMonth(latestDate.getMonth())
      setSelectedPeriod(latestPeriod)
      
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Erreur chargement périodes:', err)
    }
  }, [supabase])

  // Mettre à jour selectedPeriod quand mois/année change
  useEffect(() => {
    if (!isInitialized || availablePeriods.length === 0) return

    const year = selectedYear
    const month = selectedMonth
    const targetPeriod = `${year}-${String(month + 1).padStart(2, '0')}-01`

    if (availablePeriods.includes(targetPeriod)) {
      setSelectedPeriod(targetPeriod)
    }
  }, [selectedMonth, selectedYear, availablePeriods, isInitialized])

  // Initialisation
  useEffect(() => {
    mountedRef.current = true
    
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
          .select(`id, etablissements (id, nom, is_headquarters)`)
          .eq('id', session.company_id)
          .single()

        if (companyError) throw new Error('Impossible de charger l\'entreprise')
        if (!mountedRef.current) return

        const establishments = companyData.etablissements || []
        if (establishments.length === 0) throw new Error('Aucun établissement')

        const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
        setEtablissementId(defaultEst.id)

        const visionData = await visionsApi.getById(visionId)
        if (!mountedRef.current) return
        setVision(visionData)

        await loadPeriodsForEstablishment(defaultEst.id)
        
        setIsInitialized(true)

      } catch (err) {
        if (!mountedRef.current) return
        console.error('Erreur initialisation:', err)
        setError(err instanceof Error ? err.message : 'Erreur d\'initialisation')
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    initializeData()

    return () => {
      mountedRef.current = false
    }
  }, [visionId, supabase, router, loadPeriodsForEstablishment])

  const handleExport = async () => {
    if (!canvasRef.current || !vision) return

    const filename = generateFilename(vision.nom, exportFormat, selectedPeriod)

    const result = await exportElement(canvasRef.current, {
      format: exportFormat,
      quality: exportQuality,
      filename,
      watermark: showWatermark
    })

    if (result.success) {
      await visionsApi.incrementExportCount(visionId)
      
      setVision(prev => prev ? {
        ...prev,
        export_count: (prev.export_count || 0) + 1,
        last_exported_at: new Date().toISOString()
      } : null)
    } else {
      alert(`Erreur d'export: ${result.error}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !vision) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-400 mb-6">{error || 'Vision introuvable'}</p>
          <button
            onClick={() => router.push('/visions')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    )
  }

  const template = vision.template
  if (!template || !template.components || template.components.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Vision vide</h2>
          <p className="text-slate-400 mb-8">
            Cette vision ne contient aucun composant. Utilisez le builder pour la concevoir.
          </p>
          <button
            onClick={() => router.push(`/visions/builder?visionId=${visionId}`)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold inline-flex items-center gap-2"
          >
            Ouvrir le builder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/visions')}
              className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">{vision.nom}</h1>
              {vision.description && (
                <p className="text-slate-400 text-sm mt-1">{vision.description}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push(`/visions/builder?visionId=${visionId}`)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-400 font-medium text-sm flex items-center gap-2 transition-all"
          >
            <Settings size={18} />
            Éditer
          </button>
        </div>

        {/* Export controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl"
        >
          <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Download size={20} />
            Paramètres d'export
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Mois - z-index 30 */}
            <div className="relative z-30">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Mois
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50"
              >
                {months.map((month, index) => (
                  <option 
                    key={index} 
                    value={index}
                    disabled={!availableMonthsForYear.includes(index)}
                  >
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Année - z-index 30 */}
            <div className="relative z-30">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Année
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    exportFormat === 'pdf'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => setExportFormat('png')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    exportFormat === 'png'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
                  }`}
                >
                  <FileImage size={16} className="inline mr-1" />
                  PNG
                </button>
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Qualité
              </label>
              <select
                value={exportQuality}
                onChange={(e) => setExportQuality(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>

            {/* Export button */}
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {progress}%
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Watermark */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="watermark"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="w-4 h-4 rounded border-cyan-500/20 bg-slate-950/50 text-cyan-500 focus:ring-cyan-500/50"
            />
            <label htmlFor="watermark" className="text-sm text-slate-400 cursor-pointer">
              Ajouter un watermark "Talvio Analytics"
            </label>
          </div>
        </motion.div>

        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>
          
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-3xl p-8">
            <div 
              ref={canvasRef}
              className="relative mx-auto"
              style={{
                width: template.canvas.width * 0.5,
                height: template.canvas.height * 0.5,
                backgroundColor: template.canvas.backgroundColor,
                transform: 'scale(1)',
                transformOrigin: 'center'
              }}
            >
              {template.components.map((component) => (
                <div
                  key={component.id}
                  className="absolute"
                  style={{
                    left: component.position.x * 0.5,
                    top: component.position.y * 0.5,
                    width: component.size.width * 0.5,
                    height: component.size.height * 0.5
                  }}
                >
                  <ComponentRenderer 
                    component={component} 
                    isPreview 
                    kpiData={kpiData}
                    waterfallData={waterfallData}
                    period={selectedPeriod}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 flex justify-center gap-6 text-sm text-slate-400">
          <div>Composants: <span className="text-cyan-400 font-semibold">{template.components.length}</span></div>
          <div>Format: <span className="text-cyan-400 font-semibold">{template.canvas.format}</span></div>
          <div>Exporté: <span className="text-cyan-400 font-semibold">{vision.export_count || 0} fois</span></div>
          <div>Période: <span className="text-cyan-400 font-semibold">{months[selectedMonth]} {selectedYear}</span></div>
        </div>
      </div>
    </div>
  )
}