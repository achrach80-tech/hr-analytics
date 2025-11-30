/**
 * 🏥 ABSENCE CALCULATOR - Calculs absentéisme
 * 
 * Responsabilité: Calculer tous les indicateurs d'absentéisme
 * - Taux d'absentéisme global et maladie
 * - Nombre de jours d'absence
 * - Fréquence et durée moyenne
 * - Breakdown par type d'absence
 * - Nombre de salariés absents
 * 
 * @module AbsenceCalculator
 * @version 3.0
 */

// Types locaux
interface AbsenceData {
  matricule: string
  type_absence: string
  date_debut: string
  date_fin?: string | null
  motif?: string
  justificatif_fourni?: boolean
  validation_status?: string
}

interface EmployeeData {
  matricule: string
  periode: string
  temps_travail?: number
  statut_emploi?: string
  [key: string]: any
}

export interface AbsenceMetrics {
  // ============================================
  // TAUX D'ABSENTÉISME
  // ============================================
  taux_absenteisme: number               // Taux global (%)
  taux_absenteisme_maladie: number       // Taux maladie uniquement (%)
  
  // ============================================
  // VOLUMES
  // ============================================
  nb_jours_absence: number               // Total jours d'absence
  nb_jours_absence_maladie: number       // Jours maladie uniquement
  nb_absences_total: number              // Nombre d'absences (événements)
  nb_salaries_absents: number            // Nombre de salariés ayant eu au moins 1 absence
  
  // ============================================
  // MOYENNES
  // ============================================
  duree_moyenne_absence: number          // Durée moyenne en jours
  frequence_absence: number              // Fréquence = nb absences / nb salariés
  
  // ============================================
  // BREAKDOWN PAR TYPE
  // ============================================
  nb_jours_maladie: number               // Jours maladie ordinaire
  nb_jours_accident_travail: number      // Jours accident du travail
  nb_jours_conges: number                // Jours congés payés
  nb_jours_formation: number             // Jours formation
  nb_jours_autres: number                // Autres types d'absence
}

export class AbsenceCalculator {
  
  // Mapping types d'absence vers catégories
  private readonly ABSENCE_CATEGORIES = {
    maladie: ['maladie', 'arrêt maladie', 'maladie ordinaire', 'sick leave'],
    accident_travail: ['accident travail', 'at', 'accident du travail', 'work accident'],
    conges: ['congés', 'congés payés', 'cp', 'vacation', 'holiday'],
    formation: ['formation', 'training'],
    // Autres: tout ce qui n'est pas catégorisé
  }
  
