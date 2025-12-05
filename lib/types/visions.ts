// ============================================
// TYPES: SYSTÈME DE VISIONS PERSONNALISABLES
// lib/types/visions.ts
// ============================================

// ============================================
// TYPES DE BASE
// ============================================

export type VisionItemType = 'kpi' | 'chart' | 'table'

export interface GridPosition {
  row: number
  col: number
}

export interface GridSize {
  cols: number  // 1-4
  rows: number  // 1-4
}

export interface VisionItem {
  id: string
  type: VisionItemType
  position: GridPosition
  size: GridSize
  config?: Record<string, any>
}

// ✅ Support de 2 formats : Grid (ancien) et Sections (nouveau)
export interface VisionLayout {
  gridCols?: number      // Format Grid (ancien)
  items?: VisionItem[]   // Format Grid (ancien)
  sections?: string[]    // ✅ Format Sections (nouveau) : ['workforce', 'payroll', 'absences', 'demographics']
}

export interface SavedVision {
  id: string
  etablissementId: string
  userId: string
  nom: string
  description?: string
  isDefault: boolean
  color: string
  layout: VisionLayout
  exportCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  lastExportedAt?: string
  lastViewedAt?: string
}

// ============================================
// CATALOGUE DES ITEMS DISPONIBLES
// ============================================

export interface AvailableItem {
  id: string
  type: VisionItemType
  label: string
  description: string
  icon: string
  category: 'effectifs' | 'turnover' | 'financier' | 'absences' | 'graphiques' | 'tableaux'
  defaultSize: GridSize
  minSize: GridSize
  maxSize: GridSize
  color: string
}

