'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CalendarX, Activity, Timer, Users, TrendingDown, Stethoscope } from 'lucide-react'
import { CyberKPICard } from './CyberKPICard'
import { CyberSectionHeader } from './CyberSectionHeader'
import type { AbsenceKPIs } from '@/lib/types/dashboard'

interface CyberAbsenceSectionProps {
  data: AbsenceKPIs | null
  previousMonthData?: AbsenceKPIs | null
  previousYearData?: AbsenceKPIs | null
  loading?: boolean
}

export const CyberAbsenceSection: React.FC<CyberAbsenceSectionProps> = React.memo(({ 
  data,
  previousMonthData,
  previousYearData,
  loading = false 
}) => {
  if (loading) {
    return <AbsenceSkeleton />
  }

  if (!data) {
    return (
      <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400">Aucune donnée absences disponible</p>
      </div>
    )
  }

  const frequenceAbsence = data.nbSalariesAbsents > 0 
    ? data.nbAbsencesTotal / data.nbSalariesAbsents 
    : 0

  const previousMonthFrequence = previousMonthData && previousMonthData.nbSalariesAbsents > 0
    ? previousMonthData.nbAbsencesTotal / previousMonthData.nbSalariesAbsents
    : 0

  const previousYearFrequence = previousYearData && previousYearData.nbSalariesAbsents > 0
    ? previousYearData.nbAbsencesTotal / previousYearData.nbSalariesAbsents
    : 0

  // Calculs des évolutions - Taux Absentéisme (en points de %)
  const evolutionM1TauxAbsenteisme = previousMonthData
    ? data.tauxAbsenteisme - previousMonthData.tauxAbsenteisme
    : undefined
  const evolutionN1TauxAbsenteisme = previousYearData
    ? data.tauxAbsenteisme - previousYearData.tauxAbsenteisme
    : undefined

  // Calculs des évolutions - Jours d'Absence (en %)
  const evolutionM1JoursAbsence = previousMonthData && previousMonthData.nbJoursAbsence > 0
    ? ((data.nbJoursAbsence - previousMonthData.nbJoursAbsence) / previousMonthData.nbJoursAbsence) * 100
    : undefined
  const evolutionN1JoursAbsence = previousYearData && previousYearData.nbJoursAbsence > 0
    ? ((data.nbJoursAbsence - previousYearData.nbJoursAbsence) / previousYearData.nbJoursAbsence) * 100
    : undefined

  // Calculs des évolutions - Durée Moyenne (en %)
  const evolutionM1DureeMoyenne = previousMonthData && previousMonthData.dureeMoyenne > 0
    ? ((data.dureeMoyenne - previousMonthData.dureeMoyenne) / previousMonthData.dureeMoyenne) * 100
    : undefined
  const evolutionN1DureeMoyenne = previousYearData && previousYearData.dureeMoyenne > 0
    ? ((data.dureeMoyenne - previousYearData.dureeMoyenne) / previousYearData.dureeMoyenne) * 100
    : undefined

  // Calculs des évolutions - Salariés Absents (en %)
  const evolutionM1SalariesAbsents = previousMonthData && previousMonthData.nbSalariesAbsents > 0
    ? ((data.nbSalariesAbsents - previousMonthData.nbSalariesAbsents) / previousMonthData.nbSalariesAbsents) * 100
    : undefined
  const evolutionN1SalariesAbsents = previousYearData && previousYearData.nbSalariesAbsents > 0
    ? ((data.nbSalariesAbsents - previousYearData.nbSalariesAbsents) / previousYearData.nbSalariesAbsents) * 100
    : undefined

  // Calculs des évolutions - Fréquence Moyenne (en %)
  const evolutionM1Frequence = previousMonthFrequence > 0
    ? ((frequenceAbsence - previousMonthFrequence) / previousMonthFrequence) * 100
    : undefined
  const evolutionN1Frequence = previousYearFrequence > 0
    ? ((frequenceAbsence - previousYearFrequence) / previousYearFrequence) * 100
    : undefined

  // Calculs des évolutions - Jours Maladie (en %)
  const evolutionM1JoursMaladie = previousMonthData && previousMonthData.nbJoursMaladie > 0
    ? ((data.nbJoursMaladie - previousMonthData.nbJoursMaladie) / previousMonthData.nbJoursMaladie) * 100
    : undefined
  const evolutionN1JoursMaladie = previousYearData && previousYearData.nbJoursMaladie > 0
    ? ((data.nbJoursMaladie - previousYearData.nbJoursMaladie) / previousYearData.nbJoursMaladie) * 100
    : undefined

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <CyberSectionHeader 
        title="Analytics Absences" 
        icon={CalendarX} 
        gradient="bg-gradient-to-r from-red-500 via-pink-500 to-rose-600" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <CyberKPICard
          title="Taux d'Absentéisme"
          value={data.tauxAbsenteisme}
          format="percent"
          icon={Activity}
          gradient="bg-gradient-to-r from-red-500 to-red-600"
          subtitle="Jours absents / Jours théoriques"
          alert={data.tauxAbsenteisme > 8}
          evolutionM1={evolutionM1TauxAbsenteisme}
          evolutionN1={evolutionN1TauxAbsenteisme}
        />

        <CyberKPICard
          title="Total Jours d'Absence"
          value={data.nbJoursAbsence}
          format="number"
          icon={TrendingDown}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          subtitle="Jours perdus dans le mois"
          evolutionM1={evolutionM1JoursAbsence}
          evolutionN1={evolutionN1JoursAbsence}
        />

        <CyberKPICard
          title="Durée Moyenne"
          value={data.dureeMoyenne}
          format="decimal"
          icon={Timer}
          gradient="bg-gradient-to-r from-yellow-500 to-yellow-600"
          subtitle="jours par absence"
          evolutionM1={evolutionM1DureeMoyenne}
          evolutionN1={evolutionN1DureeMoyenne}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CyberKPICard
          title="Salariés Absents"
          value={data.nbSalariesAbsents}
          format="number"
          icon={Users}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          subtitle="personnes concernées"
          evolutionM1={evolutionM1SalariesAbsents}
          evolutionN1={evolutionN1SalariesAbsents}
        />

        <CyberKPICard
          title="Fréquence Moyenne"
          value={frequenceAbsence}
          format="decimal"
          icon={Activity}
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
          subtitle="absences / personne"
          evolutionM1={evolutionM1Frequence}
          evolutionN1={evolutionN1Frequence}
        />

        <CyberKPICard
          title="Jours Maladie"
          value={data.nbJoursMaladie}
          format="number"
          icon={Stethoscope}
          gradient="bg-gradient-to-r from-rose-500 to-rose-600"
          subtitle="arrêts maladie"
          evolutionM1={evolutionM1JoursMaladie}
          evolutionN1={evolutionN1JoursMaladie}
        />
      </div>
    </motion.section>
  )
})

const AbsenceSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

CyberAbsenceSection.displayName = 'CyberAbsenceSection'