  /**
   * Calcule tous les indicateurs d'absentéisme pour une période
   * 
   * @param absences - Liste des absences de la période
   * @param employees - Liste des employés actifs (pour calcul taux)
   * @param period - Période au format YYYY-MM-DD
   * @returns AbsenceMetrics complet
   */
  calculate(
    absences: AbsenceData[],
    employees: EmployeeData[],
    period: string
  ): AbsenceMetrics {
    
    // Validation entrée
    if (!absences || absences.length === 0) {
      console.log('ℹ️ AbsenceCalculator: Aucune absence pour cette période (normal)')
      return this.getDefaultMetrics()
    }
    
    if (!employees || employees.length === 0) {
      console.warn('⚠️ AbsenceCalculator: Aucun employé fourni')
      return this.getDefaultMetrics()
    }
    
    const periodDate = new Date(period)
    const activeEmployees = employees.filter(e => e.statut_emploi === 'Actif')
    const effectif = activeEmployees.length
    
    if (effectif === 0) {
      return this.getDefaultMetrics()
    }
    
    // ============================================
    // CALCUL JOURS D'ABSENCE PAR TYPE
    // ============================================
    let nb_jours_maladie = 0
    let nb_jours_accident_travail = 0
    let nb_jours_conges = 0
    let nb_jours_formation = 0
    let nb_jours_autres = 0
    
    const matriculesAbsents = new Set<string>()
    const dureesAbsences: number[] = []
    
    for (const absence of absences) {
      // Calculer durée de l'absence
      const dateDebut = new Date(absence.date_debut)
      const dateFin = absence.date_fin ? new Date(absence.date_fin) : dateDebut
      
      // Durée en jours (inclus premier et dernier jour)
      const dureeMsec = dateFin.getTime() - dateDebut.getTime()
      const dureeJours = Math.floor(dureeMsec / (1000 * 60 * 60 * 24)) + 1
      
      // Validation durée cohérente
      if (dureeJours < 1 || dureeJours > 365) {
        console.warn(`⚠️ Durée absence incohérente ignorée: ${dureeJours} jours`, absence)
        continue
      }
      
      dureesAbsences.push(dureeJours)
      matriculesAbsents.add(absence.matricule)
      
      // Catégorisation
      const typeAbsence = (absence.type_absence || '').toLowerCase()
      
      if (this.isCategory(typeAbsence, 'maladie')) {
        nb_jours_maladie += dureeJours
      } else if (this.isCategory(typeAbsence, 'accident_travail')) {
        nb_jours_accident_travail += dureeJours
      } else if (this.isCategory(typeAbsence, 'conges')) {
        nb_jours_conges += dureeJours
      } else if (this.isCategory(typeAbsence, 'formation')) {
        nb_jours_formation += dureeJours
      } else {
        nb_jours_autres += dureeJours
      }
    }
    
    // ============================================
    // TOTAUX ET MOYENNES
    // ============================================
    const nb_jours_absence = 
      nb_jours_maladie + 
      nb_jours_accident_travail + 
      nb_jours_conges + 
      nb_jours_formation + 
      nb_jours_autres
    
    const nb_absences_total = absences.length
    const nb_salaries_absents = matriculesAbsents.size
    
    const duree_moyenne_absence = dureesAbsences.length > 0
      ? dureesAbsences.reduce((sum, d) => sum + d, 0) / dureesAbsences.length
      : 0
    
    const frequence_absence = effectif > 0 ? nb_absences_total / effectif : 0
    
    // ============================================
    // CALCUL TAUX D'ABSENTÉISME
    // ============================================
    // Formule: (Jours d'absence / Jours théoriques travaillés) × 100
    // Jours théoriques = Effectif × Jours ouvrables du mois
    
    const joursOuvrablesMois = this.getJoursOuvrablesMois(periodDate)
    const joursTheoriques = effectif * joursOuvrablesMois
    
    const taux_absenteisme = joursTheoriques > 0
      ? (nb_jours_absence / joursTheoriques) * 100
      : 0
    
    const nb_jours_absence_maladie = nb_jours_maladie + nb_jours_accident_travail
    const taux_absenteisme_maladie = joursTheoriques > 0
      ? (nb_jours_absence_maladie / joursTheoriques) * 100
      : 0
    
    return {
      // Taux
      taux_absenteisme: this.round(taux_absenteisme, 2),
      taux_absenteisme_maladie: this.round(taux_absenteisme_maladie, 2),
      
      // Volumes
      nb_jours_absence,
      nb_jours_absence_maladie,
      nb_absences_total,
      nb_salaries_absents,
      
      // Moyennes
      duree_moyenne_absence: this.round(duree_moyenne_absence, 1),
      frequence_absence: this.round(frequence_absence, 2),
      
      // Breakdown
      nb_jours_maladie,
      nb_jours_accident_travail,
      nb_jours_conges,
      nb_jours_formation,
      nb_jours_autres
    }
  }
  
  /**
   * Vérifie si un type d'absence correspond à une catégorie
   */
  private isCategory(typeAbsence: string, category: keyof typeof this.ABSENCE_CATEGORIES): boolean {
    const keywords = this.ABSENCE_CATEGORIES[category]
    return keywords.some(keyword => typeAbsence.includes(keyword))
  }
  