export const AVAILABLE_ITEMS: AvailableItem[] = [
  // ============================================
  // CATÉGORIE: EFFECTIFS
  // ============================================
  {
    id: 'etp_total',
    type: 'kpi',
    label: 'ETP Total',
    description: 'Effectif total équivalent temps plein',
    icon: 'Users',
    category: 'effectifs',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#3b82f6'
  },
  {
    id: 'etp_actif',
    type: 'kpi',
    label: 'ETP Actif',
    description: 'Effectif actif (hors absences longue durée)',
    icon: 'UserCheck',
    category: 'effectifs',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#10b981'
  },
  {
    id: 'etp_inactif',
    type: 'kpi',
    label: 'ETP Inactif',
    description: 'Effectif en absence longue durée',
    icon: 'UserX',
    category: 'effectifs',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#64748b'
  },
  {
    id: 'variation_etp_m1',
    type: 'kpi',
    label: 'Variation ETP M-1',
    description: 'Évolution vs mois précédent',
    icon: 'TrendingUp',
    category: 'effectifs',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#8b5cf6'
  },
  {
    id: 'variation_etp_n1',
    type: 'kpi',
    label: 'Variation ETP N-1',
    description: 'Évolution vs année précédente',
    icon: 'TrendingUp',
    category: 'effectifs',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#8b5cf6'
  },

  // ============================================
  // CATÉGORIE: TURNOVER
  // ============================================
  {
    id: 'taux_turnover',
    type: 'kpi',
    label: 'Taux Turnover',
    description: 'Taux annuel de renouvellement',
    icon: 'RefreshCw',
    category: 'turnover',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#ef4444'
  },
  {
    id: 'entrees_mois',
    type: 'kpi',
    label: 'Entrées',
    description: 'Nombre d\'embauches du mois',
    icon: 'UserPlus',
    category: 'turnover',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#10b981'
  },
  {
    id: 'sorties_mois',
    type: 'kpi',
    label: 'Sorties',
    description: 'Nombre de départs du mois',
    icon: 'UserMinus',
    category: 'turnover',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#ef4444'
  },
  {
    id: 'turnover_mensuel',
    type: 'kpi',
    label: 'Turnover Mensuel',
    description: 'Taux du mois (entrées + sorties)',
    icon: 'Percent',
    category: 'turnover',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#f59e0b'
  },

  // ============================================
  // CATÉGORIE: FINANCIER
  // ============================================
  {
    id: 'masse_salariale',
    type: 'kpi',
    label: 'Masse Salariale',
    description: 'Masse salariale brute totale',
    icon: 'Euro',
    category: 'financier',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#f59e0b'
  },
  {
    id: 'cout_moyen',
    type: 'kpi',
    label: 'Coût Moyen',
    description: 'Coût moyen par ETP',
    icon: 'Calculator',
    category: 'financier',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#f59e0b'
  },
  {
    id: 'variation_masse_m1',
    type: 'kpi',
    label: 'Variation Masse M-1',
    description: 'Évolution vs mois précédent',
    icon: 'TrendingUp',
    category: 'financier',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#8b5cf6'
  },
  {
    id: 'variation_masse_n1',
    type: 'kpi',
    label: 'Variation Masse N-1',
    description: 'Évolution vs année précédente',
    icon: 'TrendingUp',
    category: 'financier',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#8b5cf6'
  },

  // ============================================
  // CATÉGORIE: ABSENCES
  // ============================================
  {
    id: 'taux_absenteisme',
    type: 'kpi',
    label: 'Taux Absentéisme',
    description: 'Pourcentage de jours d\'absence',
    icon: 'AlertCircle',
    category: 'absences',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#ef4444'
  },
  {
    id: 'jours_absences',
    type: 'kpi',
    label: 'Jours Absences',
    description: 'Total jours d\'absence du mois',
    icon: 'Calendar',
    category: 'absences',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#ef4444'
  },
  {
    id: 'jours_conges',
    type: 'kpi',
    label: 'Jours Congés',
    description: 'Total jours de congés du mois',
    icon: 'Palmtree',
    category: 'absences',
    defaultSize: { cols: 1, rows: 1 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 1 },
    color: '#10b981'
  },

  // ============================================
  // CATÉGORIE: GRAPHIQUES
  // ============================================
  {
    id: 'evolution_etp',
    type: 'chart',
    label: 'Évolution ETP',
    description: 'Courbe sur 12 mois',
    icon: 'LineChart',
    category: 'graphiques',
    defaultSize: { cols: 4, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#3b82f6'
  },
  {
    id: 'evolution_masse',
    type: 'chart',
    label: 'Évolution Masse',
    description: 'Courbe sur 12 mois',
    icon: 'LineChart',
    category: 'graphiques',
    defaultSize: { cols: 4, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#f59e0b'
  },
  {
    id: 'pyramide_ages',
    type: 'chart',
    label: 'Pyramide des Âges',
    description: 'Répartition H/F par âge',
    icon: 'BarChart3',
    category: 'graphiques',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#8b5cf6'
  },
  {
    id: 'pyramide_anciennetes',
    type: 'chart',
    label: 'Pyramide Anciennetés',
    description: 'Répartition H/F par ancienneté',
    icon: 'BarChart3',
    category: 'graphiques',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#8b5cf6'
  },
  {
    id: 'repartition_sexe',
    type: 'chart',
    label: 'Répartition Sexe',
    description: 'Distribution H/F',
    icon: 'PieChart',
    category: 'graphiques',
    defaultSize: { cols: 1, rows: 2 },
    minSize: { cols: 1, rows: 1 },
    maxSize: { cols: 2, rows: 2 },
    color: '#ec4899'
  },
  {
    id: 'repartition_contrats',
    type: 'chart',
    label: 'Répartition Contrats',
    description: 'CDI/CDD/etc.',
    icon: 'FileText',
    category: 'graphiques',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 1 },
    maxSize: { cols: 4, rows: 2 },
    color: '#06b6d4'
  },
  {
    id: 'waterfall_prix_volume_m1',
    type: 'chart',
    label: 'Waterfall Prix/Volume M-1',
    description: 'Analyse vs mois précédent',
    icon: 'TrendingUp',
    category: 'graphiques',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#f59e0b'
  },
  {
    id: 'waterfall_prix_volume_n1',
    type: 'chart',
    label: 'Waterfall Prix/Volume N-1',
    description: 'Analyse vs année précédente',
    icon: 'TrendingUp',
    category: 'graphiques',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 3 },
    color: '#f59e0b'
  },

  // ============================================
  // CATÉGORIE: TABLEAUX
  // ============================================
  {
    id: 'mouvements_mois',
    type: 'table',
    label: 'Mouvements du Mois',
    description: 'Liste entrées/sorties',
    icon: 'Table',
    category: 'tableaux',
    defaultSize: { cols: 4, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 4 },
    color: '#64748b'
  },
  {
    id: 'top_10_salaries',
    type: 'table',
    label: 'Top 10 Salariés',
    description: 'Classement par coût',
    icon: 'Table',
    category: 'tableaux',
    defaultSize: { cols: 2, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 4 },
    color: '#64748b'
  },
  {
    id: 'absences_detail',
    type: 'table',
    label: 'Détail Absences',
    description: 'Liste des absences',
    icon: 'Table',
    category: 'tableaux',
    defaultSize: { cols: 4, rows: 2 },
    minSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 4 },
    color: '#64748b'
  }
]

