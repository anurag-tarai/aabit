import { showErrorToast } from '../../utils/toast';
import React, { useState, useEffect, useCallback } from 'react';
import { sprintApi, type Sprint, type Goal, type MatrixCell, type TimeLog } from '../../api/sprintClient';
import { TimeLoggerModal } from './TimeLoggerModal';
import { MatrixHeatmap } from './MatrixHeatmap';
import { GoalArchitect } from './GoalArchitect';
import { InitializeSprintModal } from './InitializeSprintModal';
import { DayDetailPanel } from './DayDetailPanel';
import { TargetModal } from './TargetModal';
import { getMondayFromDate } from '../../api/sprintClient';
import {
  Activity, AlertTriangle, ChevronLeft, ChevronRight,
  List, Plus, Pencil, Trash2, CheckCircle, X, Menu
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
    <span className="text-xs font-mono text-neutral-500 tracking-widest">
      {hh}:{mm}:{ss}
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-[#0a0a0a] border border-neutral-800 p-4 rounded-lg flex flex-col gap-4 max-w-sm w-full font-mono text-sm shadow-2xl">
      <p className="text-neutral-300">{message}</p>
      <div className="flex justify-end gap-2">
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
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sprintApi.updateSprint(sprint.id, { name, startDate, endDate });
      onSaved(res.data);
    } catch (err: any) {
      showErrorToast(err.response?.data?.message ?? 'Failed to update sprint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-neutral-800 p-4 rounded-lg flex flex-col gap-4 max-w-sm w-full font-mono text-sm shadow-2xl">
        <div className="flex justify-between items-center text-emerald-500 border-b border-neutral-800 pb-2">
          <span className="font-bold tracking-widest">EDIT SPRINT</span>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-500 uppercase">
            Name
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 uppercase">
            Start
            <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 uppercase">
            End
            <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600" />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded transition-colors disabled:opacity-50 text-xs"
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'sprint'; id: string; name: string } | null>(null);
  const [completConfirm, setCompleteConfirm] = useState(false);
  
  // Month navigation — constrained to sprint months
  const [monthIndex, setMonthIndex] = useState(0); 
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [dayLogs, setDayLogs] = useState<TimeLog[]>([]);
  const [dayLogsLoading, setDayLogsLoading] = useState(false);
  const [preselectedGoalId, setPreselectedGoalId] = useState<string | undefined>();

  // Targets state
  const [targets, setTargets] = useState<any[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any | null>(null);

  // Compute months available in this sprint
  const sprintMonths = activeSprint ? getSprintMonths(activeSprint) : [];
  const currentMonthStr = sprintMonths[monthIndex] ?? sprintMonths[0];

  const loadTargets = useCallback(async () => {
    setTargetsLoading(true);
    try {
      const monday = getMondayFromDate(selectedDay);
      const res = await sprintApi.getTargetsForWeek(monday);
      setTargets(res.data);
    } finally {
      setTargetsLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (activeSprint) {
      loadTargets();
    }
  }, [activeSprint, loadTargets]);

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

  useEffect(() => {
    if (!activeSprint || !currentMonthStr) return;
    sprintApi.getCalendarMatrix(activeSprint.id, currentMonthStr)
      .then(r => setMatrixData(r.data.matrix))
      .catch(console.error);
  }, [activeSprint, currentMonthStr]);

  useEffect(() => {
    if (!activeSprint || !selectedDay) return;
    setDayLogsLoading(true);
    sprintApi.getLogsForDay(activeSprint.id, selectedDay)
      .then(r => setDayLogs(r.data))
      .catch(console.error)
      .finally(() => setDayLogsLoading(false));
  }, [activeSprint, selectedDay]);


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

  const handleTargetToggle = async (t: any) => {
    await sprintApi.toggleTargetComplete(t.id);
    loadTargets();
  };

  const handleTargetDelete = async (id: string) => {
    await sprintApi.deleteTarget(id);
    loadTargets();
  };

  const handleTargetMove = async (t: any) => {
    const isDaily = t.targetType === 'DAILY';
    const dateStr = isDaily ? t.targetDate : t.weekStartDate;
    if (!dateStr) return;
    
    const date = new Date(dateStr);
    date.setDate(date.getDate() + (isDaily ? 1 : 7));
    const newDateStr = date.toISOString().split('T')[0];

    const payload: any = { ...t };
    if (isDaily) {
      payload.targetDate = newDateStr;
    } else {
      payload.weekStartDate = newDateStr;
      payload.targetDate = null;
    }

    await sprintApi.updateTarget(t.id, payload);
    loadTargets();
  };

  const handleDaySelect = async (day: number) => {
    const dStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dStr);
    setDayLogsLoading(true);
    try {
      const res = await sprintApi.getLogsForDay(activeSprint!.id, dStr);
      setDayLogs(res.data);
    } finally {
      setDayLogsLoading(false);
    }
  };

  const handleDayLogClick = async (day: number, goalId?: string) => {
    const dStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dStr);
    setPreselectedGoalId(goalId);
    setShowLogModal(true);
    setDayLogsLoading(true);
    try {
      const res = await sprintApi.getLogsForDay(activeSprint!.id, dStr);
      setDayLogs(res.data);
    } finally {
      setDayLogsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500 font-mono text-xs animate-pulse">
        LOADING_SPRINT_DATA...
      </div>
    );
  }

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-neutral-800 rounded-lg text-neutral-500 font-mono gap-4">
        <AlertTriangle size={32} className="text-neutral-700" />
        <p>NO_SPRINT_FOUND</p>
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

  const monthFocus = currentMonthStr ? new Date(currentMonthStr + '-01') : new Date();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 font-sans">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-emerald-500" />
          <h1 className="text-xl font-bold tracking-wider text-white uppercase font-mono">
            {activeSprint.name}
          </h1>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
            activeSprint.status === 'ACTIVE' 
              ? 'text-emerald-600 border-emerald-900 bg-emerald-950/30' 
              : 'text-neutral-500 border-neutral-800'
          }`}>
            {activeSprint.status}
          </span>
          <span className="text-xs text-neutral-500 font-mono hidden sm:inline-block">
            {activeSprint.startDate} → {activeSprint.endDate}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4">
              <LiveClock />
              
              <div className="flex items-center gap-2">
                <button onClick={() => setMonthIndex(i => Math.max(0, i - 1))} disabled={monthIndex === 0} className="hover:text-emerald-400 p-0.5 transition-colors disabled:opacity-30 text-neutral-500">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-mono font-bold text-neutral-300 w-24 text-center">
                  {monthFocus.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
                <button onClick={() => setMonthIndex(i => Math.min(sprintMonths.length - 1, i + 1))} disabled={monthIndex === sprintMonths.length - 1} className="hover:text-emerald-400 p-0.5 transition-colors disabled:opacity-30 text-neutral-500">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <button onClick={() => setShowMobileMenu(v => !v)} className="md:hidden text-neutral-400 hover:text-white transition-colors p-1">
              <Menu size={18} />
            </button>
          </div>

          <div className={`${showMobileMenu ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-end md:items-center gap-3 md:gap-4 mt-2 md:mt-0`}>
            <div className="relative">
              <button onClick={() => setShowSprintList(v => !v)} className="flex items-center gap-1 border border-neutral-800 hover:border-neutral-600 rounded px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors font-mono">
                <List size={14} /> SPRINTS
              </button>
              
              {showSprintList && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a] border border-neutral-800 rounded shadow-2xl z-20 flex flex-col overflow-hidden font-mono">
                  {sprints.map(s => (
                    <div key={s.id} className="group flex items-center justify-between border-b border-neutral-800/50">
                      <button onClick={() => handleSprintSwitch(s)} className={`flex-1 text-left px-3 py-2 text-xs hover:bg-neutral-900 transition-colors ${s.id === activeSprint.id ? 'text-emerald-400' : 'text-neutral-400'}`}>
                        <div className="font-bold">{s.name}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{s.startDate.slice(0, 7)} → {s.endDate.slice(0, 7)}</div>
                      </button>
                      <div className="flex">
                        <button onClick={() => { setShowSprintList(false); setActiveSprint(s); setShowEditSprint(true); }} className="p-2 text-neutral-700 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" title="Edit sprint">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => { setShowSprintList(false); setConfirmDelete({ type: 'sprint', id: s.id, name: s.name }); }} className="p-2 text-neutral-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete sprint">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setShowSprintList(false); setShowCreateSprint(true); }} className="w-full text-left px-3 py-2 text-xs text-neutral-500 hover:text-emerald-400 hover:bg-neutral-900 transition-colors flex items-center gap-1">
                    <Plus size={12} /> NEW SPRINT
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-1 border-l border-neutral-800 pl-4">
              <button onClick={() => setShowEditSprint(true)} title="Edit current sprint" className="border border-neutral-800 hover:border-neutral-600 rounded p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => setConfirmDelete({ type: 'sprint', id: activeSprint.id, name: activeSprint.name })} title="Delete current sprint" className="border border-neutral-800 hover:border-red-900 rounded p-1.5 text-neutral-500 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
              {activeSprint.status === 'ACTIVE' && (
                <button onClick={() => setCompleteConfirm(true)} title="Mark sprint complete" className="border border-neutral-800 hover:border-emerald-700 rounded p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors">
                  <CheckCircle size={14} />
                </button>
              )}
            </div>
            
            <button onClick={() => setShowGoalArchitect(v => !v)} className={`border rounded px-2 py-1 text-xs font-mono transition-colors md:ml-2 ${showGoalArchitect ? 'border-emerald-700 text-emerald-400 bg-emerald-950/20' : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>
              GOALS
            </button>
          </div>
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
        onDaySelect={handleDaySelect}
        onDayLogClick={handleDayLogClick}
        sprintStartDate={activeSprint.startDate}
        sprintEndDate={activeSprint.endDate}
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
        onLogUpdated={async () => {
          const res = await sprintApi.getLogsForDay(activeSprint.id, selectedDay);
          setDayLogs(res.data);
          const mRes = await sprintApi.getCalendarMatrix(activeSprint.id, currentMonthStr);
          setMatrixData(mRes.data.matrix);
        }}
        targets={targets}
        targetsLoading={targetsLoading}
        onTargetToggle={handleTargetToggle}
        onTargetDelete={handleTargetDelete}
        onTargetEditClick={(t) => { setEditingTarget(t); setShowTargetModal(true); }}
        onTargetMove={handleTargetMove}
        onAddTargetClick={() => { setEditingTarget(null); setShowTargetModal(true); }}
      />

      {/* ── Time Logger Modal ── */}
      {showLogModal && (
        <TimeLoggerModal
          sprintId={activeSprint.id}
          goals={goals}
          preselectedDate={selectedDay}
          preselectedGoalId={preselectedGoalId}
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
          onSaved={async (_s) => { setShowEditSprint(false); await initialize(); }}
        />
      )}

      {/* ── Target Modal ── */}
      {showTargetModal && (
        <TargetModal
          goals={goals}
          target={editingTarget}
          preselectedDate={selectedDay}
          onClose={() => { setShowTargetModal(false); setEditingTarget(null); }}
          onSuccess={() => { setShowTargetModal(false); setEditingTarget(null); loadTargets(); }}
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