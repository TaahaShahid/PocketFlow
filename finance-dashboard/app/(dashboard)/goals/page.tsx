'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { useGoals } from '@/context/GoalContext';
import { Goal } from '../../../types';
import { Button } from '@/components/ui/button';
import { Plus, PiggyBank, Trash2, CheckCircle2, DollarSign, Loader2, X, Calendar, User, Tag } from 'lucide-react';

const cardBase = 'rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/10';

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
  const [currentTime] = useState(() => new Date().getTime());

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="space-y-6 pb-20">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Savings Goals</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track money allocated for long-term targets and allocate contributions.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl shadow-lg shadow-primary/10 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create Savings Goal</span>
        </Button>
      </div>

      {/* Grid of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => {
          const ratio = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const isCompleted = g.status === 'completed';
          const daysLeft = currentTime > 0 ? Math.max(0, Math.ceil((g.deadline - currentTime) / (24 * 60 * 60 * 1000))) : 0;

          return (
            <div
              key={g.id}
              className={`${cardBase} p-6 flex flex-col justify-between h-72`}
            >
              <div>
                {/* Upper line: Title & Icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${isCompleted
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                      : 'bg-primary/10 text-primary border border-primary/10'
                      }`}>
                      <PiggyBank className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">
                        {g.name}
                      </h3>
                      <p 
                        suppressHydrationWarning={true}
                        className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest"
                      >
                        {isCompleted ? 'COMPLETED' : `${daysLeft} days remaining`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Balance display */}
                <div className="mt-6">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Accumulated Savings</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar and contribution */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>{ratio.toFixed(0)}% Saved</span>
                    <span suppressHydrationWarning={true}>Target {new Date(g.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Contribute Button */}
                {!isCompleted ? (
                  <Button
                    onClick={() => handleOpenContribute(g)}
                    variant="outline"
                    className="w-full h-9 rounded-xl border-primary/30 hover:bg-primary/10 text-primary text-xs"
                  >
                    Contribute Funds
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-xl border border-emerald-500/15">
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
          <div className="col-span-full text-center py-16 border border-border bg-card/45 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-muted/10 border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <PiggyBank className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Create your first savings goal.</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Setup a financial goal with target amounts and timelines to allocate savings contributions.
            </p>
            <Button
              onClick={handleOpenAdd}
              className="mt-4 rounded-xl shadow-md"
            >
              Add First Goal
            </Button>
          </div>
        )}
      </div>

      {/* Add Goal Dialog */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-lg overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-xl font-bold tracking-tight">Create Savings Goal</h2>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddGoalSubmit} className="space-y-4">
                {/* Goal Name */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Goal Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tesla Model Y Fund"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                    ${errors.name ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                  />
                  {errors.name && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Target Amount ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${errors.targetAmount ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                    />
                    {errors.targetAmount && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">{errors.targetAmount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Starting Amount ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                      ${errors.currentAmount ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                    />
                    {errors.currentAmount && (
                      <p className="text-rose-500 text-xs mt-1 font-medium">{errors.currentAmount}</p>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                    ${errors.deadline ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                  />
                  {errors.deadline && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">{errors.deadline}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl shadow-md"
                  >
                    Create Goal
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contribute Dialog */}
      <AnimatePresence>
        {isContributeOpen && activeGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsContributeOpen(false); setActiveGoal(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card/95 border border-border text-foreground rounded-3xl shadow-2xl p-6 relative w-full max-w-md overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-2 pb-2">
                <h2 className="text-xl font-bold tracking-tight">Contribute Savings</h2>
                <button
                  onClick={() => { setIsContributeOpen(false); setActiveGoal(null); }}
                  className="p-1 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4 font-semibold">
                Allocate savings to: <span className="text-foreground font-bold">{activeGoal.name}</span>
              </p>

              <form onSubmit={handleContributeSubmit} className="space-y-4">
                {/* Contribution Input */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Contribution Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    className={`w-full h-10 px-3 border rounded-xl text-sm bg-muted/10 text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all
                    ${errors.contribution ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                  />
                  {errors.contribution && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.contribution}</p>}

                  <p className="text-[10px] text-muted-foreground mt-2 font-bold">
                    Note: Funds will be registered as a savings transaction linked to this goal.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsContributeOpen(false); setActiveGoal(null); }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl shadow-md"
                  >
                    Confirm Deposit
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}