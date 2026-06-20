import React from 'react';
import { type Goal, type TimeLog } from '../../api/sprintClient';
import { Clock, Plus } from 'lucide-react';

interface DayDetailPanelProps {
  sprintId: string;
  goals: Goal[];
  day: string;
  logs: TimeLog[];
  loading: boolean;
  onLogClick: () => void;
}

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  goals,
  day,
  logs,
  loading,
  onLogClick,
}) => {
  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]));

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-neutral-500" />
          <span className="text-neutral-400 font-bold tracking-widest">{day}</span>
          {totalMinutes > 0 && (
            <span className="text-emerald-500 text-[10px] border border-emerald-900 px-1.5 rounded">
              {formatMinutes(totalMinutes)} total
            </span>
          )}
        </div>
        <button
          onClick={onLogClick}
          className="flex items-center gap-1 text-neutral-500 hover:text-emerald-400 border border-neutral-800 hover:border-emerald-700 px-2 py-1 rounded transition-colors"
        >
          <Plus size={11} />
          LOG
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-700 animate-pulse py-2">loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-neutral-700 py-2 tracking-wider">NO_LOGS — Click LOG to add one</div>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map(log => {
            const goal = goalMap[log.goalId];
            const waName = goal?.workAreas.find(w => w.id === log.workAreaId)?.name;
            return (
              <div key={log.id} className="flex items-start gap-3 border border-neutral-900 rounded p-2 bg-neutral-950/30">
                {/* Color bar */}
                <div
                  className="w-1 rounded self-stretch flex-shrink-0"
                  style={{ backgroundColor: goal?.color ?? '#444' }}
                />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: goal?.color ?? '#aaa' }}>
                      {goal?.name ?? 'Unknown'}
                    </span>
                    {waName && <span className="text-neutral-500">/ {waName}</span>}
                    <span className="ml-auto text-neutral-500 text-[10px] flex-shrink-0">
                      {formatTime(log.startTime)} – {formatTime(log.endTime)}
                    </span>
                    <span className="text-emerald-600 text-[10px] flex-shrink-0 font-bold">
                      {formatMinutes(log.durationMinutes)}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-neutral-500 mt-0.5 truncate">{log.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
