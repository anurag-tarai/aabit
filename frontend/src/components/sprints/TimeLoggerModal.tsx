import React, { useState, useEffect } from 'react';
import { sprintApi, type Goal, type TimeLog } from '../../api/sprintClient';
import { Clock, Send, X, Tag, Pencil } from 'lucide-react';
import { CircularClockPicker } from './CircularClockPicker';

interface TimeLoggerModalProps {
  sprintId: string;
  goals: Goal[];
  preselectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
  editingLog?: TimeLog; // ★ optional — when set, switches to edit mode
  preselectedGoalId?: string; // ★ optional — preselects a goal from grid click
}

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  return (
    <span className="text-xs font-mono text-neutral-500">
      {hh}:{mm}:{ss}
    </span>
  );
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const isoToHHMM = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type LogMode = 'goal' | 'anonymous';

export const TimeLoggerModal: React.FC<TimeLoggerModalProps> = ({
  sprintId, goals, preselectedDate, onClose, onSuccess, editingLog, preselectedGoalId
}) => {
  const isEditing = !!editingLog;
  
  // Derive initial mode from editingLog or preselectedGoalId
  const initMode: LogMode = editingLog
    ? (editingLog.goalId ? 'goal' : 'anonymous')
    : 'goal';

  const [mode, setMode] = useState<LogMode>(initMode);
  const [selectedGoalId, setSelectedGoalId] = useState(editingLog?.goalId ?? preselectedGoalId ?? '');
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState(editingLog?.workAreaId ?? '');
  const [anonymousName, setAnonymousName] = useState(editingLog?.anonymousName ?? '');
  const [startTime, setStartTime] = useState(editingLog ? isoToHHMM(editingLog.startTime) : '');
  const [endTime, setEndTime] = useState(editingLog ? isoToHHMM(editingLog.endTime) : '');
  const [note, setNote] = useState(editingLog?.note ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clock picker popups state
  const [clockPickerTarget, setClockPickerTarget] = useState<'start' | 'end' | null>(null);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const workAreas = selectedGoal?.workAreas ?? [];

  const handleGoalChange = (id: string) => {
    setSelectedGoalId(id);
    setSelectedWorkAreaId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const startDate = new Date(`${preselectedDate}T${startTime}:00`);
      const endDate = new Date(`${preselectedDate}T${endTime}:00`);
      
      // If end time is before start time, it means it crossed midnight to the next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const start = startDate.toISOString();
      const end = endDate.toISOString();

      if (isEditing && editingLog) {
        // ★ EDIT mode — PATCH existing log
        if (mode === 'goal') {
          await sprintApi.updateTimeLog(editingLog.id, {
            goalId: selectedGoalId || null,
            workAreaId: selectedWorkAreaId || null,
            anonymousName: null,
            startTime: start,
            endTime: end,
            note,
          });
        } else {
          await sprintApi.updateTimeLog(editingLog.id, {
            goalId: null,
            workAreaId: null,
            anonymousName: anonymousName.trim() || 'Misc',
            startTime: start,
            endTime: end,
            note,
          });
        }
      } else {
        // CREATE mode — POST new log
        if (mode === 'goal') {
          await sprintApi.logTime({ goalId: selectedGoalId, workAreaId: selectedWorkAreaId, sprintId, startTime: start, endTime: end, note });
        } else {
          await sprintApi.logTime({ anonymousName: anonymousName.trim() || 'Misc', sprintId, startTime: start, endTime: end, note });
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save log. Time may overlap an existing entry.');
    } finally {
      setLoading(false);
    }
  };

  const durationPreview = (() => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let total = (eh * 60 + em) - (sh * 60 + sm);
    
    // Handle crossing midnight
    if (total < 0) {
      total += 24 * 60;
    }
    
    if (total === 0) return null; // Can't log 0 minutes
    
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg max-w-sm w-full font-mono text-sm shadow-2xl overflow-hidden animate-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            {isEditing ? <Pencil size={13} className="text-emerald-500" /> : <Clock size={13} className="text-emerald-500" />}
            <span className="text-neutral-300 font-bold tracking-widest text-[11px]">
              {isEditing ? 'EDIT LOG' : 'LOG TIME'}
            </span>
            <span className="text-neutral-700 text-[10px]">{preselectedDate}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing && <LiveClock />}
            <button type="button" onClick={onClose} className="text-neutral-600 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
          {/* Mode toggle */}
          <div className="flex bg-neutral-900 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setMode('goal')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-colors font-bold ${
                mode === 'goal' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              GOAL LINKED
            </button>
            <button
              type="button"
              onClick={() => setMode('anonymous')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-colors font-bold ${
                mode === 'anonymous' ? 'bg-neutral-800 text-slate-300' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Tag size={11} /> MISC / ANON
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
            {error && (
              <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded border border-red-900/40">
                {error}
              </div>
            )}

            {mode === 'goal' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-600 uppercase font-bold pl-0.5">Goal</label>
                  <select
                    required
                    value={selectedGoalId}
                    onChange={e => handleGoalChange(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs"
                  >
                    <option value="" disabled>Select goal...</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-600 uppercase font-bold pl-0.5">Work Area</label>
                  <select
                    required
                    disabled={!selectedGoalId || workAreas.length === 0}
                    value={selectedWorkAreaId}
                    onChange={e => setSelectedWorkAreaId(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs disabled:opacity-40"
                  >
                    <option value="" disabled>
                      {workAreas.length === 0 ? 'No work areas — add in Goals panel' : 'Select work area...'}
                    </option>
                    {workAreas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-600 uppercase font-bold pl-0.5">Label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Meeting, Break, Admin..."
                  value={anonymousName}
                  onChange={e => setAnonymousName(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-slate-600 text-xs"
                />
                <span className="text-[10px] text-neutral-700 pl-0.5">
                  Appears as a grey row — not linked to any goal.
                </span>
              </div>
            )}

            {/* Time range using custom round clock picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['Start', 'End'] as const).map(label => {
                const val = label === 'Start' ? startTime : endTime;
                const setVal = label === 'Start' ? setStartTime : setEndTime;
                const targetKey = label === 'Start' ? 'start' : 'end';
                return (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between pl-0.5">
                      <label className="text-[10px] text-neutral-600 uppercase font-bold">{label}</label>
                      <button type="button" onClick={() => setVal(nowHHMM())} className="text-[9px] text-neutral-600 hover:text-emerald-400 transition-colors font-bold">NOW</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClockPickerTarget(targetKey)}
                      className="w-full text-left bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none hover:border-emerald-700/80 transition-colors flex items-center justify-between text-xs font-mono h-9"
                    >
                      <span>{val || '--:--'}</span>
                      <Clock size={11} className="text-neutral-500" />
                    </button>
                  </div>
                );
              })}
            </div>

            {durationPreview && (
              <div className="text-[10px] text-emerald-700 bg-emerald-950/20 border border-emerald-900/30 rounded px-2 py-1 text-center tracking-wider">
                {durationPreview}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-600 uppercase font-bold pl-0.5">Note (optional)</label>
              <input
                type="text"
                placeholder="What did you work on?"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded transition-colors disabled:opacity-50 text-xs shadow-md"
            >
              <Send size={13} />
              {loading ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'COMMIT LOG'}
            </button>
          </form>
        </div>

      </div>

      {/* Render the Custom Android-style circular clock picker */}
      {clockPickerTarget && (
        <CircularClockPicker
          initialTime={clockPickerTarget === 'start' ? startTime : endTime}
          title={`Select ${clockPickerTarget === 'start' ? 'Start' : 'End'} Time`}
          onClose={() => setClockPickerTarget(null)}
          onSave={(timeStr) => {
            if (clockPickerTarget === 'start') {
              setStartTime(timeStr);
            } else {
              setEndTime(timeStr);
            }
            setClockPickerTarget(null);
          }}
        />
      )}
    </div>
  );
};