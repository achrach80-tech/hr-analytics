/**
 * 🎯 EFFECTS CALCULATOR v4.1 - Calculs Prix/Volume/Mix
 * 
 * Responsabilité: Calculer les effets Prix, Volume et Mix entre deux périodes
 * 
 * Formules v2.4 (garantie cohérence mathématique):
 * - Effet Prix = (Coût moyen M - Coût moyen M-1) × ETP M-1
 * - Effet Volume = (ETP M - ETP M-1) × Coût moyen M
 * - Variation = Effet Prix + Effet Volume (écart < 0.01€)
 * 
 * ✅ CORRECTION v4.1:
 * - Logs détaillés pour debugging
 * - Validation stricte des données entrantes
 * - Gestion des arrondis améliorée
 * 
 * @module EffectsCalculator
 * @version 4.1
 */

export interface SnapshotForEffects {
  masse_salariale_brute: number
  etp_fin_mois: number
  periode?: string // Pour logs
}

export interface PayrollEffects {
  // Bases de calcul
  cout_moyen_m: number
  cout_moyen_m_moins_1: number
  etp_m: number
  etp_m_moins_1: number
  
  // Effets calculés
  effet_prix: number
  effet_volume: number
  effet_mix: number // Toujours 0 pour l'instant (réservé pour évolutions futures)
  
  // Variations
  variation_masse_salariale: number
  variation_masse_salariale_pct: number
  
  // Validation cohérence
  coherence_ok: boolean
  ecart_coherence: number
  ecart_coherence_pct: number
}

export class EffectsCalculator {
  
