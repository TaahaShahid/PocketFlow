'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { Goal } from '../../../types';
import { Plus, PiggyBank, Calendar, Trash2, CheckCircle2, ChevronRight, DollarSign, AlertTriangle } from 'lucide-react';

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, contributeToGoal, addToast } = useFinanceStore();

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  // Form fields
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contribution, setContribution] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenAdd = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenContribute = (g: Goal) => {
    setActiveGoal(g);
    setContribution('');
    setErrors({});
    setIsContributeOpen(true);
  };

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount || '0');
    const deadlineTime = new Date(deadline).getTime();

    // Validations
    if (!goalName.trim()) {
      newErrors.name = 'Goal name is required';
    }
    if (isNaN(target) || target <= 0) {
      newErrors.targetAmount = 'Target amount must be a positive number';
    }
    if (isNaN(current) || current < 0) {
      newErrors.currentAmount = 'Starting amount must be 0 or positive';
    }
    if (current > target) {
      newErrors.currentAmount = 'Starting amount cannot exceed target';
    }
    if (!deadline) {
      newErrors.deadline = 'Deadline date is required';
    } else if (deadlineTime < Date.now() - 24 * 60 * 60 * 1000) {
      newErrors.deadline = 'Deadline cannot be in the past';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please correct the goal details', 'error');
      return;
    }

    addGoal({
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: deadlineTime
    });

    addToast('Savings goal created successfully!', 'success');
    setIsAddOpen(false);
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;

    const amt = parseFloat(contribution);
    if (isNaN(amt) || amt <= 0) {
      setErrors({ contribution: 'Contribution must be greater than zero' });
      addToast('Invalid contribution amount', 'error');
      return;
    }

    contributeToGoal(activeGoal.id, amt);
    addToast(`Successfully contributed $${amt.toFixed(2)} to ${activeGoal.name}`, 'success');
    setIsContributeOpen(false);
    setActiveGoal(null);
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    addToast('Savings goal deleted', 'info');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Savings Goals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track money allocated for long-term targets and allocate contributions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create Savings Goal</span>
        </button>
      </div>

      {/* Grid of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => {
          const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const isCompleted = g.status === 'completed';
          const daysLeft = Math.max(0, Math.ceil((g.deadline - Date.now()) / (24 * 60 * 60 * 1000)));

          return (
            <div
              key={g.id}
              className="p-6 rounded-2xl bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue shadow-sm flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                {/* Upper line: Title & Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-jm-dark-blue/10 dark:bg-jm-light-blue/20 text-jm-dark-blue dark:text-jm-light-blue'
                      }`}>
                      <PiggyBank className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                        {g.name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                        {isCompleted ? 'COMPLETED' : `${daysLeft} days remaining`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
                    title="Delete Goal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Balance display */}
                <div className="mt-6">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Total Savings Accumulated</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-sm text-slate-400">
                      / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar and contribution */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-jm-light-blue'
                        }`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{ratio.toFixed(0)}% Saved</span>
                    <span>Target {new Date(g.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Contribute Button */}
                {!isCompleted ? (
                  <button
                    onClick={() => handleOpenContribute(g)}
                    className="w-full py-2.5 rounded-xl border-2 border-jm-dark-blue hover:bg-slate-50 dark:border-jm-light-blue dark:hover:bg-slate-900/60 font-semibold text-xs text-jm-dark-blue dark:text-jm-light-blue text-center transition-all"
                  >
                    Contribute Funds
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Goal Completed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {goals.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-jm-navy border border-slate-100 dark:border-jm-dark-blue rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <PiggyBank className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Create your first savings goal.</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Setup a financial goal with target amounts and timelines to allocate savings contributions.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-jm-dark-blue hover:bg-jm-light-blue rounded-xl shadow-md"
            >
              Add First Goal
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-jm-navy border border-slate-200 dark:border-jm-dark-blue rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Create Savings Goal</h2>

            <form onSubmit={handleAddGoalSubmit} className="space-y-4">
              {/* Goal Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tesla Model Y Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                    }`}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Target Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Amount ($)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${errors.targetAmount ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                      }`}
                  />
                  {errors.targetAmount && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.targetAmount}</p>}
                </div>

                {/* Starting Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Starting Amount ($)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${errors.currentAmount ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                      }`}
                  />
                  {errors.currentAmount && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.currentAmount}</p>}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${errors.deadline ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                    }`}
                />
                {errors.deadline && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.deadline}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-505 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Dialog */}
      {isContributeOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-jm-navy border border-slate-200 dark:border-jm-dark-blue rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Contribute Savings</h2>
            <p className="text-xs text-slate-400 mb-4">
              Allocate savings to: <span className="font-bold text-slate-700 dark:text-slate-200">{activeGoal.name}</span>
            </p>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              {/* Contribution Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contribution Amount ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    className={`w-full h-11 pl-9 pr-3.5 border rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-jm-dark-blue/80 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-jm-dark-blue ${errors.contribution ? 'border-rose-500 ring-2 ring-rose-500/20' : ''
                      }`}
                  />
                </div>
                {errors.contribution && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.contribution}</p>}

                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Note: Funds will be deducted from your primary wallet/debit card and registered as a savings transaction.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsContributeOpen(false); setActiveGoal(null); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-jm-dark-blue rounded-xl hover:bg-jm-light-blue shadow-md"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
