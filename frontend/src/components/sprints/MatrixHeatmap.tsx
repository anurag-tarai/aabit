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
  if (minutes === 0) return 'bg-neutral-900/30 border-neutral-800/30 text-neutral-700';
  if (minutes <= 30)  return 'bg-emerald-950/50 border-emerald-900/50 text-emerald-600';
  if (minutes <= 60)  return 'bg-emerald-900/80 border-emerald-800 text-emerald-400';
  if (minutes <= 120) return 'bg-emerald-700 border-emerald-600 text-emerald-100';
  return 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-[0_0_6px_rgba(16,185,129,0.25)]';
};

const formatMinutes = (mins: number): string => {
  if (mins === 0) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
};

export const MatrixHeatmap: React.FC<MatrixProps> = ({
  goals,
  matrixData,
  monthFocus,
  selectedDay,
  onDayClick,
}) => {
  const daysInMonth = new Date(monthFocus.getFullYear(), monthFocus.getMonth() + 1, 0).getDate();
  const year = monthFocus.getFullYear();
  const month = String(monthFocus.getMonth() + 1).padStart(2, '0');

  const getMinutes = (day: number, goalId: string): number =>
    matrixData.find(m => m.day === day && m.goalId === goalId)?.totalMinutes ?? 0;

  const getDayString = (day: number): string =>
    `${year}-${month}-${String(day).padStart(2, '0')}`;

  const totalForDay = (day: number): number =>
    goals.reduce((sum, g) => sum + getMinutes(day, g.id), 0);

  return (
    <div className="w-full bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-[11px]">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-900">
        <span className="text-neutral-400 font-bold tracking-widest">MATRIX</span>
        <span className="text-neutral-600 tracking-wider">
          {monthFocus.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
        </span>
      </div>

      {goals.length === 0 ? (
        <div className="text-neutral-600 text-center py-6 tracking-widest text-xs">
          NO_GOALS_IN_SPRINT — ADD_GOALS_TO_SEE_MATRIX
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-1 text-left text-neutral-700 w-10">DAY</th>
                {goals.map(g => (
                  <th
                    key={g.id}
                    className="p-1 text-center font-normal tracking-wider min-w-[80px]"
                    style={{ color: g.color }}
                  >
                    {g.name.toUpperCase()}
                  </th>
                ))}
                <th className="p-1 text-center text-neutral-700 w-14">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayStr = getDayString(day);
                const isSelected = dayStr === selectedDay;
                const total = totalForDay(day);

                return (
                  <tr
                    key={day}
                    className={`transition-colors group ${isSelected ? 'bg-neutral-900/50' : 'hover:bg-neutral-900/20'}`}
                  >
                    <td
                      className={`p-1 font-bold select-none transition-colors cursor-pointer ${isSelected ? 'text-emerald-400' : 'text-neutral-700 group-hover:text-neutral-400'}`}
                      onClick={() => onDayClick(day)}
                    >
                      {String(day).padStart(2, '0')}
                    </td>

                    {goals.map(goal => {
                      const mins = getMinutes(day, goal.id);
                      return (
                        <td key={goal.id} className="p-0.5">
                          <div
                            onClick={() => onDayClick(day)}
                            title={mins > 0 ? `${mins} min on ${goal.name}` : `Click to log on ${goal.name}`}
                            className={`
                              mx-auto w-full max-w-[100px] h-6
                              flex items-center justify-center
                              border rounded cursor-pointer
                              transition-all hover:opacity-90
                              ${getIntensityClass(mins)}
                              ${isSelected ? 'ring-1 ring-emerald-500/40' : ''}
                            `}
                          >
                            {formatMinutes(mins)}
                          </div>
                        </td>
                      );
                    })}

                    {/* Daily total column */}
                    <td className="p-0.5">
                      <div className={`mx-auto w-full max-w-[60px] h-6 flex items-center justify-center text-center ${total > 0 ? 'text-neutral-400' : 'text-neutral-800'}`}>
                        {total > 0 ? formatMinutes(total) : '·'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
