import React, { useState } from 'react';
import { type Goal, type MatrixCell, type LifetimeSummaryCell } from '../../api/sprintClient';
import { BarChart3 } from 'lucide-react';

interface BreakdownProps {
  goals: Goal[];
  matrixData: MatrixCell[];
  lifetimeSummary: LifetimeSummaryCell[];
  selectedDay: string; // "YYYY-MM-DD"
}

type Scope = 'daily' | 'weekly' | 'monthly' | 'lifetime';

export const TimeInvestmentBreakdown: React.FC<BreakdownProps> = ({
  goals,
  matrixData,
  lifetimeSummary,
  selectedDay
}) => {
  const [scope, setScope] = useState<Scope>('daily');

  const parts = selectedDay.split('-').map(Number);
  const selectedDayNum = parts[2] || 1;

  // Calculate week days in the current month
  const getWeekDaysInMonth = (dateStr: string): number[] => {
    if (!dateStr) return [];
    const dateParts = dateStr.split('-').map(Number);
    const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = d.getDay();
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayDiff);
    
    const days: number[] = [];
    for (let i = 0; i < 7; i++) {
      const temp = new Date(monday);
      temp.setDate(monday.getDate() + i);
      if (temp.getMonth() === d.getMonth() && temp.getFullYear() === d.getFullYear()) {
        days.push(temp.getDate());
      }
    }
    return days;
  };

  const weekDays = getWeekDaysInMonth(selectedDay);

  const getGoalMinutes = (goalId: string, currentScope: Scope) => {
    if (currentScope === 'lifetime') {
      return lifetimeSummary.find(s => s.goalId === goalId)?.totalMinutes || 0;
    }
    if (currentScope === 'monthly') {
      return matrixData.filter(m => m.goalId === goalId).reduce((sum, m) => sum + m.totalMinutes, 0);
    }
    if (currentScope === 'weekly') {
      return matrixData.filter(m => weekDays.includes(m.day) && m.goalId === goalId).reduce((sum, m) => sum + m.totalMinutes, 0);
    }
    // daily
    return matrixData.filter(m => m.day === selectedDayNum && m.goalId === goalId).reduce((sum, m) => sum + m.totalMinutes, 0);
  };

  const getTotalMinutes = (currentScope: Scope) => {
    if (currentScope === 'lifetime') {
      return lifetimeSummary.reduce((sum, s) => sum + s.totalMinutes, 0);
    }
    if (currentScope === 'monthly') {
      return matrixData.reduce((sum, m) => sum + m.totalMinutes, 0);
    }
    if (currentScope === 'weekly') {
      return matrixData.filter(m => weekDays.includes(m.day)).reduce((sum, m) => sum + m.totalMinutes, 0);
    }
    // daily
    return matrixData.filter(m => m.day === selectedDayNum).reduce((sum, m) => sum + m.totalMinutes, 0);
  };

  const formatMinutes = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60); const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const getPercentage = (val: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  const activeGoals = goals.filter(g => g.active);
  const totalMins = getTotalMinutes(scope);

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-xs animate-in fade-in duration-300 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" />
          <span className="text-neutral-400 font-bold tracking-widest text-xs uppercase">TIME INVESTMENT TRACKER</span>
        </div>
        
        {/* Pill Tab Selector */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded overflow-hidden">
          {(['daily', 'weekly', 'monthly', 'lifetime'] as Scope[]).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${
                scope === s
                  ? 'bg-emerald-950/40 text-emerald-400'
                  : 'text-neutral-600 hover:bg-neutral-900 hover:text-neutral-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="text-neutral-700 py-4 text-center">No active goals in sprint to track.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {activeGoals.map(goal => {
            const mins = getGoalMinutes(goal.id, scope);
            const actualPct = getPercentage(mins, totalMins);
            const targetPct = goal.targetTimePercentage || 0;
            const diff = actualPct - targetPct;

            return (
              <div key={goal.id} className="flex flex-col gap-1.5 p-2 rounded hover:bg-neutral-900 border border-transparent transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.color }} />
                    <span className="font-bold text-neutral-300 text-sm uppercase tracking-wide truncate">{goal.name}</span>
                  </div>
                  <span className="text-emerald-450 font-bold text-sm tabular-nums">
                    {formatMinutes(mins)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pl-3.5 text-[10px]">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <span>Target: <span className="font-bold">{targetPct}%</span></span>
                    <span className="text-neutral-700">|</span>
                    <span>Actual: <span className="text-neutral-300 font-bold">{actualPct}%</span></span>
                  </div>
                  
                  {targetPct > 0 && (
                    <span className={`font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-amber-500' : 'text-neutral-600'}`}>
                      {diff > 0 ? '+' : ''}{diff}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="pt-2 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-600">
        <span className="uppercase font-bold tracking-widest">{scope} TOTAL</span>
        <span className="text-emerald-600 font-bold tabular-nums">{formatMinutes(totalMins)}</span>
      </div>
    </div>
  );
};
