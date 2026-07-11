import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { api } from '../../api/client';
import { CustomCalendar } from './CustomCalendar';

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
  
  const [monthlyCounts, setMonthlyCounts] = useState<Record<number, number>>({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = viewDate.getFullYear();
  const currentMonthIdx = viewDate.getMonth();

  useEffect(() => {
    if (isOpen) {
      api.get<Record<number, number>>(`/experiences/stats/monthly?year=${currentYear}&month=${currentMonthIdx + 1}`)
        .then(res => setMonthlyCounts(res.data))
        .catch(err => console.error("Failed to load map counts", err));
    }
  }, [currentYear, currentMonthIdx, isOpen]);

  useEffect(() => {
    if (value.year && value.month) {
      setViewDate(new Date(value.year, value.month - 1, value.day || 1));
    }
  }, [value.year, value.month]);

  const handleSelectDay = (day: number, monthIdx: number, year: number) => {
    onChange({
      year,
      month: monthIdx + 1,
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

  const renderBadge = (day: number, monthIdx: number, year: number) => {
    const count = monthlyCounts[day] || 0;
    if (count > 0) {
      const isCurrentlySelected = value.day === day && value.month === monthIdx + 1 && value.year === year;
      return (
        <span className={`text-[9px] leading-none px-1 py-0.5 font-bold rounded-sm tracking-tighter ${
          isCurrentlySelected ? 'bg-blue-500/20 text-blue-300' : 'bg-neutral-800 text-neutral-400'
        }`}>
          {count}
        </span>
      );
    }
    return null;
  };

  const headerCustomization = (
    <div className="flex flex-col gap-0.5">
      <button 
        type="button"
        onClick={handleToggleMonthOnly}
        className={`text-sm font-bold tracking-tight text-left hover:text-emerald-400 transition-colors ${
          value.month === currentMonthIdx + 1 && value.year === currentYear && !value.day ? 'text-emerald-400' : 'text-neutral-200'
        }`}
      >
        {months[currentMonthIdx]}
      </button>
      <button
        type="button"
        onClick={handleToggleYearOnly}
        className={`text-xs font-mono text-left tracking-wider hover:text-emerald-400 transition-colors ${
          value.year === currentYear && !value.month ? 'text-emerald-400' : 'text-neutral-500'
        }`}
      >
        {currentYear}
      </button>
    </div>
  );

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 text-sm bg-neutral-900 border rounded-lg transition-all outline-none w-full select-none ${
            hasActiveFilter ? 'border-emerald-600 text-emerald-400' : 'border-neutral-800 text-neutral-400 hover:text-white focus:border-neutral-600'
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
            className="p-3 border border-neutral-800 bg-neutral-900 hover:text-red-400 rounded-lg text-neutral-400 transition-colors outline-none"
            title="Reset Time Filters"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 w-full md:w-80 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 z-30 flex flex-col gap-4 animate-in fade-in duration-100">
          
          <CustomCalendar
            viewDate={viewDate}
            setViewDate={setViewDate}
            selectedDate={value.year && value.month && value.day ? new Date(value.year, value.month - 1, value.day) : null}
            onSelectDate={handleSelectDay}
            renderDayBadge={renderBadge}
            headerCustomization={headerCustomization}
          />

          <div className="flex gap-2 pt-2 border-t border-neutral-800/80">
            {hasActiveFilter && (
              <button type="button" onClick={() => onChange({ year: null, month: null, day: null })} className="w-1/3 text-center py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[10px] font-mono font-bold text-red-400 rounded-md transition-all outline-none">CLEAR</button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className={`text-center py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono font-bold text-neutral-300 rounded-md transition-all outline-none ${hasActiveFilter ? 'w-2/3' : 'w-full'}`}>[ CLOSE_PANEL ]</button>
          </div>

        </div>
      )}
    </div>
  );
};
