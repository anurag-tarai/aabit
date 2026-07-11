import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface CustomCalendarProps {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  selectedDate?: Date | null;
  onSelectDate?: (day: number, monthIdx: number, year: number) => void;
  renderDayBadge?: (day: number, monthIdx: number, year: number) => React.ReactNode;
  headerCustomization?: React.ReactNode;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  viewDate,
  setViewDate,
  selectedDate,
  onSelectDate,
  renderDayBadge,
  headerCustomization,
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonthIdx = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDayIdx = getFirstDayOfMonthIdx(currentYear, currentMonthIdx);

  const blanks = Array.from({ length: firstDayIdx }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGridCells = [...blanks, ...days];

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonthIdx - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonthIdx + 1, 1));
  const handlePrevYear = () => setViewDate(new Date(currentYear - 1, currentMonthIdx, 1));
  const handleNextYear = () => setViewDate(new Date(currentYear + 1, currentMonthIdx, 1));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        {headerCustomization || (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold tracking-tight text-left text-neutral-200">
              {months[currentMonthIdx]}
            </span>
            <span className="text-xs font-mono text-left tracking-wider text-neutral-500">
              {currentYear}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-0.5 rounded-md">
            <button type="button" onClick={handlePrevYear} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors outline-none"><ChevronsLeft size={13} /></button>
            <span className="text-[9px] font-mono font-bold text-neutral-500 px-1 tracking-tighter select-none">YEAR</span>
            <button type="button" onClick={handleNextYear} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors outline-none"><ChevronsRight size={13} /></button>
          </div>

          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-0.5 rounded-md">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors outline-none"><ChevronLeft size={13} /></button>
            <span className="text-[9px] font-mono font-bold text-neutral-500 px-1 tracking-tighter select-none">MON</span>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors outline-none"><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {daysOfWeek.map(dayStr => (
            <span key={dayStr} className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">{dayStr}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarGridCells.map((day, cellIndex) => {
            if (day === null) return <div key={`blank-${cellIndex}`} className="p-2" />;

            const isCurrentlySelected = selectedDate && 
                                        selectedDate.getDate() === day && 
                                        selectedDate.getMonth() === currentMonthIdx && 
                                        selectedDate.getFullYear() === currentYear;
                                        
            const isTodayRealWorld = new Date().getDate() === day && 
                                     new Date().getMonth() === currentMonthIdx && 
                                     new Date().getFullYear() === currentYear;

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => onSelectDate?.(day, currentMonthIdx, currentYear)}
                className={`relative p-2 h-10 font-mono text-xs rounded transition-all outline-none flex flex-col items-center justify-between border ${
                  isCurrentlySelected 
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400 font-bold' 
                    : isTodayRealWorld
                    ? 'bg-neutral-800 border-neutral-600 text-white font-bold ring-1 ring-neutral-500'
                    : 'bg-neutral-950/50 border-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-white'
                }`}
              >
                <span>{day}</span>
                {renderDayBadge?.(day, currentMonthIdx, currentYear)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
