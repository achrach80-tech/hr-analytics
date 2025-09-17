// ==========================================
// VALIDATION ENGINE
// ==========================================

import { 
  ValidationError, 
  ValidationResult, 
  ProcessedData,
  IMPORT_CONFIG 
} from '../types'

export class ValidationEngine {
  private errors: ValidationError[] = []
  private warnings: ValidationError[] = []
  private idCounter = 0

  /**
   * Main validation entry point
   */
  validate(data: ProcessedData): ValidationResult {
    this.reset()
    
    // Run all validation rules
    this.validateEmployees(data.employees)
    this.validateRemunerations(data.remunerations, data.employees)
    this.validateAbsences(data.absences, data.employees)
    this.validateReferentials(data.referentiel_organisation, data.referentiel_absences)
    this.validateDataConsistency(data)
    
    return this.buildResult()
  }

  /**
   * Reset validation state
   */
  private reset() {
    this.errors = []
    this.warnings = []
    this.idCounter = 0
  }

  /**
   * Validate employee data
   */
  private validateEmployees(employees: any[]) {
    employees.forEach((emp, index) => {
      const row = index + 2 // Excel row number
      
      // Critical validations
      if (!emp.matricule) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'A',
          field: 'matricule',
          value: emp.matricule,
          message: 'Matricule obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!emp.periode) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'B', 
          field: 'periode',
          value: emp.periode,
          message: 'Période obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!emp.date_entree) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'E',
          field: 'date_entree',
          value: emp.date_entree,
          message: 'Date d\'entrée obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!emp.intitule_poste) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'I',
          field: 'intitule_poste',
          value: emp.intitule_poste,
          message: 'Intitulé de poste obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      // Warning validations
      if (emp.type_contrat && !IMPORT_CONFIG.VALID_CONTRACT_TYPES.includes(emp.type_contrat)) {
        this.addWarning({
          sheet: 'EMPLOYES',
          row,
          column: 'G',
          field: 'type_contrat',
          value: emp.type_contrat,
          message: `Type de contrat non standard: ${emp.type_contrat}`,
          severity: 'warning',
          canIgnore: true
        })
      }
      
      if (emp.statut_emploi && !IMPORT_CONFIG.VALID_EMPLOYMENT_STATUS.includes(emp.statut_emploi)) {
        this.addWarning({
          sheet: 'EMPLOYES',
          row,
          column: 'K',
          field: 'statut_emploi',
          value: emp.statut_emploi,
          message: `Statut d'emploi non standard: ${emp.statut_emploi}`,
          severity: 'warning',
          canIgnore: true
        })
      }
      
      // Date consistency checks
      if (emp.date_entree && emp.date_sortie && emp.date_sortie < emp.date_entree) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'F',
          field: 'date_sortie',
          value: emp.date_sortie,
          message: 'Date de sortie antérieure à la date d\'entrée',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      // Temps de travail validation
      if (emp.temps_travail && (emp.temps_travail <= 0 || emp.temps_travail > 1)) {
        this.addError({
          sheet: 'EMPLOYES',
          row,
          column: 'H',
          field: 'temps_travail',
          value: emp.temps_travail,
          message: 'Temps de travail doit être entre 0 et 1',
          severity: 'critical',
          canIgnore: false
        })
      }
    })
  }

  /**
   * Validate remuneration data
   */
  private validateRemunerations(remunerations: any[], employees: any[]) {
    const employeeKeys = new Set(employees.map(e => `${e.matricule}_${e.periode}`))
    
    remunerations.forEach((rem, index) => {
      const row = index + 2
      const key = `${rem.matricule}_${rem.mois_paie}`
      
      // Check if employee exists
      if (!employeeKeys.has(key)) {
        this.addWarning({
          sheet: 'REMUNERATION',
          row,
          column: 'A',
          field: 'matricule',
          value: rem.matricule,
          message: `Rémunération pour employé/période non trouvé: ${key}`,
          severity: 'warning',
          canIgnore: true
        })
      }
      
      // Validate amounts
      const amounts = ['salaire_de_base', 'primes_fixes', 'primes_variables', 'cotisations_sociales']
      amounts.forEach((field, idx) => {
        if (rem[field] && rem[field] < 0) {
          this.addError({
            sheet: 'REMUNERATION',
            row,
            column: String.fromCharCode(67 + idx), // C, D, E, F
            field,
            value: rem[field],
            message: `${field} ne peut pas être négatif`,
            severity: 'critical',
            canIgnore: false
          })
        }
      })
    })
  }

