// components/builder/PropertiesPanel.tsx
'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/lib/store/builderStore'
import { getComponentById } from '@/lib/config/builderComponents'
import { X, Edit3, Type } from 'lucide-react'

export default function PropertiesPanel() {
  const [showTextEditor, setShowTextEditor] = useState(false)
  
  const selectedId = useBuilderStore((state) => state.selectedId)
  const components = useBuilderStore((state) => state.components)
  const updateComponent = useBuilderStore((state) => state.updateComponent)
  const selectComponent = useBuilderStore((state) => state.selectComponent)

  const selectedComponent = components.find(c => c.id === selectedId)

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-slate-900 border-l border-cyan-500/20 p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <p className="text-slate-400 font-medium mb-1">Aucune sélection</p>
            <p className="text-slate-500 text-sm">Cliquez sur un composant</p>
          </div>
        </div>
      </div>
    )
  }

  const definition = getComponentById(selectedComponent.componentName)
  const isTextComponent = selectedComponent.type === 'text' || selectedComponent.type === 'title'

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const textToHtml = (text: string) => {
    return text
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
      .join('')
  }

  return (
    <div className="w-80 bg-slate-900 border-l border-cyan-500/20 flex flex-col">
      <div className="p-4 border-b border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Propriétés</h3>
          <button
            onClick={() => selectComponent(null)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {definition && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-xs">📊</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{definition.name}</p>
              <p className="text-xs text-slate-400 truncate">{definition.category}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Position & Taille</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">X</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.x)}
                onChange={(e) => updateComponent(selectedComponent.id, {
                  position: { ...selectedComponent.position, x: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Y</label>
              <input
                type="number"
                value={Math.round(selectedComponent.position.y)}
                onChange={(e) => updateComponent(selectedComponent.id, {
                  position: { ...selectedComponent.position, y: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Largeur</label>
              <input
                type="number"
                min="50"
                value={Math.round(selectedComponent.size.width)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 50
                  updateComponent(selectedComponent.id, {
                    size: { ...selectedComponent.size, width: Math.max(50, val) }
                  })
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Hauteur</label>
              <input
                type="number"
                min="50"
                value={Math.round(selectedComponent.size.height)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 50
                  updateComponent(selectedComponent.id, {
                    size: { ...selectedComponent.size, height: Math.max(50, val) }
                  })
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {isTextComponent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Contenu</h4>
              <Type className="w-4 h-4 text-slate-500" />
            </div>
            
            {showTextEditor ? (
              <div className="space-y-3">
                <textarea
                  value={stripHtml(selectedComponent.content || '')}
                  onChange={(e) => updateComponent(selectedComponent.id, { 
                    content: textToHtml(e.target.value)
                  })}
                  placeholder="Entrez votre texte ici..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                />
                
                <button
                  onClick={() => setShowTextEditor(false)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-medium"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div>
                {selectedComponent.content && (
                  <div className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-300 max-h-32 overflow-y-auto">
                    {stripHtml(selectedComponent.content) || 'Aucun contenu'}
                  </div>
                )}
                
                <button
                  onClick={() => setShowTextEditor(true)}
                  className="w-full px-4 py-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  Éditer le contenu
                </button>
              </div>
            )}
          </div>
        )}

        {definition && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Informations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Type</span>
                <span className="text-white font-medium capitalize">
                  {selectedComponent.type === 'kpi_card' ? 'KPI' : 
                   selectedComponent.type === 'chart' ? 'Graphique' :
                   selectedComponent.type === 'text' ? 'Texte' : 'Titre'}
                </span>
              </div>
              {definition.dataKey && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Source</span>
                  <span className="text-cyan-400 font-mono text-xs">{definition.dataKey}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-slate-400">ID</span>
                <span className="text-slate-500 font-mono text-xs truncate max-w-[150px]">
                  {selectedComponent.id.split('-').pop()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}