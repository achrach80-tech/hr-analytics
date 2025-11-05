export interface KPIEvolution {
  value: number
  momPercent: number
  yoyPercent: number
  trend: 'up' | 'down' | 'neutral'
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

export interface FinancialsData {
  // Totaux mensuels
  total_salaire_brut: number
  total_salaire_de_base: number
  total_primes_fixes: number
  total_primes_variables: number
  total_primes_exceptionnelles: number
  total_heures_supp_payees: number
  total_avantages_nature: number
  total_indemnites: number
  
  // Charges
  total_cotisations_sociales: number
  total_taxes_sur_salaire: number
  total_autres_charges: number
  total_masse_salariale_chargee: number
  
  // Moyennes
  salaire_brut_moyen: number
  salaire_net_moyen: number
  masse_salariale_moyenne: number
  
  // Métadonnées
  nombre_bulletins: number
  periode: string
}

export interface AbsenceKPIs {
  tauxAbsenteisme: number
  nbJoursAbsence: number
  nbAbsencesTotal: number
  dureeMoyenne: number
  nbSalariesAbsents: number
  nbJoursMaladie: number
}

export interface Company {
  id: string
  nom: string
  subscription_plan?: string
}

export interface Establishment {
  id: string
  nom: string
  is_headquarters?: boolean
}

export interface OptimizedKPIData {
  workforce: WorkforceKPIs | null
  financials: FinancialsData | null
  absences: AbsenceKPIs | null
}