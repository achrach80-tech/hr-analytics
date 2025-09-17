// ==========================================
// IMPORT ORCHESTRATOR
// ==========================================

import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { 
  ProcessedData, 
  ImportProgress, 
  ImportResult, 
  ValidationResult,
  ImportMetadata,
  IMPORT_CONFIG 
} from '../types'
import { 
  normalizeDate, 
  normalizePeriod, 
  normalizeFamilleAbsence,
  sanitizeString, 
  sanitizeNumber, 
  parseBoolean, 
  generateBatchId,
  calculateFileHash 
} from '../processors/dataProcessors'
import { ValidationEngine } from '../validators/validationEngine'

export class ImportOrchestrator {
  private supabase = createClient()
  private validationEngine = new ValidationEngine()
  private progressCallback?: (progress: ImportProgress) => void
  private logCallback?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  private abortController?: AbortController

  constructor(
    progressCallback?: (progress: ImportProgress) => void,
    logCallback?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  ) {
    this.progressCallback = progressCallback
    this.logCallback = logCallback
  }

  /**
   * Main orchestration method
   */
  async processImport(
    file: File, 
    establishmentId: string
  ): Promise<ImportResult> {
    this.abortController = new AbortController()
    const startTime = Date.now()
    
    try {
      this.log('Début de l\'import', 'info')
      
      // Phase 1: File Analysis
      this.updateProgress('validation', 'Analyse du fichier', 5, 100, 'Lecture du fichier...')
      const processedData = await this.analyzeFile(file)
      
      // Phase 2: Validation
      this.updateProgress('validation', 'Validation des données', 20, 100, 'Vérification des données...')
      const validationResult = this.validationEngine.validate(processedData)
      
      if (!validationResult.summary.canProceed) {
        throw new Error(`Erreurs critiques détectées: ${validationResult.summary.criticalErrors}`)
      }
      
      // Phase 3: Database Import
      this.updateProgress('processing', 'Import en base', 40, 100, 'Sauvegarde des données...')
      const batchId = await this.importToDatabase(processedData, establishmentId, file)
      
      // Phase 4: KPI Calculation
      this.updateProgress('snapshots', 'Calcul des KPIs', 80, 100, 'Génération des indicateurs...')
      const snapshotsCalculated = await this.calculateKPIs(establishmentId, processedData.metadata.periods)
      
      // Phase 5: Completion
      this.updateProgress('completion', 'Import terminé', 100, 100, 'Finalisation...')
      
      const processingTime = Date.now() - startTime
      this.log(`Import terminé avec succès en ${(processingTime / 1000).toFixed(1)}s`, 'success')
      
      return {
        success: true,
        batchId,
        recordsImported: {
          employees: processedData.employees.length,
          remunerations: processedData.remunerations.length,
          absences: processedData.absences.length
        },
        snapshotsCalculated,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        processingTime
      }
      
    } catch (error) {
      this.log(`Erreur d'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error')
      throw error
    }
  }

  /**
   * Cancel the import process
   */
  cancelImport() {
    this.abortController?.abort()
    this.log('Import annulé par l\'utilisateur', 'warning')
  }

  /**
   * Analyze uploaded file and extract data
   */
  private async analyzeFile(file: File): Promise<ProcessedData> {
    this.checkAbort()
    
    // Read file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd'
    })
    
    // Check required sheets
    const missingSheets = IMPORT_CONFIG.REQUIRED_SHEETS.filter(
      sheet => !workbook.SheetNames.includes(sheet)
    )
    
    if (missingSheets.length > 0) {
      throw new Error(`Onglets manquants: ${missingSheets.join(', ')}`)
    }
    
    this.log('Structure du fichier validée', 'success')
    
    // Extract raw data
    const rawData = {
      employees: XLSX.utils.sheet_to_json(workbook.Sheets['EMPLOYES'], { defval: null }),
      remunerations: XLSX.utils.sheet_to_json(workbook.Sheets['REMUNERATION'], { defval: null }),
      absences: XLSX.utils.sheet_to_json(workbook.Sheets['ABSENCES'], { defval: null }),
      referentiel_organisation: XLSX.utils.sheet_to_json(workbook.Sheets['REFERENTIEL_ORGANISATION'], { defval: null }),
      referentiel_absences: XLSX.utils.sheet_to_json(workbook.Sheets['REFERENTIEL_ABSENCES'], { defval: null })
    }
    
    // Normalize data
    return this.normalizeData(rawData, file)
  }

  /**
   * Normalize extracted data
   */
  private normalizeData(rawData: any, file: File): ProcessedData {
    this.checkAbort()
    
    // Normalize employees
    const employees = rawData.employees.map((emp: any) => ({
      ...emp,
      periode: normalizePeriod(emp.periode),
      date_entree: normalizeDate(emp.date_entree),
      date_sortie: normalizeDate(emp.date_sortie),
      date_naissance: normalizeDate(emp.date_naissance),
      type_contrat: emp.type_contrat || 'CDI',
      temps_travail: sanitizeNumber(emp.temps_travail, 1),
      statut_emploi: emp.statut_emploi || 'Actif',
      intitule_poste: sanitizeString(emp.intitule_poste || 'Non spécifié'),
      matricule: sanitizeString(emp.matricule, 50)
    }))
    
    // Normalize remunerations
    const remunerations = rawData.remunerations.map((rem: any) => ({
      ...rem,
      matricule: sanitizeString(rem.matricule, 50),
      mois_paie: normalizePeriod(rem.mois_paie),
      salaire_de_base: sanitizeNumber(rem.salaire_de_base),
      primes_fixes: sanitizeNumber(rem.primes_fixes),
      primes_variables: sanitizeNumber(rem.primes_variables),
      cotisations_sociales: sanitizeNumber(rem.cotisations_sociales)
    }))
    
    // Normalize absences
    const absences = rawData.absences.map((abs: any) => ({
      ...abs,
      matricule: sanitizeString(abs.matricule, 50),
      type_absence: sanitizeString(abs.type_absence, 100),
      date_debut: normalizeDate(abs.date_debut),
      date_fin: normalizeDate(abs.date_fin) || normalizeDate(abs.date_debut)
    }))
    
    // Normalize referentials
    const referentiel_absences = rawData.referentiel_absences.map((ref: any) => ({
      ...ref,
      type_absence: sanitizeString(ref.type_absence, 100),
      famille: normalizeFamilleAbsence(ref.famille),
      indemnise: parseBoolean(ref.indemnise),
      comptabilise_absenteisme: parseBoolean(ref.comptabilise_absenteisme)
    }))
    
    // Generate metadata with explicit typing
    const allPeriods: any[] = [
      ...employees.map((e: any) => e.periode),
      ...remunerations.map((r: any) => r.mois_paie)
    ]
    const periods: string[] = [...new Set(allPeriods)]
      .filter((p: any): p is string => Boolean(p) && typeof p === 'string')
      .sort()
    
    const allSites: any[] = employees.map((e: any) => e.code_site)
    const validSites: string[] = allSites.filter((site: any): site is string => 
      Boolean(site) && typeof site === 'string' && site.trim().length > 0
    )
    const establishments: string[] = [...new Set(validSites)]
    
    const metadata: ImportMetadata = {
      periods,
      totalEmployees: employees.length,
      totalRecords: employees.length + remunerations.length + absences.length,
      establishments,
      fileInfo: {
        name: file.name,
        size: file.size
      }
    }
    
    this.log(`Données extraites: ${employees.length} employés, ${remunerations.length} rémunérations`, 'info')
    
    return {
      employees,
      remunerations,
      absences,
      referentiel_organisation: rawData.referentiel_organisation,
      referentiel_absences,
      metadata
    }
  }

  /**
   * Import data to database
   */
  private async importToDatabase(
    data: ProcessedData, 
    establishmentId: string, 
    file: File
  ): Promise<string> {
    this.checkAbort()
    
    const batchId = generateBatchId()
    const { employees, remunerations, absences, referentiel_organisation, referentiel_absences } = data
    
    // Initialize batch record
    await this.supabase.from('import_batches').insert({
      id: batchId,
      etablissement_id: establishmentId,
      file_name: file.name,
      file_size_bytes: file.size,
      status: 'processing',
      periods_imported: data.metadata.periods
    })
    
    try {
      // Import referentials first
      await this.importReferentials(establishmentId, referentiel_organisation, referentiel_absences)
      
      // Import main data
      const employeeMap = await this.importEmployees(establishmentId, employees, batchId)
      await this.importRemunerations(establishmentId, remunerations, employeeMap, batchId)
      await this.importAbsences(establishmentId, absences, batchId)
      
      // Update batch status
      await this.supabase.from('import_batches').update({
        status: 'completed',
        nb_employes_imported: employees.length,
        nb_remunerations_imported: remunerations.length,
        nb_absences_imported: absences.length,
        completed_at: new Date().toISOString()
      }).eq('id', batchId)
      
      return batchId
      
    } catch (error) {
      // Mark batch as failed
      await this.supabase.from('import_batches').update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }).eq('id', batchId)
      
      throw error
    }
  }

  /**
   * Import referential data
   */
  private async importReferentials(
    establishmentId: string,
    orgRefs: any[],
    absRefs: any[]
  ) {
    if (orgRefs.length > 0) {
      const orgData = orgRefs.map(org => ({
        etablissement_id: establishmentId,
        code_site: sanitizeString(org.code_site, 20),
        nom_site: sanitizeString(org.nom_site),
        code_cost_center: sanitizeString(org.code_cost_center, 20),
        nom_cost_center: sanitizeString(org.nom_cost_center),
        is_active: true
      }))
      
      const { error } = await this.supabase
        .from('referentiel_organisation')
        .upsert(orgData, { onConflict: 'etablissement_id,code_cost_center,code_site' })
      
      if (error) throw error
      this.log('Référentiel organisation importé', 'success')
    }
    
    if (absRefs.length > 0) {
      const absData = absRefs.map(abs => ({
        etablissement_id: establishmentId,
        type_absence: sanitizeString(abs.type_absence, 100),
        famille: abs.famille,
        indemnise: abs.indemnise,
        comptabilise_absenteisme: abs.comptabilise_absenteisme,
        is_active: true
      }))
      
      const { error } = await this.supabase
        .from('referentiel_absences')
        .upsert(absData, { onConflict: 'etablissement_id,type_absence' })
      
      if (error) throw error
      this.log('Référentiel absences importé', 'success')
    }
  }

  /**
   * Import employees in batches
   */
  private async importEmployees(
    establishmentId: string,
    employees: any[],
    batchId: string
  ): Promise<Map<string, string>> {
    const employeeMap = new Map<string, string>()
    
    for (let i = 0; i < employees.length; i += IMPORT_CONFIG.BATCH_SIZE) {
      this.checkAbort()
      
      const batch = employees.slice(i, i + IMPORT_CONFIG.BATCH_SIZE)
      const employeesData = batch.map(emp => ({
        etablissement_id: establishmentId,
        matricule: emp.matricule,
        periode: emp.periode,
        sexe: emp.sexe || null,
        date_naissance: emp.date_naissance,
        date_entree: emp.date_entree,
        date_sortie: emp.date_sortie,
        type_contrat: emp.type_contrat,
        temps_travail: emp.temps_travail,
        intitule_poste: emp.intitule_poste,
        code_cost_center: sanitizeString(emp.code_cost_center),
        code_site: sanitizeString(emp.code_site),
        statut_emploi: emp.statut_emploi,
        import_batch_id: batchId
      }))
      
      const { data: insertedEmployees, error } = await this.supabase
        .from('employes')
        .upsert(employeesData, { onConflict: 'etablissement_id,matricule,periode' })
        .select('id, matricule, periode')
      
      if (error) throw error
      
      // Build employee map for FK relationships
      insertedEmployees?.forEach(emp => {
        employeeMap.set(`${emp.matricule}_${emp.periode}`, emp.id)
      })
      
      const processed = Math.min(i + IMPORT_CONFIG.BATCH_SIZE, employees.length)
      this.updateProgress(
        'processing',
        'Import des employés',
        40 + Math.round((processed / employees.length) * 20),
        100,
        `${processed}/${employees.length} employés`
      )
    }
    
    this.log(`${employees.length} employés importés`, 'success')
    return employeeMap
  }

  /**
   * Import remunerations
   */
  private async importRemunerations(
    establishmentId: string,
    remunerations: any[],
    employeeMap: Map<string, string>,
    batchId: string
  ) {
    for (let i = 0; i < remunerations.length; i += IMPORT_CONFIG.BATCH_SIZE) {
      this.checkAbort()
      
      const batch = remunerations.slice(i, i + IMPORT_CONFIG.BATCH_SIZE)
      const remunerationsData = batch.map(rem => ({
        etablissement_id: establishmentId,
        employe_id: employeeMap.get(`${rem.matricule}_${rem.mois_paie}`) || null,
        matricule: rem.matricule,
        mois_paie: rem.mois_paie,
        salaire_de_base: rem.salaire_de_base,
        primes_fixes: rem.primes_fixes,
        primes_variables: rem.primes_variables,
        cotisations_sociales: rem.cotisations_sociales,
        import_batch_id: batchId
      }))
      
      const { error } = await this.supabase
        .from('remunerations')
        .upsert(remunerationsData, { onConflict: 'etablissement_id,matricule,mois_paie' })
      
      if (error) throw error
      
      const processed = Math.min(i + IMPORT_CONFIG.BATCH_SIZE, remunerations.length)
      this.updateProgress(
        'processing',
        'Import des rémunérations',
        60 + Math.round((processed / remunerations.length) * 10),
        100,
        `${processed}/${remunerations.length} rémunérations`
      )
    }
    
    this.log(`${remunerations.length} rémunérations importées`, 'success')
  }

  /**
   * Import absences
   */
  private async importAbsences(
    establishmentId: string,
    absences: any[],
    batchId: string
  ) {
    if (absences.length === 0) return
    
    for (let i = 0; i < absences.length; i += IMPORT_CONFIG.BATCH_SIZE) {
      this.checkAbort()
      
      const batch = absences.slice(i, i + IMPORT_CONFIG.BATCH_SIZE)
      const absencesData = batch.filter(abs => abs.date_debut).map(abs => ({
        etablissement_id: establishmentId,
        matricule: abs.matricule,
        type_absence: abs.type_absence,
        date_debut: abs.date_debut,
        date_fin: abs.date_fin,
        import_batch_id: batchId
      }))
      
      if (absencesData.length > 0) {
        const { error } = await this.supabase
          .from('absences')
          .upsert(absencesData, { onConflict: 'etablissement_id,matricule,date_debut,type_absence' })
        
        if (error) throw error
      }
      
      const processed = Math.min(i + IMPORT_CONFIG.BATCH_SIZE, absences.length)
      this.updateProgress(
        'processing',
        'Import des absences',
        70 + Math.round((processed / absences.length) * 10),
        100,
        `${processed}/${absences.length} absences`
      )
    }
    
    this.log(`${absences.length} absences importées`, 'success')
  }

  /**
   * Calculate KPIs for imported periods
   */
  private async calculateKPIs(establishmentId: string, periods: string[]): Promise<number> {
    let successCount = 0
    
    for (let idx = 0; idx < periods.length; idx++) {
      this.checkAbort()
      
      const period = normalizePeriod(periods[idx])
      
      this.updateProgress(
        'snapshots',
        'Calcul des KPIs',
        80 + Math.round((idx / periods.length) * 15),
        100,
        `Période ${idx + 1}/${periods.length}: ${period}`
      )
      
      try {
        const { data, error } = await this.supabase.rpc(
          'calculate_snapshot_for_period',
          {
            p_etablissement_id: establishmentId,
            p_periode: period,
            p_force: true
          }
        )
        
        if (error) {
          this.log(`⚠️ Erreur KPI ${period}: ${error.message}`, 'warning')
        } else {
          this.log(`✅ KPIs calculés pour ${period}`, 'success')
          successCount++
        }
      } catch (error) {
        this.log(`❌ Erreur KPI ${period}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error')
      }
    }
    
    return successCount
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    phase: ImportProgress['phase'],
    step: string,
    current: number,
    total: number,
    message: string,
    detail?: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        step,
        current,
        total,
        percentage: Math.round((current / total) * 100),
        message,
        detail
      })
    }
  }

  /**
   * Log message callback
   */
  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    if (this.logCallback) {
      this.logCallback(message, type)
    }
  }

  /**
   * Check if operation was aborted
   */
  private checkAbort() {
    if (this.abortController?.signal.aborted) {
      throw new Error('Import annulé')
    }
  }
}