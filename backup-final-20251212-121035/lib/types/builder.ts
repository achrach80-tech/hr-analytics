// types/builder.ts
import { LucideIcon } from 'lucide-react'

// Canvas types
export type ComponentType = 'kpi_card' | 'chart' | 'text' | 'title'

export interface CanvasComponent {
  id: string
  type: ComponentType
  dataKey: string
  componentName: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  style?: {
    fontSize?: number
    color?: string
    backgroundColor?: string
    fontWeight?: string
    textAlign?: string
  }
  content?: string
  config?: Record<string, any>
}

export interface CanvasState {
  width: number
  height: number
  format: '16:9' | '4:3' | 'A4'
  backgroundColor: string
}

export interface BuilderState {
  canvas: CanvasState
  components: CanvasComponent[]
  selectedId: string | null
  history: CanvasComponent[][]
  historyIndex: number
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

// Component definition types
export type ComponentCategory = 
  | 'Effectif' 
  | 'Masse Salariale' 
  | 'Absences' 
  | 'Démographie' 
  | 'Autres'

export interface ComponentDefinition {
  id: string
  name: string
  category: ComponentCategory
  type: ComponentType
  icon: LucideIcon
  description: string
  dataPath: string
  defaultSize: {
    width: number
    height: number
  }
  minSize?: {
    width: number
    height: number
  }
  kpiConfig?: {
    title: string
    format: 'currency' | 'percent' | 'number' | 'decimal'
    gradient: string
    showEvolution: boolean
  }
}

// KPI Data types (from existing system)
export interface WorkforceKPIs {
  etpTotal: number
  headcountActif: number
  nbEntrees: number
  nbSorties: number
  tauxTurnover: number
  pctCDI: number
  ageMoyen: number
  ancienneteMoyenne: number
  pctHommes: number
  pctFemmes: number
  pctAgeMoins25?: number
  pctAge2535?: number
  pctAge3545?: number
  pctAge4555?: number
  pctAgePlus55?: number
  pctAnciennete01?: number
  pctAnciennete13?: number
  pctAnciennete35?: number
  pctAnciennete510?: number
  pctAnciennetePlus10?: number
}

export interface PayrollKPIs {
  masseBrute: number
  coutTotal: number
  salaireMoyen: number
  coutMoyenFTE: number
  effetPrix: number
  effetVolume: number
  effetMixte: number
  variationMasseSalariale: number
}

export interface AbsenceKPIs {
  tauxAbsenteisme: number
  nbJoursAbsence: number
  dureeMoyenne: number
  nbSalariesAbsents: number
  joursParSalarie: number
}

export interface KPIData {
  workforce: WorkforceKPIs | null
  financials: PayrollKPIs | null
  absences: AbsenceKPIs | null
  previousMonthWorkforce: WorkforceKPIs | null
  previousYearWorkforce: WorkforceKPIs | null
  previousMonthFinancials: PayrollKPIs | null
  previousYearFinancials: PayrollKPIs | null
  previousMonthAbsences: AbsenceKPIs | null
  previousYearAbsences: AbsenceKPIs | null
  evolution?: EvolutionDataPoint[]
  waterfallM1?: WaterfallData
  waterfallN1?: WaterfallData
}

export interface EvolutionDataPoint {
  periode: string
  value: number
  label: string
}

export interface WaterfallData {
  masseSalarialeM1: number
  effetPrix: number
  effetVolume: number
  effetMixte?: number
  masseSalarialeM: number
}

// Vision types
export interface VisionTemplate {
  canvas: CanvasState
  components: CanvasComponent[]
  defaultEstablishment?: string
  defaultPeriod?: string
}

export interface Vision {
  id: string
  name: string
  description: string | null
  template: VisionTemplate | null
  company_id: string
  export_count: number
  created_at: string
  updated_at: string
}

export interface CreateVisionInput {
  name: string
  description?: string | null
  template: VisionTemplate
}