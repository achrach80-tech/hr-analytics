// components/builder/Toolbar.tsx
'use client'

import React from 'react'
import { useBuilderStore } from '@/lib/store/builderStore'
import { 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Grid3x3, 
  Magnet,
  Trash2,
  Eye,
  Layout
} from 'lucide-react'

interface ToolbarProps {
  onSave: () => void
  onPreview?: () => void
  isSaving?: boolean
}

export function Toolbar({ onSave, onPreview, isSaving }: ToolbarProps) {
  const {
    zoom,
    showGrid,
    snapToGrid,
    components,
    historyIndex,
    history,
    setZoom,
    toggleGrid,
    toggleSnap,
    undo,
    redo,
    clearCanvas,
    canvas,
    setCanvasFormat
  } = useBuilderStore()

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleClearCanvas = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le canvas ?')) {
      clearCanvas()
    }
  }

  return (
    <div className="h-16 bg-slate-900/95 border-b border-cyan-500/20 flex items-center justify-between px-6 backdrop-blur-sm">
      {/* Left section - Canvas controls */}
      <div className="flex items-center gap-2">
        {/* Canvas format */}
        <div className="flex bg-slate-950/50 rounded-lg border border-cyan-500/20 overflow-hidden">
          <button
            onClick={() => setCanvasFormat('16:9')}
            className={`px-3 py-2 text-sm font-medium transition-all ${
              canvas.format === '16:9'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
            title="Format 16:9 (1920×1080)"
          >
            <div className="flex items-center gap-2">
              <Layout size={16} />
              16:9
            </div>
          </button>
          <button
            onClick={() => setCanvasFormat('A4')}
            className={`px-3 py-2 text-sm font-medium transition-all ${
              canvas.format === 'A4'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-400 hover:text-cyan-400'
            }`}
            title="Format A4 (2480×3508)"
          >
            A4
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-slate-950/50 rounded-lg border border-cyan-500/20 px-2">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.2}
            className="p-2 hover:bg-cyan-500/20 rounded text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut size={18} />
          </button>
          
          <span className="text-cyan-400 text-sm font-medium min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 2}
            className="p-2 hover:bg-cyan-500/20 rounded text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom avant"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Grid & Snap */}
        <div className="flex gap-1">
          <button
            onClick={toggleGrid}
            className={`p-2 rounded-lg border transition-all ${
              showGrid
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
            }`}
            title="Afficher la grille"
          >
            <Grid3x3 size={18} />
          </button>
          
          <button
            onClick={toggleSnap}
            className={`p-2 rounded-lg border transition-all ${
              snapToGrid
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
            }`}
            title="Magnétisme à la grille"
          >
            <Magnet size={18} />
          </button>
        </div>
      </div>

      {/* Center section - History */}
      <div className="flex items-center gap-1 bg-slate-950/50 rounded-lg border border-cyan-500/20 px-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 hover:bg-cyan-500/20 rounded text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Annuler (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        
        <div className="text-xs text-slate-500 px-2">
          {historyIndex} / {history.length - 1}
        </div>
        
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 hover:bg-cyan-500/20 rounded text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Refaire (Ctrl+Y)"
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-slate-400 mr-2">
          {components.length} composant{components.length > 1 ? 's' : ''}
        </div>

        {onPreview && (
          <button
            onClick={onPreview}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-400 font-medium text-sm flex items-center gap-2 transition-all"
          >
            <Eye size={18} />
            Prévisualiser
          </button>
        )}

        <button
          onClick={handleClearCanvas}
          disabled={components.length === 0}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-400 font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={18} />
          Effacer
        </button>

        <button
          onClick={onSave}
          disabled={isSaving || components.length === 0}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
        >
          <Save size={18} />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}