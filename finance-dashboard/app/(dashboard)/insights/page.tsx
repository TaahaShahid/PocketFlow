'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  BrainCircuit,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useFinanceStore } from '../../../hooks/useFinanceStore';

const cardBase = 'rounded-3xl border border-border bg-card/45 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-pf-primary/20';

interface InsightItem {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'positive';
  recommendation: string;
}

interface AINarrativeData {
  summary: string;
  insights: InsightItem[];
}

export default function AIInsightsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const addToast = useFinanceStore((state) => state.addToast);
  const cachedData = useFinanceStore((state) => state.aiInsightsCache[period]);
  const setAiInsightsCache = useFinanceStore((state) => state.setAiInsightsCache);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AINarrativeData | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;

    if (cachedData) {
      Promise.resolve().then(() => {
        if (active) {
          setData(cachedData);
          setLoading(false);
        }
      });
      return;
    }

    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });

    async function loadData() {
      try {
        const response = await api.get(`/insights/ai-narrative?period=${period}`);
        if (active) {
          setData(response.data);
          setAiInsightsCache(period, response.data);
        }
      } catch (error) {
        console.error('Error fetching AI Insights:', error);
        addToast('Failed to generate AI Spending Narrative', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [period, reloadCounter, addToast, cachedData, setAiInsightsCache]);

  const getSeverityStyles = (severity: 'info' | 'warning' | 'positive') => {
    switch (severity) {
      case 'warning':
        return {
          icon: AlertTriangle,
          border: 'border-rose-500/25 hover:border-rose-500/40',
          bg: 'bg-rose-500/5',
          text: 'text-rose-500',
          badgeBg: 'bg-rose-500/10'
        };
      case 'positive':
        return {
          icon: CheckCircle2,
          border: 'border-emerald-500/25 hover:border-emerald-500/40',
          bg: 'bg-emerald-500/5',
          text: 'text-emerald-500',
          badgeBg: 'bg-emerald-500/10'
        };
      default:
        return {
          icon: Info,
          border: 'border-pf-primary/25 hover:border-pf-primary/40',
          bg: 'bg-pf-primary/5',
          text: 'text-pf-primary',
          badgeBg: 'bg-pf-primary/10'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pf-primary/10 rounded-xl text-pf-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">AI Spending Insights</h2>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period Selector */}
          <div className="flex bg-muted/10 border border-border p-1 rounded-xl">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${period === p
                    ? 'bg-pf-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            onClick={() => {
              setAiInsightsCache(period, null);
              setReloadCounter((prev) => prev + 1);
            }}
            variant="outline"
            size="icon"
            className="rounded-xl border-border h-9 w-9 flex items-center justify-center cursor-pointer"
            title="Regenerate Insights"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="min-h-[50vh] flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="h-10 w-10 animate-spin text-pf-primary" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Synthesizing financial trends...</p>
              <p className="text-xs text-muted-foreground mt-0.5">Querying AI model via Gemini API</p>
            </div>
          </motion.div>
        ) : data ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* AI Narrative Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-pf-primary/20 bg-gradient-to-br from-pf-primary/5 via-purple-500/5 to-card/5 backdrop-blur-xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Sparkles className="w-48 h-48 text-pf-primary" />
              </div>

              <div className="flex items-center gap-2 mb-3 text-pf-primary">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Gemini Spend Narrative</span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3">AI Executive Summary</h3>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                {data.summary || "No summary narrative generated for this period."}
              </p>
            </motion.div>

            {/* Structured Insights Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4.5 w-4.5 text-pf-primary" />
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Targeted Recommendations
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.insights && data.insights.map((insight, idx) => {
                  const styles = getSeverityStyles(insight.severity);
                  const SeverityIcon = styles.icon;

                  return (
                    <motion.div
                      key={insight.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className={`rounded-3xl border ${styles.border} ${styles.bg} p-6 flex flex-col justify-between transition-all duration-300`}
                    >
                      <div>
                        {/* Severity Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles.badgeBg} ${styles.text}`}>
                            {insight.severity}
                          </span>
                          <SeverityIcon className={`h-5 w-5 ${styles.text}`} />
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base font-bold text-foreground mb-1.5">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {insight.description}
                        </p>
                      </div>

                      {/* Recommendation Accent Box */}
                      <div className="mt-auto pt-4 border-t border-border/10">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">
                          Recommendation
                        </p>
                        <p className="text-xs font-semibold text-foreground leading-relaxed flex items-start gap-2">
                          <span className="text-pf-primary mt-0.5">•</span>
                          {insight.recommendation}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {(!data.insights || data.insights.length === 0) && (
                <Card className={cardBase}>
                  <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <Info className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">No targeted insights available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Check back when you have transaction activity or category budgets configured.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="min-h-[40vh] flex flex-col items-center justify-center text-center gap-3"
          >
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <h3 className="text-base font-bold text-foreground">No AI Narrative Available</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              We couldn&apos;t compile a narrative for this period. Try recording some transactions or budgets.
            </p>
            <Button
              onClick={() => {
                setAiInsightsCache(period, null);
                setReloadCounter((prev) => prev + 1);
              }}
              variant="outline"
              className="rounded-xl mt-2 gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
