/**
 * 👤 DEMOGRAPHICS CALCULATOR - Calculs démographiques
 * 
 * Responsabilité: Calculer tous les indicateurs démographiques
 * - Âge moyen et médian
 * - Ancienneté moyenne et médiane
 * - Répartition hommes/femmes
 * - Pyramide des âges
 * - Pyramide d'ancienneté
 * - Index égalité (optionnel)
 * 
 * @module DemographicsCalculator
 * @version 3.0
 */

// Types locaux
interface EmployeeData {
  matricule: string
  periode: string
  sexe?: string | null
  date_naissance?: string | null
  date_entree?: string | null
  statut_emploi?: string
  [key: string]: any
}

export interface DemographicsMetrics {
  // ============================================
  // ÂGE
  // ============================================
  age_moyen: number                      // Âge moyen en années
  age_median: number                     // Âge médian en années
  
  // ============================================
  // ANCIENNETÉ
  // ============================================
  anciennete_moyenne_mois: number        // Ancienneté moyenne en mois
  anciennete_mediane_mois: number        // Ancienneté médiane en mois
  
  // ============================================
  // GENRE
  // ============================================
  pct_hommes: number                     // % d'hommes
  pct_femmes: number                     // % de femmes
  index_egalite?: number                 // Index égalité H/F (0-100)
  
  // ============================================
  // PYRAMIDE DES ÂGES
  // ============================================
  pct_age_moins_25: number               // % < 25 ans
  pct_age_25_35: number                  // % 25-35 ans
  pct_age_35_45: number                  // % 35-45 ans
  pct_age_45_55: number                  // % 45-55 ans
  pct_age_plus_55: number                // % > 55 ans
  
  // ============================================
  // PYRAMIDE D'ANCIENNETÉ
  // ============================================
  pct_anciennete_0_1_an: number          // % < 1 an
  pct_anciennete_1_3_ans: number         // % 1-3 ans
  pct_anciennete_3_5_ans: number         // % 3-5 ans
  pct_anciennete_5_10_ans: number        // % 5-10 ans
  pct_anciennete_plus_10_ans: number     // % > 10 ans
}

export class DemographicsCalculator {
  
