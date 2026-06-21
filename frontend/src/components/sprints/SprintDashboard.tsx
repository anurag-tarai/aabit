import React, { useState, useEffect, useCallback } from 'react';
import { sprintApi, type Sprint, type Goal, type MatrixCell, type TimeLog } from '../../api/sprintClient';
import { TimeLoggerModal } from './TimeLoggerModal';
import { MatrixHeatmap } from './MatrixHeatmap';
import { GoalArchitect } from './GoalArchitect';
import { InitializeSprintModal } from './InitializeSprintModal';
import { DayDetailPanel } from './DayDetailPanel';
import {
  Activity, AlertTriangle, ChevronLeft, ChevronRight,
  List, Plus, Pencil, Trash2, CheckCircle, X, Check,
} from 'lucide-react';

// ─── Live Clock ───────────────────────────────────────────────────────────────
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
    <span className="font-mono text-emerald-400 text-xs tracking-widest tabular-nums select-none">
      {hh}<span className="animate-pulse opacity-70">:</span>{mm}<span className="animate-pulse opacity-70">:</span>{ss}
    </span>
  );
};

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel, danger = true }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-mono">
    <div className="bg-[#0a0a0a] border border-neutral-700 rounded max-w-xs w-full p-5">
      <p className="text-neutral-300 text-sm mb-4 leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded transition-colors"
        >
          CANCEL
        </button>
        <button
          onClick={onConfirm}
          className={`px-3 py-1.5 text-xs rounded font-bold transition-colors ${
            danger
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
          }`}
        >
          CONFIRM
        </button>
      </div>
    </div>
  </div>
);

