import React, { useState } from 'react';
import { sprintApi } from '../../api/sprintClient';
import { X, Calendar } from 'lucide-react';

interface InitializeSprintModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const InitializeSprintModal: React.FC<InitializeSprintModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sprintApi.createSprint({ name, startDate, endDate });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create sprint. Period may overlap an existing one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded max-w-sm w-full p-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-300 transition-colors">
          <X size={15} />
        </button>

        <div className="flex items-center gap-2 text-emerald-500 mb-5 pb-2 border-b border-neutral-900">
          <Calendar size={15} />
          <span className="font-bold tracking-wider text-sm">NEW SPRINT</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {error && (
            <div className="text-red-400 text-xs bg-red-950/30 p-2 rounded border border-red-900/40">{error}</div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-neutral-600 uppercase font-bold">Name</label>
            <input
              required
              type="text"
              placeholder="e.g., Jun–Oct 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-600 uppercase font-bold">Start Date</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-neutral-600 uppercase font-bold">End Date</label>
              <input
                required
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'CREATING...' : 'CREATE SPRINT'}
          </button>
        </form>
      </div>
    </div>
  );
};
