// lib/config/builderComponents.ts
import type { ComponentType } from '@/lib/store/builderStore'

export interface ComponentDefinition {
  id: string
  name: string
  type: ComponentType
  category: 'kpi' | 'chart' | 'text'
  icon: string
  description: string
  dataKey: string
  defaultSize: {
    width: number
    height: number
  }
  minSize: {
    width: number
    height: number
  }
  preview: {
    label: string
    value?: string
    subtitle?: string
    trend?: string
    color: string
  }
}

export const BUILDER_COMPONENTS: ComponentDefinition[] = [
  // ============================================
  // KPI CARDS
  // ============================================
  {
    id: 'etp_total',
    name: 'ETP Total',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'Users',
    description: 'Équivalent Temps Plein total',
    dataKey: 'workforce.etpTotal',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'ETP Total',
      value: '50.0',
      subtitle: 'Équivalent Temps Plein',
      trend: '-1.8%',
      color: '#06b6d4'
    }
  },
  {
    id: 'effectif_actif',
    name: 'Effectif Actif',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'UserCheck',
    description: 'Nombre de salariés actifs',
    dataKey: 'workforce.effectifActif',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Effectif Actif',
      value: '51',
      subtitle: 'Salariés actifs',
      trend: '+2.5%',
      color: '#10b981'
    }
  },
  {
    id: 'pct_cdi',
    name: '% CDI',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'FileText',
    description: 'Pourcentage de CDI',
    dataKey: 'workforce.pctCDI',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: '% CDI',
      value: '68.6%',
      subtitle: 'Part de CDI',
      trend: '+1.2%',
      color: '#8b5cf6'
    }
  },
  {
    id: 'entrees',
    name: 'Entrées',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'UserPlus',
    description: 'Nouvelles embauches',
    dataKey: 'movements.entrees',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Entrées',
      value: '8',
      subtitle: 'Embauches du mois',
      color: '#22c55e'
    }
  },
  {
    id: 'sorties',
    name: 'Sorties',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'UserMinus',
    description: 'Départs du mois',
    dataKey: 'movements.sorties',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Sorties',
      value: '5',
      subtitle: 'Départs du mois',
      color: '#ef4444'
    }
  },
  {
    id: 'turnover',
    name: 'Turnover',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'TrendingUp',
    description: 'Taux de rotation',
    dataKey: 'movements.turnover',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Turnover',
      value: '12.4%',
      subtitle: 'Taux de rotation annuel',
      trend: '-0.8%',
      color: '#f59e0b'
    }
  },
  {
    id: 'masse_salariale',
    name: 'Masse Salariale',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'DollarSign',
    description: 'Masse salariale brute',
    dataKey: 'payroll.masseSalariale',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Masse Salariale',
      value: '352 861 €',
      subtitle: 'Total brut mensuel',
      trend: '+5.2%',
      color: '#06b6d4'
    }
  },
  {
    id: 'cout_moyen',
    name: 'Coût Moyen',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'Calculator',
    description: 'Coût moyen par ETP',
    dataKey: 'payroll.coutMoyen',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Coût Moyen',
      value: '7 057 €',
      subtitle: 'Par ETP / mois',
      trend: '+3.1%',
      color: '#8b5cf6'
    }
  },
  {
    id: 'effet_prix',
    name: 'Effet Prix',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'TrendingUp',
    description: 'Impact des augmentations',
    dataKey: 'payroll.effetPrix',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Effet Prix',
      value: '+160 009 €',
      subtitle: 'Impact augmentations',
      trend: '+83%',
      color: '#ef4444'
    }
  },
  {
    id: 'effet_volume',
    name: 'Effet Volume',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'Users',
    description: 'Impact effectifs',
    dataKey: 'payroll.effetVolume',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Effet Volume',
      value: '0 €',
      subtitle: 'Impact effectifs',
      color: '#64748b'
    }
  },
  {
    id: 'taux_absenteisme',
    name: 'Taux Absentéisme',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'AlertCircle',
    description: 'Taux d\'absence',
    dataKey: 'absences.tauxAbsenteisme',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Absentéisme',
      value: '6.8%',
      subtitle: 'Taux mensuel',
      trend: '+0.5%',
      color: '#f59e0b'
    }
  },
  {
    id: 'jours_absence',
    name: 'Jours Absence',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'Calendar',
    description: 'Total jours d\'absence',
    dataKey: 'absences.joursAbsence',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Jours Absence',
      value: '142',
      subtitle: 'Total du mois',
      trend: '+12',
      color: '#ef4444'
    }
  },
  {
    id: 'age_moyen',
    name: 'Âge Moyen',
    type: 'kpi_card',
    category: 'kpi',
    icon: 'Clock',
    description: 'Âge moyen des salariés',
    dataKey: 'demographics.ageMoyen',
    defaultSize: { width: 400, height: 220 },
    minSize: { width: 300, height: 180 },
    preview: {
      label: 'Âge Moyen',
      value: '38.5 ans',
      subtitle: 'Moyenne d\'âge',
      color: '#06b6d4'
    }
  },

  // ============================================
  // CHARTS
  // ============================================
  {
    id: 'waterfall_m1',
    name: 'Waterfall M-1',
    type: 'chart',
    category: 'chart',
    icon: 'BarChart3',
    description: 'Analyse Prix/Volume mensuelle',
    dataKey: 'payroll.waterfallM1',
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 600, height: 400 },
    preview: {
      label: 'Waterfall M-1',
      value: 'Prix/Volume mensuel',
      color: '#06b6d4'
    }
  },
  {
    id: 'waterfall_n1',
    name: 'Waterfall N-1',
    type: 'chart',
    category: 'chart',
    icon: 'BarChart3',
    description: 'Analyse Prix/Volume annuelle',
    dataKey: 'payroll.waterfallN1',
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 600, height: 400 },
    preview: {
      label: 'Waterfall N-1',
      value: 'Prix/Volume annuel',
      color: '#8b5cf6'
    }
  },
  {
    id: 'evolution_etp',
    name: 'Évolution ETP',
    type: 'chart',
    category: 'chart',
    icon: 'LineChart',
    description: 'Évolution sur 24 mois',
    dataKey: 'workforce.evolutionETP',
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 600, height: 400 },
    preview: {
      label: 'Évolution ETP',
      value: '24 derniers mois',
      color: '#10b981'
    }
  },
  {
    id: 'pyramide_ages',
    name: 'Pyramide Âges',
    type: 'chart',
    category: 'chart',
    icon: 'BarChart2',
    description: 'Répartition par âge H/F',
    dataKey: 'demographics.pyramideAges',
    defaultSize: { width: 700, height: 600 },
    minSize: { width: 500, height: 450 },
    preview: {
      label: 'Pyramide Âges',
      value: 'Répartition H/F',
      color: '#06b6d4'
    }
  },
  {
    id: 'pyramide_anciennetes',
    name: 'Pyramide Anciennetés',
    type: 'chart',
    category: 'chart',
    icon: 'BarChart2',
    description: 'Répartition par ancienneté H/F',
    dataKey: 'demographics.pyramideAnciennetes',
    defaultSize: { width: 700, height: 600 },
    minSize: { width: 500, height: 450 },
    preview: {
      label: 'Pyramide Anciennetés',
      value: 'Répartition H/F',
      color: '#8b5cf6'
    }
  },
  {
    id: 'repartition_genre',
    name: 'Répartition Genre',
    type: 'chart',
    category: 'chart',
    icon: 'PieChart',
    description: 'Répartition Hommes/Femmes',
    dataKey: 'demographics.repartitionGenre',
    defaultSize: { width: 500, height: 400 },
    minSize: { width: 400, height: 350 },
    preview: {
      label: 'Répartition Genre',
      value: 'Hommes/Femmes',
      color: '#f59e0b'
    }
  },
  {
    id: 'distribution_contrats',
    name: 'Distribution Contrats',
    type: 'chart',
    category: 'chart',
    icon: 'Briefcase',
    description: 'Répartition par type de contrat (CDI/CDD/ALT/STA)',
    dataKey: 'workforce.distributionContrats',
    defaultSize: { width: 600, height: 600 },
    minSize: { width: 450, height: 450 },
    preview: {
      label: 'Distribution Contrats',
      value: 'CDI/CDD/ALT/STA',
      color: '#10b981'
    }
  },

  // ============================================
  // TEXT
  // ============================================
  {
    id: 'text_zone',
    name: 'Zone Texte',
    type: 'text',
    category: 'text',
    icon: 'Type',
    description: 'Zone de texte libre',
    dataKey: 'text.zone',
    defaultSize: { width: 600, height: 150 },
    minSize: { width: 200, height: 80 },
    preview: {
      label: 'Zone Texte',
      value: 'Texte personnalisable',
      color: '#64748b'
    }
  },
  {
    id: 'title',
    name: 'Titre',
    type: 'title',
    category: 'text',
    icon: 'Heading',
    description: 'Titre principal',
    dataKey: 'text.title',
    defaultSize: { width: 800, height: 100 },
    minSize: { width: 300, height: 60 },
    preview: {
      label: 'Titre',
      value: 'Titre du rapport',
      color: '#06b6d4'
    }
  }
]

export const COMPONENT_CATEGORIES = [
  { id: 'kpi', label: 'KPI Cards', icon: 'LayoutGrid' },
  { id: 'chart', label: 'Graphiques', icon: 'BarChart3' },
  { id: 'text', label: 'Texte', icon: 'Type' }
] as const

export function getComponentById(id: string): ComponentDefinition | undefined {
  return BUILDER_COMPONENTS.find(c => c.id === id)
}

export function getComponentsByCategory(category: 'kpi' | 'chart' | 'text'): ComponentDefinition[] {
  return BUILDER_COMPONENTS.filter(c => c.category === category)
}

// Alias pour compatibilité
export const getComponentDefinition = getComponentById