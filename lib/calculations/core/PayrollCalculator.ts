/**
 * 💰 PAYROLL CALCULATOR - Calculs masse salariale et coûts
 * 
 * Responsabilité: Calculer tous les indicateurs de masse salariale
 * - Totaux (brute, chargée, employeur)
 * - Moyennes et médianes
 * - Détails par composante (v2.4)
 * - Ratios (variable, charges)
 * 
 * @module PayrollCalculator
 * @version 3.0
 */

// Types locaux (à la place de l'import qui cause erreur)
interface RemunerationData {
  matricule: string
  mois_paie: string
  salaire_de_base?: number
  primes_fixes?: number
  primes_variables?: number
  primes_exceptionnelles?: number
  heures_supp_payees?: number
  avantages_nature?: number
  indemnites?: number
  cotisations_sociales?: number
  taxes_sur_salaire?: number
  autres_charges?: number
}

interface EmployeeData {
  matricule: string
  periode: string
  temps_travail?: number
  [key: string]: any
}

export interface PayrollMetrics {
  // ============================================
  // TOTAUX
  // ============================================
  masse_salariale_brute: number          // Total salaires bruts
  masse_salariale_chargee: number        // Brut + charges salariales
  cout_total_employeur: number           // Chargée + charges patronales
  
  // ============================================
  // MOYENNES & MÉDIANES
  // ============================================
  salaire_base_moyen: number             // Moyenne des salaires de base
  salaire_base_median: number            // Médiane des salaires de base
  cout_moyen_par_fte: number             // Coût total / ETP
  cout_median_par_fte: number            // Médiane coût / ETP
  
  // ============================================
  // DÉTAILS PAR COMPOSANTE (v2.4)
  // ============================================
  salaire_base_total: number             // Somme salaires de base
  primes_fixes_total: number             // Primes fixes (mensuelles)
  primes_variables_total: number         // Primes variables (objectifs)
  primes_exceptionnelles_total: number   // Primes exceptionnelles (13ème mois)
  heures_supp_total: number              // Heures supplémentaires
  avantages_nature_total: number         // Avantages en nature
  indemnites_total: number               // Indemnités diverses
  cotisations_sociales_total: number     // Total cotisations (salariales + patronales)
  
  // ============================================
  // RATIOS
  // ============================================
  part_variable: number                  // % variable dans le brut
  taux_charges: number                   // % charges sur brut
}

export class PayrollCalculator {
  
