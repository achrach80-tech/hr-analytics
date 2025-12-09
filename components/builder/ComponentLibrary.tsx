// components/builder/ComponentLibrary.tsx
'use client'

import React, { useState } from 'react'
import { BUILDER_COMPONENTS, COMPONENT_CATEGORIES } from '@/lib/config/builderComponents'
import { useBuilderStore } from '@/lib/store/builderStore'
import * as LucideIcons from 'lucide-react'

export function ComponentLibrary() {
  const [activeCategory, setActiveCategory] = useState<'kpi' | 'chart' | 'text'>('kpi')
  const addComponent = useBuilderStore(state => state.addComponent)

  const categoryComponents = BUILDER_COMPONENTS.filter(c => c.category === activeCategory)

  const handleAddComponent = (component: typeof BUILDER_COMPONENTS[0]) => {
    addComponent({
      type: component.type,
      dataKey: component.dataKey,
      componentName: component.id,
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      },
      size: component.defaultSize,
      content: component.type === 'text' ? 'Zone de texte...' : component.type === 'title' ? 'Titre' : undefined
    })
  }

  return (
    <div className="w-80 h-full bg-slate-900/95 border-l border-cyan-500/20 flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <h2 className="text-lg font-bold text-cyan-400 mb-1">Bibliothèque</h2>
        <p className="text-xs text-slate-400">Cliquez pour ajouter</p>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-cyan-500/20 bg-slate-950/50">
        {COMPONENT_CATEGORIES.map((cat) => {
          const Icon = (LucideIcons as any)[cat.icon]
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all
                ${activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5'
                }
              `}
            >
              {Icon && <Icon size={16} />}
              <span className="hidden lg:inline">{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Components list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categoryComponents.map((component) => {
          const Icon = (LucideIcons as any)[component.icon]
          
          return (
            <button
              key={component.id}
              onClick={() => handleAddComponent(component)}
              className="w-full p-3 rounded-lg border border-cyan-500/20 bg-slate-900/50 hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 group-hover:from-cyan-500/30 group-hover:to-purple-500/30 transition-all">
                  {Icon && <Icon size={20} className="text-cyan-400" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-cyan-400 mb-1 truncate">
                    {component.name}
                  </div>
                  <div className="text-xs text-slate-400 line-clamp-2">
                    {component.description}
                  </div>
                  
                  {/* Preview badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs text-slate-500">
                      {component.defaultSize.width} × {component.defaultSize.height}
                    </div>
                    {component.preview.value && (
                      <div 
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${component.preview.color}20`,
                          color: component.preview.color
                        }}
                      >
                        {component.preview.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer help */}
      <div className="p-3 border-t border-cyan-500/20 bg-slate-950/50">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <span>Cliquez pour ajouter au canvas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Glissez pour repositionner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Redimensionnez avec les poignées</span>
          </div>
        </div>
      </div>
    </div>
  )
}