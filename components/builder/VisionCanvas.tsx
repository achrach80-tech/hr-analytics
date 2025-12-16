// components/builder/VisionCanvas.tsx
// ✅ CORRIGÉ: Ajoute données mockup pour waterfall dans le builder

'use client'

import React, { useRef, useMemo } from 'react'
import { Rnd } from 'react-rnd'
import { useBuilderStore } from '@/lib/store/builderStore'
import { ComponentRenderer } from './ComponentRenderer'
import { Trash2, Copy } from 'lucide-react'
import type { DualWaterfallData } from '@/lib/types/dashboard'

export function VisionCanvas() {
  const {
    canvas,
    components,
    selectedId,
    zoom,
    showGrid,
    snapToGrid,
    gridSize,
    updateComponent,
    selectComponent,
    deleteComponent,
    duplicateComponent
  } = useBuilderStore()

  const canvasRef = useRef<HTMLDivElement>(null)

  // ✅ Données mockup pour le builder (même format que les vraies données)
  const mockWaterfallData: DualWaterfallData = useMemo(() => ({
    hasMonthBefore: true,
    hasYearBefore: true,
    vsMonthBefore: {
      periodePrecedente: '2024-11-01',
      periodeCourante: '2024-12-01',
      masseSalarialeM1: 193000,
      masseSalarialeM: 353000,
      coutMoyenM1: 3860,
      coutMoyenM: 7060,
      etpM1: 50.0,
      etpM: 50.0,
      effetPrix: 160000,
      effetVolume: 0,
      variation: 160000,
      variationPct: 82.9,
      primesExceptionnellesM: 0,
      primesExceptionnellesM1: 0,
      coherenceOk: true,
      ecartCoherence: 0,
      ecartCoherencePct: 0,
      recalculated: false
    },
    vsYearBefore: {
      periodePrecedente: '2023-12-01',
      periodeCourante: '2024-12-01',
      masseSalarialeM1: 332000,
      masseSalarialeM: 353000,
      coutMoyenM1: 6775,
      coutMoyenM: 7060,
      etpM1: 49.0,
      etpM: 50.0,
      effetPrix: 14000,
      effetVolume: 7000,
      variation: 21000,
      variationPct: 6.3,
      primesExceptionnellesM: 0,
      primesExceptionnellesM1: 0,
      coherenceOk: true,
      ecartCoherence: 0,
      ecartCoherencePct: 0,
      recalculated: false
    }
  }), [])

  const mockKpiData = useMemo(() => ({
    workforce: {
      etpTotal: 50.0,
      etpTotalEvolution: -1.8,
      headcountActif: 51,
      headcountActifEvolution: 2.5,
      ageMoyen: 31.9,
      tauxTurnover: 0.0,
      pctCDI: 68.6
    }
  }), [])

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      selectComponent(null)
    }
  }

  const snapPosition = (pos: number) => {
    if (!snapToGrid) return pos
    return Math.round(pos / gridSize) * gridSize
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto bg-slate-950/50 p-8">
      <div
        ref={canvasRef}
        className="relative border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20"
        style={{
          width: canvas.width * zoom,
          height: canvas.height * zoom,
          backgroundColor: canvas.backgroundColor,
          backgroundImage: showGrid
            ? `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: showGrid ? `${gridSize * zoom}px ${gridSize * zoom}px` : 'auto',
          backgroundPosition: '0 0, 0 0',
          transformOrigin: 'center center',
          transition: 'all 0.2s ease'
        }}
        onClick={handleCanvasClick}
      >
        {/* Render all components */}
        {components.map((component) => {
          const isSelected = component.id === selectedId

          return (
            <Rnd
              key={component.id}
              size={{
                width: component.size.width * zoom,
                height: component.size.height * zoom
              }}
              position={{
                x: component.position.x * zoom,
                y: component.position.y * zoom
              }}
              onDragStop={(e, d) => {
                const newX = snapPosition(d.x / zoom)
                const newY = snapPosition(d.y / zoom)
                updateComponent(component.id, {
                  position: { x: newX, y: newY }
                })
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const newWidth = snapPosition(parseInt(ref.style.width) / zoom)
                const newHeight = snapPosition(parseInt(ref.style.height) / zoom)
                const newX = snapPosition(position.x / zoom)
                const newY = snapPosition(position.y / zoom)

                updateComponent(component.id, {
                  size: { width: newWidth, height: newHeight },
                  position: { x: newX, y: newY }
                })
              }}
              enableResizing={isSelected}
              disableDragging={!isSelected}
              bounds="parent"
              style={{
                border: isSelected ? '2px solid rgba(6, 182, 212, 0.5)' : '2px solid transparent',
                borderRadius: '8px',
                transition: 'border-color 0.2s ease'
              }}
              resizeHandleStyles={{
                bottomRight: {
                  width: '12px',
                  height: '12px',
                  bottom: '-6px',
                  right: '-6px',
                  backgroundColor: '#06b6d4',
                  borderRadius: '50%',
                  cursor: 'se-resize',
                  display: isSelected ? 'block' : 'none'
                },
                topRight: {
                  width: '12px',
                  height: '12px',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#06b6d4',
                  borderRadius: '50%',
                  cursor: 'ne-resize',
                  display: isSelected ? 'block' : 'none'
                },
                bottomLeft: {
                  width: '12px',
                  height: '12px',
                  bottom: '-6px',
                  left: '-6px',
                  backgroundColor: '#06b6d4',
                  borderRadius: '50%',
                  cursor: 'sw-resize',
                  display: isSelected ? 'block' : 'none'
                },
                topLeft: {
                  width: '12px',
                  height: '12px',
                  top: '-6px',
                  left: '-6px',
                  backgroundColor: '#06b6d4',
                  borderRadius: '50%',
                  cursor: 'nw-resize',
                  display: isSelected ? 'block' : 'none'
                }
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                selectComponent(component.id)
              }}
            >
              <div className="w-full h-full relative">
                {/* Component content - ✅ AVEC DONNÉES MOCKUP */}
                <ComponentRenderer 
                  component={component} 
                  isPreview 
                  waterfallData={mockWaterfallData}
                  kpiData={mockKpiData}
                  period="2024-12-01"
                />

                {/* Quick actions (visible on hover) */}
                {isSelected && (
                  <div className="absolute -top-10 right-0 flex gap-1 bg-slate-900 border border-cyan-500/30 rounded-lg p-1 shadow-lg">
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation()
                        duplicateComponent(component.id)
                      }}
                      className="p-1.5 hover:bg-cyan-500/20 rounded text-cyan-400 transition-colors"
                      title="Dupliquer"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation()
                        if (confirm('Supprimer ce composant ?')) {
                          deleteComponent(component.id)
                        }
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </Rnd>
          )
        })}
      </div>
    </div>
  )
}