  /**
   * Calcule tous les indicateurs de masse salariale pour une période
   * 
   * @param remunerations - Liste des rémunérations de la période
   * @param employees - Liste des employés actifs (pour calculs ETP)
   * @returns PayrollMetrics complet
   */
  calculate(
    remunerations: RemunerationData[],
    employees: EmployeeData[]
  ): PayrollMetrics {
    
    // Validation entrée
    if (!remunerations || remunerations.length === 0) {
      console.warn('⚠️ PayrollCalculator: Aucune rémunération fournie')
      return this.getDefaultMetrics()
    }
    
    // ============================================
    // AGRÉGATION TOTAUX
    // ============================================
    let salaire_base_total = 0
    let primes_fixes_total = 0
    let primes_variables_total = 0
    let primes_exceptionnelles_total = 0
    let heures_supp_total = 0
    let avantages_nature_total = 0
    let indemnites_total = 0
    let cotisations_sociales_total = 0
    let taxes_total = 0
    let autres_charges_total = 0
    
    const salaires_base_array: number[] = []
    const couts_fte_array: number[] = []
    
    for (const rem of remunerations) {
      // Salaire de base
      const salaireBase = rem.salaire_de_base || 0
      salaire_base_total += salaireBase
      if (salaireBase > 0) {
        salaires_base_array.push(salaireBase)
      }
      
      // Composantes variables
      primes_fixes_total += rem.primes_fixes || 0
      primes_variables_total += rem.primes_variables || 0
      primes_exceptionnelles_total += rem.primes_exceptionnelles || 0
      heures_supp_total += rem.heures_supp_payees || 0
      avantages_nature_total += rem.avantages_nature || 0
      indemnites_total += rem.indemnites || 0
      
      // Charges
      cotisations_sociales_total += rem.cotisations_sociales || 0
      taxes_total += rem.taxes_sur_salaire || 0
      autres_charges_total += rem.autres_charges || 0
    }
    
    // ============================================
    // CALCUL MASSES SALARIALES
    // ============================================
    // Masse salariale brute = Base + Primes + HS + Avantages + Indemnités
    const masse_salariale_brute = 
      salaire_base_total +
      primes_fixes_total +
      primes_variables_total +
      primes_exceptionnelles_total +
      heures_supp_total +
      avantages_nature_total +
      indemnites_total
    
    // Masse chargée = Brute + Cotisations salariales (simplification: 23% brut)
    const masse_salariale_chargee = masse_salariale_brute + (cotisations_sociales_total * 0.5) // Part salariale
    
    // Coût total employeur = Chargée + Cotisations patronales + Taxes
    const cout_total_employeur = 
      masse_salariale_brute +
      cotisations_sociales_total +
      taxes_total +
      autres_charges_total
    
    // ============================================
    // MOYENNES & MÉDIANES
    // ============================================
    const salaire_base_moyen = salaires_base_array.length > 0
      ? salaires_base_array.reduce((sum, s) => sum + s, 0) / salaires_base_array.length
      : 0
    
    const salaire_base_median = this.calculateMedian(salaires_base_array)
    
    // Coût moyen par ETP
    const etp_total = employees.reduce((sum, emp) => sum + (emp.temps_travail || 1), 0)
    const cout_moyen_par_fte = etp_total > 0 ? masse_salariale_brute / etp_total : 0
    
    // Pour médiane FTE, on calcule le coût par employé puis médiane
    const couts_par_employe = remunerations.map(rem => {
      const brut = (rem.salaire_de_base || 0) +
                   (rem.primes_fixes || 0) +
                   (rem.primes_variables || 0) +
                   (rem.primes_exceptionnelles || 0) +
                   (rem.heures_supp_payees || 0) +
                   (rem.avantages_nature || 0) +
                   (rem.indemnites || 0)
      
      // Trouver l'ETP de l'employé correspondant
      const emp = employees.find(e => e.matricule === rem.matricule)
      const etp = emp?.temps_travail || 1
      
      return etp > 0 ? brut / etp : 0
    }).filter(c => c > 0)
    
    const cout_median_par_fte = this.calculateMedian(couts_par_employe)
    
    // ============================================
    // RATIOS
    // ============================================
    // Part variable = (Variables + Exceptionnelles) / Salaire de base
    const total_variable = primes_variables_total + primes_exceptionnelles_total
    const part_variable = salaire_base_total > 0
      ? (total_variable / salaire_base_total) * 100
      : 0
    
    // Taux de charges = (Cotisations + Taxes) / Brut
    const total_charges = cotisations_sociales_total + taxes_total + autres_charges_total
    const taux_charges = masse_salariale_brute > 0
      ? (total_charges / masse_salariale_brute) * 100
      : 0
    
    // ============================================
    // METADATA
    // ============================================
    const nb_salaires_traites = remunerations.length
    const matricules_uniques = new Set(remunerations.map(r => r.matricule))
    const nb_salaries_payes = matricules_uniques.size
    
    return {
      // Totaux
      masse_salariale_brute: this.round(masse_salariale_brute, 2),
      masse_salariale_chargee: this.round(masse_salariale_chargee, 2),
      cout_total_employeur: this.round(cout_total_employeur, 2),
      
      // Moyennes & médianes
      salaire_base_moyen: this.round(salaire_base_moyen, 2),
      salaire_base_median: this.round(salaire_base_median, 2),
      cout_moyen_par_fte: this.round(cout_moyen_par_fte, 2),
      cout_median_par_fte: this.round(cout_median_par_fte, 2),
      
      // Détails (v2.4)
      salaire_base_total: this.round(salaire_base_total, 2),
      primes_fixes_total: this.round(primes_fixes_total, 2),
      primes_variables_total: this.round(primes_variables_total, 2),
      primes_exceptionnelles_total: this.round(primes_exceptionnelles_total, 2),
      heures_supp_total: this.round(heures_supp_total, 2),
      avantages_nature_total: this.round(avantages_nature_total, 2),
      indemnites_total: this.round(indemnites_total, 2),
      cotisations_sociales_total: this.round(cotisations_sociales_total, 2),
      
      // Ratios
      part_variable: this.round(part_variable, 2),
      taux_charges: this.round(taux_charges, 2)
    }
  }
  