  /**
   * Calcule le nombre de jours ouvrables dans un mois
   * Approximation: 22 jours en moyenne (peut être affiné avec un calendrier)
   */
  private getJoursOuvrablesMois(date: Date): number {
    // Version simple: 22 jours ouvrables par mois en moyenne
    // Version avancée: calculer exactement selon le calendrier et jours fériés
    
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    // Compter jours ouvrables (lun-ven)
    let joursOuvrables = 0
    for (let day = 1; day <= lastDay; day++) {
      const currentDate = new Date(year, month, day)
      const dayOfWeek = currentDate.getDay()
      
      // 0 = dimanche, 6 = samedi
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        joursOuvrables++
      }
    }
    
    // TODO: Soustraire jours fériés français si nécessaire
    
    return joursOuvrables
  }
  
  /**
   * Retourne des métriques par défaut (aucune absence)
   */
  private getDefaultMetrics(): AbsenceMetrics {
    return {
      taux_absenteisme: 0,
      taux_absenteisme_maladie: 0,
      nb_jours_absence: 0,
      nb_jours_absence_maladie: 0,
      nb_absences_total: 0,
      nb_salaries_absents: 0,
      duree_moyenne_absence: 0,
      frequence_absence: 0,
      nb_jours_maladie: 0,
      nb_jours_accident_travail: 0,
      nb_jours_conges: 0,
      nb_jours_formation: 0,
      nb_jours_autres: 0
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
   * Génère un rapport d'analyse de l'absentéisme
   */
  generateAnalysis(metrics: AbsenceMetrics): {
    niveau: 'faible' | 'normal' | 'élevé' | 'critique'
    alerts: string[]
    insights: string[]
  } {
    const alerts: string[] = []
    const insights: string[] = []
    let niveau: 'faible' | 'normal' | 'élevé' | 'critique' = 'normal'
    
    // Analyse taux global
    if (metrics.taux_absenteisme > 10) {
      niveau = 'critique'
      alerts.push(`🚨 Taux d'absentéisme critique (${metrics.taux_absenteisme.toFixed(1)}%) - Action urgente requise`)
    } else if (metrics.taux_absenteisme > 7) {
      niveau = 'élevé'
      alerts.push(`⚠️ Taux d'absentéisme élevé (${metrics.taux_absenteisme.toFixed(1)}%) - Enquête recommandée`)
    } else if (metrics.taux_absenteisme > 4) {
      niveau = 'normal'
      insights.push(`📊 Taux d'absentéisme dans la norme (${metrics.taux_absenteisme.toFixed(1)}%)`)
    } else {
      niveau = 'faible'
      insights.push(`✅ Taux d'absentéisme faible (${metrics.taux_absenteisme.toFixed(1)}%) - Excellente santé organisationnelle`)
    }
    
    // Analyse durée moyenne
    if (metrics.duree_moyenne_absence > 14) {
      alerts.push(`📅 Durée moyenne d'absence élevée (${metrics.duree_moyenne_absence.toFixed(1)} jours) - Possibles arrêts longs`)
    } else if (metrics.duree_moyenne_absence < 2 && metrics.nb_absences_total > 0) {
      insights.push(`⚡ Absences courtes en moyenne (${metrics.duree_moyenne_absence.toFixed(1)} jour) - Absentéisme fractionné`)
    }
    
    // Analyse fréquence
    if (metrics.frequence_absence > 2) {
      alerts.push(`🔄 Fréquence élevée (${metrics.frequence_absence.toFixed(1)} absences/salarié) - Culture de l'absence?`)
    }
    
    // Analyse breakdown
    const pct_maladie = metrics.nb_jours_absence > 0
      ? (metrics.nb_jours_maladie / metrics.nb_jours_absence) * 100
      : 0
    
    if (pct_maladie > 80) {
      alerts.push(`🏥 ${pct_maladie.toFixed(0)}% des absences sont pour maladie - Vérifier conditions de travail`)
    }
    
    const pct_accident = metrics.nb_jours_absence > 0
      ? (metrics.nb_jours_accident_travail / metrics.nb_jours_absence) * 100
      : 0
    
    if (pct_accident > 20) {
      alerts.push(`⚠️ ${pct_accident.toFixed(0)}% d'accidents du travail - Audit sécurité nécessaire`)
    }
    
    // Insights positifs
    if (metrics.nb_jours_formation > 0) {
      const pct_formation = (metrics.nb_jours_formation / metrics.nb_jours_absence) * 100
      insights.push(`📚 ${metrics.nb_jours_formation} jours de formation (${pct_formation.toFixed(0)}% des absences) - Investissement développement`)
    }
    
    return { niveau, alerts, insights }
  }
  
  /**
   * Détecte les patterns d'absentéisme suspects
   */
  detectPatterns(metrics: AbsenceMetrics): {
    patterns: string[]
    recommandations: string[]
  } {
    const patterns: string[] = []
    const recommandations: string[] = []
    
    // Pattern: Absences courtes fréquentes
    if (metrics.duree_moyenne_absence < 2 && metrics.frequence_absence > 1.5) {
      patterns.push('🔴 Absentéisme fractionné: absences courtes mais fréquentes')
      recommandations.push('Analyser les jours de la semaine (lundi/vendredi?)')
      recommandations.push('Entretiens individuels avec les managers')
    }
    
    // Pattern: Absences longues rares
    if (metrics.duree_moyenne_absence > 10 && metrics.nb_absences_total < metrics.nb_salaries_absents * 1.5) {
      patterns.push('🟡 Absences longues: quelques cas d\'arrêts prolongés')
      recommandations.push('Suivi médical et accompagnement RH')
      recommandations.push('Vérifier charge de travail et prévention burnout')
    }
    
    // Pattern: Taux maladie très élevé
    const ratio_maladie = metrics.nb_jours_absence > 0
      ? metrics.nb_jours_absence_maladie / metrics.nb_jours_absence
      : 0
    
    if (ratio_maladie > 0.8) {
      patterns.push('🔵 Prédominance maladie: 80%+ des absences')
      recommandations.push('Audit conditions de travail (ergonomie, climat)')
      recommandations.push('Actions de prévention santé')
    }
    
    // Pattern: Accidents du travail
    if (metrics.nb_jours_accident_travail > metrics.nb_jours_absence * 0.15) {
      patterns.push('🟠 Accidents du travail significatifs')
      recommandations.push('Audit sécurité urgent')
      recommandations.push('Renforcement formations sécurité')
    }
    
    return { patterns, recommandations }
  }
  
  /**
   * Compare avec des benchmarks sectoriels
   */
  compareBenchmark(
    metrics: AbsenceMetrics,
    secteur: 'industrie' | 'service' | 'commerce' | 'tech' = 'service'
  ): {
    position: 'excellent' | 'bon' | 'moyen' | 'préoccupant'
    message: string
  } {
    // Benchmarks moyens par secteur (France)
    const benchmarks = {
      industrie: 5.5,    // Industrie: ~5.5%
      service: 4.5,      // Services: ~4.5%
      commerce: 5.0,     // Commerce: ~5%
      tech: 3.5          // Tech: ~3.5%
    }
    
    const benchmark = benchmarks[secteur]
    const ecart = metrics.taux_absenteisme - benchmark
    
    if (ecart < -1) {
      return {
        position: 'excellent',
        message: `Excellent: ${metrics.taux_absenteisme.toFixed(1)}% vs ${benchmark}% (benchmark ${secteur})`
      }
    } else if (ecart < 0.5) {
      return {
        position: 'bon',
        message: `Bon: ${metrics.taux_absenteisme.toFixed(1)}% proche du benchmark ${secteur} (${benchmark}%)`
      }
    } else if (ecart < 2) {
      return {
        position: 'moyen',
        message: `Moyen: ${metrics.taux_absenteisme.toFixed(1)}% au-dessus du benchmark ${secteur} (${benchmark}%)`
      }
    } else {
      return {
        position: 'préoccupant',
        message: `Préoccupant: ${metrics.taux_absenteisme.toFixed(1)}% largement au-dessus du benchmark ${secteur} (${benchmark}%)`
      }
    }
  }
}

// Export instance singleton pour réutilisation
export const absenceCalculator = new AbsenceCalculator()