  /**
   * Calcule les effets Prix/Volume entre deux périodes
   * 
   * @param snapshotM - Snapshot du mois courant
   * @param snapshotM1 - Snapshot du mois précédent (null si première période)
   * @returns PayrollEffects avec tous les calculs et validations
   */
  calculate(
    snapshotM: SnapshotForEffects,
    snapshotM1: SnapshotForEffects | null
  ): PayrollEffects {
    
    // Cas spécial: première période (pas de M-1)
    if (!snapshotM1) {
      console.log('ℹ️ EffectsCalculator: Première période (pas de M-1)')
      return this.getDefaultEffects()
    }
    
    // Extraction des valeurs
    const masseM = parseFloat(String(snapshotM.masse_salariale_brute)) || 0
    const masseM1 = parseFloat(String(snapshotM1.masse_salariale_brute)) || 0
    const etpM = parseFloat(String(snapshotM.etp_fin_mois)) || 0
    const etpM1 = parseFloat(String(snapshotM1.etp_fin_mois)) || 0
    
    // ============================================
    // LOGS DE DEBUGGING (pour tracker le bug Nov 2024)
    // ============================================
    console.group('🎯 EffectsCalculator - Calcul Détaillé')
    console.log('📅 Périodes:', {
      M: snapshotM.periode || 'N/A',
      M1: snapshotM1.periode || 'N/A'
    })
    console.log('📊 Données Brutes:', {
      masseM: masseM.toFixed(2),
      masseM1: masseM1.toFixed(2),
      etpM: etpM.toFixed(2),
      etpM1: etpM1.toFixed(2)
    })
    
    // Validation données
    if (masseM < 0 || masseM1 < 0 || etpM < 0 || etpM1 < 0) {
      console.error('❌ ERREUR: Valeurs négatives détectées!', {
        masseM,
        masseM1,
        etpM,
        etpM1
      })
      console.groupEnd()
      return this.getDefaultEffects()
    }
    
    if (etpM === 0 || etpM1 === 0) {
      console.warn('⚠️ ATTENTION: ETP = 0 détecté, impossible de calculer les effets')
      console.groupEnd()
      return this.getDefaultEffects()
    }
    
    // Calcul des coûts moyens par ETP
    const coutMoyenM = masseM / etpM
    const coutMoyenM1 = masseM1 / etpM1
    
    console.log('💰 Coûts Moyens:', {
      coutMoyenM: coutMoyenM.toFixed(2),
      coutMoyenM1: coutMoyenM1.toFixed(2),
      variation_cout: (coutMoyenM - coutMoyenM1).toFixed(2)
    })
    
    // ============================================
    // CALCUL EFFET PRIX (v2.4)
    // ============================================
    // Formule: (Coût moyen M - Coût moyen M-1) × ETP M-1
    // Interprétation: Impact de la variation du coût unitaire sur l'ancienne base d'effectif
    const effetPrix = (coutMoyenM - coutMoyenM1) * etpM1
    
    console.log('📈 Effet Prix:', {
      formule: '(CoutM - CoutM1) × ETPM1',
      calcul: `(${coutMoyenM.toFixed(2)} - ${coutMoyenM1.toFixed(2)}) × ${etpM1.toFixed(2)}`,
      resultat: effetPrix.toFixed(2)
    })
    
    // ============================================
    // CALCUL EFFET VOLUME (v2.4)
    // ============================================
    // Formule: (ETP M - ETP M-1) × Coût moyen M
    // Interprétation: Impact de la variation d'effectif au nouveau coût unitaire
    const effetVolume = (etpM - etpM1) * coutMoyenM
    
    console.log('👥 Effet Volume:', {
      formule: '(ETPM - ETPM1) × CoutM',
      calcul: `(${etpM.toFixed(2)} - ${etpM1.toFixed(2)}) × ${coutMoyenM.toFixed(2)}`,
      resultat: effetVolume.toFixed(2)
    })
    
    // ============================================
    // CALCUL VARIATION TOTALE
    // ============================================
    const variation = masseM - masseM1
    const variationPct = masseM1 > 0 ? (variation / masseM1) * 100 : 0
    
    console.log('📊 Variation:', {
      masse_m: masseM.toFixed(2),
      masse_m1: masseM1.toFixed(2),
      variation: variation.toFixed(2),
      variation_pct: variationPct.toFixed(2) + '%'
    })
    
    // ============================================
    // VALIDATION COHÉRENCE
    // ============================================
    // La somme Prix + Volume doit être égale à la variation réelle
    const sommeEffets = effetPrix + effetVolume
    const ecart = Math.abs(variation - sommeEffets)
    const ecartPct = variation !== 0 ? (ecart / Math.abs(variation)) * 100 : 0
    
    // Cohérence OK si écart < 1% (tolère arrondis)
    const coherenceOk = ecartPct < 1
    
    console.log('✅ Validation Cohérence:', {
      variation_reelle: variation.toFixed(2),
      somme_effets: sommeEffets.toFixed(2),
      ecart: ecart.toFixed(2),
      ecart_pct: ecartPct.toFixed(4) + '%',
      coherence: coherenceOk ? '✅ OK' : '❌ KO'
    })
    
    // Log d'alerte si incohérence
    if (!coherenceOk) {
      console.error('❌ INCOHÉRENCE DÉTECTÉE!', {
        periode_m: snapshotM.periode,
        periode_m1: snapshotM1.periode,
        variation,
        sommeEffets,
        ecart,
        ecartPct: `${ecartPct.toFixed(2)}%`,
        message: 'Les effets Prix + Volume ne correspondent pas à la variation réelle!'
      })
    }
    
    console.groupEnd()
    
    return {
      // Bases
      cout_moyen_m: this.round(coutMoyenM, 2),
      cout_moyen_m_moins_1: this.round(coutMoyenM1, 2),
      etp_m: this.round(etpM, 2),
      etp_m_moins_1: this.round(etpM1, 2),
      
      // Effets
      effet_prix: this.round(effetPrix, 2),
      effet_volume: this.round(effetVolume, 2),
      effet_mix: 0, // Réservé pour évolutions futures
      
      // Variations
      variation_masse_salariale: this.round(variation, 2),
      variation_masse_salariale_pct: this.round(variationPct, 2),
      
      // Validation
      coherence_ok: coherenceOk,
      ecart_coherence: this.round(ecart, 2),
      ecart_coherence_pct: this.round(ecartPct, 2)
    }
  }
  
