import React from 'react';
import { useFontSize } from './FontSizeContext';

export const TextScaler: React.FC = () => {
  const { fontSize, increaseFontSize, decreaseFontSize } = useFontSize();

  return (
    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Decrease Font Button */}
      <button
        onClick={decreaseFontSize}
        disabled={fontSize === 'sm'}
        className="px-2.5 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all"
        title="Decrease Text Size"
      >
        A-
      </button>

      {/* Status Label Indicating Current Scale Context */}
      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        Size: {fontSize}
      </span>

      {/* Increase Font Button */}
      <button
        onClick={increaseFontSize}
        disabled={fontSize === 'xl'}
        className="px-2.5 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all"
        title="Increase Text Size"
      >
        A+
      </button>
    </div>
  );
};