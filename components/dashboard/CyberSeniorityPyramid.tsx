'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SeniorityPyramidData {
  anciennete01H: number
  anciennete01F: number
  anciennete13H: number
  anciennete13F: number
  anciennete35H: number
  anciennete35F: number
  anciennete510H: number
  anciennete510F: number
  anciennetePlus10H: number
  anciennetePlus10F: number
}

interface CyberSeniorityPyramidProps {
  data: SeniorityPyramidData
}

export const CyberSeniorityPyramid: React.FC<CyberSeniorityPyramidProps> = ({ data }) => {
  const seniorityGroups = [
    { label: '> 10 ans', hommes: data.anciennetePlus10H, femmes: data.anciennetePlus10F },
    { label: '5-10 ans', hommes: data.anciennete510H, femmes: data.anciennete510F },
    { label: '3-5 ans', hommes: data.anciennete35H, femmes: data.anciennete35F },
    { label: '1-3 ans', hommes: data.anciennete13H, femmes: data.anciennete13F },
    { label: '< 1 an', hommes: data.anciennete01H, femmes: data.anciennete01F }
  ]

  const maxValue = Math.max(...seniorityGroups.flatMap(g => [g.hommes, g.femmes]))

  return (
    <div className="col-span-1 md:col-span-2 xl:col-span-4 relative p-6 rounded-2xl backdrop-blur-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/40">
      <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl" />
      
      <div className="relative z-10">
        {/* Header identique */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
              Pyramide des Anciennetés
            </span>
          </h3>
          
          {/* Légendes H/F */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
              <span className="text-slate-300 text-sm font-semibold">HOMMES</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" />
              <span className="text-slate-300 text-sm font-semibold">FEMMES</span>
            </div>
          </div>
        </div>

        {/* Pyramide */}
        <div className="space-y-3">
          {seniorityGroups.map((group, index) => (
            <div key={group.label} className="flex items-center gap-3">
              {/* HOMMES (gauche) */}
              <div className="flex-1 flex justify-end">
                <div className="w-full flex justify-end">
                  <div className="relative h-10 bg-slate-800/50 rounded-l-lg overflow-hidden border-l border-y border-slate-700/30 w-full">
                    <motion.div 
                      className="absolute right-0 h-full bg-gradient-to-l from-cyan-500 via-blue-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(group.hommes / maxValue) * 100}%` }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.8, ease: "easeOut" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-3">
                      <span className="text-white font-semibold text-sm z-10">
                        {group.hommes.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LABEL CENTRAL */}
              <div className="px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-lg min-w-[100px] text-center">
                <span className="text-white font-medium text-sm">{group.label}</span>
              </div>

              {/* FEMMES (droite) */}
              <div className="flex-1">
                <div className="relative h-10 bg-slate-800/50 rounded-r-lg overflow-hidden border-r border-y border-slate-700/30">
                  <motion.div 
                    className="absolute left-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(group.femmes / maxValue) * 100}%` }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.8, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-start pl-3">
                    <span className="text-white font-semibold text-sm z-10">
                      {group.femmes.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

CyberSeniorityPyramid.displayName = 'CyberSeniorityPyramid'