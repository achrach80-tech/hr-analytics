import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { 
  normalizeDate, 
  normalizePeriod, 
  sanitizeString, 
  sanitizeNumber,
  generateBatchId 
} from '../processors/dataProcessors'

interface ImportProgress {
  phase: 'reading' | 'validating' | 'processing' | 'kpis' | 'completed'
  progress: number
  message: string
  detail?: string
}

export class OptimizedImportProcessor {
  private supabase = createClient()
  private jobId: string
  private batchSize = 500 // Increased batch size
  
  constructor(jobId: string) {
    this.jobId = jobId
  }

  async processImport(file: File, establishmentId: string) {
    const startTime = Date.now()
    
    try {
      // Phase 1: Read file with streaming
      await this.updateProgress('reading', 10, 'Reading file...')
      const workbook = await this.readFileOptimized(file)
      
      // Phase 2: Fast validation
      await this.updateProgress('validating', 25, 'Validating structure...')
      const validation = this.fastValidation(workbook)
      
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      
      // Phase 3: Optimized data processing
      await this.updateProgress('processing', 40, 'Processing data...')
      const result = await this.optimizedDataImport(workbook, establishmentId)
      
      // Phase 4: Parallel KPI calculation
      await this.updateProgress('kpis', 80, 'Calculating KPIs...')
      const snapshotsCalculated = await this.parallelKPICalculation(
        establishmentId, 
        result.periods
      )
      
      // Phase 5: Complete
      await this.updateProgress('completed', 100, 'Import completed!')
      
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        recordsImported: result.recordsImported,
        snapshotsCalculated,
        processingTime,
        batchId: result.batchId
      }
      
    } catch (error) {
      await this.updateProgress('reading', 0, 'Import failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  private async readFileOptimized(file: File): Promise<XLSX.WorkBook> {
    // Read file in chunks to reduce memory pressure
    const buffer = await file.arrayBuffer()
    
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellNF: false, // Skip number formatting for performance
      cellHTML: false, // Skip HTML for performance
      cellStyles: false, // Skip styles for performance
      sheetStubs: false // Skip empty cells
    })
    
