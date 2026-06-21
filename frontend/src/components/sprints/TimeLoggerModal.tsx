import React, { useState, useEffect } from 'react';
import { sprintApi, type Goal } from '../../api/sprintClient';
import { Clock, Send, X } from 'lucide-react';

interface TimeLoggerModalProps {
  sprintId: string;
  goals: Goal[];
  preselectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Live clock — same as in dashboard
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
    <span className="text-emerald-400 text-xs tracking-widest tabular-nums select-none">
      {hh}<span className="animate-pulse opacity-70">:</span>{mm}<span className="animate-pulse opacity-70">:</span>{ss}
    </span>
  );
};

// Quick fill current time into start or end
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const TimeLoggerModal: React.FC<TimeLoggerModalProps> = ({
  sprintId,
  goals,
  preselectedDate,
  onClose,
  onSuccess,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const start = new Date(`${preselectedDate}T${startTime}:00`).toISOString();
      const end   = new Date(`${preselectedDate}T${endTime}:00`).toISOString();

      await sprintApi.logTime({
        goalId: selectedGoalId,
        workAreaId: selectedWorkAreaId,
        sprintId,
        startTime: start,
        endTime: end,
        note,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save log. Time may overlap an existing entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded max-w-md w-full p-5 relative">

        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-300 transition-colors">
          <X size={15} />
        </button>

        {/* Header with live clock */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-900">
          <Clock size={15} className="text-emerald-500" />
          <span className="font-bold tracking-wider text-sm text-emerald-500">LOG TIME</span>
          <span className="text-neutral-600 text-xs">{preselectedDate}</span>
          <span className="ml-auto">
            <LiveClock />
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
          {error && (
            <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded border border-red-900/40">
              {error}
            </div>
          )}

          {/* Goal select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-neutral-600 uppercase font-bold pl-0.5">Goal</label>
            <select
              required
              value={selectedGoalId}
              onChange={e => handleGoalChange(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs"
            >
              <option value="" disabled>Select goal...</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Work area select */}
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
              {workAreas.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Time range with NOW buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between pl-0.5">
                <label className="text-[10px] text-neutral-600 uppercase font-bold">Start</label>
                <button
                  type="button"
                  onClick={() => setStartTime(nowHHMM())}
                  className="text-[9px] text-neutral-600 hover:text-emerald-400 transition-colors"
                >
                  NOW
                </button>
              </div>
              <input
                required
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between pl-0.5">
                <label className="text-[10px] text-neutral-600 uppercase font-bold">End</label>
                <button
                  type="button"
                  onClick={() => setEndTime(nowHHMM())}
                  className="text-[9px] text-neutral-600 hover:text-emerald-400 transition-colors"
                >
                  NOW
                </button>
              </div>
              <input
                required
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 text-xs"
              />
            </div>
          </div>

          {/* Duration preview */}
          {startTime && endTime && endTime > startTime && (
            <div className="text-[10px] text-emerald-700 bg-emerald-950/20 border border-emerald-900/30 rounded px-2 py-1 text-center tracking-wider">
              {(() => {
                const [sh, sm] = startTime.split(':').map(Number);
                const [eh, em] = endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                if (mins <= 0) return '';
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return `DURATION: ${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`;
              })()}
            </div>
          )}

          {/* Note */}
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
            className="mt-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded transition-colors disabled:opacity-50 text-xs"
          >
            <Send size={13} />
            {loading ? 'SAVING...' : 'COMMIT LOG'}
          </button>
        </form>
      </div>
    </div>
  );
};
