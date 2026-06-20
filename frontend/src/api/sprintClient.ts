import { api } from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface WorkArea {
  id: string;
  goalId: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  workAreas: WorkArea[];
}

export interface MatrixCell {
  day: number;
  goalId: string;
  totalMinutes: number;
}

export interface CalendarMatrixResponse {
  month: string;
  matrix: MatrixCell[];
}

export interface TimeLog {
  id: string;
  goalId: string;
  workAreaId: string;
  sprintId: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const sprintApi = {
  // Sprints
  createSprint: (payload: { name: string; startDate: string; endDate: string }) =>
    api.post<Sprint>('/sprints', payload),

  getAllSprints: () =>
    api.get<Sprint[]>('/sprints'),

  getCurrentSprint: () =>
    api.get<Sprint>('/sprints/current'),

  completeSprint: (sprintId: string) =>
    api.patch<Sprint>(`/sprints/${sprintId}/complete`),

  // Sprint Goals
  getSprintGoals: (sprintId: string) =>
    api.get<Goal[]>(`/sprints/${sprintId}/goals`),

  assignGoalToSprint: (sprintId: string, goalId: string) =>
    api.post<void>(`/sprints/${sprintId}/goals/${goalId}`),

  removeGoalFromSprint: (sprintId: string, goalId: string) =>
    api.delete<void>(`/sprints/${sprintId}/goals/${goalId}`),

  // Calendar matrix — aggregated minutes per (day, goal) for a month
  getCalendarMatrix: (sprintId: string, month: string) =>
    api.get<CalendarMatrixResponse>(
      `/sprints/${sprintId}/calendar?month=${month}&timezone=${encodeURIComponent(TZ)}`
    ),

  // Day detail — all time logs for a specific date
  getLogsForDay: (sprintId: string, day: string) =>
    api.get<TimeLog[]>(
      `/sprints/${sprintId}/logs?day=${day}&timezone=${encodeURIComponent(TZ)}`
    ),

  // Time log submission
  logTime: (payload: {
    goalId: string;
    workAreaId: string;
    sprintId: string;
    startTime: string;
    endTime: string;
    note: string;
  }) => api.post<TimeLog>('/sprints/timelogs', payload),

  // Global goal pool
  getAllGoals: () =>
    api.get<Goal[]>('/goals'),

  createGoal: (payload: { name: string; color: string; description?: string }) =>
    api.post<Goal>('/goals', payload),

  // Work areas
  getWorkAreas: (goalId: string) =>
    api.get<WorkArea[]>(`/goals/${goalId}/work-areas`),

  createWorkArea: (goalId: string, payload: { name: string; description?: string }) =>
    api.post<WorkArea>(`/goals/${goalId}/work-areas`, payload),
};
