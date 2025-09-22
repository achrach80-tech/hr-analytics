'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import React from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle,
  Download, Building2, ArrowRight, X, Database, Server, Sparkles,
  TrendingUp, RefreshCw, Zap, Activity, FileCheck, BookOpen,
  ChevronRight, ChevronLeft, Settings, AlertTriangle, FileX,
  ShieldAlert, Clock, Users, ChevronDown, ChevronUp, Target,
  MapPin, Search, Filter, Copy, ExternalLink, Info, Bug, Wrench,
  Eye, EyeOff, History, Save, Shield, BarChart3, Cpu, Terminal,
  Code2, Gauge, HardDrive, Binary, Menu, Calendar, CheckSquare,
  FileDown, Layers, Package, PlayCircle, Hash, CheckCircle2,
  Microscope, Brain, FlaskConical, TestTube, Workflow, GitBranch,
  Boxes, Factory, UserCheck, UserX, UserPlus, TrendingDown,
  PieChart, LineChart, BarChart2, Percent, DollarSign, Clock3,
  Award, Star, Briefcase, GraduationCap, Heart, Coffee, Plane
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ==========================================
// ALL INTERFACES PROPERLY DEFINED
// ==========================================

interface Company {
  id: string
  nom: string
  code_entreprise?: string
  subscription_plan: string
  ai_features_enabled?: boolean
  max_establishments: number
  max_employees: number
}

interface Establishment {
  id: string
  entreprise_id: string
  nom: string
  code_etablissement: string
  is_default: boolean
  is_headquarters: boolean
  statut: string
}

interface ValidationError {
  id: string
  sheet: string
  row: number
  column: string
  field: string
  value: any
  message: string
  severity: 'critical' | 'warning' | 'info'
  canIgnore: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    totalErrors: number
    criticalErrors: number
    warningCount: number
    canProceed: boolean
    qualityScore: number
  }
}

interface ImportProgress {
  phase: 'validation' | 'processing' | 'snapshots' | 'completion'
  step: string
  current: number
  total: number
  percentage: number
  message: string
  detail?: string
}

interface ProcessedData {
  employees: any[]
  remunerations: any[]
  absences: any[]
  referentiel_organisation: any[]
  referentiel_absences: any[]
  metadata: {
    periods: string[]
    totalEmployees: number
    totalRecords: number
    establishments: string[]
  }
}

// Template interfaces
interface MonthData {
  period: string
  display: string
  monthNum: number
  daysInMonth: number
}

interface BaseEmployeeTemplate {
  matricule: string
  sexe: string
  date_naissance: string
  date_entree: string
  type_contrat: string
  temps_travail: number
  intitule_poste: string
  niveau_poste: string
  coefficient: number
  categorie: string
  code_cost_center: string
  code_site: string
  statut_emploi: string
  date_sortie?: string
  manager_matricule?: string
  motif_sortie?: string
  periods?: number[]
}

interface AbsenceTypeTemplate {
  type: string
  famille: string
  frequency: number
}

// ==========================================
// CONSTANTS
// ==========================================

const REQUIRED_SHEETS = ['EMPLOYES', 'REMUNERATION', 'ABSENCES', 'REFERENTIEL_ORGANISATION', 'REFERENTIEL_ABSENCES']
const MAX_FILE_SIZE = 50 * 1024 * 1024
const BATCH_SIZE = 100

const VALID_CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Stage', 'Intérim', 'Freelance', 'Apprentissage', 'Contrat Pro']
const VALID_EMPLOYMENT_STATUS = ['Actif', 'Inactif', 'Suspendu', 'Congé parental', 'Congé sabbatique']
const VALID_FAMILLE_ABSENCE = ['Congés', 'Maladie', 'Formation', 'Congés légaux', 'Accident', 'Familial', 'Autres']

// ==========================================
// SCHEMA-COMPLIANT TEMPLATE GENERATOR
// ==========================================

