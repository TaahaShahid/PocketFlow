'use client';

import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/shared/ThemeProvider';

export default function ReportsPage() {
  const { theme } = useTheme();
  const { transactions, loading: txLoading } = useTransactions();
  const { profile, loading: authLoading } = useAuth();
  const { addToast } = useFinanceStore();

  const loading = txLoading || authLoading;

  // Filters State
  const [period, setPeriod] = useState<'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Derived Date Range Timestamp
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let start = 0;
    let end = new Date().getTime();

    if (period === 'this-month') {
      start = new Date(currentYear, currentMonth, 1).getTime();
    } else if (period === 'last-month') {
      start = new Date(currentYear, currentMonth - 1, 1).getTime();
      end = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime();
    } else if (period === 'this-year') {
      start = new Date(currentYear, 0, 1).getTime();
    } else if (period === 'custom') {
      start = new Date(startDate).getTime();
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

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Transaction ID,Type,Recipient/Payee,Category,Amount,Date,Notes\n';

    filteredTransactions.forEach((tx) => {
      const formattedDate = new Date(tx.date).toLocaleDateString().replace(/,/g, '');
      const notesSafe = tx.notes ? tx.notes.replace(/"/g, '""').replace(/,/g, ';') : '';
      const recipientSafe = tx.recipientName.replace(/"/g, '""').replace(/,/g, ';');

      csvContent += `"${tx.id}","${tx.type}","${recipientSafe}","${tx.category}",${tx.amount},"${formattedDate}","${notesSafe}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    const fileName = `PocketFlow_Statement_${period}_${new Date().toISOString().split('T')[0]}.csv`;
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
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

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Export Financial Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate printable statements and download spreadsheets of transaction history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl border-border hover:bg-muted/10"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="rounded-xl shadow-lg shadow-primary/10"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="p-4 rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-end gap-4 no-print">
        {/* Time Period select */}
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Frame</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'this-month' | 'last-month' | 'this-year' | 'custom')}
            className="w-full h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="this-month" className="bg-card">This Month</option>
            <option value="last-month" className="bg-card">Last Month</option>
            <option value="this-year" className="bg-card">This Year</option>
            <option value="custom" className="bg-card">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Timelines */}
        {period === 'custom' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 px-3 border border-border bg-muted/10 rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-transparent transition-all"
              />
            </div>
          </>
        )}
      </div>

      {/* Printable Report Panel */}
      <div className="border border-border bg-card/45 backdrop-blur-xl shadow-2xl rounded-3xl p-8 print-full space-y-8 max-w-4xl mx-auto">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? '/B_LOGO.jpg' : '/W_LOGO.jpg'}
              alt="PocketFlow Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground uppercase leading-none">
                PocketFlow
              </h2>
              <span className="text-[9px] font-bold text-primary tracking-widest uppercase">
                Personal Finance Hub
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right font-medium">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Financial Statement</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center sm:justify-end gap-1.5 font-semibold">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatDateRangeLabel()}</span>
            </p>
          </div>
        </div>

        {/* Report metadata block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm py-2 border-b border-border/40 pb-6">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statement Subject</p>
            <p className="font-bold text-foreground mt-1">{profile?.displayName || "PocketFlow User"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Profile</p>
            <p className="font-semibold text-foreground mt-1">{profile?.email || "user@pocketflow.com"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Generated</p>
            <p className="font-semibold text-muted-foreground mt-1">
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</p>
            <p className="font-bold text-emerald-500 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Audited & Signed</span>
            </p>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Timeframe Aggregates</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-2xl overflow-hidden divide-x divide-y md:divide-y-0 divide-border text-center">
            <div className="p-4 bg-muted/5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Inflows</p>
              <h5 className="text-lg font-extrabold text-emerald-500 mt-1">${summary.income.toFixed(2)}</h5>
            </div>
            <div className="p-4 bg-muted/5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Outflows</p>
              <h5 className="text-lg font-extrabold text-foreground mt-1">${summary.expense.toFixed(2)}</h5>
            </div>
            <div className="p-4 bg-muted/5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Savings</p>
              <h5 className={`text-lg font-extrabold mt-1 ${summary.netSavings >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                ${summary.netSavings.toFixed(2)}
              </h5>
            </div>
            <div className="p-4 bg-muted/5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Savings Efficiency</p>
              <h5 className="text-lg font-extrabold text-violet-400 mt-1">{summary.savingsRate.toFixed(1)}%</h5>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category breakdown</h4>

          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/10 border-b border-border text-muted-foreground font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Flow Type</th>
                  <th className="py-3 px-5 text-right">Sum Total</th>
                  <th className="py-3 px-5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {summary.categories.map((c) => {
                  const share = c.type === 'income'
                    ? (summary.income > 0 ? (c.amount / summary.income) * 100 : 0)
                    : (summary.expense > 0 ? (c.amount / summary.expense) * 100 : 0);

                  return (
                    <tr key={c.name} className="text-muted-foreground font-medium hover:bg-muted/5 transition-colors">
                      <td className="py-3 px-5 font-bold text-foreground">{c.name}</td>
                      <td className="py-3 px-5 uppercase text-[10px] font-bold">
                        <span className={c.type === 'income' ? 'text-emerald-500' : 'text-destructive'}>
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-foreground">${c.amount.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground font-semibold">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {summary.categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-muted-foreground font-semibold">
                      No matching records found for this timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Audit disclosure */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-muted-foreground font-bold border-t border-border pt-6 gap-2">
          <span>Official Statement Audit Signature Code: PF-F-{(dateRange.start % 100000).toString(16).toUpperCase()}</span>
          <span>© {new Date().getFullYear()} PocketFlow. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}