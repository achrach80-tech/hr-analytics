// ==========================================
// TYPE DEFINITIONS FOR IMPORT SYSTEM
// ==========================================

export interface ValidationError {
  id: string
  sheet: string
  row: number
  column: string
  field: string
  value: any
  message: string
  severity: 'critical' | 'warning' | 'info'
  canIgnore: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    totalErrors: number
    criticalErrors: number
    warningCount: number
    canProceed: boolean
    qualityScore: number
  }
}

export interface ProcessedData {
  employees: Employee[]
  remunerations: Remuneration[]
  absences: Absence[]
  referentiel_organisation: OrganisationRef[]
  referentiel_absences: AbsenceRef[]
  metadata: ImportMetadata
}

export interface ImportMetadata {
  periods: string[]
  totalEmployees: number
  totalRecords: number
  establishments: string[]
  fileInfo: {
    name: string
    size: number
    hash?: string
  }
}

export interface ImportProgress {
  phase: 'validation' | 'processing' | 'snapshots' | 'completion'
  step: string
  current: number
  total: number
  percentage: number
  message: string
  detail?: string
  startTime?: Date
  estimatedTimeRemaining?: number
}

export interface ImportResult {
  success: boolean
  batchId: string
  recordsImported: {
    employees: number
    remunerations: number
    absences: number
  }
  snapshotsCalculated: number
  errors: ValidationError[]
  warnings: ValidationError[]
  processingTime: number
}

// Raw data interfaces from Excel
export interface Employee {
  matricule: string
  periode: string
  sexe?: string
  date_naissance?: string
  date_entree: string
  date_sortie?: string
  type_contrat: string
  temps_travail: number
  intitule_poste: string
  code_cost_center?: string
  code_site?: string
  statut_emploi: string
}

export interface Remuneration {
  matricule: string
  mois_paie: string
  salaire_de_base: number
  primes_fixes: number
  primes_variables: number
  cotisations_sociales: number
}

export interface Absence {
  matricule: string
  type_absence: string
  date_debut: string
  date_fin: string
}

export interface OrganisationRef {
  code_site: string
  nom_site: string
  code_cost_center: string
  nom_cost_center: string
}

export interface AbsenceRef {
  type_absence: string
  famille: string
  indemnise: boolean
  comptabilise_absenteisme: boolean
}

// Configuration
export const IMPORT_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  BATCH_SIZE: 100,
  REQUIRED_SHEETS: ['EMPLOYES', 'REMUNERATION', 'ABSENCES', 'REFERENTIEL_ORGANISATION', 'REFERENTIEL_ABSENCES'],
  VALID_CONTRACT_TYPES: ['CDI', 'CDD', 'Alternance', 'Stage', 'Intérim', 'Freelance', 'Apprentissage', 'Contrat Pro'],
  VALID_EMPLOYMENT_STATUS: ['Actif', 'Inactif', 'Suspendu', 'Congé parental', 'Congé sabbatique'],
  VALID_FAMILLE_ABSENCE: ['Congés', 'Maladie', 'Formation', 'Congés légaux', 'Accident', 'Familial', 'Autres']
} as const