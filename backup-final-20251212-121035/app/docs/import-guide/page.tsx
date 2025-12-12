'use client'

import { motion } from 'framer-motion'
import { 
  Download, FileSpreadsheet, CheckCircle, AlertTriangle, 
  Upload, Play, Database, Shield, ArrowRight, BookOpen,
  Layers, Users, DollarSign, CalendarX, Building2, Info,
  Zap, Target, Clock, Award, HelpCircle, ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ImportGuidePage() {
  const router = useRouter()

  const steps = [
    {
      number: "01",
      title: "Télécharger le Template Excel",
      icon: Download,
      color: "from-cyan-500 to-blue-500",
      description: "Commencez par télécharger notre template Excel optimisé depuis le bouton en haut à droite de la page d'import.",
      details: [
        "Le template contient 5 onglets pré-formatés",
        "Chaque colonne est déjà nommée correctement",
        "Des exemples de données sont fournis pour vous guider",
        "Format compatible avec Excel et Google Sheets"
      ],
      tips: "Le template est conçu pour éviter les erreurs de format. Ne modifiez pas les noms des onglets ni des colonnes."
    },
    {
      number: "02",
      title: "Remplir l'onglet EMPLOYES",
      icon: Users,
      color: "from-purple-500 to-pink-500",
      description: "Renseignez les informations de vos collaborateurs dans l'onglet EMPLOYES.",
      details: [
        "Matricule : Identifiant unique de chaque employé (requis)",
        "Période : Format YYYY-MM-01, exemple : 2025-01-01 (requis)",
        "Type de contrat : CDI, CDD, Stage, Alternance, Interim",
        "Temps de travail : 1.0 pour temps plein, 0.8 pour 80%, etc.",
        "Date d'entrée et de sortie : Format YYYY-MM-DD"
      ],
      tips: "La période doit toujours être le premier jour du mois. Un même employé peut avoir plusieurs lignes pour différentes périodes."
    },
    {
      number: "03",
      title: "Compléter l'onglet REMUNERATION",
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
      description: "Ajoutez les données salariales mensuelles de vos collaborateurs.",
      details: [
        "Matricule : Doit correspondre à un employé de l'onglet EMPLOYES",
        "Mois de paie : Format YYYY-MM-01, exemple : 2025-01-01",
        "Salaire de base : Montant en euros sans symbole (requis)",
        "Primes : Fixes, variables, exceptionnelles (optionnel)",
        "Charges sociales : Cotisations employeur (optionnel)"
      ],
      tips: "Tous les montants sont en euros. Utilisez le point pour les décimales (ex: 3500.50)."
    },
    {
      number: "04",
      title: "Ajouter les ABSENCES",
      icon: CalendarX,
      color: "from-orange-500 to-red-500",
      description: "Enregistrez les absences de vos collaborateurs avec leurs types.",
      details: [
        "Matricule : Identifiant de l'employé concerné",
        "Type d'absence : Congés payés, Maladie, Formation, etc.",
        "Date début et fin : Format YYYY-MM-DD (requis)",
        "Justificatif fourni : Oui/Non (optionnel)",
        "Motif : Description libre (optionnel)"
      ],
      tips: "Le système calcule automatiquement la durée en jours ouvrés et calendaires."
    },
    {
      number: "05",
      title: "Configurer REFERENTIEL_ORGANISATION",
      icon: Building2,
      color: "from-violet-500 to-purple-500",
      description: "Définissez la structure organisationnelle de votre entreprise.",
      details: [
        "Code et nom du site (exemple : SIEGE, Siège social)",
        "Code et nom du centre de coût (exemple : IT-GEN, IT Général)",
        "Direction, département, service (optionnel)",
        "Budget annuel (optionnel)"
      ],
      tips: "Cette structure permet d'analyser vos KPIs par site, direction ou département."
    },
    {
      number: "06",
      title: "Paramétrer REFERENTIEL_ABSENCES",
      icon: Layers,
      color: "from-blue-500 to-cyan-500",
      description: "Configurez les types d'absences et leurs règles.",
      details: [
        "Type d'absence : Nom du type (exemple : Congés payés)",
        "Famille : Congés, Maladie, Formation, Autres",
        "Indemnisé : Oui/Non",
        "Taux d'indemnisation : 0.8 pour 80%, 1.0 pour 100%",
        "Comptabilisé dans l'absentéisme : Oui/Non"
      ],
      tips: "Des types par défaut sont créés automatiquement, mais vous pouvez les personnaliser."
    },
    {
      number: "07",
      title: "Vérifier et Uploader",
      icon: Upload,
      color: "from-pink-500 to-rose-500",
      description: "Vérifiez vos données puis uploadez le fichier sur la plateforme.",
      details: [
        "Vérifiez qu'il n'y a pas de cellules vides dans les colonnes requises",
        "Assurez-vous que les matricules sont cohérents entre onglets",
        "Glissez-déposez votre fichier ou cliquez pour parcourir",
        "Le système valide automatiquement vos données"
      ],
      tips: "Le système vous signalera toute erreur critique avant l'import. Vous pourrez les corriger directement."
    },
    {
      number: "08",
      title: "Validation Automatique",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      description: "Notre IA valide vos données et détecte les anomalies.",
      details: [
        "Vérification de la cohérence des matricules",
        "Validation des formats de dates",
        "Contrôle des montants (pas de valeurs négatives)",
        "Détection des doublons",
        "Score de qualité des données calculé"
      ],
      tips: "Les erreurs critiques bloquent l'import. Les avertissements peuvent être ignorés si intentionnels."
    }
  ]

  const commonErrors = [
    {
      error: "Format de date incorrect",
      solution: "Utilisez toujours le format YYYY-MM-DD (ex: 2025-01-15)",
      icon: AlertTriangle,
      color: "text-red-400"
    },
    {
      error: "Matricule manquant ou incohérent",
      solution: "Vérifiez que chaque employé a un matricule unique et identique dans tous les onglets",
      icon: AlertTriangle,
      color: "text-orange-400"
    },
    {
      error: "Période au mauvais format",
      solution: "La période doit toujours être le 1er du mois : YYYY-MM-01",
      icon: AlertTriangle,
      color: "text-yellow-400"
    },
    {
      error: "Montant avec virgule au lieu de point",
      solution: "Utilisez le point pour les décimales : 3500.50 et non 3500,50",
      icon: AlertTriangle,
      color: "text-amber-400"
    }
  ]

  const requiredFields = [
    { sheet: "EMPLOYES", fields: ["matricule", "periode", "date_entree", "type_contrat"] },
    { sheet: "REMUNERATION", fields: ["matricule", "mois_paie", "salaire_de_base"] },
    { sheet: "ABSENCES", fields: ["matricule", "type_absence", "date_debut"] },
    { sheet: "REFERENTIEL_ORGANISATION", fields: ["code_site", "nom_site", "code_cost_center"] },
    { sheet: "REFERENTIEL_ABSENCES", fields: ["type_absence", "famille"] }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/import">
                <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                  <ArrowRight size={20} className="text-slate-400 rotate-180" />
                </button>
              </Link>
              <div className="flex items-center gap-3">
                <BookOpen size={32} className="text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white font-mono">Guide d'Import</h1>
                  <p className="text-slate-400 text-sm">Documentation complète étape par étape</p>
                </div>
              </div>
            </div>
            <Link href="/import">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold hover:opacity-90 transition-all">
                <div className="flex items-center gap-2">
                  <Upload size={18} />
                  Commencer l'Import
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-2xl border border-slate-700/50 p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Bienvenue dans le guide d'import</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Ce guide vous accompagne pas à pas dans l'import de vos données RH. Notre système optimisé permet d'importer 
                  vos données d'effectifs, rémunérations et absences en quelques minutes seulement.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Clock size={20} className="text-green-400" />
                    <div>
                      <div className="text-white font-semibold text-sm">5 minutes</div>
                      <div className="text-slate-400 text-xs">Temps moyen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Shield size={20} className="text-blue-400" />
                    <div>
                      <div className="text-white font-semibold text-sm">100% sécurisé</div>
                      <div className="text-slate-400 text-xs">RGPD compliant</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <Zap size={20} className="text-purple-400" />
                    <div>
                      <div className="text-white font-semibold text-sm">Validation auto</div>
                      <div className="text-slate-400 text-xs">IA intégrée</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-2xl border border-slate-700/50 p-8 hover:border-slate-600/50 transition-all">
                <div className="flex items-start gap-6">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon size={28} className="text-white" />
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-slate-500 text-xs font-mono">{step.number}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-slate-300 mb-4">{step.description}</p>

                    {/* Details List */}
                    <div className="space-y-2 mb-4">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                          <span className="text-slate-400 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Award size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-blue-400 font-semibold text-sm">Conseil : </span>
                          <span className="text-blue-300 text-sm">{step.tips}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-8 bg-gradient-to-b from-slate-600 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Required Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-2xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Target size={24} className="text-purple-400" />
              Champs Obligatoires par Onglet
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {requiredFields.map((item, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    {item.sheet}
                  </h3>
                  <div className="space-y-2">
                    {item.fields.map((field, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-slate-300 font-mono">{field}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Common Errors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 rounded-2xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-400" />
              Erreurs Courantes et Solutions
            </h2>
            <div className="space-y-4">
              {commonErrors.map((item, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <item.icon size={20} className={`${item.color} mt-1 flex-shrink-0`} />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{item.error}</h3>
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle size={14} />
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Video Tutorial Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 p-8">
            <div className="text-center">
              <Play size={48} className="text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">Tutoriel Vidéo</h2>
              <p className="text-slate-300 mb-6">
                Regardez notre vidéo de démonstration pour voir l'import en action
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2">
                <Play size={20} />
                Regarder la démo (2 min)
              </button>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-2xl border border-cyan-500/30 p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Prêt à importer vos données ?</h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Vous avez maintenant toutes les clés pour réussir votre import. Notre système vous guidera à chaque étape.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/import">
                <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg hover:opacity-90 transition-all inline-flex items-center gap-3">
                  <Zap size={24} />
                  Commencer l'Import Maintenant
                  <ArrowRight size={20} />
                </button>
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              Besoin d'aide ? Contactez notre support à support@rhquantum.fr
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}