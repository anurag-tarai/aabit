import { CustomInput } from '../common/CustomInput';
import React, { useState } from 'react';
import { sprintApi, type Goal, type TimeLog, type Target } from '../../api/sprintClient';
import { Clock, Plus, Trash2, Pencil, Target as TargetIcon, Check } from 'lucide-react';
import { TimeLoggerModal } from './TimeLoggerModal';

interface DayDetailPanelProps {
  sprintId: string;
  goals: Goal[];
  day: string;
  logs: TimeLog[];
  loading: boolean;
  onLogClick: () => void;
  onLogDeleted: () => void;
  onLogUpdated: () => void;

  // Lifted target props
  targets: Target[];
  targetsLoading: boolean;
  onTargetToggle: (t: Target) => Promise<void>;
  onTargetDelete: (id: string) => Promise<void>;
  onTargetEditClick: (t: Target) => void;
  onTargetMove: (t: Target) => Promise<void>;
  onAddTargetClick: () => void;
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60); const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  sprintId, goals, day, logs, loading, onLogClick, onLogDeleted, onLogUpdated,
  targets, targetsLoading, onTargetToggle, onTargetDelete, onTargetEditClick, onTargetMove, onAddTargetClick
}) => {
  const goalMap = Object.fromEntries(goals.map(g => [g.id, g]));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const [editingLog, setEditingLog]           = useState<TimeLog | null>(null);
  const [showUnfinished, setShowUnfinished]   = useState(false);

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await sprintApi.deleteTimeLog(id);
      setConfirmDeleteId(null);
      onLogDeleted();
    } catch (e) { console.error('Delete time log failed', e); }
    finally { setDeleting(false); }
  };

  // Filter targets:
  // If showUnfinished is true, show ALL unfinished targets in the current list
  // Otherwise, filter strictly by this day
  const dailyTargets = targets.filter(t => t.targetType === 'DAILY' && (showUnfinished ? !t.completed : t.targetDate === day));
  const weeklyTargets = targets.filter(t => t.targetType === 'WEEKLY' && (showUnfinished ? !t.completed : true));

  // Flatten all work areas for lookups
  const allWorkAreas = goals.flatMap(g => g.workAreas.map(wa => ({ ...wa, goalColor: g.color, goalName: g.name })));
  const workAreaMap = Object.fromEntries(allWorkAreas.map(wa => [wa.id, wa]));

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGHEST': return 'text-red-400 border-red-950/60 bg-red-950/20';
      case 'LOW': return 'text-blue-400 border-blue-950/60 bg-blue-950/20';
      default: return 'text-amber-400 border-amber-900/60 bg-amber-900/20';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        
        {/* TIME LOGS COL */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-neutral-500" />
              <span className="text-neutral-400 font-bold tracking-widest">LOGS: {day}</span>
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
              <Plus size={11} /> LOG
            </button>
          </div>

          {loading ? (
            <div className="text-neutral-700 animate-pulse py-2">loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-neutral-700 py-2 tracking-wider">NO_LOGS — click LOG to add one</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {logs.map(log => {
                const isAnon = log.goalId === null;
                const goal   = !isAnon ? goalMap[log.goalId!] : null;
                const waName = goal?.workAreas.find(w => w.id === log.workAreaId)?.name;
                const isConfirming = confirmDeleteId === log.id;

                return (
                  <div key={log.id} className="flex items-start gap-3 border border-neutral-900 rounded p-2 bg-neutral-950 group">
                    <div
                      className="w-1 rounded self-stretch flex-shrink-0"
                      style={{ backgroundColor: isAnon ? '#64748b' : (goal?.color ?? '#444') }}
                    />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAnon ? (
                          <span className="font-bold text-slate-400">
                            {log.anonymousName ?? 'Misc'}
                          </span>
                        ) : (
                          <>
                            <span className="font-bold" style={{ color: goal?.color ?? '#aaa' }}>
                              {goal?.name ?? 'Unknown'}
                            </span>
                            {waName && <span className="text-neutral-500">/ {waName}</span>}
                          </>
                        )}
                        <span className="ml-auto text-neutral-500 text-[10px] flex-shrink-0">
                          {formatTime(log.startTime)} – {formatTime(log.endTime)}
                        </span>
                        <span className="text-emerald-655 text-[10px] flex-shrink-0 font-bold">
                          {formatMinutes(log.durationMinutes)}
                        </span>
                      </div>
                      {log.note && <p className="text-neutral-500 mt-0.5 text-[10px]">{log.note}</p>}
                    </div>

                    {/* Edit + Delete controls */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(log.id)}
                            disabled={deleting}
                            className="text-[10px] text-red-400 hover:text-red-300 border border-red-900/40 rounded px-1.5 py-0.5 font-bold"
                          >
                            {deleting ? '...' : 'DEL'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] text-neutral-600 hover:text-neutral-400 border border-neutral-800 rounded px-1.5 py-0.5"
                          >
                            NO
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingLog(log)}
                            className="text-neutral-800 hover:text-emerald-455 transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit log"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(log.id)}
                            className="text-neutral-800 hover:text-red-455 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete log"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TARGETS COL */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <TargetIcon size={13} className="text-violet-400" />
              <span className="text-neutral-400 font-bold tracking-widest">{showUnfinished ? 'UNFINISHED TARGETS' : 'TARGETS'}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-neutral-500 hover:text-neutral-300">
                <CustomInput
                  type="checkbox"
                  checked={showUnfinished}
                  onChange={(e) => setShowUnfinished(e.target.checked)}
                  className="accent-violet-500 rounded border-neutral-800 bg-neutral-900"
                />
                Unfinished
              </label>
              <button
                onClick={onAddTargetClick}
                className="flex items-center gap-1 text-neutral-500 hover:text-violet-400 border border-neutral-800 hover:border-violet-700 px-2 py-1 rounded transition-colors"
              >
                <Plus size={11} /> ADD
              </button>
            </div>
          </div>

          {targetsLoading ? (
            <div className="text-neutral-700 animate-pulse py-2">loading targets...</div>
          ) : (dailyTargets.length === 0 && weeklyTargets.length === 0) ? (
            <div className="text-neutral-700 py-2 tracking-wider">NO_TARGETS_SCHEDULED — set in weekly targets</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              
              {/* Daily Targets List */}
              {dailyTargets.length > 0 && (
                <div>
                  <div className="text-[10px] text-neutral-600 font-bold uppercase mb-1.5 tracking-wider">Daily Targets</div>
                  <div className="flex flex-col gap-1.5 pl-1.5">
                    {dailyTargets.map(t => renderTargetItem(t))}
                  </div>
                </div>
              )}

              {/* Weekly Targets List */}
              {weeklyTargets.length > 0 && (
                <div>
                  <div className="text-[10px] text-neutral-600 font-bold uppercase mb-1.5 tracking-wider">Weekly Targets (Flexible)</div>
                  <div className="flex flex-col gap-1.5 pl-1.5">
                    {weeklyTargets.map(t => renderTargetItem(t))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Edit modal — renders only when a log is selected for editing */}
      {editingLog && (
        <TimeLoggerModal
          sprintId={sprintId}
          goals={goals}
          preselectedDate={day}
          editingLog={editingLog}
          onClose={() => setEditingLog(null)}
          onSuccess={() => {
            setEditingLog(null);
            onLogUpdated();
          }}
        />
      )}
    </>
  );

  // Helper helper to render target card/item
  function renderTargetItem(t: Target) {
    const wa = t.workAreaId ? workAreaMap[t.workAreaId] : null;
    let goal = t.goalId ? goalMap[t.goalId] : null;
    if (wa && !goal) {
      goal = goalMap[wa.goalId];
    }
    const isCompleted = t.completed;

    return (
      <div
        key={t.id}
        className={`flex items-start gap-2 border rounded p-2 group transition-all border-neutral-900 bg-neutral-950`}
      >
        {/* Toggle Checkbox */}
        <button
          onClick={() => onTargetToggle(t)}
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'border-neutral-700 bg-neutral-900 hover:border-violet-500'
          }`}
          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted && <Check size={10} />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className={`text-[11px] leading-tight ${isCompleted ? 'line-through text-neutral-600' : 'text-neutral-300 font-medium'}`}>
            {t.name}
            {t.isFixed && (
              <span className="text-[9px] text-amber-500 font-bold border border-amber-900/50 bg-amber-950/20 px-1 rounded ml-1.5" title="Must do on this day">
                FIXED
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {goal && (
              <span className="text-[9px] font-bold" style={{ color: goal.color }}>
                {goal.name}
              </span>
            )}
            {wa && (
              <span className="text-[9px] text-neutral-600">/ {wa.name}</span>
            )}
            {!goal && !wa && (
              <span className="text-[9px] text-slate-500 italic">Anonymous</span>
            )}


            {/* Priority Indicator badge */}
            <span className={`text-[8px] font-extrabold border px-1 rounded-sm scale-95 uppercase ${getPriorityBadgeClass(t.priority)}`}>
              {t.priority}
            </span>
          </div>
        </div>

        {/* Edit/Move/Delete Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onTargetMove(t)}
              className="text-[9px] font-bold text-neutral-500 hover:text-emerald-400 border border-neutral-800 hover:border-emerald-700 rounded px-1.5 py-0.5 mr-1"
              title={t.targetType === 'DAILY' ? 'Move to tomorrow' : 'Move to next week'}
            >
              [Move]
            </button>
          <button
            onClick={() => onTargetEditClick(t)}
            className="text-neutral-700 hover:text-emerald-450 transition-colors"
            title="Edit target"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onTargetDelete(t.id)}
            className="text-neutral-700 hover:text-red-450 transition-colors"
            title="Delete target"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  }
};