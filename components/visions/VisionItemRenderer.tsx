// components/visions/VisionItemRenderer.tsx
// Version FINALE - Structure SANS config

import { memo } from 'react'
import { CyberKPICard } from '@/components/dashboard/CyberKPICard'
import { 
  Users, 
  DollarSign, 
  Calendar,
  Activity,
  type LucideIcon
} from 'lucide-react'

// ✅ Interface flexible sans config
interface VisionItem {
  id: string
  type: string
  width?: number
  // Données DIRECTEMENT dans item (pas de config)
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
  // Pour les charts
  position?: {
    col: number
    row: number
  }
}

interface VisionItemRendererProps {
  item: VisionItem
  data?: any
  etablissementId?: string
  periode?: string
  className?: string
  exportMode?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  'users': Users,
  'dollar-sign': DollarSign,
  'calendar': Calendar,
  'activity': Activity,
}

const gradientMap: Record<string, string> = {
  'cyan': 'bg-gradient-to-br from-cyan-500 to-blue-600',
  'blue': 'bg-gradient-to-br from-blue-500 to-indigo-600',
  'purple': 'bg-gradient-to-br from-purple-500 to-pink-600',
  'green': 'bg-gradient-to-br from-green-500 to-emerald-600',
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
    if (!item) {
      return <div className="p-4 bg-slate-900 rounded-lg">Item null</div>
    }

    switch (item.type) {
      case 'kpi': {
        // ✅ Accès DIRECT sans config
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
        // Rendu temporaire pour les charts
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

  return (
    <div className={className}>
      {renderItem()}
    </div>
  )
})

VisionItemRenderer.displayName = 'VisionItemRenderer'

export default VisionItemRenderer