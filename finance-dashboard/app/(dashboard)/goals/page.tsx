'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { useGoals } from '@/context/GoalContext';
import { Goal } from '../../../types';
import { Plus, PiggyBank, Calendar, Trash2, CheckCircle2, ChevronRight, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, contributeToGoal, loading } = useGoals();
  const { addToast } = useFinanceStore();

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pf-primary" />
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-on-surface">Savings Goals</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Track money allocated for long-term targets and allocate contributions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container shadow-md cursor-pointer self-start sm:self-auto"
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
              className="p-6 glass-card rounded-2xl shadow-sm flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                {/* Upper line: Title & Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isCompleted
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-pf-primary/10 text-pf-primary'
                      }`}>
                      <PiggyBank className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface leading-tight">
                        {g.name}
                      </h3>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-0.5 tracking-wider">
                        {isCompleted ? 'COMPLETED' : `${daysLeft} days remaining`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-white/5 transition-all"
                    title="Delete Goal"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Balance display */}
                <div className="mt-6">
                  <span className="text-xs text-on-surface-variant font-semibold">Total Savings Accumulated</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar and contribution */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-jm-dark-blue/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-400' : 'bg-pf-primary'
                        }`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                    <span>{ratio.toFixed(0)}% Saved</span>
                    <span>Target {new Date(g.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Contribute Button */}
                {!isCompleted ? (
                  <button
                    onClick={() => handleOpenContribute(g)}
                    className="w-full py-2.5 rounded-xl border-2 border-pf-primary hover:bg-pf-primary/10 font-semibold text-xs text-pf-primary text-center transition-all"
                  >
                    Contribute Funds
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-xl border border-green-500/10">
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
          <div className="col-span-full text-center py-16 glass-card rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <PiggyBank className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-on-surface">Create your first savings goal.</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              Setup a financial goal with target amounts and timelines to allocate savings contributions.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-5 py-2.5 text-xs font-bold text-on-primary bg-pf-primary hover:bg-pf-primary-container rounded-xl shadow-md"
            >
              Add First Goal
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-jm-navy rounded-2xl shadow-2xl border border-jm-dark-blue/50 p-6 relative"
            style={{
              width: "640px",
              maxWidth: "95vw",
              maxHeight: "90vh",
            }}
          >
            <h2 className="text-xl font-bold text-on-surface mb-6 shrink-0">
              Create Savings Goal
            </h2>

            <div className="overflow-y-auto max-h-[70vh] pr-2">
              <form onSubmit={handleAddGoalSubmit} className="space-y-5">

                {/* Goal Name */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Goal Name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Tesla Model Y Fund"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary ${errors.name
                      ? "border-error ring-2 ring-error/20"
                      : "border-jm-dark-blue/50"
                      }`}
                  />
                  {errors.name && (
                    <p className="text-error text-xs mt-1 font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Target Amount ($)
                    </label>

                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary ${errors.targetAmount
                        ? "border-error ring-2 ring-error/20"
                        : "border-jm-dark-blue/50"
                        }`}
                    />
                    {errors.targetAmount && (
                      <p className="text-error text-xs mt-1 font-medium">
                        {errors.targetAmount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Starting Amount ($)
                    </label>

                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary ${errors.currentAmount
                        ? "border-error ring-2 ring-error/20"
                        : "border-jm-dark-blue/50"
                        }`}
                    />
                    {errors.currentAmount && (
                      <p className="text-error text-xs mt-1 font-medium">
                        {errors.currentAmount}
                      </p>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Target Deadline
                  </label>

                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-slate-900 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary ${errors.deadline
                      ? "border-error ring-2 ring-error/20"
                      : "border-jm-dark-blue/50"
                      }`}
                  />
                  {errors.deadline && (
                    <p className="text-error text-xs mt-1 font-medium">
                      {errors.deadline}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-jm-dark-blue/10 text-on-surface-variant"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container shadow-md"
                  >
                    Create Goal
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Dialog */}
      {isContributeOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-jm-navy border border-jm-dark-blue/50 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-on-surface mb-2">Contribute Savings</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Allocate savings to: <span className="font-bold text-on-surface">{activeGoal.name}</span>
            </p>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              {/* Contribution Input */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Contribution Amount ($)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
                    <DollarSign className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    className={`w-full h-11 pl-9 pr-3.5 border rounded-xl text-sm bg-slate-900 border-jm-dark-blue/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary ${errors.contribution ? 'border-error ring-2 ring-error/20' : ''
                      }`}
                  />
                </div>
                {errors.contribution && <p className="text-error text-xs mt-1 font-medium">{errors.contribution}</p>}

                <p className="text-[10px] text-on-surface-variant mt-2 font-medium">
                  Note: Funds will be deducted from your primary wallet/debit card and registered as a savings transaction.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsContributeOpen(false); setActiveGoal(null); }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-jm-dark-blue/10 text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-on-primary bg-pf-primary rounded-xl hover:bg-pf-primary-container shadow-md"
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