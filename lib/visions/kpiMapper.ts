// lib/visions/kpiMapper.ts
// Système de mapping KPI ID → Données dynamiques

import { DashboardData } from '@/lib/types/dashboard'

export interface KPIDefinition {
  id: string
  getValue: (data: DashboardData | null) => number
  getTitle: () => string
  getFormat: () => 'currency' | 'percent' | 'number' | 'decimal'
  getIcon: () => string
  getGradient: () => string
  getSubtitle?: (data: DashboardData | null) => string
  getEvolutionM1?: (data: DashboardData | null) => number
  getEvolutionN1?: (data: DashboardData | null) => number
}

// ✅ Catalogue complet des KPIs disponibles
export const KPI_CATALOG: Record<string, KPIDefinition> = {
  // === EFFECTIF ===
  'effectif_total': {
    id: 'effectif_total',
    getValue: (data) => data?.workforce?.effectif_total || 0,
    getTitle: () => 'Effectif Total',
    getFormat: () => 'number',
    getIcon: () => 'users',
    getGradient: () => 'cyan',
    getEvolutionM1: (data) => data?.workforce?.evolution_m1 || 0,
    getEvolutionN1: (data) => data?.workforce?.evolution_n1 || 0,
  },

  'effectif_moyen': {
    id: 'effectif_moyen',
    getValue: (data) => data?.workforce?.effectif_moyen || 0,
    getTitle: () => 'Effectif Moyen',
    getFormat: () => 'decimal',
    getIcon: () => 'users',
    getGradient: () => 'blue',
  },

  'entrees': {
    id: 'entrees',
    getValue: (data) => data?.workforce?.entrees || 0,
    getTitle: () => 'Entrées',
    getFormat: () => 'number',
    getIcon: () => 'user-check',
    getGradient: () => 'green',
  },

  'sorties': {
    id: 'sorties',
    getValue: (data) => data?.workforce?.sorties || 0,
    getTitle: () => 'Sorties',
    getFormat: () => 'number',
    getIcon: () => 'user-x',
    getGradient: () => 'red',
  },

  'turnover_rate': {
    id: 'turnover_rate',
    getValue: (data) => data?.workforce?.turnover_rate || 0,
    getTitle: () => 'Taux de Turnover',
    getFormat: () => 'percent',
    getIcon: () => 'trending-up',
    getGradient: () => 'orange',
  },

  // === MASSE SALARIALE ===
  'masse_salariale': {
    id: 'masse_salariale',
    getValue: (data) => data?.payroll?.masse_salariale_brute || 0,
    getTitle: () => 'Masse Salariale Brute',
    getFormat: () => 'currency',
    getIcon: () => 'dollar-sign',
    getGradient: () => 'green',
    getEvolutionM1: (data) => data?.payroll?.evolution_m1 || 0,
    getEvolutionN1: (data) => data?.payroll?.evolution_n1 || 0,
  },

  'salaire_moyen': {
    id: 'salaire_moyen',
    getValue: (data) => data?.payroll?.salaire_moyen || 0,
    getTitle: () => 'Salaire Moyen',
    getFormat: () => 'currency',
    getIcon: () => 'dollar-sign',
    getGradient: () => 'blue',
  },

  'charges_sociales': {
    id: 'charges_sociales',
    getValue: (data) => data?.payroll?.charges_sociales || 0,
    getTitle: () => 'Charges Sociales',
    getFormat: () => 'currency',
    getIcon: () => 'percent',
    getGradient: () => 'purple',
  },

  'cout_total': {
    id: 'cout_total',
    getValue: (data) => data?.payroll?.cout_total || 0,
    getTitle: () => 'Coût Total',
    getFormat: () => 'currency',
    getIcon: () => 'dollar-sign',
    getGradient: () => 'slate',
  },

  // === ABSENCES ===
  'total_absences': {
    id: 'total_absences',
    getValue: (data) => data?.absences?.total_jours || 0,
    getTitle: () => 'Total Absences (jours)',
    getFormat: () => 'number',
    getIcon: () => 'calendar',
    getGradient: () => 'red',
  },

  'taux_absenteisme': {
    id: 'taux_absenteisme',
    getValue: (data) => data?.absences?.taux_absenteisme || 0,
    getTitle: () => 'Taux d\'Absentéisme',
    getFormat: () => 'percent',
    getIcon: () => 'activity',
    getGradient: () => 'orange',
  },

  'conges_payes': {
    id: 'conges_payes',
    getValue: (data) => data?.absences?.conges_payes || 0,
    getTitle: () => 'Congés Payés',
    getFormat: () => 'number',
    getIcon: () => 'calendar',
    getGradient: () => 'blue',
  },

  'arrets_maladie': {
    id: 'arrets_maladie',
    getValue: (data) => data?.absences?.arrets_maladie || 0,
    getTitle: () => 'Arrêts Maladie',
    getFormat: () => 'number',
    getIcon: () => 'activity',
    getGradient: () => 'red',
  },

  // === DÉMOGRAPHIE ===
  'age_moyen': {
    id: 'age_moyen',
    getValue: (data) => data?.demographics?.age_moyen || 0,
    getTitle: () => 'Âge Moyen',
    getFormat: () => 'decimal',
    getIcon: () => 'users',
    getGradient: () => 'purple',
  },

  'anciennete_moyenne': {
    id: 'anciennete_moyenne',
    getValue: (data) => data?.demographics?.anciennete_moyenne || 0,
    getTitle: () => 'Ancienneté Moyenne',
    getFormat: () => 'decimal',
    getIcon: () => 'calendar',
    getGradient: () => 'blue',
  },

  'ratio_hommes_femmes': {
    id: 'ratio_hommes_femmes',
    getValue: (data) => {
      const total = (data?.demographics?.hommes || 0) + (data?.demographics?.femmes || 0)
      return total > 0 ? ((data?.demographics?.femmes || 0) / total) * 100 : 0
    },
    getTitle: () => 'Ratio Femmes',
    getFormat: () => 'percent',
    getIcon: () => 'users',
    getGradient: () => 'purple',
  },
}

// ✅ Fonction pour enrichir un item KPI avec les données
export function enrichKPIItem(item: any, data: DashboardData | null): any {
  if (item.type !== 'kpi') return item

  // Si l'item a déjà toutes les données, on le garde tel quel
  if (item.title && item.value !== undefined) {
    return item
  }

  // Sinon, on cherche dans le catalogue
  const kpiDef = KPI_CATALOG[item.id]
  if (!kpiDef) {
    console.warn(`KPI "${item.id}" non trouvé dans le catalogue`)
    return {
      ...item,
      title: item.title || 'KPI Inconnu',
      value: 0,
      format: 'number',
      icon: 'activity',
      gradient: 'slate',
    }
  }

  // Enrichir avec les données du catalogue
  return {
    ...item,
    title: kpiDef.getTitle(),
    value: kpiDef.getValue(data),
    format: kpiDef.getFormat(),
    icon: kpiDef.getIcon(),
    gradient: kpiDef.getGradient(),
    subtitle: kpiDef.getSubtitle?.(data),
    evolutionM1: kpiDef.getEvolutionM1?.(data),
    evolutionN1: kpiDef.getEvolutionN1?.(data),
  }
}

// ✅ Fonction pour enrichir tous les items d'une vision
export function enrichVisionItems(items: any[], data: DashboardData | null): any[] {
  return items.map(item => enrichKPIItem(item, data))
}