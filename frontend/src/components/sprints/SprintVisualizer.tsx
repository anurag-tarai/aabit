import React, { useState, useEffect, useCallback } from 'react';
import { sprintApi, type Sprint, type Goal, type MatrixCell, type Target, type LifetimeSummaryCell, getCurrentWeekMonday } from '../../api/sprintClient';
import { TimeInvestmentBreakdown } from './TimeInvestmentBreakdown';
import { BarChart2, Target as TargetIcon, Clock, TrendingUp, Layers, AlertCircle } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMins = (mins: number): string => {
  if (mins === 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const fmtPct = (n: number, d: number): string =>
  d === 0 ? '—' : `${Math.round((n / d) * 100)}%`;

// Radial SVG ring
const Ring: React.FC<{ pct: number; color: string; size?: number; stroke?: number }> = ({
  pct, color, size = 72, stroke = 7,
}) => {
  const r  = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
};

// Bento card shell
const Card: React.FC<{ children: React.ReactNode; className?: string; span2?: boolean }> = ({
  children, className = '', span2 = false,
}) => (
  <div className={`
    bg-neutral-950 border border-neutral-800 rounded-2xl p-5
    ${span2 ? 'md:col-span-2' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-600 ${className}`}>
    {children}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const SprintVisualizer: React.FC = () => {
  const [sprints, setSprints]       = useState<Sprint[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [matrix, setMatrix]         = useState<MatrixCell[]>([]);
  const [targets, setTargets]       = useState<Target[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lifetimeSummary, setLifetimeSummary] = useState<LifetimeSummaryCell[]>([]);

  // Load all sprints on mount
  useEffect(() => {
    sprintApi.getAllSprints().then(r => {
      setSprints(r.data);
      if (r.data.length > 0) {
        // Default to the first ACTIVE sprint, else the most recent
        const active = r.data.find(s => s.status === 'ACTIVE');
        setSelectedId((active ?? r.data[0]).id);
      } else {
        setLoading(false);
      }
    }).catch(() => { setError('Failed to load sprints.'); setLoading(false); });
  }, []);

  // Load data whenever selected sprint changes
  const loadSprintData = useCallback(async (sprintId: string) => {
    if (!sprintId) return;
    setLoading(true);
    setError(null);
    try {
      const sprint = sprints.find(s => s.id === sprintId)!;

      // Collect all months in the sprint range
      const monthSet: string[] = [];
      const [sy, sm] = sprint.startDate.split('-').map(Number);
      const [ey, em] = sprint.endDate.split('-').map(Number);
      let y = sy, m = sm;
      while (y < ey || (y === ey && m <= em)) {
        monthSet.push(`${y}-${String(m).padStart(2, '0')}`);
        m++; if (m > 12) { m = 1; y++; }
      }

      const [goalsRes, targetsRes, lifetimeRes, ...matrixResults] = await Promise.all([
        sprintApi.getSprintGoals(sprintId),
        sprintApi.getTargetsForWeek(getCurrentWeekMonday()),
        sprintApi.getLifetimeSummary(sprintId),
        ...monthSet.map(mo => sprintApi.getCalendarMatrix(sprintId, mo)),
      ]);

      const allCells = matrixResults.flatMap(r => r.data.matrix);
      setGoals(goalsRes.data);
      setMatrix(allCells);
      setTargets(targetsRes.data);
      setLifetimeSummary(lifetimeRes.data.summary);
    } catch {
      setError('Failed to load sprint data.');
    } finally {
      setLoading(false);
    }
  }, [sprints]);

  useEffect(() => { if (selectedId) loadSprintData(selectedId); }, [selectedId, loadSprintData]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const sprint = sprints.find(s => s.id === selectedId);

  // Total minutes per goal (goal-linked only)
  const minutesByGoal = goals.map(g => ({
    goal: g,
    minutes: matrix.filter(c => c.goalId === g.id).reduce((s, c) => s + c.totalMinutes, 0),
  }));

  const totalGoalMinutes = minutesByGoal.reduce((s, g) => s + g.minutes, 0);
  const totalAnonMinutes = matrix.filter(c => c.goalId === null).reduce((s, c) => s + c.totalMinutes, 0);
  const totalMinutes     = totalGoalMinutes + totalAnonMinutes;

  // Targets stats — scoped to work areas that belong to this sprint's goals
  const sprintWorkAreaIds = new Set(goals.flatMap(g => g.workAreas.map(w => w.id)));
  const sprintTargets     = targets.filter(t => t.workAreaId && sprintWorkAreaIds.has(t.workAreaId));
  const completedTargets  = sprintTargets.filter(t => t.completed).length;
  const totalTargets      = sprintTargets.length;

  // Days active in sprint so far
  const activeDays = matrix
    .filter(c => c.totalMinutes > 0)
    .map(c => c.day)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  // Best day
  const dayMap = new Map<number, number>();
  matrix.forEach(c => dayMap.set(c.day, (dayMap.get(c.day) ?? 0) + c.totalMinutes));
  const bestDayMins = Math.max(0, ...dayMap.values());

  // Work-area breakdown within goals

  // Target completion pct
  const targetPct = totalTargets === 0 ? 0 : completedTargets / totalTargets;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (sprints.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <Layers size={32} className="text-neutral-700" />
        <p className="text-neutral-500 font-mono text-sm">No sprints found.</p>
        <p className="text-neutral-700 font-mono text-xs">Create a sprint in Sprint Workspace first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 size={18} className="text-emerald-500" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Sprint Visualizer</h1>
            <p className="text-[11px] text-neutral-600 font-mono mt-0.5">Progress overview and time allocation</p>
          </div>
        </div>
        {/* Sprint selector */}
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono px-3 py-1.5 rounded-lg outline-none focus:border-emerald-700"
        >
          {sprints.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.status === 'ACTIVE' ? '● ACTIVE' : ''}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* ── Card 1: Total hours ──────────────────────────────────────────── */}
          <Card>
            <Label>Total Hours</Label>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">
                {Math.floor(totalMinutes / 60)}
              </span>
              <span className="text-neutral-600 font-mono text-sm mb-0.5">h {totalMinutes % 60}m</span>
            </div>
            <div className="mt-2 flex gap-3 text-[10px] font-mono">
              <span className="text-emerald-600">{fmtMins(totalGoalMinutes)} goal</span>
              <span className="text-slate-500">{fmtMins(totalAnonMinutes)} misc</span>
            </div>
          </Card>

          {/* ── Card 2: Weekly target ring ───────────────────────────────────── */}
          <Card className="flex flex-col items-start">
            <Label>Weekly Targets</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <Ring pct={targetPct} color="#10b981" size={68} stroke={7} />
                <span className="absolute text-sm font-bold text-white tabular-nums">
                  {Math.round(targetPct * 100)}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-white tabular-nums">{completedTargets}</span>
                <span className="text-[10px] font-mono text-neutral-600">of {totalTargets} done</span>
                <div className="flex items-center gap-1 mt-1">
                  <TargetIcon size={10} className="text-emerald-700" />
                  <span className="text-[10px] font-mono text-neutral-600">this week</span>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Card 3: Active days ──────────────────────────────────────────── */}
          <Card>
            <Label>Active Days</Label>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">{activeDays}</span>
              <span className="text-neutral-600 font-mono text-sm mb-0.5">days</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-neutral-600">
              Best: <span className="text-emerald-600">{fmtMins(bestDayMins)}</span>
            </div>
          </Card>

          {/* ── Card 4: Goals count ──────────────────────────────────────────── */}
          <Card>
            <Label>Goals in Sprint</Label>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">{goals.length}</span>
              <span className="text-neutral-600 font-mono text-sm mb-0.5">goals</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {goals.slice(0, 4).map(g => (
                <span
                  key={g.id}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                  style={{ borderColor: g.color + '55', color: g.color, backgroundColor: g.color + '18' }}
                >
                  {g.name.length > 8 ? g.name.slice(0, 8) + '…' : g.name}
                </span>
              ))}
            </div>
          </Card>


          {/* ── Card 6 (wide): Sprint info + date range ──────────────────────── */}
          <Card span2 className="md:col-span-4 bg-neutral-900">
            <Label className="text-neutral-500">Sprint Timeline</Label>
            {sprint && (
              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <p className="text-white font-bold text-lg">{sprint.name}</p>
                  <p className="text-neutral-500 font-mono text-xs">
                    {sprint.startDate} → {sprint.endDate}
                  </p>
                  <div className="mt-2">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                      sprint.status === 'ACTIVE'
                        ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40'
                        : 'text-neutral-500 border-neutral-800 bg-neutral-900'
                    }`}>
                      {sprint.status}
                    </span>
                  </div>
                </div>

                <div className="flex-1 max-w-xl flex flex-col gap-5">
                  {/* Progress bar: days elapsed */}
                  {(() => {
                    const sprintStartMs = new Date(sprint.startDate).getTime();
                    const sprintEndMs = new Date(sprint.endDate).getTime();
                    const nowMs = new Date().getTime();
                    const daysLeft = Math.max(0, Math.ceil((sprintEndMs - nowMs) / 86400000));
                    
                    // Generate months
                    const [sy, sm] = sprint.startDate.split('-').map(Number);
                    const [ey, em] = sprint.endDate.split('-').map(Number);
                    const months: string[] = [];
                    let y = sy, m = sm;
                    while (y < ey || (y === ey && m <= em)) {
                      months.push(`${y}-${String(m).padStart(2, '0')}`);
                      m++;
                      if (m > 12) { m = 1; y++; }
                    }

                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-mono text-neutral-500 mb-1">
                          <span>Sprint Progress</span>
                          <span className="text-emerald-500">{daysLeft > 0 ? `${daysLeft}d remaining` : 'Ended'}</span>
                        </div>
                        <div className="flex gap-1.5 w-full">
                          {months.map((mStr) => {
                            const [my, mm] = mStr.split('-').map(Number);
                            const mStartMs = new Date(my, mm - 1, 1).getTime();
                            const mEndMs = new Date(my, mm, 0, 23, 59, 59, 999).getTime(); // last day of month

                            const actualStartMs = Math.max(sprintStartMs, mStartMs);
                            const actualEndMs = Math.min(sprintEndMs, mEndMs);
                            
                            const totalDaysInSegment = (actualEndMs - actualStartMs) / 86400000;
                            const flexWeight = Math.max(1, Math.round(totalDaysInSegment));

                            const elapsedMs = Math.max(0, Math.min(nowMs, actualEndMs) - actualStartMs);
                            const segmentTotalMs = actualEndMs - actualStartMs;
                            const pct = segmentTotalMs <= 0 ? 0 : Math.min(1, elapsedMs / segmentTotalMs);

                            const monthName = monthNames[mm - 1];

                            return (
                              <div key={mStr} className="flex flex-col gap-1.5" style={{ flexGrow: flexWeight, flexBasis: 0 }}>
                                <div className="h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 relative">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out absolute top-0 left-0 ${pct === 1 ? 'bg-emerald-700' : 'bg-emerald-500'}`}
                                    style={{ width: `${pct * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-neutral-600 text-center uppercase tracking-wider">
                                  {monthName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Goal allocation summary */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
                      <TrendingUp size={13} className="text-neutral-500" />
                      <span className="text-neutral-400">
                        Avg per active day:{' '}
                        <span className="text-white font-bold ml-1">
                          {activeDays === 0 ? '—' : fmtMins(Math.round(totalMinutes / activeDays))}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
                      <Clock size={13} className="text-neutral-500" />
                      <span className="text-neutral-400">
                        Goal focus:{' '}
                        <span className="text-emerald-400 font-bold ml-1">
                          {fmtPct(totalGoalMinutes, totalMinutes)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

        </div>
      )}

      {/* ── Time Investment Tracker ────────────────────────────────────────── */}
      {!loading && !error && sprints.length > 0 && (
        <TimeInvestmentBreakdown
          goals={goals}
          matrixData={matrix}
          lifetimeSummary={lifetimeSummary}
          selectedDay={new Date().toLocaleDateString('en-CA')} // YYYY-MM-DD
        />
      )}
    </div>
  );
};