  /**
   * Calcule tous les indicateurs démographiques pour une période
   * 
   * @param employees - Liste des employés actifs de la période
   * @param period - Période au format YYYY-MM-DD (pour calcul âge/ancienneté)
   * @returns DemographicsMetrics complet
   */
  calculate(
    employees: EmployeeData[],
    period: string
  ): DemographicsMetrics {
    
    // Validation entrée
    if (!employees || employees.length === 0) {
      console.warn('⚠️ DemographicsCalculator: Aucun employé fourni')
      return this.getDefaultMetrics()
    }
    
    // Date de référence pour les calculs
    const periodDate = new Date(period)
    
    // Filtrer seulement les employés actifs
    const activeEmployees = employees.filter(e => e.statut_emploi === 'Actif')
    const effectif = activeEmployees.length
    
    if (effectif === 0) {
      return this.getDefaultMetrics()
    }
    
    // ============================================
    // CALCUL ÂGE
    // ============================================
    const ages: number[] = []
    const ageDistribution = {
      moins_25: 0,
      entre_25_35: 0,
      entre_35_45: 0,
      entre_45_55: 0,
      plus_55: 0
    }
    
    for (const emp of activeEmployees) {
      if (emp.date_naissance) {
        const birthDate = new Date(emp.date_naissance)
        const age = periodDate.getFullYear() - birthDate.getFullYear()
        
        // Correction si anniversaire pas encore passé dans l'année
        const monthDiff = periodDate.getMonth() - birthDate.getMonth()
        const dayDiff = periodDate.getDate() - birthDate.getDate()
        const ageAdjusted = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age
        
        if (ageAdjusted >= 0 && ageAdjusted < 120) { // Validation âge cohérent
          ages.push(ageAdjusted)
          
          // Distribution
          if (ageAdjusted < 25) ageDistribution.moins_25++
          else if (ageAdjusted < 35) ageDistribution.entre_25_35++
          else if (ageAdjusted < 45) ageDistribution.entre_35_45++
          else if (ageAdjusted < 55) ageDistribution.entre_45_55++
          else ageDistribution.plus_55++
        }
      }
    }
    
    const age_moyen = ages.length > 0
      ? ages.reduce((sum, a) => sum + a, 0) / ages.length
      : 0
    
    const age_median = this.calculateMedian(ages)
    
    // Pourcentages pyramide âge
    const pct_age_moins_25 = effectif > 0 ? (ageDistribution.moins_25 / effectif) * 100 : 0
    const pct_age_25_35 = effectif > 0 ? (ageDistribution.entre_25_35 / effectif) * 100 : 0
    const pct_age_35_45 = effectif > 0 ? (ageDistribution.entre_35_45 / effectif) * 100 : 0
    const pct_age_45_55 = effectif > 0 ? (ageDistribution.entre_45_55 / effectif) * 100 : 0
    const pct_age_plus_55 = effectif > 0 ? (ageDistribution.plus_55 / effectif) * 100 : 0
    
    // ============================================
    // CALCUL ANCIENNETÉ
    // ============================================
    const anciennetes: number[] = []
    const ancienneteDistribution = {
      moins_1_an: 0,
      entre_1_3_ans: 0,
      entre_3_5_ans: 0,
      entre_5_10_ans: 0,
      plus_10_ans: 0
    }
    
    for (const emp of activeEmployees) {
      if (emp.date_entree) {
        const entryDate = new Date(emp.date_entree)
        
        // Calcul ancienneté en mois
        const yearsDiff = periodDate.getFullYear() - entryDate.getFullYear()
        const monthsDiff = periodDate.getMonth() - entryDate.getMonth()
        const ancienneteMois = yearsDiff * 12 + monthsDiff
        
        if (ancienneteMois >= 0) { // Validation ancienneté positive
          anciennetes.push(ancienneteMois)
          
          // Distribution
          const ancienneteAns = ancienneteMois / 12
          if (ancienneteAns < 1) ancienneteDistribution.moins_1_an++
          else if (ancienneteAns < 3) ancienneteDistribution.entre_1_3_ans++
          else if (ancienneteAns < 5) ancienneteDistribution.entre_3_5_ans++
          else if (ancienneteAns < 10) ancienneteDistribution.entre_5_10_ans++
          else ancienneteDistribution.plus_10_ans++
        }
      }
    }
    
    const anciennete_moyenne_mois = anciennetes.length > 0
      ? anciennetes.reduce((sum, a) => sum + a, 0) / anciennetes.length
      : 0
    
    const anciennete_mediane_mois = this.calculateMedian(anciennetes)
    
    // Pourcentages pyramide ancienneté
    const pct_anciennete_0_1_an = effectif > 0 ? (ancienneteDistribution.moins_1_an / effectif) * 100 : 0
    const pct_anciennete_1_3_ans = effectif > 0 ? (ancienneteDistribution.entre_1_3_ans / effectif) * 100 : 0
    const pct_anciennete_3_5_ans = effectif > 0 ? (ancienneteDistribution.entre_3_5_ans / effectif) * 100 : 0
    const pct_anciennete_5_10_ans = effectif > 0 ? (ancienneteDistribution.entre_5_10_ans / effectif) * 100 : 0
    const pct_anciennete_plus_10_ans = effectif > 0 ? (ancienneteDistribution.plus_10_ans / effectif) * 100 : 0
    
    // ============================================
    // CALCUL GENRE
    // ============================================
    const hommes = activeEmployees.filter(e => 
      e.sexe?.toUpperCase() === 'M' || e.sexe?.toUpperCase() === 'H'
    ).length
    
    const femmes = activeEmployees.filter(e => 
      e.sexe?.toUpperCase() === 'F'
    ).length
    
    const pct_hommes = effectif > 0 ? (hommes / effectif) * 100 : 0
    const pct_femmes = effectif > 0 ? (femmes / effectif) * 100 : 0
    
    // Index égalité (optionnel - simplifié)
    // Note: L'index égalité réel (France) est plus complexe
    const index_egalite = this.calculateIndexEgalite(activeEmployees)
    
    return {
      // Âge
      age_moyen: this.round(age_moyen, 1),
      age_median: this.round(age_median, 1),
      
      // Ancienneté
      anciennete_moyenne_mois: this.round(anciennete_moyenne_mois, 1),
      anciennete_mediane_mois: this.round(anciennete_mediane_mois, 1),
      
      // Genre
      pct_hommes: this.round(pct_hommes, 2),
      pct_femmes: this.round(pct_femmes, 2),
      index_egalite: index_egalite ? this.round(index_egalite, 0) : undefined,
      
      // Pyramide âge
      pct_age_moins_25: this.round(pct_age_moins_25, 2),
      pct_age_25_35: this.round(pct_age_25_35, 2),
      pct_age_35_45: this.round(pct_age_35_45, 2),
      pct_age_45_55: this.round(pct_age_45_55, 2),
      pct_age_plus_55: this.round(pct_age_plus_55, 2),
      
      // Pyramide ancienneté
      pct_anciennete_0_1_an: this.round(pct_anciennete_0_1_an, 2),
      pct_anciennete_1_3_ans: this.round(pct_anciennete_1_3_ans, 2),
      pct_anciennete_3_5_ans: this.round(pct_anciennete_3_5_ans, 2),
      pct_anciennete_5_10_ans: this.round(pct_anciennete_5_10_ans, 2),
      pct_anciennete_plus_10_ans: this.round(pct_anciennete_plus_10_ans, 2)
    }
  }
  
