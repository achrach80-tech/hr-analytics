// ============================================
// TALVIO - TYPES DASHBOARD
// Mise à jour: 2025-11-17
// ============================================

export interface Company {
  id: string
  nom: string
  subscription_plan: 'trial' | 'starter' | 'professional' | 'enterprise'
  etablissements?: Establishment[]
}

export interface Establishment {
  id: string
  nom: string
  is_headquarters: boolean
}

export interface WorkforceKPIs {
  etpTotal: number
  headcountActif: number
  nbEntrees: number
  nbSorties: number
  tauxTurnover: number
  pctCDI: number
  ageMoyen: number
  ancienneteMoyenne: number
  pctHommes: number
  pctFemmes: number
}

export interface PayrollKPIs {
  masseBrute: number
  coutTotal: number
  salaireMoyen: number
  coutMoyenFTE: number
  partVariable: number
  tauxCharges: number
  effetPrix: number
  effetVolume: number
  effetMix: number
  variationMasseSalariale: number
  variationMasseSalarialePct: number
  // ✅ AJOUT: Primes pour analyse intelligente
  primesExceptionnelles?: number
  primesMois13?: number
}

export interface AbsenceKPIs {
  tauxAbsenteisme: number
  nbJoursAbsence: number
  nbAbsencesTotal: number
  dureeMoyenne: number
  nbSalariesAbsents: number
  nbJoursMaladie: number
}

export interface KPIData {
  workforce: WorkforceKPIs | null
  financials: PayrollKPIs | null
  absences: AbsenceKPIs | null
  previousMonthFinancials: PayrollKPIs | null
  previousYearFinancials: PayrollKPIs | null
  previousMonthWorkforce: WorkforceKPIs | null
  previousYearWorkforce: WorkforceKPIs | null
  previousMonthAbsences: AbsenceKPIs | null
  previousYearAbsences: AbsenceKPIs | null
}

// ✅ AJOUT: Interface pour les données waterfall
export interface WaterfallData {
  masseSalarialeM1: number
  effetPrix: number
  effetVolume: number
  masseSalarialeM: number
  primesExceptionnelles?: number
  primesMois13?: number
}

// ✅ AJOUT: Interface pour les résultats de diagnostic SQL
export interface WaterfallDiagnostic {
  periode: string
  masseBruteM: number
  masseBruteM1: number
  variationReelle: number
  variationStockee: number
  effetPrix: number
  effetVolume: number
  sommeEffets: number
  ecartCoherence: number
  status: 'OK' | 'INCOHERENT'
}

// ✅ AJOUT: Type pour les périodes
export type PeriodFormat = `${number}-${number}-01` // YYYY-MM-01

// ✅ AJOUT: Interface pour les alertes
export interface Alert {
  type: 'turnover' | 'absenteisme' | 'masse_salariale' | 'effectif' | 'coherence'
  severity: 'info' | 'warning' | 'error'
  message: string
  value?: number
  threshold?: number
}

// ✅ AJOUT: Interface pour les métadonnées de snapshot
export interface SnapshotMetadata {
  periode: string
  calculatedAt: string
  dataQualityScore: number
  dataCompleteness: number
  anomaliesDetectees: number
  calculationDurationMs?: number
}