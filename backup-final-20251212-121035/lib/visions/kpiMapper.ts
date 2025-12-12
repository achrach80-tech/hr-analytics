// lib/visions/kpiMapper.ts
// KPI Mapper - Types 100% compatibles avec useDashboardData

import type { DashboardData } from '@/lib/hooks/useDashboardData'

export interface KPIDefinition {
  id: string
  getValue: (data: DashboardData | null) => number
  getTitle: () => string
  getFormat: () => 'currency' | 'percent' | 'number' | 'decimal'
  getIcon: () => string
  getGradient: () => string
  getSubtitle?: (data: DashboardData | null) => string | undefined
  getEvolutionM1?: (data: DashboardData | null) => number | undefined
  getEvolutionN1?: (data: DashboardData | null) => number | undefined
}

// Catalogue des KPIs - Noms exacts de DashboardData
export const KPI_CATALOG: Record<string, KPIDefinition> = {
  // WORKFORCE
  'effectif_total': {
    id: 'effectif_total',
    getValue: (data) => data?.workforce.etpTotal ?? 0,
    getTitle: () => 'Effectif Total',
    getFormat: () => 'decimal',
    getIcon: () => 'users',
    getGradient: () => 'cyan',
    getEvolutionM1: (data) => data?.workforce.variationM1Pct,
    getEvolutionN1: (data) => data?.workforce.variationN1Pct,
  },

  'effectif_actif': {
    id: 'effectif_actif',
    getValue: (data) => data?.workforce.etpActif ?? 0,
    getTitle: () => 'Effectif Actif',
    getFormat: () => 'decimal',
    getIcon: () => 'users',
    getGradient: () => 'blue',
  },

  'effectif_inactif': {
    id: 'effectif_inactif',
    getValue: (data) => data?.workforce.etpInactif ?? 0,
    getTitle: () => 'Effectif Inactif',
    getFormat: () => 'decimal',
    getIcon: () => 'users',
    getGradient: () => 'slate',
  },

  'entrees': {
    id: 'entrees',
    getValue: (data) => data?.workforce.entreesMois ?? 0,
    getTitle: () => 'Entrées',
    getFormat: () => 'number',
    getIcon: () => 'user-check',
    getGradient: () => 'green',
  },

  'sorties': {
    id: 'sorties',
    getValue: (data) => data?.workforce.sortiesMois ?? 0,
    getTitle: () => 'Sorties',
    getFormat: () => 'number',
    getIcon: () => 'user-x',
    getGradient: () => 'red',
  },

  'taux_turnover': {
    id: 'taux_turnover',
    getValue: (data) => data?.workforce.tauxTurnover ?? 0,
    getTitle: () => 'Taux de Turnover',
    getFormat: () => 'percent',
    getIcon: () => 'trending-up',
    getGradient: () => 'orange',
  },

  'turnover_mensuel': {
    id: 'turnover_mensuel',
    getValue: (data) => data?.workforce.turnoverMensuel ?? 0,
    getTitle: () => 'Turnover Mensuel',
    getFormat: () => 'percent',
    getIcon: () => 'activity',
    getGradient: () => 'yellow',
  },

  // PAYROLL
  'masse_salariale': {
    id: 'masse_salariale',
    getValue: (data) => data?.payroll.masseSalariale ?? 0,
    getTitle: () => 'Masse Salariale',
    getFormat: () => 'currency',
    getIcon: () => 'dollar-sign',
    getGradient: () => 'green',
    getEvolutionM1: (data) => data?.payroll.variationM1Pct,
    getEvolutionN1: (data) => data?.payroll.variationN1Pct,
  },

  'cout_moyen': {
    id: 'cout_moyen',
    getValue: (data) => data?.payroll.coutMoyen ?? 0,
    getTitle: () => 'Coût Moyen',
    getFormat: () => 'currency',
    getIcon: () => 'dollar-sign',
    getGradient: () => 'blue',
  },

  'effet_prix_m1': {
    id: 'effet_prix_m1',
    getValue: (data) => data?.payroll.waterfallM1?.effetPrix.value ?? 0,
    getTitle: () => 'Effet Prix M-1',
    getFormat: () => 'currency',
    getIcon: () => 'trending-up',
    getGradient: () => 'green',
    getSubtitle: (data) => data?.payroll.waterfallM1?.effetPrix.label,
  },

  'effet_volume_m1': {
    id: 'effet_volume_m1',
    getValue: (data) => data?.payroll.waterfallM1?.effetVolume.value ?? 0,
    getTitle: () => 'Effet Volume M-1',
    getFormat: () => 'currency',
    getIcon: () => 'hash',
    getGradient: () => 'blue',
    getSubtitle: (data) => data?.payroll.waterfallM1?.effetVolume.label,
  },

  'effet_prix_n1': {
    id: 'effet_prix_n1',
    getValue: (data) => data?.payroll.waterfallN1?.effetPrix.value ?? 0,
    getTitle: () => 'Effet Prix N-1',
    getFormat: () => 'currency',
    getIcon: () => 'trending-up',
    getGradient: () => 'purple',
    getSubtitle: (data) => data?.payroll.waterfallN1?.effetPrix.label,
  },

  'effet_volume_n1': {
    id: 'effet_volume_n1',
    getValue: (data) => data?.payroll.waterfallN1?.effetVolume.value ?? 0,
    getTitle: () => 'Effet Volume N-1',
    getFormat: () => 'currency',
    getIcon: () => 'hash',
    getGradient: () => 'purple',
    getSubtitle: (data) => data?.payroll.waterfallN1?.effetVolume.label,
  },

  // ABSENCES
  'taux_absenteisme': {
    id: 'taux_absenteisme',
    getValue: (data) => data?.absences.tauxAbsenteisme ?? 0,
    getTitle: () => 'Taux d\'Absentéisme',
    getFormat: () => 'percent',
    getIcon: () => 'activity',
    getGradient: () => 'orange',
  },

  'jours_absences': {
    id: 'jours_absences',
    getValue: (data) => data?.absences.joursAbsences ?? 0,
    getTitle: () => 'Jours d\'Absence',
    getFormat: () => 'number',
    getIcon: () => 'calendar',
    getGradient: () => 'red',
  },

  'jours_conges': {
    id: 'jours_conges',
    getValue: (data) => data?.absences.joursConges ?? 0,
    getTitle: () => 'Jours de Congés',
    getFormat: () => 'number',
    getIcon: () => 'calendar',
    getGradient: () => 'blue',
  },
}

export function enrichKPIItem(item: any, data: DashboardData | null): any {
  if (item.type !== 'kpi') {
    return item
  }

  // Si déjà enrichi (a title et value), retourner tel quel
  if (item.title && typeof item.value === 'number') {
    return item
  }

  // Chercher dans le catalogue
  const kpiDef = KPI_CATALOG[item.id]
  
  if (!kpiDef) {
    console.warn(`⚠️ KPI inconnu: "${item.id}"`)
    return {
      ...item,
      title: `KPI: ${item.id}`,
      value: 0,
      format: 'number',
      icon: 'activity',
      gradient: 'slate',
    }
  }

  // Enrichir
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

export function enrichVisionItems(items: any[], data: DashboardData | null): any[] {
  return items.map(item => enrichKPIItem(item, data))
}