  /**
   * Calcule l'index égalité H/F (version simplifiée)
   * Note: L'index officiel français nécessite plus de données
   */
  private calculateIndexEgalite(employees: EmployeeData[]): number | null {
    const hommes = employees.filter(e => 
      e.sexe?.toUpperCase() === 'M' || e.sexe?.toUpperCase() === 'H'
    ).length
    
    const femmes = employees.filter(e => 
      e.sexe?.toUpperCase() === 'F'
    ).length
    
    if (hommes === 0 || femmes === 0) {
      return null // Pas assez de données pour calculer
    }
    
    // Version simplifiée: score basé sur l'équilibre H/F
    // 100 = parfait équilibre (50/50)
    // 0 = déséquilibre total
    const total = hommes + femmes
    const pct_hommes = (hommes / total) * 100
    const ecart = Math.abs(pct_hommes - 50)
    const score = Math.max(0, 100 - (ecart * 2))
    
    return score
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
  private getDefaultMetrics(): DemographicsMetrics {
    return {
      age_moyen: 0,
      age_median: 0,
      anciennete_moyenne_mois: 0,
      anciennete_mediane_mois: 0,
      pct_hommes: 0,
      pct_femmes: 0,
      index_egalite: undefined,
      pct_age_moins_25: 0,
      pct_age_25_35: 0,
      pct_age_35_45: 0,
      pct_age_45_55: 0,
      pct_age_plus_55: 0,
      pct_anciennete_0_1_an: 0,
      pct_anciennete_1_3_ans: 0,
      pct_anciennete_3_5_ans: 0,
      pct_anciennete_5_10_ans: 0,
      pct_anciennete_plus_10_ans: 0
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
   * Génère un rapport d'analyse démographique
   */
  generateAnalysis(metrics: DemographicsMetrics): {
    alerts: string[]
    insights: string[]
  } {
    const alerts: string[] = []
    const insights: string[] = []
    
    // Alertes âge
    if (metrics.age_moyen > 50) {
      alerts.push(`⚠️ Population vieillissante (âge moyen: ${metrics.age_moyen.toFixed(0)} ans) - Anticiper renouvellement`)
    } else if (metrics.age_moyen < 30) {
      insights.push(`👶 Population jeune (âge moyen: ${metrics.age_moyen.toFixed(0)} ans) - Dynamisme et innovation`)
    }
    
    if (metrics.pct_age_plus_55 > 30) {
      alerts.push(`📊 ${metrics.pct_age_plus_55.toFixed(0)}% des effectifs ont plus de 55 ans - Plan de succession nécessaire`)
    }
    
    // Alertes ancienneté
    if (metrics.pct_anciennete_0_1_an > 40) {
      alerts.push(`🔄 Forte rotation (${metrics.pct_anciennete_0_1_an.toFixed(0)}% < 1 an) - Vérifier intégration et culture`)
    }
    
    if (metrics.pct_anciennete_plus_10_ans > 50) {
      insights.push(`🏆 Forte fidélisation (${metrics.pct_anciennete_plus_10_ans.toFixed(0)}% > 10 ans) - Expertise et stabilité`)
    }
    
    // Alertes genre
    const ecart_genre = Math.abs(metrics.pct_hommes - metrics.pct_femmes)
    if (ecart_genre > 30) {
      alerts.push(`⚖️ Déséquilibre H/F important (${metrics.pct_hommes.toFixed(0)}% H / ${metrics.pct_femmes.toFixed(0)}% F) - Actions diversité recommandées`)
    }
    
    if (metrics.index_egalite && metrics.index_egalite < 75) {
      alerts.push(`📉 Index égalité H/F faible (${metrics.index_egalite.toFixed(0)}/100) - Plan d'action requis`)
    }
    
    // Insights positifs
    if (ecart_genre < 10) {
      insights.push(`✅ Excellent équilibre H/F (${metrics.pct_hommes.toFixed(0)}% H / ${metrics.pct_femmes.toFixed(0)}% F)`)
    }
    
    if (metrics.pct_age_25_35 > 30 && metrics.pct_age_35_45 > 25) {
      insights.push(`💪 Population bien équilibrée entre juniors et seniors - Mix idéal expérience/innovation`)
    }
    
    return { alerts, insights }
  }
  
  /**
   * Détecte les risques de pyramide inversée (trop de seniors)
   */
  detectPyramideInversee(metrics: DemographicsMetrics): {
    risque: boolean
    niveau: 'faible' | 'moyen' | 'élevé'
    message: string
  } {
    const jeunes = metrics.pct_age_moins_25 + metrics.pct_age_25_35
    const seniors = metrics.pct_age_45_55 + metrics.pct_age_plus_55
    
    if (seniors > jeunes * 2) {
      return {
        risque: true,
        niveau: 'élevé',
        message: `Pyramide inversée critique: ${seniors.toFixed(0)}% de seniors vs ${jeunes.toFixed(0)}% de jeunes`
      }
    } else if (seniors > jeunes * 1.5) {
      return {
        risque: true,
        niveau: 'moyen',
        message: `Pyramide vieillissante: ${seniors.toFixed(0)}% de seniors vs ${jeunes.toFixed(0)}% de jeunes`
      }
    }
    
    return {
      risque: false,
      niveau: 'faible',
      message: `Pyramide équilibrée: ${jeunes.toFixed(0)}% jeunes, ${seniors.toFixed(0)}% seniors`
    }
  }
}

// Export instance singleton pour réutilisation
export const demographicsCalculator = new DemographicsCalculator()