    // Clean up buffer reference to help GC
    return workbook
  }

  private fastValidation(workbook: XLSX.WorkBook): { valid: boolean; error?: string } {
    const requiredSheets = ['EMPLOYES', 'REMUNERATION', 'ABSENCES', 'REFERENTIEL_ORGANISATION', 'REFERENTIEL_ABSENCES']
    const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet))
    
    if (missingSheets.length > 0) {
      return { valid: false, error: `Missing sheets: ${missingSheets.join(', ')}` }
    }
    
    // Quick row count validation
    const employeeSheet = workbook.Sheets['EMPLOYES']
    const range = XLSX.utils.decode_range(employeeSheet['!ref'] || 'A1')
    const rowCount = range.e.r - range.s.r
    
    if (rowCount > 50000) {
      return { valid: false, error: 'File too large. Maximum 50,000 employees per import.' }
    }
    
    return { valid: true }
  }

  private async optimizedDataImport(workbook: XLSX.WorkBook, establishmentId: string) {
    const batchId = generateBatchId()
    const periods = new Set<string>()
    let totalRecords = 0
    
    // Initialize batch record
    await this.supabase.from('import_batches').insert({
      id: batchId,
      etablissement_id: establishmentId,
      status: 'processing',
      job_id: this.jobId
    })

    try {
      // Process referentials first (small tables)
      await this.processReferentials(workbook, establishmentId)
      
      // Process employees with optimized bulk insert
      const employeeResult = await this.bulkInsertEmployees(workbook, establishmentId, batchId)
      totalRecords += employeeResult.count
      employeeResult.periods.forEach(p => periods.add(p))
      
      await this.updateProgress('processing', 55, 'Importing remunerations...')
      
      // Process remunerations
      const remResult = await this.bulkInsertRemunerations(workbook, establishmentId, batchId, employeeResult.employeeMap)
      totalRecords += remResult.count
      remResult.periods.forEach(p => periods.add(p))
      
      await this.updateProgress('processing', 70, 'Importing absences...')
      
      // Process absences
      const absResult = await this.bulkInsertAbsences(workbook, establishmentId, batchId)
      totalRecords += absResult.count
      
      // Update batch completion
      await this.supabase.from('import_batches').update({
        status: 'completed',
        nb_employes_imported: employeeResult.count,
        nb_remunerations_imported: remResult.count,
        nb_absences_imported: absResult.count,
        completed_at: new Date().toISOString()
      }).eq('id', batchId)
      
      return {
        batchId,
        recordsImported: {
          employees: employeeResult.count,
          remunerations: remResult.count,
          absences: absResult.count
        },
        periods: Array.from(periods)
      }
      
    } catch (error) {
      await this.supabase.from('import_batches').update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }).eq('id', batchId)
      throw error
    }
  }

  private async bulkInsertEmployees(workbook: XLSX.WorkBook, establishmentId: string, batchId: string) {
    const employeesData = XLSX.utils.sheet_to_json(workbook.Sheets['EMPLOYES'])
    const employeeMap = new Map<string, string>()
    const periods = new Set<string>()
    let processedCount = 0
    
    // Process in optimized batches
    for (let i = 0; i < employeesData.length; i += this.batchSize) {
      const batch = employeesData.slice(i, i + this.batchSize)
      
      const normalizedBatch = batch.map((emp: any) => {
        const periode = normalizePeriod(emp.periode)
        periods.add(periode)
        
        return {
          etablissement_id: establishmentId,
          matricule: sanitizeString(emp.matricule, 50),
          periode,
          sexe: emp.sexe || null,
          date_naissance: normalizeDate(emp.date_naissance),
          date_entree: normalizeDate(emp.date_entree) || '2020-01-01',
          date_sortie: normalizeDate(emp.date_sortie),
          type_contrat: emp.type_contrat || 'CDI',
          temps_travail: sanitizeNumber(emp.temps_travail, 1),
          intitule_poste: sanitizeString(emp.intitule_poste || 'Non spécifié'),
          code_cost_center: sanitizeString(emp.code_cost_center),
          code_site: sanitizeString(emp.code_site),
          statut_emploi: emp.statut_emploi || 'Actif',
          import_batch_id: batchId
        }
      })
      
      // Use single bulk insert with conflict resolution
      const { data: insertedEmployees, error } = await this.supabase
        .from('employes')
        .upsert(normalizedBatch, { 
          onConflict: 'etablissement_id,matricule,periode',
          count: 'exact'
        })
        .select('id, matricule, periode')
      
      if (error) throw error
      
      // Build employee mapping for foreign keys
      insertedEmployees?.forEach(emp => {
        employeeMap.set(`${emp.matricule}_${emp.periode}`, emp.id)
      })
      
      processedCount += batch.length
      const progress = 40 + Math.round((processedCount / employeesData.length) * 15)
      await this.updateProgress('processing', progress, `Imported ${processedCount}/${employeesData.length} employees`)
    }
    
    return {
      count: employeesData.length,
      employeeMap,
      periods: Array.from(periods)
    }
  }

  private async bulkInsertRemunerations(workbook: XLSX.WorkBook, establishmentId: string, batchId: string, employeeMap: Map<string, string>) {
    const remunerationsData = XLSX.utils.sheet_to_json(workbook.Sheets['REMUNERATION'])
    const periods = new Set<string>()
    let processedCount = 0
    
    for (let i = 0; i < remunerationsData.length; i += this.batchSize) {
      const batch = remunerationsData.slice(i, i + this.batchSize)
      
      const normalizedBatch = batch.map((rem: any) => {
        const periode = normalizePeriod(rem.mois_paie)
        periods.add(periode)
        
        return {
          etablissement_id: establishmentId,
          employe_id: employeeMap.get(`${rem.matricule}_${periode}`) || null,
          matricule: sanitizeString(rem.matricule, 50),
          mois_paie: periode,
          salaire_de_base: sanitizeNumber(rem.salaire_de_base),
          primes_fixes: sanitizeNumber(rem.primes_fixes),
          primes_variables: sanitizeNumber(rem.primes_variables),
          cotisations_sociales: sanitizeNumber(rem.cotisations_sociales),
          import_batch_id: batchId
        }
      })
      
      const { error } = await this.supabase
        .from('remunerations')
        .upsert(normalizedBatch, { onConflict: 'etablissement_id,matricule,mois_paie' })
      
      if (error) throw error
      
      processedCount += batch.length
      const progress = 55 + Math.round((processedCount / remunerationsData.length) * 15)
      await this.updateProgress('processing', progress, `Imported ${processedCount}/${remunerationsData.length} remunerations`)
    }
    
    return {
      count: remunerationsData.length,
      periods: Array.from(periods)
    }
  }

  private async bulkInsertAbsences(workbook: XLSX.WorkBook, establishmentId: string, batchId: string) {
    const absencesData = XLSX.utils.sheet_to_json(workbook.Sheets['ABSENCES'])
    let processedCount = 0
    
    for (let i = 0; i < absencesData.length; i += this.batchSize) {
      const batch = absencesData.slice(i, i + this.batchSize)
      
      const normalizedBatch = batch
        .filter((abs: any) => abs.date_debut) // Only valid absences
        .map((abs: any) => ({
          etablissement_id: establishmentId,
          matricule: sanitizeString(abs.matricule, 50),
          type_absence: sanitizeString(abs.type_absence, 100),
          date_debut: normalizeDate(abs.date_debut),
          date_fin: normalizeDate(abs.date_fin) || normalizeDate(abs.date_debut),
          import_batch_id: batchId
        }))
      
      if (normalizedBatch.length > 0) {
        const { error } = await this.supabase
          .from('absences')
          .upsert(normalizedBatch, { onConflict: 'etablissement_id,matricule,date_debut,type_absence' })
        
        if (error) throw error
      }
      
      processedCount += batch.length
    }
    
    return { count: absencesData.length }
  }

  private async processReferentials(workbook: XLSX.WorkBook, establishmentId: string) {
    // Process organization referential
    const orgData = XLSX.utils.sheet_to_json(workbook.Sheets['REFERENTIEL_ORGANISATION'])
    if (orgData.length > 0) {
      const normalizedOrg = orgData.map((org: any) => ({
        etablissement_id: establishmentId,
        code_site: sanitizeString(org.code_site, 20),
        nom_site: sanitizeString(org.nom_site),
        code_cost_center: sanitizeString(org.code_cost_center, 20),
        nom_cost_center: sanitizeString(org.nom_cost_center),
        is_active: true
      }))
      
      await this.supabase
        .from('referentiel_organisation')
        .upsert(normalizedOrg, { onConflict: 'etablissement_id,code_cost_center,code_site' })
    }
    
    // Process absence referential
    const absRefData = XLSX.utils.sheet_to_json(workbook.Sheets['REFERENTIEL_ABSENCES'])
    if (absRefData.length > 0) {
      const normalizedAbsRef = absRefData.map((ref: any) => ({
        etablissement_id: establishmentId,
        type_absence: sanitizeString(ref.type_absence, 100),
        famille: ref.famille || 'Autres',
        indemnise: Boolean(ref.indemnise),
        comptabilise_absenteisme: Boolean(ref.comptabilise_absenteisme),
        is_active: true
      }))
      
      await this.supabase
        .from('referentiel_absences')
        .upsert(normalizedAbsRef, { onConflict: 'etablissement_id,type_absence' })
    }
  }

  private async parallelKPICalculation(establishmentId: string, periods: string[]): Promise<number> {
    const maxConcurrent = 3 // Limit concurrent KPI calculations
    let successCount = 0
    
    // Process periods in batches to avoid overwhelming the database
    for (let i = 0; i < periods.length; i += maxConcurrent) {
      const batch = periods.slice(i, i + maxConcurrent)
      
      const promises = batch.map(async (period, index) => {
        try {
          const { error } = await this.supabase.rpc(
            'calculate_snapshot_for_period',
            {
              p_etablissement_id: establishmentId,
              p_periode: period,
              p_force: true
            }
          )
          
          if (!error) {
            successCount++
          }
          
          // Update progress
          const progress = 80 + Math.round(((i + index + 1) / periods.length) * 15)
          await this.updateProgress('kpis', progress, `KPI ${i + index + 1}/${periods.length} calculated`)
          
          return !error
        } catch (error) {
          console.error(`KPI calculation failed for period ${period}:`, error)
          return false
        }
      })
      
      await Promise.all(promises)
    }
    
    return successCount
  }

  private async updateProgress(phase: ImportProgress['phase'], progress: number, message: string, detail?: string) {
    await this.supabase.from('import_jobs').update({
      progress,
      status: phase === 'completed' ? 'completed' : 'processing',
      current_phase: phase,
      current_message: message,
      current_detail: detail,
      updated_at: new Date().toISOString()
    }).eq('id', this.jobId)
  }
}