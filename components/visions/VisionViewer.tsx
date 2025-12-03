'use client'

import { useMemo } from 'react'
import type { SavedVision } from '@/lib/types/visions'
import type { DashboardData } from '@/lib/hooks/useDashboardData'
import { VisionItemRenderer } from './VisionItemRenderer'

interface VisionViewerProps {
  vision: SavedVision
  data?: DashboardData | null
  etablissementId: string
  periode: string
  className?: string
}

export function VisionViewer({
  vision,
  data,
  etablissementId,
  periode,
  className = ''
}: VisionViewerProps) {
  const maxRow = useMemo(() => {
    return Math.max(
      ...vision.layout.items.map(item => item.position.row + item.size.rows),
      4
    )
  }, [vision.layout.items])

  const gridCols = vision.layout.gridCols || 4
  const gridTemplateColumns = `repeat(${gridCols}, 1fr)`
  const gridTemplateRows = `repeat(${maxRow}, minmax(150px, auto))`

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {vision.nom}
        </h2>
        {vision.description && (
          <p className="text-slate-400">
            {vision.description}
          </p>
        )}
      </div>

      {vision.layout.items.length > 0 ? (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns,
            gridTemplateRows
          }}
        >
          {vision.layout.items.map((item) => {
            const gridColumn = `${item.position.col + 1} / span ${item.size.cols}`
            const gridRow = `${item.position.row + 1} / span ${item.size.rows}`

            return (
              <div
                key={`${item.id}-${item.position.row}-${item.position.col}`}
                style={{
                  gridColumn,
                  gridRow
                }}
                className="min-h-0"
              >
                <VisionItemRenderer
                  item={item}
                  data={data}
                  etablissementId={etablissementId}
                  periode={periode}
                  className="h-full"
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-12 text-center">
          <p className="text-slate-400">
            Cette vision est vide. Ajoutez des items pour commencer.
          </p>
        </div>
      )}
    </div>
  )
}