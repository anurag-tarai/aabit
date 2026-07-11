import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CustomCalendar } from './CustomCalendar';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  required,
  className = '',
  placeholder = 'Select date...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse standard YYYY-MM-DD to Date
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [y, m, d] = dateString.split('-');
    if (y && m && d) {
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return null;
  };

  const selectedDate = parseDate(value);

  // Sync viewDate when popup opens or value changes
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    } else {
      setViewDate(new Date());
    }
  }, [value, isOpen]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDate = (day: number, monthIdx: number, year: number) => {
    // Format to YYYY-MM-DD
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${year}-${pad(monthIdx + 1)}-${pad(day)}`);
    setIsOpen(false);
  };

  const formatDateLabel = (d: Date | null) => {
    if (!d) return placeholder;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-neutral-900 border border-neutral-800 rounded outline-none focus:border-emerald-600 transition-colors"
      >
        <span className={`text-xs font-mono ${value ? 'text-neutral-200' : 'text-neutral-500'}`}>
          {formatDateLabel(selectedDate)}
        </span>
        <CalendarIcon size={14} className="text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in duration-100">
          <CustomCalendar
            viewDate={viewDate}
            setViewDate={setViewDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
          <div className="flex gap-2 pt-4 mt-2 border-t border-neutral-800/80">
            {value && !required && (
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="flex-1 py-1.5 text-[10px] font-mono font-bold text-red-400 border border-red-900/30 rounded bg-red-950/20 hover:bg-red-950/40 transition-colors"
              >
                CLEAR
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 text-[10px] font-mono font-bold text-neutral-400 border border-neutral-800 rounded hover:bg-neutral-800 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
