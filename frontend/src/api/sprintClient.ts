import { api } from './client';

// ─── Interfaces ─────────────────────────────────────────────────────────────
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
  goalId: string | null;         // null = anonymous row
  anonymousLabel: string | null; // set when goalId is null
  totalMinutes: number;
}

export interface CalendarMatrixResponse {
  month: string;
  matrix: MatrixCell[];
}

export interface TimeLog {
  id: string;
  goalId: string | null;
  workAreaId: string | null;
  anonymousName: string | null;
  sprintId: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
}

export interface Target {
  id: string;
  workAreaId: string;
  name: string;
  weekStartDate: string;
  completed: boolean;
  repeating: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function getCurrentWeekMonday(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate distance to the nearest past Monday
  // If today is Sunday (0), we need to step back 6 days.
  // Otherwise, step back (day - 1) days.
  const distanceToMonday = day === 0 ? 6 : day - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  
  // Directly pull YYYY-MM-DD format using local time parameters to prevent ISO UTC timezone shifts
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekSunday(mondayStr: string): string {
  const parts = mondayStr.split('-').map(Number);
  // Instantiate strictly using local calendar coordinates 
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + 6);
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

// ─── API Client Definition ───────────────────────────────────────────────────
export const sprintApi = {
  // Sprints
  createSprint: (payload: { name: string; startDate: string; endDate: string }) =>
    api.post<Sprint>('/sprints', payload),
  getAllSprints: () =>
    api.get<Sprint[]>('/sprints'),
  getCurrentSprint: () =>
    api.get<Sprint>('/sprints/current'),
  updateSprint: (sprintId: string, payload: { name: string; startDate: string; endDate: string }) =>
    api.patch<Sprint>(`/sprints/${sprintId}`, payload),
  deleteSprint: (sprintId: string) =>
    api.delete(`/sprints/${sprintId}`),
  completeSprint: (sprintId: string) =>
    api.patch<Sprint>(`/sprints/${sprintId}/complete`),

  // Sprint Goals
  getSprintGoals: (sprintId: string) =>
    api.get<Goal[]>(`/sprints/${sprintId}/goals`),
  assignGoalToSprint: (sprintId: string, goalId: string) =>
    api.post(`/sprints/${sprintId}/goals/${goalId}`),
  removeGoalFromSprint: (sprintId: string, goalId: string) =>
    api.delete(`/sprints/${sprintId}/goals/${goalId}`),

  // Calendar Matrix
  getCalendarMatrix: (sprintId: string, month: string) =>
    api.get<CalendarMatrixResponse>(
      `/sprints/${sprintId}/calendar?month=${month}&timezone=${encodeURIComponent(TZ)}`
    ),

  // Day Detail
  getLogsForDay: (sprintId: string, day: string) =>
    api.get<TimeLog[]>(
      `/sprints/${sprintId}/logs?day=${day}&timezone=${encodeURIComponent(TZ)}`
    ),

  // Time Logs
  logTime: (payload: {
    goalId?: string | null;
    workAreaId?: string | null;
    anonymousName?: string | null;
    sprintId: string | null;
    startTime: string;
    endTime: string;
    note: string;
  }) => api.post<TimeLog>('/sprints/timelogs', payload),

  deleteTimeLog: (timeLogId: string) =>
    api.delete(`/sprints/timelogs/${timeLogId}`),

  // 💡 THIS EXPLICIT DECLARATION CLEARS THE PROPERTY ERROR IMMEDIATELY
  updateTimeLog: (timeLogId: string, payload: {
    goalId?: string | null;
    workAreaId?: string | null;
    anonymousName?: string | null;
    startTime: string;
    endTime: string;
    note: string;
  }) => api.patch<TimeLog>(`/sprints/timelogs/${timeLogId}`, payload),

  // Global Goal Pool
  getAllGoals: () =>
    api.get<Goal[]>('/goals'),
  createGoal: (payload: { name: string; color: string; description?: string }) =>
    api.post<Goal>('/goals', payload),
  updateGoal: (goalId: string, payload: { name: string; color: string; description?: string }) =>
    api.patch<Goal>(`/goals/${goalId}`, payload),
  deleteGoal: (goalId: string) =>
    api.delete(`/goals/${goalId}`),

  // Work Areas
  getWorkAreas: (goalId: string) =>
    api.get<WorkArea[]>(`/goals/${goalId}/work-areas`),
  createWorkArea: (goalId: string, payload: { name: string; description?: string }) =>
    api.post<WorkArea>(`/goals/${goalId}/work-areas`, payload),
  deleteWorkArea: (goalId: string, workAreaId: string) =>
    api.delete(`/goals/${goalId}/work-areas/${workAreaId}`),

  // Targets
  getTargetsForWeek: (weekStart: string) =>
    api.get<Target[]>(`/targets?weekStart=${weekStart}`),
  createTarget: (payload: { workAreaId: string; name: string; weekStartDate?: string; repeating: boolean }) =>
    api.post<Target>('/targets', payload),
  toggleTargetComplete: (targetId: string) =>
    api.patch<Target>(`/targets/${targetId}/toggle`),
  updateTarget: (targetId: string, payload: { workAreaId?: string; name?: string; repeating: boolean }) =>
    api.patch<Target>(`/targets/${targetId}`, payload),
  deleteTarget: (targetId: string) =>
    api.delete(`/targets/${targetId}`),
};