// ============================================
// HELPERS
// ============================================

export function getAvailableItem(id: string): AvailableItem | undefined {
  return AVAILABLE_ITEMS.find(item => item.id === id)
}

export function getItemsByCategory(
  category: AvailableItem['category']
): AvailableItem[] {
  return AVAILABLE_ITEMS.filter(item => item.category === category)
}

export function getItemsByType(type: VisionItemType): AvailableItem[] {
  return AVAILABLE_ITEMS.filter(item => item.type === type)
}

export const CATEGORIES: Array<{
  id: AvailableItem['category']
  label: string
  icon: string
  color: string
}> = [
  {
    id: 'effectifs',
    label: 'Effectifs',
    icon: 'Users',
    color: '#3b82f6'
  },
  {
    id: 'turnover',
    label: 'Turnover',
    icon: 'RefreshCw',
    color: '#ef4444'
  },
  {
    id: 'financier',
    label: 'Financier',
    icon: 'Euro',
    color: '#f59e0b'
  },
  {
    id: 'absences',
    label: 'Absences',
    icon: 'AlertCircle',
    color: '#ef4444'
  },
  {
    id: 'graphiques',
    label: 'Graphiques',
    icon: 'BarChart3',
    color: '#8b5cf6'
  },
  {
    id: 'tableaux',
    label: 'Tableaux',
    icon: 'Table',
    color: '#64748b'
  }
]

// ============================================
// VALIDATION
// ============================================

export function validateVisionLayout(layout: VisionLayout): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // ✅ Support du format simple (sections)
  if (layout.sections) {
    if (!Array.isArray(layout.sections)) {
      errors.push('sections doit être un tableau')
    } else if (layout.sections.length === 0) {
      errors.push('La vision doit contenir au moins 1 section')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Format ancien (grid)
  if (!layout.gridCols || layout.gridCols < 1 || layout.gridCols > 4) {
    errors.push('gridCols doit être entre 1 et 4')
  }

  if (!layout.items || !Array.isArray(layout.items)) {
    errors.push('items doit être un tableau')
  }

  if (layout.items && layout.items.length === 0) {
    errors.push('La vision doit contenir au moins 1 item')
  }

  // Vérifier chevauchements
  if (layout.items) {
    const occupied: Set<string> = new Set()
    for (const item of layout.items) {
      for (let r = item.position.row; r < item.position.row + item.size.rows; r++) {
        for (let c = item.position.col; c < item.position.col + item.size.cols; c++) {
          const key = `${r},${c}`
          if (occupied.has(key)) {
            errors.push(`Chevauchement détecté à la position ${key}`)
          }
          occupied.add(key)
        }
      }

      // Vérifier limites
      if (layout.gridCols && item.position.col + item.size.cols > layout.gridCols) {
        errors.push(`Item ${item.id} dépasse la grille`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================
// EXPORT OPTIONS
// ============================================

export interface ExportOptions {
  format: 'A4' | 'A3'
  orientation: 'portrait' | 'landscape'
  includeHeader: boolean
  includeFooter: boolean
  onePage: boolean
  quality: 'normal' | 'high'
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'A4',
  orientation: 'landscape',
  includeHeader: true,
  includeFooter: true,
  onePage: true,
  quality: 'high'
}