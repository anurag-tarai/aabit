import React, { useState } from 'react';
import { sprintApi, type Target, type Goal, getMondayFromDate } from '../../api/sprintClient';
import { X } from 'lucide-react';

interface TargetModalProps {
  target?: Target;
  goals: Goal[];
  preselectedDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TargetModal: React.FC<TargetModalProps> = ({
  target,
  goals,
  preselectedDate,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState(target?.name || '');
  const [targetType, setTargetType] = useState<'DAILY' | 'WEEKLY'>(target?.targetType || 'DAILY');
  // Initialize date to either the target date, or the week start date, or the preselected date
  const initialDate = target?.targetType === 'WEEKLY' ? target.weekStartDate : target?.targetDate;
  const [targetDate, setTargetDate] = useState(initialDate || preselectedDate || '');
  const [selectedGoalId, setSelectedGoalId] = useState(target?.goalId || '');
  const [selectedWorkAreaId, setSelectedWorkAreaId] = useState(target?.workAreaId || '');
  const [priority, setPriority] = useState<'HIGHEST' | 'MEDIUM' | 'LOW'>(target?.priority || 'MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const workAreas = selectedGoal?.workAreas ?? [];

  const handleGoalChange = (goalId: string) => {
    setSelectedGoalId(goalId);
    setSelectedWorkAreaId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!targetDate) {
      setError('Date is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        goalId: selectedGoalId || null,
        workAreaId: selectedWorkAreaId || null,
        targetType,
        targetDate: targetType === 'DAILY' ? targetDate : null,
        weekStartDate: targetType === 'WEEKLY' ? getMondayFromDate(targetDate) : undefined,
        isFixed: false,
        priority
      };

      if (target) {
        await sprintApi.updateTarget(target.id, payload);
      } else {
        await sprintApi.createTarget(payload as any);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update target.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg max-w-sm w-full font-mono text-sm shadow-2xl overflow-hidden animate-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-900">
          <span className="text-emerald-500 font-bold tracking-widest text-[11px]">{target ? 'MODIFY TARGET' : 'CREATE TARGET'}</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 pt-3 flex flex-col gap-3 text-xs">
          {error && (
            <div className="text-red-400 p-2 rounded border border-red-900/40 bg-red-950/20">{error}</div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-500 uppercase font-bold">Target Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 font-sans text-xs"
            />
          </div>

          {/* Target Type */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-500 uppercase font-bold">Type</label>
              <select
                value={targetType}
                onChange={e => {
                  const val = e.target.value as 'DAILY' | 'WEEKLY';
                  setTargetType(val);
                }}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none"
              >
                <option value="WEEKLY">WEEKLY</option>
                <option value="DAILY">DAILY</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-500 uppercase font-bold">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none"
              >
                <option value="HIGHEST">HIGHEST</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Target Date / Move Target option */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-500 uppercase font-bold">
              Target Date (Move target) *
            </label>
            <input
              required
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 font-mono text-xs"
            />
          </div>

          {/* Goal selection (optional) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-500 uppercase font-bold">Goal</label>
              <select
                value={selectedGoalId}
                onChange={e => handleGoalChange(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none text-xs"
              >
                <option value="">None (Anonymous)</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Work Area selection (optional) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-500 uppercase font-bold">Work Area</label>
              <select
                disabled={!selectedGoalId}
                value={selectedWorkAreaId}
                onChange={e => setSelectedWorkAreaId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none text-xs disabled:opacity-40"
              >
                <option value="">None (Goal Only)</option>
                {workAreas.map(wa => <option key={wa.id} value={wa.id}>{wa.name}</option>)}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-between mt-3 pt-3 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-800 text-neutral-500 hover:text-neutral-300 rounded hover:border-neutral-700 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded transition-colors"
            >
              {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
