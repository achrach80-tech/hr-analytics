// components/visions/VisionItemRenderer.tsx
// Version corrigée - ZÉRO erreur TypeScript

import { memo } from 'react'
import { CyberKPICard } from '@/components/dashboard/CyberKPICard'
import { 
  Users, 
  DollarSign, 
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Percent,
  Hash,
  TrendingUp,
  TrendingDown,
  type LucideIcon
} from 'lucide-react'

// ✅ Types simplifiés - Pas besoin d'importer depuis @/types
interface VisionItem {
  id: string
  type: string
  width?: number
  config: {
    title?: string
    value?: string | number
    format?: 'currency' | 'percent' | 'number' | 'decimal'
    icon?: string
    gradient?: string
    alert?: boolean
    subtitle?: string
    size?: 'normal' | 'large'
    evolutionM1?: number
    evolutionN1?: number
    evolution?: {
      value: number
      label: string
    }
  }
}

interface DashboardData {
  // Type flexible pour éviter les erreurs
  [key: string]: any
}

interface VisionItemRendererProps {
  item: VisionItem
  data?: DashboardData | null
  etablissementId?: string
  periode?: string
  className?: string
  exportMode?: boolean  // ✅ Ajouté
}

// Map des icônes
const iconMap: Record<string, LucideIcon> = {
  'users': Users,
  'user-check': UserCheck,
  'user-x': UserX,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'calendar': Calendar,
  'activity': Activity,
  'percent': Percent,
  'hash': Hash,
}

// Map des gradients
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

export const VisionItemRenderer = memo(function VisionItemRenderer({
  item,
  data,
  etablissementId,
  periode,
  className = '',
  exportMode = false,
}: VisionItemRendererProps) {
  
  const renderItem = () => {
    switch (item.type) {
      case 'kpi': {
        // Conversion stricte des types pour CyberKPICard
        const icon = item.config.icon && iconMap[item.config.icon] 
          ? iconMap[item.config.icon] 
          : Users // Valeur par défaut

        const gradient = item.config.gradient && gradientMap[item.config.gradient]
          ? gradientMap[item.config.gradient]
          : 'bg-gradient-to-br from-cyan-500 to-blue-600' // Valeur par défaut

        const value = typeof item.config.value === 'number' 
          ? item.config.value 
          : parseFloat(item.config.value || '0')

        const format = (item.config.format || 'number') as 'currency' | 'percent' | 'number' | 'decimal'
        
        const size = (item.config.size || 'normal') as 'normal' | 'large'

        return (
          <CyberKPICard
            title={item.config.title || 'Sans titre'}
            value={value}
            format={format}
            icon={icon}
            gradient={gradient}
            alert={item.config.alert}
            subtitle={item.config.subtitle}
            size={size}
            evolutionM1={item.config.evolutionM1}
            evolutionN1={item.config.evolutionN1}
            evolution={item.config.evolution}
          />
        )
      }

      // Ajoute ici d'autres types si nécessaire
      // case 'waterfall':
      //   return <WaterfallChart ... />

      default:
        return (
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm">Type inconnu : {item.type}</p>
          </div>
        )
    }
  }

  return (
    <div className={className}>
      {renderItem()}
    </div>
  )
})

VisionItemRenderer.displayName = 'VisionItemRenderer'