  /**
   * Calcule la médiane d'un tableau de nombres
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }
    
    return sorted[middle]
  }
  
  /**
   * Retourne des métriques par défaut (aucune donnée)
   */
  private getDefaultMetrics(): PayrollMetrics {
    return {
      masse_salariale_brute: 0,
      masse_salariale_chargee: 0,
      cout_total_employeur: 0,
      salaire_base_moyen: 0,
      salaire_base_median: 0,
      cout_moyen_par_fte: 0,
      cout_median_par_fte: 0,
      salaire_base_total: 0,
      primes_fixes_total: 0,
      primes_variables_total: 0,
      primes_exceptionnelles_total: 0,
      heures_supp_total: 0,
      avantages_nature_total: 0,
      indemnites_total: 0,
      cotisations_sociales_total: 0,
      part_variable: 0,
      taux_charges: 0
    }
  }
  
  /**
   * Arrondit un nombre avec précision
   */
  private round(value: number, decimals: number): number {
    if (!isFinite(value) || isNaN(value)) {
      return 0
    }
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
  
  /**
   * Génère un rapport d'analyse de la masse salariale
   */
  generateAnalysis(metrics: PayrollMetrics): {
    level: 'low' | 'normal' | 'high'
    insights: string[]
  } {
    const insights: string[] = []
    
    // Analyse part variable
    if (metrics.part_variable > 30) {
      insights.push(`💰 Part variable élevée (${metrics.part_variable.toFixed(1)}%) - Politique de rémunération incitative`)
    } else if (metrics.part_variable < 5) {
      insights.push(`📊 Part variable faible (${metrics.part_variable.toFixed(1)}%) - Rémunération principalement fixe`)
    }
    
    // Analyse taux de charges
    if (metrics.taux_charges > 50) {
      insights.push(`⚠️ Taux de charges élevé (${metrics.taux_charges.toFixed(1)}%) - Vérifier optimisations possibles`)
    } else if (metrics.taux_charges < 35) {
      insights.push(`✅ Taux de charges optimisé (${metrics.taux_charges.toFixed(1)}%)`)
    }
    
    // Analyse primes exceptionnelles
    if (metrics.primes_exceptionnelles_total > metrics.salaire_base_total * 0.5) {
      insights.push(`🎁 Primes exceptionnelles importantes (probable 13ème mois ou bonus annuel)`)
    }
    
    // Niveau général
    let level: 'low' | 'normal' | 'high' = 'normal'
    if (metrics.cout_moyen_par_fte < 2000) {
      level = 'low'
      insights.push(`📉 Coût moyen faible (${metrics.cout_moyen_par_fte.toFixed(0)}€/FTE) - Profils juniors ou temps partiels`)
    } else if (metrics.cout_moyen_par_fte > 5000) {
      level = 'high'
      insights.push(`📈 Coût moyen élevé (${metrics.cout_moyen_par_fte.toFixed(0)}€/FTE) - Profils seniors ou cadres`)
    }
    
    return { level, insights }
  }
}

// Export instance singleton pour réutilisation
export const payrollCalculator = new PayrollCalculator()