// ─── Sprint month helpers ──────────────────────────────────────────────────────
function getSprintMonths(sprint: Sprint): string[] {
  const [sy, sm] = sprint.startDate.split('-').map(Number);
  const [ey, em] = sprint.endDate.split('-').map(Number);
  const months: string[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

// ─── Edit Sprint Inline ───────────────────────────────────────────────────────
interface EditSprintModalProps {
  sprint: Sprint;
  onClose: () => void;
  onSaved: (s: Sprint) => void;
}
const EditSprintModal: React.FC<EditSprintModalProps> = ({ sprint, onClose, onSaved }) => {
  const [name, setName] = useState(sprint.name);
  const [startDate, setStartDate] = useState(sprint.startDate);
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await sprintApi.updateSprint(sprint.id, { name, startDate, endDate });
      onSaved(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update sprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded max-w-sm w-full p-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-300">
          <X size={15} />
        </button>
        <div className="flex items-center gap-2 text-emerald-500 mb-5 pb-2 border-b border-neutral-900">
          <Pencil size={14} />
          <span className="font-bold tracking-wider text-sm">EDIT SPRINT</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {error && (
            <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded border border-red-900/40">{error}</div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-neutral-600 uppercase font-bold">Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-600 uppercase font-bold">Start</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-600 uppercase font-bold">End</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded transition-colors disabled:opacity-50 text-xs"
          >
            {loading ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const SprintDashboard: React.FC = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixCell[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSprintList, setShowSprintList] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showEditSprint, setShowEditSprint] = useState(false);
  const [showGoalArchitect, setShowGoalArchitect] = useState(false);

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'sprint'; id: string; name: string } | null>(null);
  const [completConfirm, setCompleteConfirm] = useState(false);

  // Month navigation — constrained to sprint months
  const [monthIndex, setMonthIndex] = useState(0); // index into sprintMonths array

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [showLogModal, setShowLogModal] = useState(false);
  const [dayLogs, setDayLogs] = useState<TimeLog[]>([]);
  const [dayLogsLoading, setDayLogsLoading] = useState(false);

  // Compute months available in this sprint
  const sprintMonths = activeSprint ? getSprintMonths(activeSprint) : [];
  const currentMonthStr = sprintMonths[monthIndex] ?? sprintMonths[0];

  const loadSprints = useCallback(async () => {
    const res = await sprintApi.getAllSprints();
    setSprints(res.data);
    return res.data;
  }, []);

  const loadSprintData = useCallback(async (sprint: Sprint, mStr: string) => {
    const [goalsRes, matrixRes] = await Promise.all([
      sprintApi.getSprintGoals(sprint.id),
      sprintApi.getCalendarMatrix(sprint.id, mStr),
    ]);
    setGoals(goalsRes.data);
    setMatrixData(matrixRes.data.matrix);
  }, []);

  // Compute the right initial month index for a sprint (clamp to today's month if inside sprint)
  const getInitialMonthIdx = (sprint: Sprint): number => {
    const months = getSprintMonths(sprint);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const idx = months.indexOf(todayStr);
    return idx >= 0 ? idx : 0;
  };

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const allSprints = await loadSprints();
      const currentRes = await sprintApi.getCurrentSprint();
      const current = currentRes.status === 204 ? null : currentRes.data;

      if (current) {
        setActiveSprint(current);
        const idx = getInitialMonthIdx(current);
        setMonthIndex(idx);
        const months = getSprintMonths(current);
        await loadSprintData(current, months[idx]);
      } else if (allSprints.length > 0) {
        setActiveSprint(allSprints[0]);
        setMonthIndex(0);
        const months = getSprintMonths(allSprints[0]);
        await loadSprintData(allSprints[0], months[0]);
      } else {
        setActiveSprint(null);
      }
    } catch (err) {
      console.error('Sprint init failed', err);
      setActiveSprint(null);
    } finally {
      setLoading(false);
    }
  }, [loadSprints, loadSprintData]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Reload matrix when month changes
  useEffect(() => {
    if (!activeSprint || !currentMonthStr) return;
    sprintApi.getCalendarMatrix(activeSprint.id, currentMonthStr)
      .then(r => setMatrixData(r.data.matrix))
      .catch(console.error);
  }, [activeSprint, currentMonthStr]);

  // Reload day logs when selected day or sprint changes
  useEffect(() => {
    if (!activeSprint || !selectedDay) return;
    setDayLogsLoading(true);
    sprintApi.getLogsForDay(activeSprint.id, selectedDay)
      .then(r => setDayLogs(r.data))
      .catch(console.error)
      .finally(() => setDayLogsLoading(false));
  }, [activeSprint, selectedDay]);

  const handleDayClick = (day: number) => {
    if (!currentMonthStr) return;
    const [y, m] = currentMonthStr.split('-');
    setSelectedDay(`${y}-${m}-${String(day).padStart(2, '0')}`);
    setShowLogModal(true);
  };

  const handleSprintSwitch = async (sprint: Sprint) => {
    setActiveSprint(sprint);
    setShowSprintList(false);
    const idx = getInitialMonthIdx(sprint);
    setMonthIndex(idx);
    const months = getSprintMonths(sprint);
    await loadSprintData(sprint, months[idx]);
  };

  const handleDeleteSprint = async () => {
    if (!confirmDelete || !activeSprint) return;
    try {
      await sprintApi.deleteSprint(confirmDelete.id);
      setConfirmDelete(null);
      await initialize();
    } catch (err: any) {
      console.error('Delete sprint failed', err);
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    try {
      const res = await sprintApi.completeSprint(activeSprint.id);
      setActiveSprint(res.data);
      setSprints(prev => prev.map(s => s.id === res.data.id ? res.data : s));
      setCompleteConfirm(false);
    } catch (err) {
      console.error('Complete sprint failed', err);
    }
  };

  if (loading) {
    return (
      <div className="font-mono text-neutral-500 p-6 animate-pulse text-xs tracking-widest">
        LOADING_SPRINT_DATA...
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neutral-800 rounded text-neutral-500 font-mono mx-4">
        <AlertTriangle size={28} className="mb-4 text-yellow-600/40" />
        <p className="tracking-widest text-xs mb-4">NO_SPRINT_FOUND</p>
        <button
          onClick={() => setShowCreateSprint(true)}
          className="text-xs px-4 py-2 border border-neutral-700 hover:border-emerald-600 text-neutral-400 hover:text-emerald-400 transition-all rounded"
        >
          [ CREATE_FIRST_SPRINT ]
        </button>
        {showCreateSprint && (
          <InitializeSprintModal
            onClose={() => setShowCreateSprint(false)}
            onSuccess={() => { setShowCreateSprint(false); initialize(); }}
          />
        )}
      </div>
    );
  }

  const monthFocus = currentMonthStr
    ? new Date(currentMonthStr + '-01')
    : new Date();

  return (
    <div className="flex flex-col gap-4 font-mono p-2">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Activity size={16} className="text-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase">{activeSprint.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${activeSprint.status === 'ACTIVE' ? 'text-emerald-600 border-emerald-900 bg-emerald-950/30' : 'text-neutral-500 border-neutral-800'}`}>
            {activeSprint.status}
          </span>
          <span className="text-neutral-600 text-[10px] hidden sm:inline">
            {activeSprint.startDate} → {activeSprint.endDate}
          </span>
          {/* Live clock — web */}
          <span className="hidden sm:flex items-center gap-1 border border-neutral-800 rounded px-2 py-1 bg-neutral-950">
            <LiveClock />
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">

          {/* Month navigator — only shows months in this sprint */}
          <div className="flex items-center gap-1 border border-neutral-800 rounded px-2 py-1 bg-neutral-950">
            <button
              onClick={() => setMonthIndex(i => Math.max(0, i - 1))}
              disabled={monthIndex === 0}
              className="hover:text-emerald-400 p-0.5 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="text-neutral-400 font-bold px-1 min-w-[80px] text-center">
              {monthFocus.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
            <button
              onClick={() => setMonthIndex(i => Math.min(sprintMonths.length - 1, i + 1))}
              disabled={monthIndex === sprintMonths.length - 1}
              className="hover:text-emerald-400 p-0.5 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Sprint month pills */}
          {sprintMonths.length > 1 && (
            <div className="hidden md:flex items-center gap-1">
              {sprintMonths.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMonthIndex(i)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    i === monthIndex
                      ? 'border-emerald-700 text-emerald-400 bg-emerald-950/30'
                      : 'border-neutral-800 text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {new Date(m + '-01').toLocaleString('default', { month: 'short' }).toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Sprint actions */}
          <div className="relative">
            <button
              onClick={() => setShowSprintList(v => !v)}
              className="flex items-center gap-1 border border-neutral-800 hover:border-neutral-600 rounded px-2 py-1 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <List size={13} />
              <span>SPRINTS</span>
            </button>
            {showSprintList && (
              <div className="absolute right-0 top-8 bg-[#0a0a0a] border border-neutral-800 rounded shadow-xl z-20 min-w-[220px]">
                {sprints.map(s => (
                  <div key={s.id} className="flex items-center group border-b border-neutral-900 last:border-0">
                    <button
                      onClick={() => handleSprintSwitch(s)}
                      className={`flex-1 text-left px-3 py-2 text-xs hover:bg-neutral-900 transition-colors ${s.id === activeSprint.id ? 'text-emerald-400' : 'text-neutral-400'}`}
                    >
                      {s.name}
                      <span className="ml-1 text-neutral-600 text-[10px]">{s.startDate.slice(0, 7)} → {s.endDate.slice(0, 7)}</span>
                    </button>
                    <button
                      onClick={() => { setShowSprintList(false); setActiveSprint(s); setShowEditSprint(true); }}
                      className="p-2 text-neutral-700 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit sprint"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => { setShowSprintList(false); setConfirmDelete({ type: 'sprint', id: s.id, name: s.name }); }}
                      className="p-2 text-neutral-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete sprint"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => { setShowSprintList(false); setShowCreateSprint(true); }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-500 hover:text-emerald-400 hover:bg-neutral-900 transition-colors flex items-center gap-1"
                >
                  <Plus size={11} /> NEW SPRINT
                </button>
              </div>
            )}
          </div>

          {/* Current sprint quick actions */}
          <button
            onClick={() => setShowEditSprint(true)}
            title="Edit current sprint"
            className="border border-neutral-800 hover:border-neutral-600 rounded p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => setConfirmDelete({ type: 'sprint', id: activeSprint.id, name: activeSprint.name })}
            title="Delete current sprint"
            className="border border-neutral-800 hover:border-red-900 rounded p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
          {activeSprint.status === 'ACTIVE' && (
            <button
              onClick={() => setCompleteConfirm(true)}
              title="Mark sprint complete"
              className="border border-neutral-800 hover:border-emerald-700 rounded p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors"
            >
              <CheckCircle size={12} />
            </button>
          )}

          {/* Goal architect toggle */}
          <button
            onClick={() => setShowGoalArchitect(v => !v)}
            className={`border rounded px-2 py-1 text-xs transition-colors ${showGoalArchitect ? 'border-emerald-700 text-emerald-400 bg-emerald-950/20' : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
          >
            GOALS
          </button>
        </div>
      </div>

      {/* ── Goal Architect (collapsible) ── */}
      {showGoalArchitect && (
        <GoalArchitect
          sprintId={activeSprint.id}
          activeGoals={goals}
          onUpdate={async () => {
            const res = await sprintApi.getSprintGoals(activeSprint.id);
            setGoals(res.data);
          }}
        />
      )}

      {/* ── Matrix ── */}
      <MatrixHeatmap
        goals={goals}
        matrixData={matrixData}
        monthFocus={monthFocus}
        selectedDay={selectedDay}
        onDayClick={handleDayClick}
      />

      {/* ── Day Detail ── */}
      <DayDetailPanel
        sprintId={activeSprint.id}
        goals={goals}
        day={selectedDay}
        logs={dayLogs}
        loading={dayLogsLoading}
        onLogClick={() => setShowLogModal(true)}
        onLogDeleted={async () => {
          const res = await sprintApi.getLogsForDay(activeSprint.id, selectedDay);
          setDayLogs(res.data);
          const mRes = await sprintApi.getCalendarMatrix(activeSprint.id, currentMonthStr);
          setMatrixData(mRes.data.matrix);
        }}
      />

      {/* ── Time Logger Modal ── */}
      {showLogModal && (
        <TimeLoggerModal
          sprintId={activeSprint.id}
          goals={goals}
          preselectedDate={selectedDay}
          onClose={() => setShowLogModal(false)}
          onSuccess={async () => {
            setShowLogModal(false);
            const [matrixRes, logsRes] = await Promise.all([
              sprintApi.getCalendarMatrix(activeSprint.id, currentMonthStr),
              sprintApi.getLogsForDay(activeSprint.id, selectedDay),
            ]);
            setMatrixData(matrixRes.data.matrix);
            setDayLogs(logsRes.data);
          }}
        />
      )}

      {/* ── Create Sprint Modal ── */}
      {showCreateSprint && (
        <InitializeSprintModal
          onClose={() => setShowCreateSprint(false)}
          onSuccess={async () => { setShowCreateSprint(false); await initialize(); }}
        />
      )}

      {/* ── Edit Sprint Modal ── */}
      {showEditSprint && activeSprint && (
        <EditSprintModal
          sprint={activeSprint}
          onClose={() => setShowEditSprint(false)}
          onSaved={updated => {
            setActiveSprint(updated);
            setSprints(prev => prev.map(s => s.id === updated.id ? updated : s));
            setShowEditSprint(false);
          }}
        />
      )}

      {/* ── Confirm Delete Sprint ── */}
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete sprint "${confirmDelete.name}"? This cannot be undone. Time logs will be preserved but unlinked from the sprint.`}
          onConfirm={handleDeleteSprint}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Confirm Complete Sprint ── */}
      {completConfirm && (
        <ConfirmDialog
          message={`Mark sprint "${activeSprint.name}" as COMPLETED? You can still view data but it will no longer be the active sprint.`}
          onConfirm={handleCompleteSprint}
          onCancel={() => setCompleteConfirm(false)}
          danger={false}
        />
      )}
    </div>
  );
};
