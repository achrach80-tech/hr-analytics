// components/builder/VisionCanvas.tsx
'use client'

import React, { useRef } from 'react'
import { Rnd } from 'react-rnd'
import { useBuilderStore } from '@/lib/store/builderStore'
import { ComponentRenderer } from './ComponentRenderer'
import { Trash2, Copy } from 'lucide-react'

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
                const newWidth = Math.max(100, parseInt(ref.style.width) / zoom)
                const newHeight = Math.max(80, parseInt(ref.style.height) / zoom)
                const newX = snapPosition(position.x / zoom)
                const newY = snapPosition(position.y / zoom)

                updateComponent(component.id, {
                  size: { width: newWidth, height: newHeight },
                  position: { x: newX, y: newY }
                })
              }}
              bounds="parent"
              enableResizing={isSelected}
              disableDragging={!isSelected}
              className={`group ${isSelected ? 'z-50' : 'z-10'}`}
              style={{
                border: isSelected ? '2px solid #06b6d4' : '2px solid transparent',
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
                {/* Component content */}
                <ComponentRenderer component={component} isPreview />

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

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-6 left-0 bg-cyan-500 text-slate-900 text-xs font-semibold px-2 py-0.5 rounded">
                    {component.componentName}
                  </div>
                )}
              </div>
            </Rnd>
          )
        })}

        {/* Empty state */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-xl font-semibold mb-2">Canvas vide</div>
              <div className="text-sm">Glissez-déposez des composants depuis la bibliothèque</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}