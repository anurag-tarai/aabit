import React, { useState, useEffect, useCallback } from 'react';
import { sprintApi, type Target, type Goal, getCurrentWeekMonday, getWeekSunday } from '../../api/sprintClient';
import { Target as TargetIcon, Plus, Trash2, RefreshCw, Check, X } from 'lucide-react';

interface Props {
  goals: Goal[];
}

export const WeeklyTargetsPane: React.FC<Props> = ({ goals }) => {
  const weekStart  = getCurrentWeekMonday();
  const weekSunday = getWeekSunday(weekStart);
  const isPastWeek = new Date().toISOString().slice(0, 10) > weekSunday;

  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formWorkAreaId, setFormWorkAreaId] = useState('');
  const [formGoalId, setFormGoalId]         = useState('');
  const [formName, setFormName]             = useState('');
  const [formRepeating, setFormRepeating]   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sprintApi.getTargetsForWeek(weekStart);
      setTargets(res.data);
    } catch (e) {
      console.error('Failed to fetch targets', e);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchTargets(); }, [fetchTargets]);

  // Flatten all work areas for the selector, grouped by goal
  const allWorkAreas = goals.flatMap(g => g.workAreas.map(wa => ({ ...wa, goalName: g.name })));

  const workAreaMap = Object.fromEntries(allWorkAreas.map(wa => [wa.id, wa]));
  const goalMap     = Object.fromEntries(goals.flatMap(g => g.workAreas.map(wa => [wa.id, g])));

  const handleGoalChange = (goalId: string) => {
    setFormGoalId(goalId);
    setFormWorkAreaId('');
  };

  const filteredWorkAreas = formGoalId
    ? goals.find(g => g.id === formGoalId)?.workAreas ?? []
    : allWorkAreas;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formWorkAreaId || !formName.trim()) {
      setFormError('Work area and name are required.');
      return;
    }
    setSaving(true);
    try {
      await sprintApi.createTarget({
        workAreaId: formWorkAreaId,
        name: formName.trim(),
        weekStartDate: weekStart,
        repeating: formRepeating,
      });
      setFormName('');
      setFormWorkAreaId('');
      setFormGoalId('');
      setFormRepeating(false);
      setShowForm(false);
      await fetchTargets();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Failed to create target.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (target: Target) => {
    if (isPastWeek) return;
    try {
      const res = await sprintApi.toggleTargetComplete(target.id);
      setTargets(prev => prev.map(t => t.id === target.id ? res.data : t));
    } catch (e) {
      console.error('Toggle failed', e);
    }
  };

  const handleDelete = async (targetId: string) => {
    setDeletingId(targetId);
    try {
      await sprintApi.deleteTarget(targetId);
      setTargets(prev => prev.filter(t => t.id !== targetId));
    } catch (e) {
      console.error('Delete target failed', e);
    } finally {
      setDeletingId(null);
    }
  };

  const completed = targets.filter(t => t.completed).length;
  const total     = targets.length;

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <TargetIcon size={13} className="text-violet-400" />
          <span className="text-neutral-400 font-bold tracking-widest text-xs">WEEKLY TARGETS</span>
          <span className="text-[10px] text-neutral-700">{weekStart}</span>
          {total > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              completed === total
                ? 'text-emerald-500 border-emerald-900 bg-emerald-950/30'
                : 'text-violet-400 border-violet-900/50 bg-violet-950/20'
            }`}>
              {completed}/{total}
            </span>
          )}
        </div>
        {!isPastWeek && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-neutral-500 hover:text-violet-400 border border-neutral-800 hover:border-violet-700 px-2 py-1 rounded transition-colors"
          >
            {showForm ? <X size={11} /> : <Plus size={11} />}
            {showForm ? 'CANCEL' : 'ADD'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-0.5 bg-neutral-900">
          <div
            className="h-full bg-violet-600 transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-4 py-3 border-b border-neutral-900 flex flex-col gap-2 bg-neutral-950/40">
          {formError && (
            <div className="text-red-400 text-[10px] bg-red-950/30 p-1.5 rounded border border-red-900/40">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-600 uppercase font-bold">Goal</label>
              <select
                value={formGoalId}
                onChange={e => handleGoalChange(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-1.5 rounded outline-none focus:border-violet-700 text-[11px]"
              >
                <option value="">All goals...</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-neutral-600 uppercase font-bold">Work Area *</label>
              <select
                required
                value={formWorkAreaId}
                onChange={e => setFormWorkAreaId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-1.5 rounded outline-none focus:border-violet-700 text-[11px]"
              >
                <option value="">Select...</option>
                {filteredWorkAreas.map(wa => (
                  <option key={wa.id} value={wa.id}>{wa.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-neutral-600 uppercase font-bold">Target Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Complete unit tests, Read 50 pages..."
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-1.5 rounded outline-none focus:border-violet-700 text-[11px]"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setFormRepeating(v => !v)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  formRepeating ? 'bg-violet-600 border-violet-500' : 'border-neutral-700 bg-neutral-900'
                }`}
              >
                {formRepeating && <Check size={10} className="text-white" />}
              </div>
              <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
                <RefreshCw size={9} className="inline mr-1 text-violet-500" />
                Repeat next week
              </span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 bg-violet-700 hover:bg-violet-600 text-white text-[11px] font-bold rounded transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'CREATE'}
            </button>
          </div>
        </form>
      )}

      {/* Target list */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="text-neutral-700 animate-pulse py-1 text-[11px]">loading targets...</div>
        ) : targets.length === 0 ? (
          <div className="text-neutral-700 py-2 tracking-wider text-[11px]">
            {isPastWeek ? 'NO_TARGETS_LOGGED_THIS_WEEK' : 'NO_TARGETS — click ADD to set your weekly goals'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {targets.map(target => {
              const wa   = workAreaMap[target.workAreaId];
              const goal = goalMap[target.workAreaId];
              const locked = isPastWeek;

              return (
                <div
                  key={target.id}
                  className="flex items-center gap-2.5 group py-1"
                >
                  {/* Completion checkbox */}
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => handleToggle(target)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      target.completed
                        ? 'bg-emerald-600 border-emerald-500'
                        : locked
                        ? 'border-neutral-800 bg-neutral-900 cursor-not-allowed opacity-50'
                        : 'border-neutral-700 bg-neutral-900 hover:border-violet-600'
                    }`}
                    title={locked ? 'Past week — locked' : target.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {target.completed && <Check size={10} className="text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] ${target.completed ? 'line-through text-neutral-600' : 'text-neutral-300'}`}>
                      {target.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {goal && (
                        <span className="text-[9px] font-bold" style={{ color: goal.color }}>
                          {goal.name}
                        </span>
                      )}
                      {wa && (
                        <span className="text-[9px] text-neutral-600">/ {wa.name}</span>
                      )}
                      {target.repeating && (
                        <span title="Repeats next week">
  <RefreshCw size={8} className="text-violet-600" />
</span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(target.id)}
                    disabled={deletingId === target.id}
                    className="text-neutral-800 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Delete target"
                  >
                    {deletingId === target.id ? '...' : <Trash2 size={11} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};