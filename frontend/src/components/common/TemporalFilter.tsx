import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { api } from '../../api/client';

export interface TemporalValue {
  year: number | null;
  month: number | null; // 1-12
  day: number | null;
}

interface TemporalFilterProps {
  value: TemporalValue;
  onChange: (newValue: TemporalValue) => void;
}

export const TemporalFilter: React.FC<TemporalFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  // NEW: State to hold log counts mapping for the current calendar grid page month
  const [monthlyCounts, setMonthlyCounts] = useState<Record<number, number>>({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth();

  // Fetch log metrics summary whenever the grid month context view page pivots
  useEffect(() => {
    if (isOpen) {
      api.get<Record<number, number>>(`/experiences/stats/monthly?year=${currentYear}&month=${currentMonthIdx + 1}`)
        .then(res => setMonthlyCounts(res.data))
        .catch(err => console.error("Failed to load map counts", err));
    }
  }, [currentYear, currentMonthIdx, isOpen]);

  // Handle outside layout coordinate syncing
  useEffect(() => {
    if (value.year && value.month) {
      setViewDate(new Date(value.year, value.month - 1, value.day || 1));
    }
  }, [value.year, value.month]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonthIdx = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDayIdx = getFirstDayOfMonthIdx(currentYear, currentMonthIdx);

  const blanks = Array.from({ length: firstDayIdx }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGridCells = [...blanks, ...days];

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonthIdx - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonthIdx + 1, 1));
  const handlePrevYear = () => setViewDate(new Date(currentYear - 1, currentMonthIdx, 1));
  const handleNextYear = () => setViewDate(new Date(currentYear + 1, currentMonthIdx, 1));

  const handleSelectDay = (day: number) => {
    onChange({
      year: currentYear,
      month: currentMonthIdx + 1,
      day: value.day === day ? null : day
    });
  };

  const handleToggleMonthOnly = () => {
    const targetMonth = currentMonthIdx + 1;
    if (value.month === targetMonth && value.year === currentYear && !value.day) {
      onChange({ year: null, month: null, day: null });
    } else {
      onChange({ year: currentYear, month: targetMonth, day: null });
    }
  };

  const handleToggleYearOnly = () => {
    if (value.year === currentYear && !value.month && !value.day) {
      onChange({ year: null, month: null, day: null });
    } else {
      onChange({ year: currentYear, month: null, day: null });
    }
  };

  const hasActiveFilter = value.year !== null || value.month !== null || value.day !== null;

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 text-sm bg-os-surface border rounded-lg transition-all outline-none w-full select-none ${
            hasActiveFilter ? 'border-blue-500 text-blue-400' : 'border-os-border text-os-muted hover:text-white focus:border-gray-500'
          }`}
        >
          <CalendarIcon size={16} />
          <span className="text-left flex-1 font-mono text-xs tracking-wide">
            {value.day && value.month && value.year ? (
              `[DATE] ${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${value.year}`
            ) : value.month && value.year ? (
              `[MONTH] ${months[value.month - 1].substring(0, 3).toUpperCase()} ${value.year}`
            ) : value.year ? (
              `[YEAR] ${value.year}`
            ) : (
              'FILTER_BY_TIMEFRAME...'
            )}
          </span>
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange({ year: null, month: null, day: null })}
            className="p-3 border border-os-border bg-os-surface hover:text-red-400 rounded-lg text-os-muted transition-colors outline-none"
            title="Reset Time Filters"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 w-full md:w-80 mt-2 bg-os-surface border border-os-border rounded-xl shadow-2xl p-4 z-30 flex flex-col gap-4 animate-in fade-in duration-100">
          
          <div className="flex items-center justify-between border-b border-os-border/40 pb-3">
            <div className="flex flex-col gap-0.5">
              <button 
                type="button"
                onClick={handleToggleMonthOnly}
                className={`text-sm font-bold tracking-tight text-left hover:text-blue-400 transition-colors ${
                  value.month === currentMonthIdx + 1 && value.year === currentYear && !value.day ? 'text-blue-400' : 'text-white'
                }`}
              >
                {months[currentMonthIdx]}
              </button>
              <button
                type="button"
                onClick={handleToggleYearOnly}
                className={`text-xs font-mono text-left tracking-wider hover:text-blue-400 transition-colors ${
                  value.year === currentYear && !value.month ? 'text-blue-400' : 'text-os-muted'
                }`}
              >
                {currentYear}
              </button>
            </div>

            <div className="flex flex-col gap-1.5 items-end">
              <div className="flex items-center gap-1 bg-os-bg border border-os-border/80 p-0.5 rounded-md">
                <button type="button" onClick={handlePrevYear} className="p-1 rounded text-os-muted hover:text-white hover:bg-os-surface transition-colors outline-none"><ChevronsLeft size={13} /></button>
                <span className="text-[9px] font-mono font-bold text-os-muted px-1 tracking-tighter select-none">YEAR</span>
                <button type="button" onClick={handleNextYear} className="p-1 rounded text-os-muted hover:text-white hover:bg-os-surface transition-colors outline-none"><ChevronsRight size={13} /></button>
              </div>

              <div className="flex items-center gap-1 bg-os-bg border border-os-border/80 p-0.5 rounded-md">
                <button type="button" onClick={handlePrevMonth} className="p-1 rounded text-os-muted hover:text-white hover:bg-os-surface transition-colors outline-none"><ChevronLeft size={13} /></button>
                <span className="text-[9px] font-mono font-bold text-os-muted px-1 tracking-tighter select-none">MON</span>
                <button type="button" onClick={handleNextMonth} className="p-1 rounded text-os-muted hover:text-white hover:bg-os-surface transition-colors outline-none"><ChevronRight size={13} /></button>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {daysOfWeek.map(dayStr => (
                <span key={dayStr} className="text-[10px] font-mono font-bold uppercase tracking-wider text-os-muted">{dayStr}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarGridCells.map((day, cellIndex) => {
                if (day === null) return <div key={`blank-${cellIndex}`} className="p-2" />;

                const isCurrentlySelected = value.day === day && value.month === currentMonthIdx + 1 && value.year === currentYear;
                const isTodayRealWorld = new Date().getDate() === day && new Date().getMonth() === currentMonthIdx && new Date().getFullYear() === currentYear;
                
                // NEW: Read the exact journal count for this day from our map database response payload
                const journalCount = monthlyCounts[day] || 0;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`relative p-2 h-10 font-mono text-xs rounded transition-all outline-none flex flex-col items-center justify-between border ${
                      isCurrentlySelected 
                        ? 'bg-blue-950/40 border-blue-500 text-blue-400 font-bold' 
                        : isTodayRealWorld
                        ? 'bg-os-surface border-neutral-600 text-white font-bold ring-1 ring-neutral-500'
                        : 'bg-os-bg/40 border-os-border text-gray-300 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{day}</span>
                    
                    {/* NEW: Mini indicator badge displaying journal count dynamically if entries exist */}
                    {journalCount > 0 && (
                      <span className={`text-[9px] leading-none px-1 py-0.5 font-bold rounded-sm tracking-tighter ${
                        isCurrentlySelected ? 'bg-blue-500/20 text-blue-300' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {journalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-os-border/40">
            {hasActiveFilter && (
              <button type="button" onClick={() => onChange({ year: null, month: null, day: null })} className="w-1/3 text-center py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[10px] font-mono font-bold text-red-400 rounded-md transition-all outline-none">CLEAR</button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className={`text-center py-1.5 bg-os-bg hover:bg-neutral-900 border border-os-border text-[10px] font-mono font-bold text-os-text rounded-md transition-all outline-none ${hasActiveFilter ? 'w-2/3' : 'w-full'}`}>[ CLOSE_PANEL ]</button>
          </div>

        </div>
      )}
    </div>
  );
};