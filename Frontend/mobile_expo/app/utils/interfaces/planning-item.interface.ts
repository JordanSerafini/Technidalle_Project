import type { event_type, Event } from './event.interface'

export type task_status = 'à_faire' | 'en_cours' | 'terminé'

export interface Task {
  id: number
  label: string
  description?: string
  due_date?: string
  status?: task_status
  priority?: number
  assigned_to?: number
  stage_id?: number
  project_id?: number
  project_name?: string
  stage_name?: string
}

export type PlanningItem =
  | (Event & { type: 'event'; project_name?: string; stage_name?: string })
  | (Task & { type: 'task' }) 