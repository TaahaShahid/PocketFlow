'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Download, Printer, Calendar, FileText, CheckCircle, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { profile, loading: authLoading } = useAuth();
  const { addToast } = useFinanceStore();

  const loading = txLoading || authLoading;

  // Filters State
  const [period, setPeriod] = useState<'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived Date Range Timestamp
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let start = 0;
    let end = Date.now();

    if (period === 'this-month') {
      start = new Date(currentYear, currentMonth, 1).getTime();
    } else if (period === 'last-month') {
      start = new Date(currentYear, currentMonth - 1, 1).getTime();
      end = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime();
    } else if (period === 'this-year') {
      start = new Date(currentYear, 0, 1).getTime();
    } else if (period === 'custom') {
      start = new Date(startDate).getTime();
      // include the full end day
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      end = eDate.getTime();
    }

    return { start, end };
  }, [period, startDate, endDate]);

  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.date >= dateRange.start && tx.date <= dateRange.end && tx.status === 'completed'
    );
  }, [transactions, dateRange]);

  // Calculate stats for the report
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals: Record<string, { name: string; type: string; amount: number }> = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }

      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = { name: tx.category, type: tx.type, amount: 0 };
      }
      categoryTotals[tx.category].amount += tx.amount;
    });

    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    return {
      income,
      expense,
      netSavings,
      savingsRate,
      categories: Object.values(categoryTotals).sort((a, b) => b.amount - a.amount)
    };
  }, [filteredTransactions]);

  // CSV Exporter Trigger
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast('No transaction data to export.', 'error');
      return;
    }

    // CSV headers
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Transaction ID,Type,Recipient/Payee,Category,Amount,Date,Notes\n';

    // Populate rows
    filteredTransactions.forEach((tx) => {
      const formattedDate = new Date(tx.date).toLocaleDateString().replace(/,/g, '');
      const notesSafe = tx.notes ? tx.notes.replace(/"/g, '""').replace(/,/g, ';') : '';
      const recipientSafe = tx.recipientName.replace(/"/g, '""').replace(/,/g, ';');

      csvContent += `"${tx.id}","${tx.type}","${recipientSafe}","${tx.category}",${tx.amount},"${formattedDate}","${notesSafe}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    const fileName = `JM_Solutionss_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('CSV spreadsheet downloaded successfully', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDateRangeLabel = () => {
    const opt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${new Date(dateRange.start).toLocaleDateString(undefined, opt)} - ${new Date(dateRange.end).toLocaleDateString(undefined, opt)}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pf-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Printable CSS rules to hide Sidebar and Header during browser print */}
      <style jsx global>{`
        @media print {
          aside, header, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .lg\\:pl-64 {
            padding-left: 0 !important;
          }
          .print-full {
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header and top menu controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Export Financial Reports</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Generate printable statements and download spreadsheets of transaction history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold text-on-surface-variant glass-card hover:bg-white/5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold text-on-primary bg-pf-primary hover:bg-pf-primary-container rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Options bar */}
      <div className="p-4 rounded-2xl glass-card shadow-sm flex flex-col md:flex-row md:items-end gap-4 no-print">

        {/* Time Period select */}
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Report Frame</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="w-full h-11 px-3.5 border border-white/10 bg-slate-900 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary"
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Timelines */}
        {period === 'custom' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 px-3.5 border border-white/10 bg-slate-900 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 px-3.5 border border-white/10 bg-slate-900 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-pf-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* Printable Report Panel */}
      <div className="glass-card rounded-2xl shadow-sm p-8 print-full space-y-8 max-w-4xl mx-auto">

        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-pf-primary text-on-primary shadow-md">
              <span className="text-2xl font-bold font-sans">J</span>
              <span className="text-xs font-bold font-sans self-end mb-1 ml-0.5 text-on-primary/70">M</span>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-on-surface uppercase leading-none">
                JM Solutionss
              </h2>
              <span className="text-[10px] font-bold text-pf-primary tracking-wider uppercase">
                Corporate Finance Division
              </span>
            </div>
          </div>

          <div className="text-right sm:text-right font-medium">
            <h3 className="text-base font-bold text-on-surface">FINANCIAL STATEMENT</h3>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center justify-end gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateRangeLabel()}</span>
            </p>
          </div>
        </div>

        {/* Report metadata block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm py-2">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Statement Subject</p>
            <p className="font-bold text-on-surface mt-1">{profile?.displayName || "User"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Profile</p>
            <p className="font-semibold text-on-surface mt-1">{profile?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Report Generated</p>
            <p className="font-semibold text-on-surface-variant mt-1">
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</p>
            <p className="font-bold text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Audited & Signed</span>
            </p>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div>
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Timeframe Aggregates</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 border border-white/10 rounded-2xl overflow-hidden divide-x divide-y md:divide-y-0 divide-white/10 text-center">
            <div className="p-4 bg-white/5">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Total Inflows</p>
              <h5 className="text-lg font-bold text-green-400 mt-1">${summary.income.toFixed(2)}</h5>
            </div>
            <div className="p-4 bg-white/5">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Total Outflows</p>
              <h5 className="text-lg font-bold text-on-surface mt-1">${summary.expense.toFixed(2)}</h5>
            </div>
            <div className="p-4 bg-white/5">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Net Savings</p>
              <h5 className={`text-lg font-bold mt-1 ${summary.netSavings >= 0 ? 'text-green-400' : 'text-error'}`}>
                ${summary.netSavings.toFixed(2)}
              </h5>
            </div>
            <div className="p-4 bg-white/5">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Savings Efficiency</p>
              <h5 className="text-lg font-bold text-violet-400 mt-1">{summary.savingsRate.toFixed(1)}%</h5>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Spending & Income Breakdown by Category</h4>

          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Flow Type</th>
                  <th className="py-3 px-5 text-right">Sum Total</th>
                  <th className="py-3 px-5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {summary.categories.map((c) => {
                  const share = c.type === 'income'
                    ? (summary.income > 0 ? (c.amount / summary.income) * 100 : 0)
                    : (summary.expense > 0 ? (c.amount / summary.expense) * 100 : 0);

                  return (
                    <tr key={c.name} className="text-on-surface-variant font-medium">
                      <td className="py-3 px-5 font-bold text-on-surface">{c.name}</td>
                      <td className="py-3 px-5 uppercase text-xs font-bold">
                        <span className={c.type === 'income' ? 'text-green-400' : 'text-error'}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-on-surface">${c.amount.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right text-on-surface-variant font-semibold">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {summary.categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-on-surface-variant font-medium">
                      No matching records found for this timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Audit disclosure */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-on-surface-variant font-medium border-t border-white/10 pt-6 gap-2">
          <span>Official Statement Audit Signature Code: JM-F-{(dateRange.start % 100000).toString(16).toUpperCase()}</span>
          <span>© {new Date().getFullYear()} JM Solutionss. All rights reserved.</span>
        </div>

      </div>

    </div>
  );
}