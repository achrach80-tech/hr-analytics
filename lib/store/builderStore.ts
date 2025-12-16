// lib/store/builderStore.ts
// ✅ CORRIGÉ: Ajout de textAlign au type style

import { create } from 'zustand'

export type ComponentType = 
  | 'kpi_card'
  | 'chart'
  | 'text'
  | 'title'

export interface CanvasComponent {
  id: string
  type: ComponentType
  dataKey: string
  componentName: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  style?: {
    fontSize?: number
    fontWeight?: string
    color?: string
    backgroundColor?: string
    textAlign?: 'left' | 'center' | 'right' | 'justify'  // ✅ AJOUTÉ
  }
  content?: string
  config?: Record<string, unknown>
}

export interface CanvasState {
  width: number
  height: number
  format: '16:9' | 'A4'
  backgroundColor: string
}

interface BuilderState {
  canvas: CanvasState
  components: CanvasComponent[]
  selectedId: string | null
  history: CanvasComponent[][]
  historyIndex: number
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  
  setCanvasSize: (width: number, height: number) => void
  setCanvasFormat: (format: '16:9' | 'A4') => void
  addComponent: (component: Omit<CanvasComponent, 'id'>) => void
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void
  deleteComponent: (id: string) => void
  duplicateComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  toggleSnap: () => void
  loadTemplate: (components: CanvasComponent[], canvas: CanvasState) => void
  clearCanvas: () => void
  getExportData: () => { canvas: CanvasState; components: CanvasComponent[] }
}

const DEFAULT_CANVAS: CanvasState = {
  width: 1920,
  height: 1080,
  format: '16:9',
  backgroundColor: '#0f172a'
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  canvas: DEFAULT_CANVAS,
  components: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 0.5,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,

  setCanvasSize: (width, height) =>
    set({ canvas: { ...get().canvas, width, height } }),

  setCanvasFormat: (format) => {
    const dimensions = format === '16:9' 
      ? { width: 1920, height: 1080 }
      : { width: 2480, height: 3508 }
    
    set({
      canvas: {
        ...get().canvas,
        format,
        ...dimensions
      }
    })
  },

  addComponent: (component) => {
    const newComponent: CanvasComponent = {
      ...component,
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    set((state) => ({
      components: [...state.components, newComponent],
      selectedId: newComponent.id
    }))
    
    get().saveToHistory()
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    }))
  },

  deleteComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    }))
    
    get().saveToHistory()
  },

  duplicateComponent: (id) => {
    const component = get().components.find((c) => c.id === id)
    if (!component) return

    const newComponent: CanvasComponent = {
      ...component,
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: component.position.x + 20,
        y: component.position.y + 20
      }
    }

    set((state) => ({
      components: [...state.components, newComponent],
      selectedId: newComponent.id
    }))

    get().saveToHistory()
  },

  selectComponent: (id) => set({ selectedId: id }),

  saveToHistory: () => {
    const { components, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(components)))
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      set({
        components: JSON.parse(JSON.stringify(history[historyIndex - 1])),
        historyIndex: historyIndex - 1
      })
    }
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      set({
        components: JSON.parse(JSON.stringify(history[historyIndex + 1])),
        historyIndex: historyIndex + 1
      })
    }
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(2, zoom)) }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  loadTemplate: (components, canvas) =>
    set({
      components: JSON.parse(JSON.stringify(components)),
      canvas,
      selectedId: null,
      history: [JSON.parse(JSON.stringify(components))],
      historyIndex: 0
    }),

  clearCanvas: () =>
    set({
      components: [],
      selectedId: null,
      history: [[]],
      historyIndex: 0
    }),

  getExportData: () => ({
    canvas: get().canvas,
    components: JSON.parse(JSON.stringify(get().components))
  })
}))