  /**
   * Retourne des effets par défaut (première période)
   */
  private getDefaultEffects(): PayrollEffects {
    return {
      cout_moyen_m: 0,
      cout_moyen_m_moins_1: 0,
      etp_m: 0,
      etp_m_moins_1: 0,
      effet_prix: 0,
      effet_volume: 0,
      effet_mix: 0,
      variation_masse_salariale: 0,
      variation_masse_salariale_pct: 0,
      coherence_ok: true,
      ecart_coherence: 0,
      ecart_coherence_pct: 0
    }
  }
  
  /**
   * Arrondit un nombre avec précision
   */
  private round(value: number, decimals: number): number {
    if (!isFinite(value) || isNaN(value)) {
      console.warn('⚠️ Valeur non-finie détectée:', value)
      return 0
    }
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
  
  /**
   * Détecte si une période contient un 13ème mois
   * (utile pour l'analyse intelligente du waterfall)
   */
  detectPrimeAnnuelle(
    snapshotM: SnapshotForEffects & { primes_exceptionnelles_total?: number },
    snapshotM1: SnapshotForEffects & { primes_exceptionnelles_total?: number }
  ): {
    detected: boolean
    montant?: number
    pctMasse?: number
  } {
    
    const primesM = snapshotM.primes_exceptionnelles_total || 0
    const masseM = snapshotM.masse_salariale_brute
    
    // Détection: primes > 30% de la masse (probable 13ème mois)
    if (primesM > masseM * 0.3) {
      return {
        detected: true,
        montant: primesM,
        pctMasse: (primesM / masseM) * 100
      }
    }
    
    return { detected: false }
  }
  
  /**
   * Génère un commentaire intelligent sur les effets calculés
   */
  generateCommentary(effects: PayrollEffects): string[] {
    const comments: string[] = []
    
    const { effet_prix, effet_volume, variation_masse_salariale_pct } = effects
    
    // Analyse effet dominant
    if (Math.abs(effet_prix) > Math.abs(effet_volume) * 3) {
      if (effet_prix > 0) {
        comments.push(`📈 Hausse significative des coûts salariaux (+${this.formatEuro(effet_prix)}) - Augmentations ou promotions`)
      } else {
        comments.push(`📉 Économie réalisée sur les coûts salariaux (${this.formatEuro(effet_prix)}) - Restructuration ou baisses`)
      }
    }
    
    if (Math.abs(effet_volume) > Math.abs(effet_prix) * 3) {
      if (effet_volume > 0) {
        comments.push(`👥 Hausse de l'effectif = augmentation de coût (+${this.formatEuro(effet_volume)})`)
      } else {
        comments.push(`👥 Baisse d'effectif = économie réalisée (${this.formatEuro(effet_volume)})`)
      }
    }
    
    // Variation exceptionnelle
    if (Math.abs(variation_masse_salariale_pct) > 50) {
      comments.push(`⚡ Variation exceptionnelle de ${variation_masse_salariale_pct >= 0 ? '+' : ''}${variation_masse_salariale_pct.toFixed(0)}% vs mois précédent`)
    }
    
    // Équilibre
    if (effet_prix !== 0 && effet_volume !== 0 && 
        Math.abs(effet_prix - effet_volume) < Math.abs(effet_prix) * 0.3) {
      comments.push(`⚖️ Effets Prix et Volume contribuent de manière équilibrée`)
    }
    
    // Par défaut
    if (comments.length === 0) {
      if (variation_masse_salariale_pct > 0) {
        comments.push(`📊 Augmentation normale de la masse salariale (+${variation_masse_salariale_pct.toFixed(1)}%)`)
      } else if (variation_masse_salariale_pct < 0) {
        comments.push(`📊 Diminution de la masse salariale (${variation_masse_salariale_pct.toFixed(1)}%)`)
      } else {
        comments.push(`📊 Masse salariale stable ce mois`)
      }
    }
    
    return comments
  }
  
  /**
   * Formatte un montant en euros
   */
  private formatEuro(value: number): string {
    const abs = Math.abs(value)
    if (abs >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`
    }
    if (abs >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`
    }
    return `${value.toFixed(0)}€`
  }
}

// Export instance singleton pour réutilisation
export const effectsCalculator = new EffectsCalculator()