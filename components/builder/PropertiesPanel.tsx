// components/builder/PropertiesPanel.tsx
// ✅ CORRIGÉ: Ajoute sélecteur de couleur pour texte

'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/lib/store/builderStore'
import { getComponentById } from '@/lib/config/builderComponents'
import { X, Edit3, Type, Palette } from 'lucide-react'

// Couleurs prédéfinies pour le texte
const TEXT_COLORS = [
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blanc', value: '#ffffff' },
  { name: 'Gris clair', value: '#cbd5e1' },
  { name: 'Gris', value: '#94a3b8' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Rouge', value: '#ef4444' },
]

export default function PropertiesPanel() {
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [tempWidth, setTempWidth] = useState<string>('')
  const [tempHeight, setTempHeight] = useState<string>('')
  const [tempFontSize, setTempFontSize] = useState<string>('')
  
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
              <label className="block text-xs text-slate-400 mb-1.5">X</label>
              <input
                type="number"
                value={selectedComponent.position.x}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  updateComponent(selectedComponent.id, {
                    position: { ...selectedComponent.position, x: Math.max(0, val) }
                  })
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Y</label>
              <input
                type="number"
                value={selectedComponent.position.y}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  updateComponent(selectedComponent.id, {
                    position: { ...selectedComponent.position, y: Math.max(0, val) }
                  })
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Largeur</label>
              <input
                type="number"
                value={tempWidth || selectedComponent.size.width}
                onChange={(e) => {
                  setTempWidth(e.target.value)
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 50
                  updateComponent(selectedComponent.id, {
                    size: { ...selectedComponent.size, width: Math.max(50, val) }
                  })
                  setTempWidth('')
                }}
                onFocus={() => setTempWidth('')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Hauteur</label>
              <input
                type="number"
                value={tempHeight || selectedComponent.size.height}
                onChange={(e) => {
                  setTempHeight(e.target.value)
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 50
                  updateComponent(selectedComponent.id, {
                    size: { ...selectedComponent.size, height: Math.max(50, val) }
                  })
                  setTempHeight('')
                }}
                onFocus={() => setTempHeight('')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ✅ NOUVEAU: Taille du texte */}
        {isTextComponent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Taille du texte</h4>
              <Type className="w-4 h-4 text-slate-500" />
            </div>
            
            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Taille: {selectedComponent.style?.fontSize || (selectedComponent.type === 'title' ? 32 : 16)}px</span>
                <div className="flex gap-2">
                  {[12, 16, 24, 32, 48, 64].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        updateComponent(selectedComponent.id, {
                          style: {
                            ...selectedComponent.style,
                            fontSize: size
                          }
                        })
                      }}
                      className={`
                        px-2 py-1 text-xs rounded transition-all
                        ${(selectedComponent.style?.fontSize || (selectedComponent.type === 'title' ? 32 : 16)) === size
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                type="range"
                min="8"
                max="96"
                step="1"
                value={selectedComponent.style?.fontSize || (selectedComponent.type === 'title' ? 32 : 16)}
                onChange={(e) => {
                  updateComponent(selectedComponent.id, {
                    style: {
                      ...selectedComponent.style,
                      fontSize: parseInt(e.target.value)
                    }
                  })
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              
              <div className="flex justify-between text-xs text-slate-500">
                <span>8px</span>
                <span>96px</span>
              </div>
            </div>

            {/* Input manuel */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Taille personnalisée</label>
              <input
                type="number"
                value={tempFontSize || (selectedComponent.style?.fontSize || (selectedComponent.type === 'title' ? 32 : 16))}
                onChange={(e) => {
                  setTempFontSize(e.target.value)
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value) || 16
                  updateComponent(selectedComponent.id, {
                    style: {
                      ...selectedComponent.style,
                      fontSize: Math.max(8, Math.min(200, val))
                    }
                  })
                  setTempFontSize('')
                }}
                onFocus={() => setTempFontSize('')}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ✅ Sélecteur de couleur pour le texte */}
        {isTextComponent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Couleur du texte</h4>
              <Palette className="w-4 h-4 text-slate-500" />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {TEXT_COLORS.map((color) => {
                const isSelected = (selectedComponent.style?.color || '#06b6d4') === color.value
                
                return (
                  <button
                    key={color.value}
                    onClick={() => {
                      updateComponent(selectedComponent.id, {
                        style: {
                          ...selectedComponent.style,
                          color: color.value
                        }
                      })
                    }}
                    className={`
                      relative h-10 rounded-lg transition-all
                      ${isSelected 
                        ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900 scale-110' 
                        : 'hover:scale-105 hover:ring-1 hover:ring-slate-600'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: color.value === '#ffffff' ? '#000000' : '#ffffff' }}>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Affichage couleur actuelle */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <div 
                className="w-6 h-6 rounded border border-slate-600"
                style={{ backgroundColor: selectedComponent.style?.color || '#06b6d4' }}
              />
              <span className="text-sm text-slate-400">
                {TEXT_COLORS.find(c => c.value === (selectedComponent.style?.color || '#06b6d4'))?.name || 'Personnalisée'}
              </span>
              <span className="text-xs text-slate-500 ml-auto font-mono">
                {selectedComponent.style?.color || '#06b6d4'}
              </span>
            </div>
          </div>
        )}

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
                  <div 
                    className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-sm max-h-32 overflow-y-auto"
                    style={{ color: selectedComponent.style?.color || '#cbd5e1' }}
                  >
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
                  <span className="text-white font-mono text-xs">{definition.dataKey}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}