  /**
   * Validate absence data
   */
  private validateAbsences(absences: any[], employees: any[]) {
    const employeeMatricules = new Set(employees.map(e => e.matricule))
    
    absences.forEach((abs, index) => {
      const row = index + 2
      
      // Check if employee exists
      if (!employeeMatricules.has(abs.matricule)) {
        this.addWarning({
          sheet: 'ABSENCES',
          row,
          column: 'A',
          field: 'matricule',
          value: abs.matricule,
          message: `Absence pour employé non trouvé: ${abs.matricule}`,
          severity: 'warning',
          canIgnore: true
        })
      }
      
      // Date validations
      if (!abs.date_debut) {
        this.addError({
          sheet: 'ABSENCES',
          row,
          column: 'C',
          field: 'date_debut',
          value: abs.date_debut,
          message: 'Date de début d\'absence obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!abs.date_fin) {
        this.addError({
          sheet: 'ABSENCES',
          row,
          column: 'D',
          field: 'date_fin',
          value: abs.date_fin,
          message: 'Date de fin d\'absence obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (abs.date_debut && abs.date_fin && abs.date_fin < abs.date_debut) {
        this.addError({
          sheet: 'ABSENCES',
          row,
          column: 'D',
          field: 'date_fin',
          value: abs.date_fin,
          message: 'Date de fin antérieure à la date de début',
          severity: 'critical',
          canIgnore: false
        })
      }
    })
  }

  /**
   * Validate referential data
   */
  private validateReferentials(orgRefs: any[], absRefs: any[]) {
    // Organisation referentials
    orgRefs.forEach((org, index) => {
      const row = index + 2
      
      if (!org.code_site) {
        this.addError({
          sheet: 'REFERENTIEL_ORGANISATION',
          row,
          column: 'A',
          field: 'code_site',
          value: org.code_site,
          message: 'Code site obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (!org.code_cost_center) {
        this.addError({
          sheet: 'REFERENTIEL_ORGANISATION',
          row,
          column: 'C',
          field: 'code_cost_center',
          value: org.code_cost_center,
          message: 'Code centre de coût obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
    })
    
    // Absence referentials
    absRefs.forEach((abs, index) => {
      const row = index + 2
      
      if (!abs.type_absence) {
        this.addError({
          sheet: 'REFERENTIEL_ABSENCES',
          row,
          column: 'A',
          field: 'type_absence',
          value: abs.type_absence,
          message: 'Type d\'absence obligatoire',
          severity: 'critical',
          canIgnore: false
        })
      }
      
      if (abs.famille && !IMPORT_CONFIG.VALID_FAMILLE_ABSENCE.includes(abs.famille)) {
        this.addWarning({
          sheet: 'REFERENTIEL_ABSENCES',
          row,
          column: 'B',
          field: 'famille',
          value: abs.famille,
          message: `Famille d'absence non standard: ${abs.famille}`,
          severity: 'warning',
          canIgnore: true
        })
      }
    })
  }

  /**
   * Validate data consistency across sheets
   */
  private validateDataConsistency(data: ProcessedData) {
    // Check for duplicate employees in same period
    const employeeKeys = new Map<string, number>()
    data.employees.forEach((emp, index) => {
      const key = `${emp.matricule}_${emp.periode}`
      if (employeeKeys.has(key)) {
        this.addError({
          sheet: 'EMPLOYES',
          row: index + 2,
          column: 'A',
          field: 'matricule',
          value: emp.matricule,
          message: `Employé en double pour la période ${emp.periode}`,
          severity: 'critical',
          canIgnore: false
        })
      }
      employeeKeys.set(key, index)
    })
    
    // Check metadata consistency
    if (data.metadata.totalEmployees !== data.employees.length) {
      this.addWarning({
        sheet: 'METADATA',
        row: 0,
        column: 'A',
        field: 'totalEmployees',
        value: data.metadata.totalEmployees,
        message: 'Incohérence dans le décompte des employés',
        severity: 'warning',
        canIgnore: true
      })
    }
  }

  /**
   * Add error to collection
   */
  private addError(error: Omit<ValidationError, 'id'>) {
    this.errors.push({
      id: `err_${++this.idCounter}`,
      ...error
    })
  }

  /**
   * Add warning to collection
   */
  private addWarning(warning: Omit<ValidationError, 'id'>) {
    this.warnings.push({
      id: `warn_${++this.idCounter}`,
      ...warning
    })
  }

  /**
   * Build final validation result
   */
  private buildResult(): ValidationResult {
    const totalErrors = this.errors.length
    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length
    const warningCount = this.warnings.length
    const qualityScore = Math.max(0, 100 - (criticalErrors * 10) - (warningCount * 2))
    
    return {
      isValid: criticalErrors === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors,
        criticalErrors,
        warningCount,
        canProceed: criticalErrors === 0,
        qualityScore
      }
    }
  }
}