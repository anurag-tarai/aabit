import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full font-mono text-xs",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none flex items-center justify-between cursor-pointer transition-colors ${
          isOpen ? 'border-emerald-600' : 'hover:border-neutral-600'
        }`}
      >
        <span className={!selectedOption ? 'text-neutral-500 truncate' : 'truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <ul className="flex flex-col p-1 m-0 list-none">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 rounded-md transition-colors ${
                  opt.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-neutral-800 hover:text-emerald-400'
                } ${value === opt.value ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300'}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