const generateSchemaCompliantTemplate = (): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new()
  
  // Generate months in YYYY-MM-DD format
  const months: MonthData[] = Array.from({ length: 12 }, (_, i) => {
    const year = 2024
    const month = i + 1
    return {
      period: `${year}-${String(month).padStart(2, '0')}-01`,
      display: new Date(year, i, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      monthNum: month,
      daysInMonth: new Date(year, i + 1, 0).getDate()
    }
  })

  // EMPLOYES sheet
  const employeesData: (string | number)[][] = [
    [
      'matricule', 'periode', 'sexe', 'date_naissance', 'date_entree', 'date_sortie', 
      'type_contrat', 'temps_travail', 'intitule_poste', 'niveau_poste', 'coefficient',
      'categorie', 'code_cost_center', 'code_site', 'manager_matricule', 'statut_emploi',
      'motif_sortie', 'import_batch_id'
    ]
  ]

  // Core employees data - properly typed
  const coreEmployees: BaseEmployeeTemplate[] = [
    {
      matricule: 'EMP001',
      sexe: 'F',
      date_naissance: '1985-06-15',
      date_entree: '2020-03-01',
      type_contrat: 'CDI',
      temps_travail: 1.0,
      intitule_poste: 'Directrice RH',
      niveau_poste: 'N5',
      coefficient: 450,
      categorie: 'Cadre',
      code_cost_center: 'RH-GEN',
      code_site: 'SIEGE',
      statut_emploi: 'Actif'
    },
    {
      matricule: 'EMP002',
      sexe: 'M',
      date_naissance: '1988-11-22',
      date_entree: '2019-09-15',
      type_contrat: 'CDI',
      temps_travail: 1.0,
      intitule_poste: 'Développeur Senior',
      niveau_poste: 'N4',
      coefficient: 400,
      categorie: 'Cadre',
      code_cost_center: 'IT-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP001',
      statut_emploi: 'Actif'
    },
    {
      matricule: 'EMP003',
      sexe: 'F',
      date_naissance: '1995-04-10',
      date_entree: '2021-06-01',
      type_contrat: 'CDI',
      temps_travail: 0.8,
      intitule_poste: 'Comptable',
      niveau_poste: 'N3',
      coefficient: 300,
      categorie: 'Non-cadre',
      code_cost_center: 'FIN-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP001',
      statut_emploi: 'Actif'
    },
    {
      matricule: 'EMP004',
      sexe: 'M',
      date_naissance: '1990-12-05',
      date_entree: '2022-01-15',
      type_contrat: 'CDI',
      temps_travail: 1.0,
      intitule_poste: 'Chef de Projet',
      niveau_poste: 'N4',
      coefficient: 380,
      categorie: 'Cadre',
      code_cost_center: 'IT-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP002',
      statut_emploi: 'Actif'
    },
    {
      matricule: 'EMP005',
      sexe: 'F',
      date_naissance: '1992-08-28',
      date_entree: '2023-11-10',
      type_contrat: 'CDI',
      temps_travail: 1.0,
      intitule_poste: 'Marketing Manager',
      niveau_poste: 'N4',
      coefficient: 350,
      categorie: 'Cadre',
      code_cost_center: 'COM-VTE',
      code_site: 'SIEGE',
      manager_matricule: 'EMP001',
      statut_emploi: 'Actif'
    }
  ]

  // Variable employees - properly typed
  const variableEmployees: BaseEmployeeTemplate[] = [
    {
      matricule: 'EMP006',
      sexe: 'M',
      date_naissance: '1987-03-18',
      date_entree: '2024-01-01',
      date_sortie: '2024-03-31',
      type_contrat: 'CDD',
      temps_travail: 1.0,
      intitule_poste: 'Data Analyst',
      niveau_poste: 'N3',
      coefficient: 320,
      categorie: 'Non-cadre',
      code_cost_center: 'IT-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP002',
      statut_emploi: 'Actif',
      motif_sortie: 'Fin de contrat',
      periods: [1, 2, 3]
    },
    {
      matricule: 'EMP007',
      sexe: 'F',
      date_naissance: '1996-09-25',
      date_entree: '2024-04-15',
      type_contrat: 'CDI',
      temps_travail: 1.0,
      intitule_poste: 'UX Designer',
      niveau_poste: 'N3',
      coefficient: 310,
      categorie: 'Non-cadre',
      code_cost_center: 'IT-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP002',
      statut_emploi: 'Actif',
      periods: [4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      matricule: 'EMP008',
      sexe: 'M',
      date_naissance: '2001-07-12',
      date_entree: '2024-06-01',
      date_sortie: '2024-08-31',
      type_contrat: 'Stage',
      temps_travail: 1.0,
      intitule_poste: 'Stagiaire Développement',
      niveau_poste: 'STAGE',
      coefficient: 150,
      categorie: 'Stagiaire',
      code_cost_center: 'IT-GEN',
      code_site: 'SIEGE',
      manager_matricule: 'EMP002',
      statut_emploi: 'Actif',
      motif_sortie: 'Fin de stage',
      periods: [6, 7, 8]
    }
  ]

  // Generate employee records for each month
  months.forEach((month) => {
    const monthNum = month.monthNum
    
    // Add core employees
    coreEmployees.forEach(emp => {
      const isPromotion = emp.matricule === 'EMP003' && monthNum >= 7
      
      employeesData.push([
        emp.matricule,
        month.period,
        emp.sexe,
        emp.date_naissance,
        emp.date_entree,
        emp.date_sortie || '',
        emp.type_contrat,
        isPromotion ? 1.0 : emp.temps_travail,
        isPromotion ? 'Comptable Senior' : emp.intitule_poste,
        emp.niveau_poste,
        isPromotion ? 330 : emp.coefficient,
        emp.categorie,
        emp.code_cost_center,
        emp.code_site,
        emp.manager_matricule || '',
        emp.statut_emploi,
        emp.motif_sortie || '',
        'TEMPLATE_2024'
      ])
    })

    // Add variable employees
    variableEmployees.forEach(emp => {
      if (!emp.periods || emp.periods.includes(monthNum)) {
        employeesData.push([
          emp.matricule,
          month.period,
          emp.sexe,
          emp.date_naissance,
          emp.date_entree,
          emp.date_sortie || '',
          emp.type_contrat,
          emp.temps_travail,
          emp.intitule_poste,
          emp.niveau_poste,
          emp.coefficient,
          emp.categorie,
          emp.code_cost_center,
          emp.code_site,
          emp.manager_matricule || '',
          emp.statut_emploi,
          emp.motif_sortie || '',
          'TEMPLATE_2024'
        ])
      }
    })
  })

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(employeesData), 'EMPLOYES')

  // REMUNERATION sheet
  const remunerationData: (string | number)[][] = [
    [
      'matricule', 'mois_paie', 'type_contrat', 'etp_paie', 'jours_travailles',
      'salaire_de_base', 'primes_fixes', 'primes_variables', 'primes_exceptionnelles',
      'heures_supp_payees', 'avantages_nature', 'indemnites',
      'cotisations_sociales', 'taxes_sur_salaire', 'autres_charges',
      'import_batch_id'
    ]
  ]

  const baseSalaries: Record<string, number> = {
    'EMP001': 5200, 'EMP002': 4200, 'EMP003': 2400, 'EMP004': 3800, 
    'EMP005': 4000, 'EMP006': 3500, 'EMP007': 3200, 'EMP008': 600
  }

  months.forEach((month) => {
    const monthNum = month.monthNum
    const isAfterIncrease = monthNum >= 7
    const increaseMultiplier = isAfterIncrease ? 1.03 : 1

    const presentEmployees = new Set<string>()
    
    coreEmployees.forEach(emp => presentEmployees.add(emp.matricule))
    
    variableEmployees.forEach(emp => {
      if (!emp.periods || emp.periods.includes(monthNum)) {
        presentEmployees.add(emp.matricule)
      }
    })

    presentEmployees.forEach(matricule => {
      const baseSalary = baseSalaries[matricule] || 3000
      const adjustedSalary = Math.round(baseSalary * increaseMultiplier)
      
      const allEmployees = [...coreEmployees, ...variableEmployees]
      const empRecord = allEmployees.find(e => e.matricule === matricule)
      const timeRatio = empRecord?.temps_travail || 1.0
      const contractType = empRecord?.type_contrat || 'CDI'
      
      const salaire_base = Math.round(adjustedSalary * timeRatio)
      const primes_fixes = Math.round(adjustedSalary * 0.1 * timeRatio)
      const primes_variables = monthNum % 3 === 0 ? Math.round(adjustedSalary * 0.15 * timeRatio) : Math.round(adjustedSalary * 0.05 * timeRatio)
      const primes_exceptionnelles = monthNum === 12 ? Math.round(adjustedSalary * 0.2 * timeRatio) : 0
      const heures_supp = contractType === 'CDI' && matricule.endsWith('2') ? Math.round(adjustedSalary * 0.05 * timeRatio) : 0
      const avantages_nature = contractType === 'CDI' ? Math.round(adjustedSalary * 0.02 * timeRatio) : 0
      const indemnites = 0
      
      const total_brut = salaire_base + primes_fixes + primes_variables + primes_exceptionnelles + heures_supp + avantages_nature + indemnites
      const cotisations_sociales = Math.round(total_brut * 0.23)
      const taxes_sur_salaire = Math.round(total_brut * 0.04)
      const autres_charges = Math.round(total_brut * 0.03)

      remunerationData.push([
        matricule,
        month.period,
        contractType,
        timeRatio,
        22,
        salaire_base,
        primes_fixes,
        primes_variables,
        primes_exceptionnelles,
        heures_supp,
        avantages_nature,
        indemnites,
        cotisations_sociales,
        taxes_sur_salaire,
        autres_charges,
        'TEMPLATE_2024'
      ])
    })
  })

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(remunerationData), 'REMUNERATION')

  // ABSENCES sheet
  const absencesData: (string | number | boolean)[][] = [
    [
      'matricule', 'type_absence', 'date_debut', 'date_fin',
      'heure_debut', 'heure_fin', 'motif', 'justificatif_fourni',
      'validation_status', 'validated_by', 'import_batch_id'
    ]
  ]

  const absenceTypes: AbsenceTypeTemplate[] = [
    { type: 'Congés payés', famille: 'Congés', frequency: 0.4 },
    { type: 'RTT', famille: 'Congés', frequency: 0.3 },
    { type: 'Maladie ordinaire', famille: 'Maladie', frequency: 0.2 },
    { type: 'Formation', famille: 'Formation', frequency: 0.15 },
    { type: 'Congé sans solde', famille: 'Congés', frequency: 0.05 },
    { type: 'Accident du travail', famille: 'Accident', frequency: 0.02 }
  ]

  months.forEach((month, monthIdx) => {
    const year = 2024
    const monthNum = month.monthNum
    
    const activeEmployees: string[] = []
    coreEmployees.forEach(emp => activeEmployees.push(emp.matricule))
    variableEmployees.forEach(emp => {
      if (!emp.periods || emp.periods.includes(monthNum)) {
        activeEmployees.push(emp.matricule)
      }
    })

    activeEmployees.forEach((matricule, empIdx) => {
      const seed = parseInt(matricule.slice(3)) + monthIdx
      if (seed % 3 === 0) {
        const absenceTypeIdx = (seed + empIdx) % absenceTypes.length
        const absenceType = absenceTypes[absenceTypeIdx]
        
        const startDay = (seed % month.daysInMonth) + 1
        const duration = absenceType.type.includes('Congé') ? Math.min((seed % 5) + 1, 5) : Math.min((seed % 3) + 1, 3)
        const endDay = Math.min(startDay + duration - 1, month.daysInMonth)
        
        absencesData.push([
          matricule,
          absenceType.type,
          `${year}-${String(monthNum).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
          `${year}-${String(monthNum).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
          '',
          '',
          `${absenceType.type} - ${month.display}`,
          absenceType.type.includes('Maladie'),
          'approved',
          'EMP001',
          'TEMPLATE_2024'
        ])
      }
    })
  })

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(absencesData), 'ABSENCES')

  // REFERENTIEL_ORGANISATION sheet
  const organisationData: (string | number | boolean)[][] = [
    [
      'code_direction', 'nom_direction', 'code_departement', 'nom_departement',
      'code_service', 'nom_service', 'code_cost_center', 'nom_cost_center',
      'code_site', 'nom_site', 'budget_annuel', 'budget_utilise', 'is_active',
      'valid_from', 'valid_to'
    ],
    ['DG', 'Direction Générale', 'ADMIN', 'Administration', 'ADMIN-GEN', 'Administration Générale', 'ADM-GEN', 'Admin Général', 'SIEGE', 'Siège Social', 500000, 0, true, '2024-01-01', ''],
    ['DG', 'Direction Générale', 'RH', 'Ressources Humaines', 'RH-GEN', 'RH Général', 'RH-GEN', 'RH Général', 'SIEGE', 'Siège Social', 300000, 0, true, '2024-01-01', ''],
    ['DG', 'Direction Générale', 'FIN', 'Finance', 'COMPTA', 'Comptabilité', 'FIN-GEN', 'Finance Général', 'SIEGE', 'Siège Social', 250000, 0, true, '2024-01-01', ''],
    ['TECH', 'Direction Technique', 'IT', 'Informatique', 'DEV', 'Développement', 'IT-GEN', 'IT Général', 'SIEGE', 'Siège Social', 800000, 0, true, '2024-01-01', ''],
    ['COM', 'Direction Commerciale', 'VENTE', 'Ventes', 'MARKETING', 'Marketing', 'COM-VTE', 'Commercial Ventes', 'SIEGE', 'Siège Social', 600000, 0, true, '2024-01-01', '']
  ]

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(organisationData), 'REFERENTIEL_ORGANISATION')

  // REFERENTIEL_ABSENCES sheet
  const absencesRefData: (string | number | boolean)[][] = [
    [
      'type_absence', 'code_absence', 'famille', 'indemnise', 'taux_indemnisation',
      'maintien_salaire', 'subrogation', 'comptabilise_absenteisme', 'comptabilise_effectif',
      'justificatif_requis', 'delai_carence_jours', 'duree_max_jours', 'is_active', 'ordre_affichage'
    ],
    ['Congés payés', 'CP', 'Congés', true, 1.0, true, false, false, true, false, 0, 25, true, 10],
    ['RTT', 'RTT', 'Congés', true, 1.0, true, false, false, true, false, 0, 15, true, 20],
    ['Congé sans solde', 'CSS', 'Congés', false, 0, false, false, false, false, true, 0, 365, true, 30],
    ['Maladie ordinaire', 'MAL', 'Maladie', true, 0.9, false, true, true, true, true, 3, 90, true, 40],
    ['Accident du travail', 'AT', 'Accident', true, 1.0, true, false, true, true, true, 0, 365, true, 50],
    ['Maladie professionnelle', 'MP', 'Maladie', true, 1.0, true, false, true, true, true, 0, 365, true, 60],
    ['Congé maternité', 'MAT', 'Congés légaux', true, 1.0, true, false, false, false, true, 0, 112, true, 70],
    ['Congé paternité', 'PAT', 'Congés légaux', true, 1.0, true, false, false, false, true, 0, 25, true, 80],
    ['Formation', 'FORM', 'Formation', true, 1.0, true, false, false, true, false, 0, 30, true, 100],
    ['Absence injustifiée', 'ABS', 'Autres', false, 0, false, false, true, true, false, 0, 5, true, 110]
  ]

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(absencesRefData), 'REFERENTIEL_ABSENCES')

  return wb
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const normalizeDate = (date: any): string | null => {
  if (!date) return null
  
  try {
    if (typeof date === 'number' && date > 0 && date < 100000) {
      const excelDate = new Date((date - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return excelDate.toISOString().split('T')[0]
      }
    }
    
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    const dateStr = String(date).trim()
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return null
  } catch {
    return null
  }
}

const normalizePeriod = (period: any): string => {
  if (!period) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  
  try {
    if (typeof period === 'number' && period > 0 && period < 100000) {
      const excelDate = new Date((period - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}-01`
      }
    }
    
    if (period instanceof Date && !isNaN(period.getTime())) {
      return `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`
    }
    
    const periodStr = String(period).trim()
    
    if (/^\d{4}-\d{2}-01$/.test(periodStr)) {
      return periodStr
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
      return periodStr.substring(0, 7) + '-01'
    }
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(periodStr)) {
      const [day, month, year] = periodStr.split('/')
      return `${year}-${month.padStart(2, '0')}-01`
    }
    
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
}

const sanitizeString = (str: any, maxLength = 255): string => {
  if (!str) return ''
  return String(str).trim().substring(0, maxLength)
}

const sanitizeNumber = (val: any, defaultValue = 0): number => {
  if (val === null || val === undefined || val === '') return defaultValue
  const num = parseFloat(String(val).replace(',', '.'))
  return isNaN(num) ? defaultValue : num
}

const parseBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val
  const str = String(val).trim().toLowerCase()
  return ['oui', 'yes', 'true', '1', 'o', 'y'].includes(str)
}

// ==========================================
// VALIDATION ENGINE
// ==========================================

const validateData = (data: ProcessedData): ValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let idCounter = 0
  
  data.employees.forEach((emp, index) => {
    const row = index + 2
    
    if (!emp.matricule) {
      errors.push({
        id: `err_${++idCounter}`,
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
      errors.push({
        id: `err_${++idCounter}`,
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
      errors.push({
        id: `err_${++idCounter}`,
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
    
    if (emp.type_contrat && !VALID_CONTRACT_TYPES.includes(emp.type_contrat)) {
      warnings.push({
        id: `warn_${++idCounter}`,
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
  })
  
  const employeeKeys = new Set(data.employees.map(e => `${e.matricule}_${e.periode}`))
  
  data.remunerations.forEach((rem, index) => {
    const row = index + 2
    const key = `${rem.matricule}_${rem.mois_paie}`
    
    if (!employeeKeys.has(key)) {
      warnings.push({
        id: `warn_${++idCounter}`,
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
  })
  
  const totalErrors = errors.length
  const criticalErrors = errors.filter(e => e.severity === 'critical').length
  const warningCount = warnings.length
  const qualityScore = Math.max(0, 100 - (criticalErrors * 10) - (warningCount * 2))
  
  return {
    isValid: criticalErrors === 0,
    errors,
    warnings,
    summary: {
      totalErrors,
      criticalErrors,
      warningCount,
      canProceed: criticalErrors === 0,
      qualityScore
    }
  }
}

// ==========================================
// COMPONENTS
// ==========================================

const StaticCyberpunkBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    )
  }

  const staticParticles = [
    { left: '10%', top: '20%', delay: '0s' },
    { left: '20%', top: '40%', delay: '1s' },
    { left: '30%', top: '60%', delay: '2s' },
    { left: '40%', top: '80%', delay: '0.5s' },
    { left: '50%', top: '30%', delay: '1.5s' },
    { left: '60%', top: '50%', delay: '2.5s' },
    { left: '70%', top: '70%', delay: '0.8s' },
    { left: '80%', top: '90%', delay: '1.8s' },
    { left: '90%', top: '10%', delay: '2.8s' },
    { left: '15%', top: '85%', delay: '0.3s' }
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      <div className="absolute inset-0">
        {staticParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full filter blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )
}

interface NeoBorderProps {
  children: React.ReactNode
  className?: string
  glowing?: boolean
}

const NeoBorder: React.FC<NeoBorderProps> = ({ children, className = '', glowing = false }) => (
  <div className={`relative ${className}`}>
    <div className={`absolute inset-0 rounded-xl ${glowing ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20' : 'bg-gradient-to-r from-slate-700/50 to-slate-600/50'} blur-sm`} />
    <div className="relative bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl">
      {children}
    </div>
  </div>
)

interface HolographicButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const HolographicButton: React.FC<HolographicButtonProps> = ({ 
  onClick, 
  children, 
  disabled = false, 
  variant = 'primary',
  size = 'md'
}) => {
  const variants = {
    primary: 'from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400',
    secondary: 'from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600',
    danger: 'from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl font-bold text-white transition-all duration-300
        ${sizes[size]}
        ${disabled 
          ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
          : `bg-gradient-to-r ${variants[variant]} transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25`
        }
      `}
    >
      <div className="relative z-10">{children}</div>
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  )
}

interface DataMatrixProps {
  data: ProcessedData | null
}

const DataMatrix: React.FC<DataMatrixProps> = ({ data }) => {
  if (!data) return null
  
  return (
    <NeoBorder className="mt-6" glowing>
      <div className="p-6">
        <h3 className="text-cyan-400 font-bold text-lg mb-4 flex items-center gap-2">
          <Binary size={20} />
          Matrice de Données
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-cyan-500/20">
            <div className="text-2xl font-bold text-cyan-400 font-mono">{data.metadata.totalEmployees}</div>
            <div className="text-xs text-slate-400 mt-1">EMPLOYÉS</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400 font-mono">{data.metadata.periods.length}</div>
            <div className="text-xs text-slate-400 mt-1">PÉRIODES</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400 font-mono">{data.remunerations.length}</div>
            <div className="text-xs text-slate-400 mt-1">PAIES</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400 font-mono">{data.absences.length}</div>
            <div className="text-xs text-slate-400 mt-1">ABSENCES</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-600/30">
            <span className="text-slate-400 text-sm">Périodes détectées:</span>
            <span className="text-cyan-400 font-mono text-sm">{data.metadata.periods.join(' • ')}</span>
          </div>
        </div>
      </div>
    </NeoBorder>
  )
}

interface ProgressPortalProps {
  progress: ImportProgress
  onCancel: () => void
}

const ProgressPortal: React.FC<ProgressPortalProps> = ({ progress, onCancel }) => (
  <NeoBorder className="mt-8" glowing>
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-cyan-400 font-bold text-xl flex items-center gap-3">
          <Cpu size={24} className="animate-spin" />
          Processus d'Injection de Données
        </h3>
        <HolographicButton onClick={onCancel} variant="danger" size="sm">
          <X size={16} />
          Avorter
        </HolographicButton>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-300 font-mono">{progress.step}</span>
          <span className="text-cyan-400 font-mono text-lg">{progress.percentage}%</span>
        </div>
        
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress.percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
        
        {progress.detail && (
          <div className="text-center">
            <p className="text-slate-400 text-sm font-mono">{progress.detail}</p>
          </div>
        )}
        
        <div className="flex justify-center space-x-2 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  </NeoBorder>
)

interface ValidationConsoleProps {
  validation: ValidationResult
}

const ValidationConsole: React.FC<ValidationConsoleProps> = ({ validation }) => (
  <NeoBorder className="mt-8">
    <div className="p-6">
      <h3 className="text-cyan-400 font-bold text-xl mb-4 flex items-center gap-3">
        <Shield size={24} />
        Console de Validation
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-600/30 text-center">
          <div className="text-2xl font-bold text-white font-mono">{validation.summary.totalErrors}</div>
          <div className="text-xs text-slate-400 mt-1">TOTAL</div>
        </div>
        
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 text-center">
          <div className="text-2xl font-bold text-red-400 font-mono">{validation.summary.criticalErrors}</div>
          <div className="text-xs text-slate-400 mt-1">CRITIQUES</div>
        </div>
        
        <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30 text-center">
          <div className="text-2xl font-bold text-yellow-400 font-mono">{validation.summary.warningCount}</div>
          <div className="text-xs text-slate-400 mt-1">WARNINGS</div>
        </div>
        
        <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30 text-center">
          <div className={`text-2xl font-bold font-mono ${validation.summary.canProceed ? 'text-green-400' : 'text-red-400'}`}>
            {validation.summary.qualityScore}%
          </div>
          <div className="text-xs text-slate-400 mt-1">QUALITÉ</div>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Erreurs Détectées
          </h4>
          {validation.errors.slice(0, 5).map(error => (
            <div key={error.id} className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle size={16} className="text-red-400" />
                <div className="flex-1 font-mono text-sm">
                  <span className="text-red-400">[{error.sheet}:L{error.row}]</span>
                  <span className="text-red-300 ml-2">{error.message}</span>
                </div>
              </div>
            </div>
          ))}
          {validation.errors.length > 5 && (
            <p className="text-slate-400 text-sm text-center font-mono">
              +{validation.errors.length - 5} autres anomalies détectées
            </p>
          )}
        </div>
      )}
    </div>
  </NeoBorder>
)

interface CyberSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onDownloadTemplate: () => void
  logs: string[]
}

const CyberSidebar: React.FC<CyberSidebarProps> = ({ isOpen, onToggle, onDownloadTemplate, logs }) => (
  <div className={`${isOpen ? 'w-80' : 'w-20'} transition-all duration-300 bg-gradient-to-b from-slate-950/95 to-slate-900/95 backdrop-blur-xl border-r border-cyan-500/30`}>
    <div className="p-6 border-b border-cyan-500/30">
      <div className="flex items-center justify-between">
        <h3 className={`text-cyan-400 font-bold ${isOpen ? 'text-xl' : 'text-sm'} transition-all font-mono`}>
          {isOpen ? 'CYBER TOOLS' : 'CT'}
        </h3>
        <button
          onClick={onToggle}
          className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors hover:bg-cyan-500/10 rounded-lg"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </div>

    <div className="p-6 space-y-6">
      <NeoBorder glowing>
        <div className="p-4">
          <div className={`flex items-center gap-3 ${isOpen ? '' : 'justify-center'}`}>
            <FlaskConical size={20} className="text-green-400" />
            {isOpen && <span className="text-green-400 font-bold">Template SQL</span>}
          </div>
          {isOpen && (
            <>
              <p className="text-slate-400 text-xs mt-2 mb-4">
                Template conforme au schéma SQL avec 12 mois de données réalistes
              </p>
              <HolographicButton onClick={onDownloadTemplate} size="sm">
                <Download size={16} className="mr-2" />
                Télécharger
              </HolographicButton>
            </>
          )}
        </div>
      </NeoBorder>

      {isOpen && logs.length > 0 && (
        <NeoBorder>
          <div className="p-4">
            <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
              <Terminal size={16} />
              Journal Système
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
              {logs.slice(-10).map((log, idx) => (
                <div key={idx} className="text-slate-400 border-l-2 border-cyan-500/30 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </NeoBorder>
      )}

      {isOpen && (
        <NeoBorder>
          <div className="p-4">
            <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
              <Database size={16} />
              Schéma SQL
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Format dates YYYY-MM-DD</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Types de données conformes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Contraintes respectées</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Relations intègres</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>KPIs calculables</span>
              </li>
            </ul>
          </div>
        </NeoBorder>
      )}
    </div>
  </div>
)

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CyberpunkImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'processing' | 'success' | 'error'>('idle')
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    phase: 'validation',
    step: '',
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [importLogs, setImportLogs] = useState<string[]>([])
  
  const supabase = createClient()
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    initializeCompany()
  }, [])

  const initializeCompany = async (): Promise<void> => {
    try {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)
      
      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select(`*, etablissements (*)`)
        .eq('id', session.company_id)
        .single()

      if (companyError) throw companyError

      setCompany(companyData as Company)
      const establishmentsData = companyData.etablissements || []
      setEstablishments(establishmentsData)
      
      const defaultEstablishment = establishmentsData.find((e: any) => e.is_headquarters) || establishmentsData[0]
      if (defaultEstablishment) {
        setSelectedEstablishment(defaultEstablishment as Establishment)
      }
    } catch (error) {
      console.error('Initialization error:', error)
      setError('ERREUR: Échec d\'initialisation du système')
    }
  }

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString()
    const icons = { info: '>', success: '✓', warning: '!', error: '✗' }
    setImportLogs(prev => [...prev, `${timestamp} [${icons[type]}] ${message}`])
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0]
    if (droppedFile) {
      if (droppedFile.size > MAX_FILE_SIZE) {
        setError(`ERREUR: Fichier excède la limite (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
        return
      }
      
      setFile(droppedFile)
      setImportStatus('idle')
      setError(null)
      setValidationResult(null)
      setProcessedData(null)
      setImportLogs([])
      analyzeFile(droppedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  })

  const analyzeFile = async (file: File): Promise<void> => {
    try {
      setImportStatus('validating')
      addLog('Initiation du scan de fichier', 'info')
      
      setImportProgress({
        phase: 'validation',
        step: 'Extraction des métadonnées',
        current: 10,
        total: 100,
        percentage: 10,
        message: 'Analyse en cours...'
      })

      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { 
        type: 'array',
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      })
      
      const missingSheets = REQUIRED_SHEETS.filter(sheet => !wb.SheetNames.includes(sheet))
      if (missingSheets.length > 0) {
        throw new Error(`Onglets manquants: ${missingSheets.join(', ')}`)
      }

      addLog('Structure validée - Onglets détectés', 'success')

      setImportProgress({
        phase: 'validation',
        step: 'Décompilation des données',
        current: 30,
        total: 100,
        percentage: 30,
        message: 'Lecture matricielle...'
      })

      const employees = XLSX.utils.sheet_to_json(wb.Sheets['EMPLOYES'], { defval: null })
      const remunerations = XLSX.utils.sheet_to_json(wb.Sheets['REMUNERATION'], { defval: null })
      const absences = XLSX.utils.sheet_to_json(wb.Sheets['ABSENCES'], { defval: null })
      const referentiel_organisation = XLSX.utils.sheet_to_json(wb.Sheets['REFERENTIEL_ORGANISATION'], { defval: null })
      const referentiel_absences = XLSX.utils.sheet_to_json(wb.Sheets['REFERENTIEL_ABSENCES'], { defval: null })

      addLog(`Données extraites: ${employees.length} employés`, 'info')

      setImportProgress({
        phase: 'validation',
        step: 'Normalisation quantique',
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Traitement algorithmique...'
      })

      const normalizedEmployees = employees.map((emp: any) => ({
        ...emp,
        periode: normalizePeriod(emp.periode),
        date_entree: normalizeDate(emp.date_entree),
        date_sortie: normalizeDate(emp.date_sortie),
        date_naissance: normalizeDate(emp.date_naissance),
        type_contrat: emp.type_contrat || 'CDI',
        temps_travail: sanitizeNumber(emp.temps_travail, 1),
        statut_emploi: emp.statut_emploi || 'Actif'
      }))

      const normalizedRemunerations = remunerations.map((rem: any) => ({
        ...rem,
        mois_paie: normalizePeriod(rem.mois_paie),
        salaire_de_base: sanitizeNumber(rem.salaire_de_base),
        primes_fixes: sanitizeNumber(rem.primes_fixes),
        primes_variables: sanitizeNumber(rem.primes_variables),
        cotisations_sociales: sanitizeNumber(rem.cotisations_sociales)
      }))

      const normalizedAbsences = absences.map((abs: any) => ({
        ...abs,
        date_debut: normalizeDate(abs.date_debut),
        date_fin: normalizeDate(abs.date_fin)
      }))

      const normalizedRefAbsences = referentiel_absences.map((ref: any) => ({
        ...ref,
        indemnise: parseBoolean(ref.indemnise),
        comptabilise_absenteisme: parseBoolean(ref.comptabilise_absenteisme)
      }))

      const periods = [...new Set([
        ...normalizedEmployees.map(e => e.periode),
        ...normalizedRemunerations.map(r => r.mois_paie)
      ])].filter(Boolean).sort()

      addLog(`Périodes temporelles: ${periods.join(' | ')}`, 'info')

      const processedData: ProcessedData = {
        employees: normalizedEmployees,
        remunerations: normalizedRemunerations,
        absences: normalizedAbsences,
        referentiel_organisation,
        referentiel_absences: normalizedRefAbsences,
        metadata: {
          periods,
          totalEmployees: normalizedEmployees.length,
          totalRecords: normalizedEmployees.length + normalizedRemunerations.length + normalizedAbsences.length,
          establishments: [...new Set(normalizedEmployees.map(e => e.code_site).filter(Boolean))]
        }
      }

      setProcessedData(processedData)

      setImportProgress({
        phase: 'validation',
        step: 'Validation intégrité',
        current: 80,
        total: 100,
        percentage: 80,
        message: 'Vérification systémique...'
      })

      const validation = validateData(processedData)
      setValidationResult(validation)

      if (validation.summary.criticalErrors > 0) {
        addLog(`${validation.summary.criticalErrors} erreur(s) critique(s)`, 'error')
      } else {
        addLog('Validation réussie - Système prêt', 'success')
      }

      setImportProgress({
        phase: 'validation',
        step: 'Analyse terminée',
        current: 100,
        total: 100,
        percentage: 100,
        message: validation.summary.canProceed ? 'PRÊT POUR INJECTION' : 'CORRECTIONS REQUISES'
      })

      setImportStatus('idle')
    } catch (error) {
      console.error('Analysis error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur système inconnue'
      setError(`ERREUR CRITIQUE: ${errorMessage}`)
      addLog(errorMessage, 'error')
      setImportStatus('error')
    }
  }

  const processImport = async (): Promise<void> => {
    if (!processedData || !selectedEstablishment || !validationResult?.summary.canProceed) {
      setError('ERREUR: Pré-requis non satisfaits')
      return
    }

    try {
      setImportStatus('processing')
      setError(null)
      setImportLogs([])
      abortControllerRef.current = new AbortController()
      
      const batchId = `CYBER-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const { employees, remunerations, absences, referentiel_organisation, referentiel_absences, metadata } = processedData

      addLog(`Initiation injection - ${metadata.totalRecords} entités`, 'info')

      setImportProgress({
        phase: 'processing',
        step: 'Initialisation matrices',
        current: 5,
        total: 100,
        percentage: 5,
        message: 'Connexion base...'
      })

      await supabase.from('import_batches').insert({
        id: batchId,
        etablissement_id: selectedEstablishment.id,
        file_name: file?.name || 'import.xlsx',
        status: 'processing',
        periods_imported: metadata.periods
      })

      if (referentiel_organisation.length > 0) {
        setImportProgress({
          phase: 'processing',
          step: 'Injection référentiels',
          current: 10,
          total: 100,
          percentage: 10,
          message: 'Structure organisationnelle...'
        })

        const orgData = referentiel_organisation.map(org => ({
          etablissement_id: selectedEstablishment.id,
          code_site: sanitizeString(org.code_site, 20),
          nom_site: sanitizeString(org.nom_site),
          code_cost_center: sanitizeString(org.code_cost_center, 20),
          nom_cost_center: sanitizeString(org.nom_cost_center),
          is_active: parseBoolean(org.is_active)
        }))

        const { error: orgError } = await supabase
          .from('referentiel_organisation')
          .upsert(orgData, { onConflict: 'etablissement_id,code_cost_center,code_site' })

        if (orgError) throw orgError
        addLog('Référentiel organisation injecté', 'success')
      }

      if (referentiel_absences.length > 0) {
        const absTypesData = referentiel_absences.map(abs => ({
          etablissement_id: selectedEstablishment.id,
          type_absence: sanitizeString(abs.type_absence, 100),
          famille: abs.famille || 'Autres',
          indemnise: parseBoolean(abs.indemnise),
          comptabilise_absenteisme: parseBoolean(abs.comptabilise_absenteisme),
          is_active: parseBoolean(abs.is_active)
        }))

        const { error: absError } = await supabase
          .from('referentiel_absences')
          .upsert(absTypesData, { onConflict: 'etablissement_id,type_absence' })

        if (absError) throw absError
        addLog('Référentiel absences injecté', 'success')
      }

      setImportProgress({
        phase: 'processing',
        step: 'Injection entités employés',
        current: 20,
        total: 100,
        percentage: 20,
        message: `0/${employees.length}`
      })

      const employeeMap = new Map<string, string>()
      
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) throw new Error('Processus avorté')
        
        const batch = employees.slice(i, i + BATCH_SIZE)
        const employeesData = batch.map(emp => ({
          etablissement_id: selectedEstablishment.id,
          matricule: sanitizeString(emp.matricule, 50),
          periode: emp.periode,
          sexe: emp.sexe || null,
          date_naissance: emp.date_naissance,
          date_entree: emp.date_entree || '2020-01-01',
          date_sortie: emp.date_sortie,
          type_contrat: emp.type_contrat,
          temps_travail: emp.temps_travail,
          intitule_poste: sanitizeString(emp.intitule_poste || 'Non spécifié'),
          code_cost_center: sanitizeString(emp.code_cost_center),
          code_site: sanitizeString(emp.code_site),
          statut_emploi: emp.statut_emploi,
          import_batch_id: batchId
        }))

        const { data: insertedEmployees, error: empError } = await supabase
          .from('employes')
          .upsert(employeesData, { onConflict: 'etablissement_id,matricule,periode' })
          .select('id, matricule, periode')

        if (empError) throw empError

        insertedEmployees?.forEach(emp => {
          employeeMap.set(`${emp.matricule}_${emp.periode}`, emp.id)
        })

        const processed = Math.min(i + BATCH_SIZE, employees.length)
        setImportProgress({
          phase: 'processing',
          step: 'Injection entités employés',
          current: 20 + Math.round((processed / employees.length) * 20),
          total: 100,
          percentage: 20 + Math.round((processed / employees.length) * 20),
          message: `${processed}/${employees.length}`
        })
      }

      addLog(`${employees.length} entités employés injectées`, 'success')

      setImportProgress({
        phase: 'processing',
        step: 'Injection matrices salariales',
        current: 40,
        total: 100,
        percentage: 40,
        message: `0/${remunerations.length}`
      })

      for (let i = 0; i < remunerations.length; i += BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) throw new Error('Processus avorté')
        
        const batch = remunerations.slice(i, i + BATCH_SIZE)
        const remunerationsData = batch.map(rem => ({
          etablissement_id: selectedEstablishment.id,
          employe_id: employeeMap.get(`${rem.matricule}_${rem.mois_paie}`) || null,
          matricule: sanitizeString(rem.matricule, 50),
          mois_paie: rem.mois_paie,
          salaire_de_base: sanitizeNumber(rem.salaire_de_base),
          primes_fixes: sanitizeNumber(rem.primes_fixes),
          primes_variables: sanitizeNumber(rem.primes_variables),
          cotisations_sociales: sanitizeNumber(rem.cotisations_sociales),
          import_batch_id: batchId
        }))

        const { error: remError } = await supabase
          .from('remunerations')
          .upsert(remunerationsData, { onConflict: 'etablissement_id,matricule,mois_paie' })

        if (remError) throw remError

        const processed = Math.min(i + BATCH_SIZE, remunerations.length)
        setImportProgress({
          phase: 'processing',
          step: 'Injection matrices salariales',
          current: 40 + Math.round((processed / remunerations.length) * 20),
          total: 100,
          percentage: 40 + Math.round((processed / remunerations.length) * 20),
          message: `${processed}/${remunerations.length}`
        })
      }

      addLog(`${remunerations.length} matrices salariales injectées`, 'success')

      if (absences.length > 0) {
        setImportProgress({
          phase: 'processing',
          step: 'Injection patterns d\'absences',
          current: 60,
          total: 100,
          percentage: 60,
          message: `0/${absences.length}`
        })

        for (let i = 0; i < absences.length; i += BATCH_SIZE) {
          if (abortControllerRef.current?.signal.aborted) throw new Error('Processus avorté')
          
          const batch = absences.slice(i, i + BATCH_SIZE)
          const absencesData = batch.filter(abs => abs.date_debut).map(abs => ({
            etablissement_id: selectedEstablishment.id,
            matricule: sanitizeString(abs.matricule, 50),
            type_absence: sanitizeString(abs.type_absence, 100),
            date_debut: abs.date_debut,
            date_fin: abs.date_fin || abs.date_debut,
            import_batch_id: batchId
          }))

          if (absencesData.length > 0) {
            const { error: absError } = await supabase
              .from('absences')
              .upsert(absencesData, { onConflict: 'etablissement_id,matricule,date_debut,type_absence' })

            if (absError) throw absError
          }

          const processed = Math.min(i + BATCH_SIZE, absences.length)
          setImportProgress({
            phase: 'processing',
            step: 'Injection patterns d\'absences',
            current: 60 + Math.round((processed / absences.length) * 10),
            total: 100,
            percentage: 60 + Math.round((processed / absences.length) * 10),
            message: `${processed}/${absences.length}`
          })
        }

        addLog(`${absences.length} patterns d'absences injectés`, 'success')
      }

      setImportProgress({
        phase: 'snapshots',
        step: 'Calcul KPIs quantiques',
        current: 70,
        total: 100,
        percentage: 70,
        message: 'Initialisation algorithmes...'
      })

      const snapshotResults = []
      
      for (let idx = 0; idx < metadata.periods.length; idx++) {
        const period = metadata.periods[idx]
        const normalizedPeriod = normalizePeriod(period)
        
        setImportProgress({
          phase: 'snapshots',
          step: 'Calcul KPIs quantiques',
          current: 70 + Math.round((idx / metadata.periods.length) * 25),
          total: 100,
          percentage: 70 + Math.round((idx / metadata.periods.length) * 25),
          message: `Analyse ${idx + 1}/${metadata.periods.length}`,
          detail: `Période ${normalizedPeriod} en cours d'analyse...`
        })

        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'calculate_snapshot_for_period',
            {
              p_etablissement_id: selectedEstablishment.id,
              p_periode: normalizedPeriod,
              p_force: true
            }
          )

          if (rpcError) {
            console.error(`RPC error for ${normalizedPeriod}:`, rpcError)
            addLog(`Erreur KPI ${normalizedPeriod}: ${rpcError.message}`, 'warning')
            snapshotResults.push({ period: normalizedPeriod, success: false, error: rpcError.message })
          } else {
            const { data: verifySnapshot, error: verifyError } = await supabase
              .from('snapshots_mensuels')
              .select('id, periode, effectif_fin_mois, calculated_at')
              .eq('etablissement_id', selectedEstablishment.id)
              .eq('periode', normalizedPeriod)
              .single()

            if (verifySnapshot) {
              addLog(`KPIs calculés pour ${normalizedPeriod}`, 'success')
              snapshotResults.push({ period: normalizedPeriod, success: true, data: verifySnapshot })
            } else {
              addLog(`KPIs non vérifiés pour ${normalizedPeriod}`, 'warning')
              snapshotResults.push({ period: normalizedPeriod, success: false, error: 'Non vérifié' })
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`Snapshot error for ${normalizedPeriod}:`, error)
          addLog(`Erreur KPI ${normalizedPeriod}: ${errorMessage}`, 'error')
          snapshotResults.push({ period: normalizedPeriod, success: false, error: errorMessage })
        }
      }

      const successfulSnapshots = snapshotResults.filter(r => r.success).length
      const failedSnapshots = snapshotResults.filter(r => !r.success).length

      if (successfulSnapshots === 0) {
        throw new Error('Échec total du calcul des KPIs')
      }

      if (failedSnapshots > 0) {
        addLog(`${failedSnapshots} période(s) sans KPI`, 'warning')
      }

      setImportProgress({
        phase: 'completion',
        step: 'Finalisation système',
        current: 95,
        total: 100,
        percentage: 95,
        message: 'Persistance données...'
      })

      await supabase.from('import_batches').update({
        status: 'completed',
        nb_employes_imported: employees.length,
        nb_remunerations_imported: remunerations.length,
        nb_absences_imported: absences.length,
        completed_at: new Date().toISOString()
      }).eq('id', batchId)

      setImportProgress({
        phase: 'completion',
        step: 'INJECTION RÉUSSIE',
        current: 100,
        total: 100,
        percentage: 100,
        message: `${metadata.totalRecords} entités • ${successfulSnapshots} KPIs calculés`
      })

      addLog(`Mission accomplie: ${successfulSnapshots}/${metadata.periods.length} périodes`, 'success')
      setImportStatus('success')

      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error) {
      console.error('Import error:', error)
      let errorMessage = 'Erreur système critique'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = (error as any).message
        }
      }
      
      setError(`ERREUR FATALE: ${errorMessage}`)
      addLog(errorMessage, 'error')
      setImportStatus('error')
    }
  }

  const downloadTemplate = (): void => {
    const wb = generateSchemaCompliantTemplate()
    XLSX.writeFile(wb, `HR_Template_SQL_Compliant_${new Date().toISOString().split('T')[0]}.xlsx`)
    addLog('Template conforme SQL téléchargé - 12 mois de données', 'success')
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <StaticCyberpunkBackground />
      
      <div className="relative z-10 flex min-h-screen">
        <CyberSidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onDownloadTemplate={downloadTemplate}
          logs={importLogs}
        />

        <div className="flex-1 container max-w-6xl mx-auto px-8 py-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-900/70 to-slate-800/70 border border-cyan-500/30 rounded-2xl backdrop-blur-sm mb-6">
              <Database size={20} className="text-cyan-400" />
              <span className="text-cyan-400 font-mono text-sm">CYBER-HR SYSTEM v4.2</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-mono">
              DATA INJECTION PORTAL
            </h1>
            
            <p className="text-slate-400 text-lg font-mono">
              Interface de chargement matriciel pour génération automatique de KPIs
            </p>

            {company && selectedEstablishment && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <NeoBorder>
                  <div className="px-4 py-2">
                    <span className="text-cyan-400 text-sm font-mono">{company.nom}</span>
                  </div>
                </NeoBorder>
                <NeoBorder>
                  <div className="px-4 py-2">
                    <span className="text-purple-400 text-sm font-mono">{selectedEstablishment.nom}</span>
                  </div>
                </NeoBorder>
              </div>
            )}
          </div>

          {error && (
            <NeoBorder className="mb-8">
              <div className="p-6 bg-red-900/20">
                <div className="flex items-center gap-3">
                  <XCircle size={24} className="text-red-400" />
                  <div className="flex-1">
                    <p className="text-red-400 font-bold font-mono">ERREUR SYSTÈME</p>
                    <p className="text-red-300 text-sm mt-1 font-mono">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)} 
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </NeoBorder>
          )}

          <NeoBorder className={`${isDragActive ? 'scale-[1.02]' : ''} transition-transform duration-300`} glowing={isDragActive || !!file}>
            <div
              {...getRootProps()}
              className={`p-16 text-center cursor-pointer transition-all duration-500 ${
                isDragActive 
                  ? 'bg-cyan-500/10' 
                  : file
                  ? 'bg-green-500/5'
                  : 'bg-slate-900/30'
              }`}
            >
              <input {...getInputProps()} />
              
              {file ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto relative">
                    <FileCheck size={40} className="text-white" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-2xl" />
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2 font-mono">{file.name}</h3>
                    <p className="text-slate-400 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  <DataMatrix data={processedData} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <Upload size={64} className="text-cyan-400 mx-auto" />
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-full filter blur-xl animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2 font-mono">
                      {isDragActive ? 'INITIALISATION DU TRANSFERT' : 'INTERFACE DE CHARGEMENT'}
                    </h3>
                    <p className="text-slate-400 font-mono">
                      {isDragActive ? 'Relâchez pour commencer l\'analyse' : 'Glissez votre fichier Excel ou cliquez pour sélectionner'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-mono">
                    <span>XLSX/XLS</span>
                    <span>•</span>
                    <span>Max 50MB</span>
                    <span>•</span>
                    <span>5 modules requis</span>
                  </div>
                </div>
              )}
            </div>
          </NeoBorder>

          {validationResult && <ValidationConsole validation={validationResult} />}

          {importStatus === 'processing' && <ProgressPortal progress={importProgress} onCancel={() => {
            abortControllerRef.current?.abort()
            setImportStatus('idle')
          }} />}

          {importStatus === 'success' && (
            <NeoBorder className="mt-8" glowing>
              <div className="p-10 text-center">
                <div className="relative inline-block">
                  <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
                  <div className="absolute inset-0 bg-green-400/20 rounded-full filter blur-xl animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-mono">MISSION ACCOMPLIE</h3>
                <p className="text-green-400 mb-6 font-mono">{importProgress.message}</p>
                <div className="flex items-center justify-center gap-4">
                  <HolographicButton onClick={() => router.push('/dashboard')}>
                    <BarChart3 size={20} className="mr-2" />
                    Dashboard Analytique
                  </HolographicButton>
                  <HolographicButton onClick={() => window.location.reload()} variant="secondary">
                    <RefreshCw size={20} className="mr-2" />
                    Nouvelle Mission
                  </HolographicButton>
                </div>
              </div>
            </NeoBorder>
          )}

          {file && processedData && validationResult && importStatus === 'idle' && (
            <div className="mt-8 text-center">
              <HolographicButton
                onClick={processImport}
                disabled={!validationResult.summary.canProceed || !selectedEstablishment}
                size="lg"
              >
                {validationResult.summary.canProceed ? (
                  <>
                    <Zap size={24} className="mr-3" />
                    LANCER L'INJECTION
                  </>
                ) : (
                  'CORRECTIONS REQUISES'
                )}
              </HolographicButton>
              
              {validationResult.summary.canProceed && (
                <p className="text-cyan-400 text-sm mt-4 font-mono">
                  Prêt pour l'injection de {processedData.metadata.totalRecords} entités
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}