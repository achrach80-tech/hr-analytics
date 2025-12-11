// components/builder/PyramidPreview.tsx
'use client'

import React from 'react'

interface PyramidPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kpiData?: any
}

// 🎨 PYRAMIDE DES ÂGES - Style Dashboard
export function PyramidAgesPreview({ kpiData }: PyramidPreviewProps) {
  // Données mockées (pour le moment)
  const ageGroups = [
    { label: '> 55 ans', hommes: 0.0, femmes: 0.0 },
    { label: '45-55 ans', hommes: 0.0, femmes: 0.0 },
    { label: '35-45 ans', hommes: 16.8, femmes: 20.5 },
    { label: '25-35 ans', hommes: 21.2, femmes: 25.8 },
    { label: '< 25 ans', hommes: 7.1, femmes: 8.6 }
  ]

  // Calculer la valeur max pour normaliser les barres
  const maxValue = Math.max(
    ...ageGroups.flatMap(g => [g.hommes, g.femmes]),
    1
  )

  return (
    <div className="h-full w-full relative p-4 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-white font-bold text-base">
            <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              Pyramide des Âges
            </span>
          </h3>
          
          {/* Légendes H/F */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
              <span className="text-slate-300 text-xs font-semibold">HOMMES</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" />
              <span className="text-slate-300 text-xs font-semibold">FEMMES</span>
            </div>
          </div>
        </div>

        {/* Pyramide */}
        <div className="flex-1 flex flex-col justify-between gap-2">
          {ageGroups.map((group, index) => (
            <div key={group.label} className="flex items-stretch gap-2 flex-1">
              
              {/* HOMMES (gauche) */}
              <div className="flex-1 flex justify-end items-center">
                <div className="relative h-full bg-slate-800/50 rounded-l-xl overflow-hidden border-l border-y border-slate-700/30 w-full flex items-center">
                  {/* Barre animée bleue */}
                  <div 
                    className="absolute right-0 h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${(group.hommes / maxValue) * 100}%` }}
                  />
                  {/* Pourcentage */}
                  {group.hommes > 0 && (
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-white font-bold text-xs z-10">
                        {group.hommes.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* LABEL CENTRAL */}
              <div className="px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-xl min-w-[90px] text-center flex items-center justify-center">
                <span className="text-white font-semibold text-xs">{group.label}</span>
              </div>

              {/* FEMMES (droite) */}
              <div className="flex-1 flex items-center">
                <div className="relative h-full bg-slate-800/50 rounded-r-xl overflow-hidden border-r border-y border-slate-700/30 w-full flex items-center">
                  {/* Barre animée rose */}
                  <div 
                    className="absolute left-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 transition-all duration-700"
                    style={{ width: `${(group.femmes / maxValue) * 100}%` }}
                  />
                  {/* Pourcentage */}
                  {group.femmes > 0 && (
                    <div className="absolute inset-0 flex items-center justify-start pl-2">
                      <span className="text-white font-bold text-xs z-10">
                        {group.femmes.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 🎨 PYRAMIDE DES ANCIENNETÉS - Style Dashboard
export function PyramidAnciennetesPreview({ kpiData }: PyramidPreviewProps) {
  // Données mockées (pour le moment)
  const seniorityGroups = [
    { label: '> 10 ans', hommes: 0.0, femmes: 0.0 },
    { label: '5-10 ans', hommes: 8.0, femmes: 9.7 },
    { label: '3-5 ans', hommes: 12.4, femmes: 15.1 },
    { label: '1-3 ans', hommes: 20.3, femmes: 24.8 },
    { label: '< 1 an', hommes: 4.4, femmes: 5.4 }
  ]

  // Calculer la valeur max pour normaliser les barres
  const maxValue = Math.max(
    ...seniorityGroups.flatMap(g => [g.hommes, g.femmes]),
    1
  )

  return (
    <div className="h-full w-full relative p-4 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-white font-bold text-base">
            <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              Pyramide des Anciennetés
            </span>
          </h3>
          
          {/* Légendes H/F */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
              <span className="text-slate-300 text-xs font-semibold">HOMMES</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" />
              <span className="text-slate-300 text-xs font-semibold">FEMMES</span>
            </div>
          </div>
        </div>

        {/* Pyramide */}
        <div className="flex-1 flex flex-col justify-between gap-2">
          {seniorityGroups.map((group, index) => (
            <div key={group.label} className="flex items-stretch gap-2 flex-1">
              
              {/* HOMMES (gauche) */}
              <div className="flex-1 flex justify-end items-center">
                <div className="relative h-full bg-slate-800/50 rounded-l-xl overflow-hidden border-l border-y border-slate-700/30 w-full flex items-center">
                  {/* Barre animée bleue */}
                  <div 
                    className="absolute right-0 h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${(group.hommes / maxValue) * 100}%` }}
                  />
                  {/* Pourcentage */}
                  {group.hommes > 0 && (
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-white font-bold text-xs z-10">
                        {group.hommes.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* LABEL CENTRAL */}
              <div className="px-3 py-1 bg-slate-900/90 border border-slate-700/50 rounded-xl min-w-[90px] text-center flex items-center justify-center">
                <span className="text-white font-semibold text-xs">{group.label}</span>
              </div>

              {/* FEMMES (droite) */}
              <div className="flex-1 flex items-center">
                <div className="relative h-full bg-slate-800/50 rounded-r-xl overflow-hidden border-r border-y border-slate-700/30 w-full flex items-center">
                  {/* Barre animée rose */}
                  <div 
                    className="absolute left-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 transition-all duration-700"
                    style={{ width: `${(group.femmes / maxValue) * 100}%` }}
                  />
                  {/* Pourcentage */}
                  {group.femmes > 0 && (
                    <div className="absolute inset-0 flex items-center justify-start pl-2">
                      <span className="text-white font-bold text-xs z-10">
                        {group.femmes.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

PyramidAgesPreview.displayName = 'PyramidAgesPreview'
PyramidAnciennetesPreview.displayName = 'PyramidAnciennetesPreview'