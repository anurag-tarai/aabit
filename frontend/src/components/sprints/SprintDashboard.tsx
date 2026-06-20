import React, { useState, useEffect, useCallback } from 'react';
import { sprintApi, type Sprint, type Goal, type MatrixCell, type TimeLog } from '../../api/sprintClient';
import { TimeLoggerModal } from './TimeLoggerModal';
import { MatrixHeatmap } from './MatrixHeatmap';
import { GoalArchitect } from './GoalArchitect';
import { InitializeSprintModal } from './InitializeSprintModal';
import { DayDetailPanel } from './DayDetailPanel';
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';

export const SprintDashboard: React.FC = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixCell[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSprintList, setShowSprintList] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showGoalArchitect, setShowGoalArchitect] = useState(false);

  // Month navigation for the matrix
  const [monthFocus, setMonthFocus] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Selected day for logging and detail view
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [showLogModal, setShowLogModal] = useState(false);
  const [dayLogs, setDayLogs] = useState<TimeLog[]>([]);
  const [dayLogsLoading, setDayLogsLoading] = useState(false);

  const monthString = `${monthFocus.getFullYear()}-${String(monthFocus.getMonth() + 1).padStart(2, '0')}`;

  const loadSprints = useCallback(async () => {
    const res = await sprintApi.getAllSprints();
    setSprints(res.data);
    return res.data;
  }, []);

  const loadSprintData = useCallback(async (sprint: Sprint) => {
    const [goalsRes, matrixRes] = await Promise.all([
      sprintApi.getSprintGoals(sprint.id),
      sprintApi.getCalendarMatrix(sprint.id, monthString),
    ]);
    setGoals(goalsRes.data);
    setMatrixData(matrixRes.data.matrix);
  }, [monthString]);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const allSprints = await loadSprints();

      // Try to find the sprint whose window contains today
      const currentRes = await sprintApi.getCurrentSprint();
      const current = currentRes.status === 204 ? null : currentRes.data;

      if (current) {
        setActiveSprint(current);
        await loadSprintData(current);
      } else if (allSprints.length > 0) {
        // Fallback: most recent sprint
        setActiveSprint(allSprints[0]);
        await loadSprintData(allSprints[0]);
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
    if (!activeSprint) return;
    sprintApi.getCalendarMatrix(activeSprint.id, monthString)
      .then(r => setMatrixData(r.data.matrix))
      .catch(console.error);
  }, [activeSprint, monthString]);

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
    const d = String(day).padStart(2, '0');
    const m = String(monthFocus.getMonth() + 1).padStart(2, '0');
    setSelectedDay(`${monthFocus.getFullYear()}-${m}-${d}`);
    setShowLogModal(true);
  };

  const handleSprintSwitch = async (sprint: Sprint) => {
    setActiveSprint(sprint);
    setShowSprintList(false);
    await loadSprintData(sprint);
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

  return (
    <div className="flex flex-col gap-4 font-mono p-2">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-emerald-500 animate-pulse" />
          <span className="text-emerald-400 font-bold tracking-widest text-sm uppercase">{activeSprint.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${activeSprint.status === 'ACTIVE' ? 'text-emerald-600 border-emerald-900 bg-emerald-950/30' : 'text-neutral-500 border-neutral-800'}`}>
            {activeSprint.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Month navigator */}
          <div className="flex items-center gap-1 border border-neutral-800 rounded px-2 py-1 bg-neutral-950">
            <button onClick={() => setMonthFocus(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="hover:text-emerald-400 p-0.5 transition-colors">
              <ChevronLeft size={13} />
            </button>
            <span className="text-neutral-400 font-bold px-1">
              {monthFocus.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
            </span>
            <button onClick={() => setMonthFocus(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="hover:text-emerald-400 p-0.5 transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Sprint switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSprintList(v => !v)}
              className="flex items-center gap-1 border border-neutral-800 hover:border-neutral-600 rounded px-2 py-1 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <List size={13} />
              <span>SPRINTS</span>
            </button>
            {showSprintList && (
              <div className="absolute right-0 top-8 bg-[#0a0a0a] border border-neutral-800 rounded shadow-xl z-20 min-w-[200px]">
                {sprints.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSprintSwitch(s)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-900 transition-colors border-b border-neutral-900 last:border-0 ${s.id === activeSprint.id ? 'text-emerald-400' : 'text-neutral-400'}`}
                  >
                    {s.name}
                    <span className="ml-2 text-neutral-600">{s.startDate} → {s.endDate}</span>
                  </button>
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

      {/* ── Day Detail (below matrix, shows selected day's logs) ── */}
      <DayDetailPanel
        sprintId={activeSprint.id}
        goals={goals}
        day={selectedDay}
        logs={dayLogs}
        loading={dayLogsLoading}
        onLogClick={() => setShowLogModal(true)}
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
              sprintApi.getCalendarMatrix(activeSprint.id, monthString),
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
          onSuccess={async () => {
            setShowCreateSprint(false);
            await initialize();
          }}
        />
      )}
    </div>
  );
};
