import React, { useState, useEffect } from 'react';
import { sprintApi, type Goal } from '../../api/sprintClient';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

interface GoalArchitectProps {
  sprintId: string;
  activeGoals: Goal[];
  onUpdate: () => void;
}

export const GoalArchitect: React.FC<GoalArchitectProps> = ({ sprintId, activeGoals, onUpdate }) => {
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // New goal form
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('#10b981');
  const [goalLoading, setGoalLoading] = useState(false);

  // New work area form
  const [selectedGoalForArea, setSelectedGoalForArea] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [areaLoading, setAreaLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const refreshGoals = async () => {
    const res = await sprintApi.getAllGoals();
    setAllGoals(res.data);
  };

  useEffect(() => {
    refreshGoals();
  }, [activeGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    setGoalLoading(true);
    setError(null);
    try {
      await sprintApi.createGoal({ name: newGoalName.trim(), color: newGoalColor });
      setNewGoalName('');
      await refreshGoals();
    } catch {
      setError('Failed to create goal.');
    } finally {
      setGoalLoading(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForArea || !newAreaName.trim()) return;
    setAreaLoading(true);
    setError(null);
    try {
      await sprintApi.createWorkArea(selectedGoalForArea, { name: newAreaName.trim() });
      setNewAreaName('');
      await refreshGoals();
    } catch {
      setError('Failed to create work area.');
    } finally {
      setAreaLoading(false);
    }
  };

  const handleAssign = async (goalId: string) => {
    try {
      await sprintApi.assignGoalToSprint(sprintId, goalId);
      onUpdate();
    } catch {
      setError('Failed to assign goal to sprint.');
    }
  };

  const handleRemove = async (goalId: string) => {
    try {
      await sprintApi.removeGoalFromSprint(sprintId, goalId);
      onUpdate();
    } catch {
      setError('Failed to remove goal from sprint.');
    }
  };

  const isActive = (goalId: string) => activeGoals.some(g => g.id === goalId);

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded p-4 font-mono text-xs flex flex-col gap-5">
      {error && (
        <div className="text-red-400 bg-red-950/20 border border-red-900/40 px-3 py-2 rounded text-xs">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* ── Section 1: Create Goal ── */}
        <form onSubmit={handleCreateGoal} className="flex flex-col gap-2">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">1. New Goal</span>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Goal name..."
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600"
            />
            <input
              type="color"
              value={newGoalColor}
              onChange={e => setNewGoalColor(e.target.value)}
              className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded cursor-pointer p-0.5 flex-shrink-0"
            />
            <button
              type="submit"
              disabled={goalLoading}
              className="px-3 border border-neutral-700 hover:border-emerald-600 rounded text-neutral-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
          </div>
        </form>

        {/* ── Section 2: Add Work Area ── */}
        <form onSubmit={handleCreateArea} className="flex flex-col gap-2">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">2. New Work Area</span>
          <div className="flex gap-2">
            <select
              value={selectedGoalForArea}
              onChange={e => setSelectedGoalForArea(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-400 p-2 rounded outline-none min-w-0 flex-1"
            >
              <option value="" disabled>Goal...</option>
              {allGoals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <input
              required
              disabled={!selectedGoalForArea}
              type="text"
              placeholder="Area name..."
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded outline-none focus:border-emerald-600 disabled:opacity-40 min-w-0"
            />
            <button
              type="submit"
              disabled={areaLoading || !selectedGoalForArea}
              className="px-3 border border-neutral-700 hover:border-emerald-600 rounded text-neutral-400 hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <Plus size={13} />
            </button>
          </div>
        </form>

        {/* ── Section 3: Sprint Goal Roster ── */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">3. Sprint Goals</span>
          <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto border border-neutral-900 rounded p-2 bg-neutral-950/30">
            {allGoals.length === 0 && (
              <span className="text-neutral-700 text-center py-2">No goals yet</span>
            )}
            {allGoals.map(g => {
              const active = isActive(g.id);
              return (
                <div key={g.id} className="flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                  <button
                    onClick={() => setExpandedGoalId(expandedGoalId === g.id ? null : g.id)}
                    className="flex-1 text-left text-neutral-400 hover:text-neutral-200 truncate flex items-center gap-1"
                  >
                    {expandedGoalId === g.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    {g.name}
                  </button>
                  {active ? (
                    <button
                      onClick={() => handleRemove(g.id)}
                      title="Remove from sprint"
                      className="text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssign(g.id)}
                      title="Add to sprint"
                      className="text-neutral-600 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Plus size={11} />
                    </button>
                  )}
                  {active && (
                    <span className="text-emerald-700 text-[9px] font-bold">IN SPRINT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Work area preview for expanded goal */}
      {expandedGoalId && (() => {
        const goal = allGoals.find(g => g.id === expandedGoalId);
        if (!goal) return null;
        return (
          <div className="border-t border-neutral-900 pt-3">
            <span className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest">
              Work areas: <span style={{ color: goal.color }}>{goal.name}</span>
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {goal.workAreas.length === 0 ? (
                <span className="text-neutral-700">No work areas yet</span>
              ) : (
                goal.workAreas.map(wa => (
                  <span
                    key={wa.id}
                    className="px-2 py-0.5 border border-neutral-800 rounded text-neutral-500 bg-neutral-950"
                  >
                    {wa.name}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
