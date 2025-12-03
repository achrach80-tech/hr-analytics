// app/(dashboard)/visions/[visionId]/page.tsx
// Version FINALE avec données dynamiques

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileDown, ArrowLeft, Star, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { 
  Users, 
  DollarSign, 
  Calendar as CalendarIcon,
  Activity,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  Percent,
  Hash,
  type LucideIcon
} from 'lucide-react'
import ExportModal from '@/components/visions/ExportModal'
import { CyberKPICard } from '@/components/dashboard/CyberKPICard'
import { useDashboardData } from '@/lib/hooks/useDashboardData'
import { enrichVisionItems } from '@/lib/visions/kpiMapper'

interface Vision {
  id: string
  nom: string
  description: string | null
  etablissement_id: string
  layout: any
  is_default: boolean
  view_count: number
  export_count: number
  default_period: string | null
}

const iconMap: Record<string, LucideIcon> = {
  'users': Users,
  'user-check': UserCheck,
  'user-x': UserX,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'calendar': CalendarIcon,
  'activity': Activity,
  'percent': Percent,
  'hash': Hash,
}

const gradientMap: Record<string, string> = {
  'cyan': 'bg-gradient-to-br from-cyan-500 to-blue-600',
  'blue': 'bg-gradient-to-br from-blue-500 to-indigo-600',
  'purple': 'bg-gradient-to-br from-purple-500 to-pink-600',
  'green': 'bg-gradient-to-br from-green-500 to-emerald-600',
  'orange': 'bg-gradient-to-br from-orange-500 to-red-600',
  'red': 'bg-gradient-to-br from-red-500 to-rose-600',
  'yellow': 'bg-gradient-to-br from-yellow-500 to-orange-600',
  'slate': 'bg-gradient-to-br from-slate-500 to-slate-700',
}

export default function VisionPage() {
  const params = useParams()
  const router = useRouter()
  const visionId = params.visionId as string

  const [vision, setVision] = useState<Vision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // ✅ Charger les données du dashboard pour la période sélectionnée
  const { data: dashboardData, loading: dataLoading } = useDashboardData(
    vision?.etablissement_id || '',
    selectedPeriod
  )

  useEffect(() => {
    async function loadVision() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Loading vision:', visionId)
        
        const token = localStorage.getItem('auth_token')
        if (!token) {
          localStorage.setItem('redirect_after_login', window.location.pathname)
          router.push('/login')
          return
        }

        const response = await fetch(`/api/visions/${visionId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.setItem('redirect_after_login', window.location.pathname)
          router.push('/login')
          return
        }

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }

        const visionData = await response.json()
        console.log('✅ Vision:', visionData)
        
        setVision(visionData)

        // Définir la période par défaut
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const period = lastMonth.toISOString().slice(0, 7) + '-01'
        setSelectedPeriod(visionData.default_period || period)

        // View count
        try {
          await fetch(`/api/visions/${visionId}/view`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } catch (e) {}

      } catch (err: any) {
        console.error('❌ Error:', err)
        setError(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }

    loadVision()
  }, [visionId, router])

  const getAvailablePeriods = (): string[] => {
    const periods: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      periods.push(date.toISOString().slice(0, 7) + '-01')
    }
    return periods
  }

  const formatPeriod = (period: string): string => {
    const date = new Date(period)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ?')) return

    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`/api/visions/${visionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      router.push('/visions')
    } catch (error) {
      alert('Erreur')
    }
  }

  const handleToggleDefault = async () => {
    if (!vision) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/visions/${visionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_default: !vision.is_default })
      })

      if (response.ok) {
        const updated = await response.json()
        setVision(updated)
      }
    } catch (error) {}
  }

  // ✅ Rendu avec données dynamiques
  const renderItem = (item: any) => {
    console.log('🎨 Rendering:', item.type, item)

    if (!item) {
      return <div className="p-4 bg-slate-900 rounded-lg">Item null</div>
    }

    switch (item.type) {
      case 'kpi': {
        const IconComponent = item.icon && iconMap[item.icon] 
          ? iconMap[item.icon] 
          : Users

        const gradient = item.gradient && gradientMap[item.gradient]
          ? gradientMap[item.gradient]
          : 'bg-gradient-to-br from-cyan-500 to-blue-600'

        const value = typeof item.value === 'number' 
          ? item.value 
          : parseFloat(item.value || '0')

        const format = (item.format || 'number') as 'currency' | 'percent' | 'number' | 'decimal'
        
        const size = (item.size || 'normal') as 'normal' | 'large'

        return (
          <CyberKPICard
            title={item.title || 'Sans titre'}
            value={value}
            format={format}
            icon={IconComponent}
            gradient={gradient}
            alert={item.alert}
            subtitle={item.subtitle}
            size={size}
            evolutionM1={item.evolutionM1}
            evolutionN1={item.evolutionN1}
            evolution={item.evolution}
          />
        )
      }

      case 'chart': {
        return (
          <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
            <h3 className="text-white font-semibold mb-2">
              Chart: {item.id}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Position: col {item.position?.col}, row {item.position?.row}
            </p>
            <p className="text-yellow-400 text-sm">
              ⚠️ Composant chart à implémenter
            </p>
          </div>
        )
      }

      default:
        return (
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Type: {item.type}</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/visions')}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!vision) return null

  // ✅ Enrichir les items avec les données dynamiques
  const rawItems = vision.layout?.items || []
  const enrichedItems = enrichVisionItems(rawItems, dashboardData)
  
  console.log('📦 Raw items:', rawItems)
  console.log('✨ Enriched items:', enrichedItems)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/visions')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{vision.nom}</h1>
                  {vision.is_default && (
                    <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">
                      Par défaut
                    </span>
                  )}
                </div>
                {vision.description && (
                  <p className="text-sm text-slate-400 mt-1">{vision.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sélecteur période */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-sm text-white border-none outline-none cursor-pointer"
                >
                  {getAvailablePeriods().map((period) => (
                    <option key={period} value={period} className="bg-slate-800">
                      {formatPeriod(period)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleToggleDefault}
                className={`p-2 rounded-lg transition-colors ${
                  vision.is_default
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <Star className="w-5 h-5" fill={vision.is_default ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => router.push(`/visions/${visionId}/edit`)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <Edit2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                <FileDown className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div id="vision-content" className="container mx-auto px-6 py-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
              <p className="text-slate-400">Chargement des données...</p>
            </div>
          </div>
        ) : enrichedItems.length > 0 ? (
          <div className="space-y-4">
            {enrichedItems.map((item: any, index: number) => (
              <div key={item.id || index}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">Aucun élément</p>
            <button
              onClick={() => router.push(`/visions/${visionId}/edit`)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        visionId={visionId}
        visionName={vision.nom}
      />
    </div>
  )
}