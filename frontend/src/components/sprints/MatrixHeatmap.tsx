import React from 'react';
import { type Goal, type MatrixCell } from '../../api/sprintClient';

interface MatrixProps {
  goals: Goal[];
  matrixData: MatrixCell[];
  monthFocus: Date;
  selectedDay: string;
  onDayClick: (day: number) => void;
}

const getIntensityClass = (minutes: number): string => {
  if (minutes === 0) return 'bg-neutral-900/40 border-neutral-800/40 text-neutral-700';
  if (minutes <= 30)  return 'bg-emerald-950/70 border-emerald-900/60 text-emerald-600';
  if (minutes <= 60)  return 'bg-emerald-900/90 border-emerald-800 text-emerald-400';
  if (minutes <= 120) return 'bg-emerald-700 border-emerald-600 text-emerald-100';
  return 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]';
};

const getAnonIntensityClass = (minutes: number): string => {
  if (minutes === 0) return 'bg-neutral-900/40 border-neutral-800/40 text-neutral-700';
  if (minutes <= 30)  return 'bg-slate-800/60 border-slate-700/50 text-slate-400';
  if (minutes <= 60)  return 'bg-slate-700/80 border-slate-600 text-slate-300';
  if (minutes <= 120) return 'bg-slate-600 border-slate-500 text-slate-100';
  return 'bg-slate-500 border-slate-400 text-white font-bold';
};

