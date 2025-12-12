// lib/visions/componentsCatalog.ts
// Catalogue COMPLET des composants Dashboard disponibles pour les visions

import { 
  Users, DollarSign, TrendingUp, Calendar, Activity,
  UserCheck, UserX, Percent, Hash, BarChart3, LineChart
} from 'lucide-react'

export interface ComponentDefinition {
  id: string
  type: 'kpi' | 'chart'
  category: 'effectif' | 'masse_salariale' | 'absences' | 'evolution'
  title: string
  description: string
  icon: any
  gradient: string
  size: 'normal' | 'large'
  requiresData?: string[] // Données Dashboard nécessaires
}

// ✅ CATALOGUE COMPLET
export const COMPONENTS_CATALOG: Record<string, ComponentDefinition> = {
  // === EFFECTIF ===
  'effectif_total': {
    id: 'effectif_total',
    type: 'kpi',
    category: 'effectif',
    title: 'Effectif Total',
    description: 'ETP total de la période',
    icon: Users,
    gradient: 'cyan',
    size: 'large',
    requiresData: ['workforce.etpTotal']
  },

  'effectif_actif': {
    id: 'effectif_actif',
    type: 'kpi',
    category: 'effectif',
    title: 'Effectif Actif',
    description: 'Employés actifs fin de période',
    icon: Users,
    gradient: 'blue',
    size: 'normal',
    requiresData: ['workforce.etpActif']
  },

  'effectif_inactif': {
    id: 'effectif_inactif',
    type: 'kpi',
    category: 'effectif',
    title: 'Effectif Inactif',
    description: 'Employés inactifs',
    icon: Users,
    gradient: 'slate',
    size: 'normal',
    requiresData: ['workforce.etpInactif']
  },

  'entrees': {
    id: 'entrees',
    type: 'kpi',
    category: 'effectif',
    title: 'Entrées',
    description: 'Nouvelles embauches du mois',
    icon: UserCheck,
    gradient: 'green',
    size: 'normal',
    requiresData: ['workforce.entreesMois']
  },

  'sorties': {
    id: 'sorties',
    type: 'kpi',
    category: 'effectif',
    title: 'Sorties',
    description: 'Départs du mois',
    icon: UserX,
    gradient: 'red',
    size: 'normal',
    requiresData: ['workforce.sortiesMois']
  },

  'taux_turnover': {
    id: 'taux_turnover',
    type: 'kpi',
    category: 'effectif',
    title: 'Taux de Turnover',
    description: 'Turnover annualisé',
    icon: TrendingUp,
    gradient: 'orange',
    size: 'normal',
    requiresData: ['workforce.tauxTurnover']
  },

  'turnover_mensuel': {
    id: 'turnover_mensuel',
    type: 'kpi',
    category: 'effectif',
    title: 'Turnover Mensuel',
    description: 'Rotation du mois',
    icon: Activity,
    gradient: 'yellow',
    size: 'normal',
    requiresData: ['workforce.turnoverMensuel']
  },

  // === MASSE SALARIALE ===
  'masse_salariale': {
    id: 'masse_salariale',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Masse Salariale',
    description: 'Masse salariale brute',
    icon: DollarSign,
    gradient: 'green',
    size: 'large',
    requiresData: ['payroll.masseSalariale']
  },

  'cout_moyen': {
    id: 'cout_moyen',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Coût Moyen',
    description: 'Coût moyen par ETP',
    icon: DollarSign,
    gradient: 'blue',
    size: 'normal',
    requiresData: ['payroll.coutMoyen']
  },

  'effet_prix_m1': {
    id: 'effet_prix_m1',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Effet Prix M-1',
    description: 'Impact prix vs mois précédent',
    icon: TrendingUp,
    gradient: 'green',
    size: 'normal',
    requiresData: ['payroll.waterfallM1']
  },

  'effet_volume_m1': {
    id: 'effet_volume_m1',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Effet Volume M-1',
    description: 'Impact volume vs mois précédent',
    icon: Hash,
    gradient: 'blue',
    size: 'normal',
    requiresData: ['payroll.waterfallM1']
  },

  'effet_prix_n1': {
    id: 'effet_prix_n1',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Effet Prix N-1',
    description: 'Impact prix vs année dernière',
    icon: TrendingUp,
    gradient: 'purple',
    size: 'normal',
    requiresData: ['payroll.waterfallN1']
  },

  'effet_volume_n1': {
    id: 'effet_volume_n1',
    type: 'kpi',
    category: 'masse_salariale',
    title: 'Effet Volume N-1',
    description: 'Impact volume vs année dernière',
    icon: Hash,
    gradient: 'purple',
    size: 'normal',
    requiresData: ['payroll.waterfallN1']
  },

  // === ABSENCES ===
  'taux_absenteisme': {
    id: 'taux_absenteisme',
    type: 'kpi',
    category: 'absences',
    title: 'Taux d\'Absentéisme',
    description: 'Taux d\'absence global',
    icon: Activity,
    gradient: 'orange',
    size: 'normal',
    requiresData: ['absences.tauxAbsenteisme']
  },

  'jours_absences': {
    id: 'jours_absences',
    type: 'kpi',
    category: 'absences',
    title: 'Jours d\'Absence',
    description: 'Total jours d\'absence',
    icon: Calendar,
    gradient: 'red',
    size: 'normal',
    requiresData: ['absences.joursAbsences']
  },

  'jours_conges': {
    id: 'jours_conges',
    type: 'kpi',
    category: 'absences',
    title: 'Jours de Congés',
    description: 'Total jours de congés payés',
    icon: Calendar,
    gradient: 'blue',
    size: 'normal',
    requiresData: ['absences.joursConges']
  },

  // === CHARTS ===
  'evolution_etp': {
    id: 'evolution_etp',
    type: 'chart',
    category: 'evolution',
    title: 'Évolution des ETP',
    description: 'Courbe d\'évolution sur 24 mois',
    icon: LineChart,
    gradient: 'purple',
    size: 'large',
    requiresData: ['evolution_data']
  },

  'pyramide_ages': {
    id: 'pyramide_ages',
    type: 'chart',
    category: 'effectif',
    title: 'Pyramide des Âges',
    description: 'Répartition par tranche d\'âge',
    icon: BarChart3,
    gradient: 'cyan',
    size: 'large',
    requiresData: ['demographics.ageGroups']
  },

  'pyramide_anciennetes': {
    id: 'pyramide_anciennetes',
    type: 'chart',
    category: 'effectif',
    title: 'Pyramide des Anciennetés',
    description: 'Répartition par ancienneté',
    icon: BarChart3,
    gradient: 'blue',
    size: 'large',
    requiresData: ['demographics.seniorityGroups']
  },

  'waterfall_prix_volume_m1': {
    id: 'waterfall_prix_volume_m1',
    type: 'chart',
    category: 'masse_salariale',
    title: 'Waterfall Prix/Volume M-1',
    description: 'Décomposition vs mois précédent',
    icon: BarChart3,
    gradient: 'green',
    size: 'large',
    requiresData: ['payroll.waterfallM1']
  },

  'waterfall_prix_volume_n1': {
    id: 'waterfall_prix_volume_n1',
    type: 'chart',
    category: 'masse_salariale',
    title: 'Waterfall Prix/Volume N-1',
    description: 'Décomposition vs année dernière',
    icon: BarChart3,
    gradient: 'purple',
    size: 'large',
    requiresData: ['payroll.waterfallN1']
  },
}

// ✅ Fonctions utilitaires
export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return Object.values(COMPONENTS_CATALOG).filter(c => c.category === category)
}

export function getComponentById(id: string): ComponentDefinition | undefined {
  return COMPONENTS_CATALOG[id]
}

export function getAllKPIs(): ComponentDefinition[] {
  return Object.values(COMPONENTS_CATALOG).filter(c => c.type === 'kpi')
}

export function getAllCharts(): ComponentDefinition[] {
  return Object.values(COMPONENTS_CATALOG).filter(c => c.type === 'chart')
}

export const CATEGORIES = [
  { id: 'effectif', label: 'Effectif & Mouvements', icon: Users },
  { id: 'masse_salariale', label: 'Masse Salariale', icon: DollarSign },
  { id: 'absences', label: 'Absences', icon: Calendar },
  { id: 'evolution', label: 'Évolutions', icon: LineChart },
] as const