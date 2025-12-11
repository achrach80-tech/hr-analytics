// components/builder/CanvasComponent.tsx - VERSION FINALE
'use client'

import { useState } from 'react'
import { Rnd } from 'react-rnd'
import { Trash2, Copy, GripVertical } from 'lucide-react'
import { CanvasComponent as CanvasComponentType } from '@/lib/store/builderStore'
import { useBuilderStore } from '@/lib/store/builderStore'
// ✅ CORRECTION: Import relatif correct
import { ComponentRenderer } from './ComponentRenderer'

interface CanvasComponentProps {
  component: CanvasComponentType
  zoom: number
}

export default function CanvasComponent({ component, zoom }: CanvasComponentProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const selectedId = useBuilderStore((state) => state.selectedId)
  const updateComponent = useBuilderStore((state) => state.updateComponent)
  const deleteComponent = useBuilderStore((state) => state.deleteComponent)
  const duplicateComponent = useBuilderStore((state) => state.duplicateComponent)
  const selectComponent = useBuilderStore((state) => state.selectComponent)
  const snapToGrid = useBuilderStore((state) => state.snapToGrid)
  const gridSize = useBuilderStore((state) => state.gridSize)

  const isSelected = selectedId === component.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    const newX = snapToGrid ? Math.round(d.x / (gridSize * zoom)) * (gridSize * zoom) : d.x
    const newY = snapToGrid ? Math.round(d.y / (gridSize * zoom)) * (gridSize * zoom) : d.y
    
    updateComponent(component.id, {
      position: { x: newX / zoom, y: newY / zoom }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleResizeStop = (
    _e: any,
    _direction: any,
    ref: HTMLElement,
    _delta: any,
    position: { x: number; y: number }
  ) => {
    const newWidth = ref.offsetWidth / zoom
    const newHeight = ref.offsetHeight / zoom
    const newX = snapToGrid ? Math.round(position.x / (gridSize * zoom)) * (gridSize * zoom) : position.x
    const newY = snapToGrid ? Math.round(position.y / (gridSize * zoom)) * (gridSize * zoom) : position.y

    updateComponent(component.id, {
      size: { width: newWidth, height: newHeight },
      position: { x: newX / zoom, y: newY / zoom }
    })
  }

  return (
    <Rnd
      position={{
        x: component.position.x * zoom,
        y: component.position.y * zoom
      }}
      size={{
        width: component.size.width * zoom,
        height: component.size.height * zoom
      }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => selectComponent(component.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      bounds="parent"
      dragGrid={snapToGrid ? [gridSize * zoom, gridSize * zoom] : undefined}
      resizeGrid={snapToGrid ? [gridSize * zoom, gridSize * zoom] : undefined}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      }}
      className={`group ${isSelected ? 'z-50' : 'z-10'}`}
      dragHandleClassName="drag-handle"
    >
      <div className="relative w-full h-full">
        {/* Selection border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-cyan-500 rounded-lg pointer-events-none z-50">
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50" />
          </div>
        )}

        {/* Hover border */}
        {isHovered && !isSelected && (
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-lg pointer-events-none z-40" />
        )}

        {/* Actions toolbar */}
        {(isSelected || isHovered) && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 shadow-xl z-50">
            {/* Drag handle */}
            <div className="drag-handle cursor-move p-1.5 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="w-px h-5 bg-slate-700" />
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                duplicateComponent(component.id)
              }}
              className="p-1.5 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Supprimer ce composant ?')) {
                  deleteComponent(component.id)
                }
              }}
              className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Component content */}
        <div className="w-full h-full overflow-hidden rounded-lg">
          <ComponentRenderer component={component} />
        </div>

        {/* Size indicator */}
        {isSelected && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-900/95 backdrop-blur-sm border border-cyan-500/30 text-xs text-cyan-400 font-mono pointer-events-none z-50 whitespace-nowrap">
            {Math.round(component.size.width)} × {Math.round(component.size.height)}px
          </div>
        )}
      </div>
    </Rnd>
  )
}