const formatMinutes = (mins: number): string => {
  if (mins === 0) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
};

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const MatrixHeatmap: React.FC<MatrixProps> = ({
  goals,
  matrixData,
  monthFocus,
  selectedDay,
  onDayClick,
}) => {
  const daysInMonth = new Date(monthFocus.getFullYear(), monthFocus.getMonth() + 1, 0).getDate();
  const year  = monthFocus.getFullYear();
  const month = String(monthFocus.getMonth() + 1).padStart(2, '0');

  const getGoalMinutes = (day: number, goalId: string): number =>
    matrixData.find(m => m.day === day && m.goalId === goalId)?.totalMinutes ?? 0;

  const getAnonMinutes = (day: number): number =>
    matrixData.filter(m => m.day === day && m.goalId === null)
      .reduce((s, m) => s + m.totalMinutes, 0);

  const hasAnonLogs =
    matrixData.some(m => m.goalId === null && m.totalMinutes > 0);

  const getDayString = (day: number) =>
    `${year}-${month}-${String(day).padStart(2, '0')}`;

  const getGoalTotal  = (day: number) =>
    goals.reduce((sum, g) => sum + getGoalMinutes(day, g.id), 0);


  const getDow = (day: number) => DOW[new Date(year, monthFocus.getMonth(), day).getDay()];

  const isWeekend = (day: number) => {
    const d = new Date(year, monthFocus.getMonth(), day).getDay();
    return d === 0 || d === 6;
  };

  // Column-level totals across all days
  const monthGoalTotal = goals.reduce((sum, g) =>
    sum + Array.from({ length: daysInMonth }, (_, i) => i + 1)
      .reduce((s, d) => s + getGoalMinutes(d, g.id), 0), 0);

  const monthAnonTotal = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .reduce((s, d) => s + getAnonMinutes(d), 0);

  const hasGoals = goals.length > 0;

  return (
    <div className="w-full bg-[#0a0a0a] border border-neutral-800 rounded font-mono text-[11px]">
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-3 pb-2 border-b border-neutral-900">
        <span className="text-neutral-400 font-bold tracking-widest text-xs">MATRIX</span>
        <span className="text-neutral-600 tracking-wider text-[10px]">
          {monthFocus.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
        </span>
      </div>

      {!hasGoals && !hasAnonLogs ? (
        <div className="text-neutral-600 text-center py-8 tracking-widest text-xs px-4">
          NO_GOALS_IN_SPRINT — OPEN GOALS PANEL TO ADD
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ minWidth: `${goals.length * 90 + (hasAnonLogs ? 90 : 0) + 120}px` }}
          >
            <thead>
              <tr className="border-b border-neutral-900/60">
                <th className="p-2 text-left text-neutral-700 w-12 text-[10px] font-normal">DAY</th>
                <th className="p-2 text-left text-neutral-700 w-8  text-[10px] font-normal"></th>
                {goals.map(g => (
                  <th
                    key={g.id}
                    className="p-2 text-center font-bold tracking-wider text-[10px]"
                    style={{ color: g.color, minWidth: '88px' }}
                  >
                    {g.name.toUpperCase()}
                  </th>
                ))}
                {hasAnonLogs && (
                  <th className="p-2 text-center font-bold tracking-wider text-[10px] text-slate-500 border-l border-neutral-900/60" style={{ minWidth: '88px' }}>
                    MISC
                  </th>
                )}
                {/* Split TOTAL column header */}
                <th className="p-2 text-center text-neutral-700 text-[10px] font-normal border-l border-neutral-800/60" style={{ minWidth: '100px' }}>
                  <span className="text-emerald-700">GOAL</span>
                  <span className="text-neutral-700 mx-1">|</span>
                  <span className="text-slate-600">ANON</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayStr    = getDayString(day);
                const isSelected = dayStr === selectedDay;
                const weekend   = isWeekend(day);
                const anonMins  = getAnonMinutes(day);
                const goalMins  = getGoalTotal(day);

                return (
                  <tr
                    key={day}
                    className={`transition-colors group border-b border-neutral-900/20 ${
                      isSelected
                        ? 'bg-neutral-900/60'
                        : weekend
                        ? 'bg-neutral-950/60 hover:bg-neutral-900/30'
                        : 'hover:bg-neutral-900/20'
                    }`}
                  >
                    <td
                      className={`p-1 pl-2 font-bold select-none transition-colors cursor-pointer text-sm ${
                        isSelected ? 'text-emerald-400' : weekend ? 'text-neutral-600 group-hover:text-neutral-400' : 'text-neutral-600 group-hover:text-neutral-300'
                      }`}
                      onClick={() => onDayClick(day)}
                    >
                      {String(day).padStart(2, '0')}
                    </td>
                    <td className={`p-1 text-[9px] select-none ${weekend ? 'text-neutral-700' : 'text-neutral-800'}`}>
                      {getDow(day)}
                    </td>

                    {goals.map(goal => {
                      const mins = getGoalMinutes(day, goal.id);
                      return (
                        <td key={goal.id} className="p-0.5">
                          <div
                            onClick={() => onDayClick(day)}
                            title={mins > 0 ? `${formatMinutes(mins)} on ${goal.name}` : `Log time for ${goal.name}`}
                            className={`
                              mx-auto h-7 w-full flex items-center justify-center
                              border rounded cursor-pointer
                              transition-all hover:opacity-80 hover:scale-[0.97] text-[10px]
                              ${getIntensityClass(mins)}
                              ${isSelected ? 'ring-1 ring-emerald-500/50' : ''}
                            `}
                          >
                            {formatMinutes(mins)}
                          </div>
                        </td>
                      );
                    })}

                    {hasAnonLogs && (
                      <td className="p-0.5 border-l border-neutral-900/40">
                        <div
                          onClick={() => onDayClick(day)}
                          title={anonMins > 0 ? `${formatMinutes(anonMins)} misc/anonymous` : 'No misc logs'}
                          className={`
                            mx-auto h-7 w-full flex items-center justify-center
                            border rounded cursor-pointer
                            transition-all hover:opacity-80 hover:scale-[0.97] text-[10px]
                            ${getAnonIntensityClass(anonMins)}
                            ${isSelected ? 'ring-1 ring-slate-500/50' : ''}
                          `}
                        >
                          {formatMinutes(anonMins)}
                        </div>
                      </td>
                    )}

                    {/* ★ Split TOTAL cell: Goal | Anon */}
                    <td className="p-0.5 pr-2 border-l border-neutral-800/40">
                      <div className="mx-auto h-7 flex items-center justify-center gap-1 text-[10px] font-bold tabular-nums">
                        <span className={goalMins > 0 ? 'text-emerald-600' : 'text-neutral-800'}>
                          {goalMins > 0 ? formatMinutes(goalMins) : '·'}
                        </span>
                        <span className="text-neutral-700">|</span>
                        <span className={anonMins > 0 ? 'text-slate-400' : 'text-neutral-800'}>
                          {anonMins > 0 ? formatMinutes(anonMins) : '·'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ★ Footer: split column totals */}
            <tfoot>
              <tr className="border-t border-neutral-800">
                <td colSpan={2} className="p-2 text-[10px] text-neutral-700 font-bold">TOTAL</td>
                {goals.map(g => {
                  const total = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    .reduce((sum, d) => sum + getGoalMinutes(d, g.id), 0);
                  return (
                    <td key={g.id} className="p-2 text-center">
                      <span className="text-[10px] font-bold" style={total > 0 ? { color: g.color } : { color: '#404040' }}>
                        {total > 0 ? formatMinutes(total) : '·'}
                      </span>
                    </td>
                  );
                })}
                {hasAnonLogs && (
                  <td className="p-2 text-center border-l border-neutral-900/40">
                    <span className={`text-[10px] font-bold ${monthAnonTotal > 0 ? 'text-slate-400' : 'text-neutral-800'}`}>
                      {monthAnonTotal > 0 ? formatMinutes(monthAnonTotal) : '·'}
                    </span>
                  </td>
                )}
                {/* ★ Footer split total */}
                <td className="p-2 text-center border-l border-neutral-800/40">
                  <span className={`text-[10px] font-bold ${monthGoalTotal > 0 ? 'text-emerald-600' : 'text-neutral-800'}`}>
                    {monthGoalTotal > 0 ? formatMinutes(monthGoalTotal) : '·'}
                  </span>
                  <span className="text-neutral-700 mx-1 text-[10px]">|</span>
                  <span className={`text-[10px] font-bold ${monthAnonTotal > 0 ? 'text-slate-400' : 'text-neutral-800'}`}>
                    {monthAnonTotal > 0 ? formatMinutes(monthAnonTotal) : '·'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};