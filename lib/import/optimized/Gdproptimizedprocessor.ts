import { createClient } from '@/lib/supabase/client'
import type { 
  ProcessedData, 
  ImportProgress, 
  LogType,
  EmployeeData,
  RemunerationData,
  AbsenceData
} from '../types'

/**
 * 🔒 GDPR-OPTIMIZED PROCESSOR
 * 
 * This processor:
 * 1. Reads Excel data
 * 2. Calculates aggregated KPIs in memory
 * 3. Stores ONLY snapshots (no individual data)
 * 4. Discards all PII immediately
 * 
 * NO individual employee data is ever stored in the database.
 */
export class GDPROptimizedProcessor {
  private supabase = createClient()
  private isAborted = false

  async processImport(
    data: ProcessedData,
    establishmentId: string,
    fileName: string,
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    const batchId = `GDPR-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    try {
      onLog(`🔒 GDPR-Friendly Import: ${data.metadata.totalRecords} records → Aggregated KPIs`, 'info')
      onLog(`📊 Processing ${data.metadata.periods.length} periods`, 'info')

      // Step 1: Calculate snapshots directly from Excel data
      const snapshots = await this.calculateSnapshotsFromRawData(
        establishmentId, 
        data, 
        batchId,
        onProgress, 
        onLog
      )

      // Step 2: Insert snapshots into database
      await this.insertSnapshots(establishmentId, snapshots, batchId, onProgress, onLog)

      // Step 3: Calculate payroll effects (prix/volume/mix)
      await this.calculatePayrollEffects(establishmentId, data.metadata.periods, onProgress, onLog)

      // Step 4: Create import batch record
      await this.createImportBatch(establishmentId, fileName, data, batchId)

      onProgress({
        phase: 'completion',
        step: 'IMPORT COMPLETE',
        current: 100,
        total: 100,
        percentage: 100,
        message: `${snapshots.length} snapshots created (No PII stored)`
      })

      onLog(`✅ Mission accomplished: ${snapshots.length} snapshots created`, 'success')
      onLog(`🔒 Zero individual records stored (GDPR-compliant)`, 'success')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onLog(`❌ FATAL ERROR: ${errorMessage}`, 'error')
      throw new Error(`GDPR Import failed: ${errorMessage}`)
    }
  }

  /**
   * Calculate aggregated KPIs directly from raw Excel data
   * All calculations happen in memory, no individual data stored
   */
  private async calculateSnapshotsFromRawData(
    establishmentId: string,
    data: ProcessedData,
    batchId: string,
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<any[]> {
    
    onProgress({
      phase: 'processing',
      step: 'Calculating KPIs from raw data',
      current: 10,
      total: 100,
      percentage: 10,
      message: 'Analyzing Excel data in memory...'
    })

    const snapshots: any[] = []
    const periods = data.metadata.periods

    for (let i = 0; i < periods.length; i++) {
      if (this.isAborted) throw new Error('Import cancelled')

      const period = this.normalizePeriod(periods[i])
      
      onProgress({
        phase: 'processing',
        step: 'Calculating KPIs',
        current: 10 + Math.round((i / periods.length) * 70),
        total: 100,
        percentage: 10 + Math.round((i / periods.length) * 70),
        message: `Period ${i + 1}/${periods.length}`,
        detail: period
      })

      onLog(`📊 Calculating KPIs for ${period}...`, 'info')

      // Filter data for this period
      const periodEmployees = data.employees.filter(emp => 
        this.normalizePeriod(emp.periode) === period
      )
      const periodRemunerations = data.remunerations.filter(rem =>
        this.normalizePeriod(rem.mois_paie) === period
      )
      const periodAbsences = data.absences.filter(abs => {
        const absDate = new Date(abs.date_debut)
        const periodDate = new Date(period)
        return absDate.getFullYear() === periodDate.getFullYear() &&
               absDate.getMonth() === periodDate.getMonth()
      })

      // Calculate all KPIs
      const snapshot = this.calculateKPIsForPeriod(
        period,
        periodEmployees,
        periodRemunerations,
        periodAbsences,
        establishmentId,
        batchId
      )

      snapshots.push(snapshot)
      
      onLog(`✅ KPIs calculated for ${period}: ${snapshot.effectif_fin_mois} EMP, ${snapshot.etp_fin_mois?.toFixed(1)} FTE`, 'success')
    }

    onLog(`🎯 Total: ${snapshots.length} snapshots calculated`, 'success')
    
    return snapshots
  }

  /**
   * Calculate all KPIs for a single period
   * Pure calculation function - no database access
   */
  private calculateKPIsForPeriod(
    period: string,
    employees: EmployeeData[],
    remunerations: RemunerationData[],
    absences: AbsenceData[],
    establishmentId: string,
    batchId: string
  ): any {
    
    // WORKFORCE METRICS
    const activeEmployees = employees.filter(e => e.statut_emploi === 'Actif')
    const effectif_fin_mois = activeEmployees.length
    const etp_fin_mois = activeEmployees.reduce((sum, e) => sum + (e.temps_travail || 1), 0)

    // Calculate entries/exits for this period
    const periodDate = new Date(period)
    const nb_entrees = employees.filter(e => {
      if (!e.date_entree) return false
      const entryDate = new Date(e.date_entree)
      return entryDate.getFullYear() === periodDate.getFullYear() &&
             entryDate.getMonth() === periodDate.getMonth()
    }).length

    const nb_sorties = employees.filter(e => {
      if (!e.date_sortie) return false
      const exitDate = new Date(e.date_sortie)
      return exitDate.getFullYear() === periodDate.getFullYear() &&
             exitDate.getMonth() === periodDate.getMonth()
    }).length

    // CONTRACT TYPES
    const nb_cdi = activeEmployees.filter(e => e.type_contrat === 'CDI').length
    const nb_cdd = activeEmployees.filter(e => e.type_contrat === 'CDD').length
    const nb_alternance = activeEmployees.filter(e => 
      e.type_contrat === 'Alternance' || e.type_contrat === 'Apprentissage'
    ).length
    const nb_stage = activeEmployees.filter(e => e.type_contrat === 'Stage').length

    const pct_cdi = effectif_fin_mois > 0 ? Math.round((nb_cdi / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_cdd = effectif_fin_mois > 0 ? Math.round((nb_cdd / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_alternance = effectif_fin_mois > 0 ? Math.round((nb_alternance / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_stage = effectif_fin_mois > 0 ? Math.round((nb_stage / effectif_fin_mois) * 100 * 100) / 100 : 0

    // DEMOGRAPHICS
    const ages = activeEmployees.map(e => {
      if (!e.date_naissance) return null
      return periodDate.getFullYear() - new Date(e.date_naissance).getFullYear()
    }).filter(a => a !== null) as number[]

    const age_moyen = ages.length > 0 
      ? Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length * 10) / 10
      : 0

    const seniorityMonths = activeEmployees.map(e => {
      if (!e.date_entree) return 0
      const entryDate = new Date(e.date_entree)
      return (periodDate.getFullYear() - entryDate.getFullYear()) * 12 +
             (periodDate.getMonth() - entryDate.getMonth())
    })

    const anciennete_moyenne_mois = seniorityMonths.length > 0
      ? Math.round(seniorityMonths.reduce((sum, m) => sum + m, 0) / seniorityMonths.length * 10) / 10
      : 0

    const males = activeEmployees.filter(e => e.sexe === 'M').length
    const females = activeEmployees.filter(e => e.sexe === 'F').length
    const pct_hommes = effectif_fin_mois > 0 ? Math.round((males / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_femmes = effectif_fin_mois > 0 ? Math.round((females / effectif_fin_mois) * 100 * 100) / 100 : 0

    // AGE PYRAMID
    const pct_age_moins_25 = effectif_fin_mois > 0 
      ? Math.round((ages.filter(a => a < 25).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_age_25_35 = effectif_fin_mois > 0
      ? Math.round((ages.filter(a => a >= 25 && a < 35).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_age_35_45 = effectif_fin_mois > 0
      ? Math.round((ages.filter(a => a >= 35 && a < 45).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_age_45_55 = effectif_fin_mois > 0
      ? Math.round((ages.filter(a => a >= 45 && a < 55).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_age_plus_55 = effectif_fin_mois > 0
      ? Math.round((ages.filter(a => a >= 55).length / effectif_fin_mois) * 100 * 100) / 100 : 0

    // SENIORITY PYRAMID
    const pct_anciennete_0_1_an = effectif_fin_mois > 0
      ? Math.round((seniorityMonths.filter(m => m < 12).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_anciennete_1_3_ans = effectif_fin_mois > 0
      ? Math.round((seniorityMonths.filter(m => m >= 12 && m < 36).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_anciennete_3_5_ans = effectif_fin_mois > 0
      ? Math.round((seniorityMonths.filter(m => m >= 36 && m < 60).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_anciennete_5_10_ans = effectif_fin_mois > 0
      ? Math.round((seniorityMonths.filter(m => m >= 60 && m < 120).length / effectif_fin_mois) * 100 * 100) / 100 : 0
    const pct_anciennete_plus_10_ans = effectif_fin_mois > 0
      ? Math.round((seniorityMonths.filter(m => m >= 120).length / effectif_fin_mois) * 100 * 100) / 100 : 0

    // PAYROLL METRICS
    const masse_salariale_brute = remunerations.reduce((sum, r) => {
      return sum + (r.salaire_de_base || 0) + (r.primes_fixes || 0) + 
             (r.primes_variables || 0) + (r.primes_exceptionnelles || 0) +
             (r.heures_supp_payees || 0) + (r.avantages_nature || 0) + (r.indemnites || 0)
    }, 0)

    const total_charges = remunerations.reduce((sum, r) => {
      return sum + (r.cotisations_sociales || 0) + (r.taxes_sur_salaire || 0) + (r.autres_charges || 0)
    }, 0)

    const cout_total_employeur = masse_salariale_brute + total_charges

    const salaire_base_moyen = remunerations.length > 0
      ? Math.round(remunerations.reduce((sum, r) => sum + (r.salaire_de_base || 0), 0) / remunerations.length * 100) / 100
      : 0

    const cout_moyen_par_fte = etp_fin_mois > 0
      ? Math.round((cout_total_employeur / etp_fin_mois) * 100) / 100
      : 0

    const primes_variables_total = remunerations.reduce((sum, r) => sum + (r.primes_variables || 0), 0)
    const part_variable = masse_salariale_brute > 0
      ? Math.round((primes_variables_total / masse_salariale_brute) * 100 * 100) / 100
      : 0

    const taux_charges = masse_salariale_brute > 0
      ? Math.round((total_charges / masse_salariale_brute) * 100 * 100) / 100
      : 0

    // ABSENCE METRICS
    const nb_jours_absence = absences.reduce((sum, a) => {
      if (!a.date_debut || !a.date_fin) return sum
      const debut = new Date(a.date_debut)
      const fin = new Date(a.date_fin)
      const diffTime = Math.abs(fin.getTime() - debut.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return sum + diffDays
    }, 0)

    const nb_absences_total = absences.length
    const nb_salaries_absents = new Set(absences.map(a => a.matricule)).size

    const duree_moyenne_absence = nb_absences_total > 0
      ? Math.round((nb_jours_absence / nb_absences_total) * 100) / 100
      : 0

    const nb_jours_maladie = absences
      .filter(a => (a.type_absence || '').toLowerCase().includes('maladie'))
      .reduce((sum, a) => {
        if (!a.date_debut || !a.date_fin) return sum
        const debut = new Date(a.date_debut)
        const fin = new Date(a.date_fin)
        const diffTime = Math.abs(fin.getTime() - debut.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        return sum + diffDays
      }, 0)

    // Assuming 22 working days per month
    const taux_absenteisme = effectif_fin_mois > 0 && effectif_fin_mois * 22 > 0
      ? Math.round((nb_jours_absence / (effectif_fin_mois * 22)) * 100 * 100) / 100
      : 0

    const taux_absenteisme_maladie = effectif_fin_mois > 0 && effectif_fin_mois * 22 > 0
      ? Math.round((nb_jours_maladie / (effectif_fin_mois * 22)) * 100 * 100) / 100
      : 0

    // TURNOVER
    const taux_turnover = effectif_fin_mois > 0
      ? Math.round(((nb_entrees + nb_sorties) / 2 / effectif_fin_mois) * 100 * 100) / 100
      : 0

    // Build snapshot object
    return {
      etablissement_id: establishmentId,
      periode: period,
      
      // Workforce
      effectif_fin_mois,
      etp_fin_mois: Math.round(etp_fin_mois * 100) / 100,
      nb_entrees,
      nb_sorties,
      taux_turnover,
      
      // Contracts
      nb_cdi,
      nb_cdd,
      nb_alternance,
      nb_stage,
      pct_cdi,
      pct_cdd,
      pct_alternance,
      pct_stage,
      
      // Demographics
      age_moyen,
      anciennete_moyenne_mois,
      pct_hommes,
      pct_femmes,
      
      // Age pyramid
      pct_age_moins_25,
      pct_age_25_35,
      pct_age_35_45,
      pct_age_45_55,
      pct_age_plus_55,
      
      // Seniority pyramid
      pct_anciennete_0_1_an,
      pct_anciennete_1_3_ans,
      pct_anciennete_3_5_ans,
      pct_anciennete_5_10_ans,
      pct_anciennete_plus_10_ans,
      
      // Payroll
      masse_salariale_brute: Math.round(masse_salariale_brute * 100) / 100,
      cout_total_employeur: Math.round(cout_total_employeur * 100) / 100,
      salaire_base_moyen,
      cout_moyen_par_fte,
      part_variable,
      taux_charges,
      
      // Absences
      taux_absenteisme,
      taux_absenteisme_maladie,
      nb_jours_absence,
      nb_jours_absence_maladie: nb_jours_maladie,
      nb_absences_total,
      nb_salaries_absents,
      duree_moyenne_absence,
      nb_jours_maladie,
      
      // Metadata
      import_batch_id: batchId,
      calculated_at: new Date().toISOString(),
      data_quality_score: 100,
      data_completeness: 100,
      version: 1
    }
  }

  /**
   * Insert snapshots into database
   */
  private async insertSnapshots(
    establishmentId: string,
    snapshots: any[],
    batchId: string,
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    
    onProgress({
      phase: 'processing',
      step: 'Inserting snapshots',
      current: 80,
      total: 100,
      percentage: 80,
      message: `0/${snapshots.length} snapshots`
    })

    // Delete existing snapshots for these periods
    const periods = snapshots.map(s => s.periode)
    for (const period of periods) {
      await this.supabase
        .from('snapshots_mensuels')
        .delete()
        .eq('etablissement_id', establishmentId)
        .eq('periode', period)
    }

    onLog(`🧹 Cleaned existing snapshots for ${periods.length} periods`, 'info')

    // Insert new snapshots
    const { error } = await this.supabase
      .from('snapshots_mensuels')
      .insert(snapshots)

    if (error) {
      onLog(`❌ Error inserting snapshots: ${error.message}`, 'error')
      throw error
    }

    onLog(`✅ ${snapshots.length} snapshots inserted successfully`, 'success')
  }

  /**
   * Calculate payroll effects (prix/volume/mix) for all periods
   */
  private async calculatePayrollEffects(
    establishmentId: string,
    periods: string[],
    onProgress: (progress: ImportProgress) => void,
    onLog: (message: string, type?: LogType) => void
  ): Promise<void> {
    
    onProgress({
      phase: 'snapshots',
      step: 'Calculating payroll effects',
      current: 90,
      total: 100,
      percentage: 90,
      message: 'Analyzing trends...'
    })

    const sortedPeriods = periods
      .map(p => this.normalizePeriod(p))
      .sort()

    // Skip first period (no previous period to compare)
    for (let i = 1; i < sortedPeriods.length; i++) {
      const period = sortedPeriods[i]
      
      const { error } = await this.supabase
        .rpc('calculate_payroll_effects', {
          p_etablissement_id: establishmentId,
          p_periode: period
        })

      if (!error) {
        onLog(`✅ Payroll effects calculated for ${period}`, 'success')
      }
    }
  }

  /**
   * Create import batch record
   */
  private async createImportBatch(
    establishmentId: string,
    fileName: string,
    data: ProcessedData,
    batchId: string
  ): Promise<void> {
    
    await this.supabase
      .from('import_batches')
      .insert({
        id: batchId,
        etablissement_id: establishmentId,
        file_name: fileName,
        status: 'completed',
        nb_periods_imported: data.metadata.periods.length,
        nb_snapshots_created: data.metadata.periods.length,
        periods_imported: data.metadata.periods.map(p => this.normalizePeriod(p)),
        completed_at: new Date().toISOString(),
        gdpr_note: 'No individual employee data stored. Only aggregated KPIs retained.'
      })
  }

  abort(): void {
    this.isAborted = true
  }

  private normalizePeriod(period: any): string {
    if (!period) {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }

    try {
      // Handle Excel serial date
      if (typeof period === 'number' && period > 0 && period < 100000) {
        const excelDate = new Date((period - 25569) * 86400 * 1000)
        if (!isNaN(excelDate.getTime())) {
          return `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}-01`
        }
      }

      // Handle Date object
      if (period instanceof Date) {
        return `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`
      }

      // Handle string
      const str = String(period).trim()
      if (/^\d{4}-\d{2}-01$/.test(str)) return str
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str.substring(0, 7) + '-01'

      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    } catch {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }
  }
}