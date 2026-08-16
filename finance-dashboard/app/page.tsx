"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Wallet,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle,
  ChevronDown,
  Lock,
  ArrowUpRight,
  RefreshCw,
  PieChart,
  ArrowRightLeft,
  PiggyBank,
  AlertTriangle,
  Star,
  Check,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { CountUp } from "@/components/ui/count-up";
import { useTheme } from "@/components/shared/ThemeProvider";

// Reusable animated section wrapper for scroll reveals
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  // Live Transaction Feed Mock data for Hero
  const initialBalance = 2450;
  const liveTransactions = [
    { id: 1, label: "Salary Paycheck", amount: 4500, type: "income", category: "Salary" },
    { id: 2, label: "Whole Foods Groceries", amount: -120, type: "expense", category: "Food" },
    { id: 3, label: "Netflix Subscription", amount: -15, type: "expense", category: "Entertainment" },
    { id: 4, label: "Uber Ride", amount: -32, type: "expense", category: "Transport" },
    { id: 5, label: "Savings Goal Deposit", amount: -500, type: "expense", category: "Savings" }
  ];

  const [heroBalance, setHeroBalance] = useState(initialBalance);
  const [visibleTx, setVisibleTx] = useState<typeof liveTransactions>([]);
  const [txIndex, setTxIndex] = useState(0);

  // Live transaction animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTxIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % (liveTransactions.length + 1);
        if (nextIndex === 0) {
          // Reset loop
          setHeroBalance(initialBalance);
          setVisibleTx([]);
        } else {
          const newTx = liveTransactions[nextIndex - 1];
          setVisibleTx((prev) => [...prev, newTx]);
          setHeroBalance((prev) => prev + newTx.amount);
        }
        return nextIndex;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  // WebGL shader background (preserved exactly from original setup but masked for readability)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas!.clientWidth || 1280;
      const h = canvas!.clientHeight || 720;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    float t = u_time * 0.2;

    vec2 p1 = vec2(0.5 + 0.3 * cos(t), 0.5 + 0.2 * sin(t * 1.2));
    vec2 p2 = vec2(0.3 + 0.2 * sin(t * 1.5), 0.7 + 0.1 * cos(t * 0.8));
    vec2 p3 = vec2(0.7 + 0.2 * cos(t * 0.9), 0.3 + 0.3 * sin(t * 1.1));

    float d1 = 1.0 - smoothstep(0.0, 0.6, distance(uv, p1));
    float d2 = 1.0 - smoothstep(0.0, 0.7, distance(uv, p2));
    float d3 = 1.0 - smoothstep(0.0, 0.5, distance(uv, p3));

    vec3 baseColor = vec3(0.002, 0.004, 0.012); // Reverted background base
    vec3 accentColor = vec3(0.12, 0.2, 0.5); // Unified brand glow
    vec3 deepBlue = vec3(0.01, 0.018, 0.04);

    vec3 color = baseColor;
    color = mix(color, deepBlue, d2 * 0.5);
    color = mix(color, accentColor, d1 * 0.15);
    color = mix(color, accentColor, d3 * 0.1);

    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.008;

    gl_FragColor = vec4(color, 1.0);
}`;

    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let rafId: number;
    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, []);

  const faqs = [
    {
      q: "How does PocketFlow secure my financial data?",
      a: "PocketFlow uses bank-grade AES-256 encryption alongside secure Google Firebase isolation. We never save raw credentials, ensuring your records remain confidential."
    },
    {
      q: "Can I manage multiple accounts and currency rates?",
      a: "Yes! The Wallet & Cards tab allows you to configure multiple accounts, track wallet balances, and manage transactional currencies effortlessly."
    },
    {
      q: "How are budgets and warnings calculated?",
      a: "PocketFlow tracks transactions dynamically. If an expense exceeds a category's budget, Nginx and our background logic triggers push notifications and visual indicators."
    }
  ];

  return (
    <div className="relative min-h-screen bg-surface text-on-surface font-sans selection:bg-pf-primary/30 selection:text-white overflow-x-hidden antialiased">

      {/* Background WebGL Shader (reverted colors and masked for premium depth) */}
      <div className="absolute inset-0 z-0 h-[100vh] w-full pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className={cn("w-full h-full object-cover transition-opacity duration-500", theme === 'dark' ? "opacity-60" : "opacity-10")} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/75 to-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--surface)_90%)]" />
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-outline-variant bg-surface/65 backdrop-blur-xl">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={theme === 'dark' ? '/B_LOGO.jpg' : '/W_LOGO.jpg'}
              alt="PocketFlow Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-sm transition-all duration-300 group-hover:scale-105"
            />
            <span className="text-base font-bold tracking-tight text-on-surface leading-none">PocketFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-on-surface-variant">
            <a href="#track" className="hover:text-on-surface transition-colors">Tracking</a>
            <a href="#spending" className="hover:text-on-surface transition-colors">Analytics</a>
            <a href="#budgets" className="hover:text-on-surface transition-colors">Budgets</a>
            <a href="#goals" className="hover:text-on-surface transition-colors">Goals</a>
            <a href="#pricing" className="hover:text-on-surface transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-outline-variant hover:bg-white/5 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <a href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2">
              Log In
            </a>
            <Button asChild size="sm" className="rounded-full shadow-lg bg-pf-primary text-on-primary hover:bg-pf-primary-container">
              <a href="/signup">Get Started</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Sparkle Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-pf-primary/10 border border-pf-primary/20 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-pf-primary animate-pulse" />
          <span className="text-[11px] font-bold text-pf-primary tracking-wider uppercase">Your Personal Money Companion</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-on-surface max-w-4xl leading-[1.05]"
        >
          Your money.<br className="sm:hidden" /> Organized.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mt-6 leading-relaxed font-medium"
        >
          Take control of your money. Understand exactly where it goes, build savings, and reach your goals with absolute clarity.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto z-20"
        >
          <Button asChild size="lg" className="w-full sm:w-auto rounded-full px-8 bg-pf-primary text-on-primary hover:bg-pf-primary-container shadow-lg shadow-pf-primary/15 font-bold">
            <a href="/signup">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
            <a href="/login">Explore Dashboard</a>
          </Button>
        </motion.div>

        {/* Interactive Live Dashboard Composition (Spendee-Inspired) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative w-full max-w-5xl mx-auto rounded-[32px] border border-outline-variant bg-card/60 p-3 sm:p-5 backdrop-blur-md shadow-2xl mt-16 overflow-hidden group hover:border-outline transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-pf-primary/5 via-transparent to-transparent pointer-events-none" />

          {/* Top Mock Window bar */}
          <div className="flex items-center gap-2 mb-4 px-2 no-print shrink-0">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-[10px] text-on-surface-variant font-bold ml-2">pocketflow-live-dashboard.app</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Live Balance Card */}
            <div className="lg:col-span-1 p-6 rounded-2xl border border-outline-variant bg-muted/20 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pf-primary/5 to-transparent pointer-events-none" />
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">PocketFlow Core Wallet</span>
                <h3 className="text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
                  ${heroBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant pt-4 border-t border-outline-variant">
                <span>Transactions Processed</span>
                <span className="text-pf-primary font-bold">{visibleTx.length} Active</span>
              </div>
            </div>

            {/* Live Transaction additions log */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-outline-variant bg-muted/20 flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Real-Time Activity Feed</span>

                <div className="mt-4 space-y-2.5 h-36 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {visibleTx.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-on-surface-variant italic font-semibold py-8 text-center"
                      >
                        Waiting for paychecks and subscriptions...
                      </motion.p>
                    ) : (
                      visibleTx.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-card/75 border border-outline-variant text-xs font-semibold"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              tx.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                            <span className="text-on-surface">{tx.label}</span>
                            <span className="text-[10px] text-on-surface-variant opacity-60">({tx.category})</span>
                          </div>
                          <span className={tx.type === "income" ? "text-emerald-400" : "text-rose-400"}>
                            {tx.type === "income" ? "+" : "-"}${Math.abs(tx.amount)}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 1 — Track your money (Spendee style storytelling) */}
      <section id="track" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Story Text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-pf-primary/10 border border-pf-primary/20 px-3.5 py-1.5 rounded-full">
                <ArrowRightLeft className="w-3.5 h-3.5 text-pf-primary" />
                <span className="text-[10px] font-bold text-pf-primary tracking-widest uppercase">Everything in One Place</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
                Track your money effortlessly.
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-semibold">
                PocketFlow aggregates your wallets, bank logs, and credit cards into a single feed. Instantly record cash flows, map transfers, and assign cards.
              </p>
              <div className="space-y-3 pt-4 font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-on-surface">Multiple Virtual Wallet profiles supported</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-on-surface">Strict PCI card masking compliance built-in</span>
                </div>
              </div>
            </div>

            {/* Interactive Visual composition */}
            <div className="lg:col-span-7 bg-card/35 border border-outline-variant rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">PocketFlow Wallet Composition</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wallet 1 checking */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-outline-variant/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/70">
                    <span>Main Checking Card</span>
                    <span className="italic">Visa</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white">$4,850.00</div>
                  <div className="font-mono text-xs text-white/50 tracking-wider">**** 4912</div>
                </div>

                {/* Wallet 2 savings */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-outline-variant/10 space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/70">
                    <span>Emergency Savings Account</span>
                    <span className="italic">Debit</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white">$18,200.00</div>
                  <div className="font-mono text-xs text-white/50 tracking-wider">**** 8329</div>
                </div>
              </div>

              {/* Slider transaction feed representation */}
              <div className="space-y-2 border-t border-outline-variant pt-6">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Recent Inflows & Outflows</span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-outline-variant text-xs font-semibold">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /></div>
                    <div>
                      <p className="text-on-surface">Client Direct Deposit</p>
                      <p className="text-[9px] text-on-surface-variant opacity-60">August 16</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">+$1,500.00</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 2 — Understand your spending (Spending Breakdown Analytics representation) */}
      <section id="spending" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual Analytics */}
            <div className="lg:col-span-7 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-pf-primary/10 border border-pf-primary/20 px-3.5 py-1.5 rounded-full">
                <PieChart className="w-3.5 h-3.5 text-pf-primary" />
                <span className="text-[10px] font-bold text-pf-primary tracking-widest uppercase">Deep Expense Analytics</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
                Understand where your money goes.
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-semibold">
                Categorization is handled dynamically. Instantly evaluate month-over-month trend directions and verify which areas take up the largest proportion.
              </p>
              <div className="space-y-3 pt-4 font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-on-surface">Proportion charts drawn automatically</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-on-surface">Monthly trend reports dynamically generated</span>
                </div>
              </div>
            </div>

            {/* Interactive Visual charts mock */}
            <div className="lg:col-span-5 lg:order-1 bg-card/35 border border-outline-variant rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Dynamic Category Breakdown</span>

              {/* Category circles list with percentage ring */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-pf-primary" />
                    <span className="text-xs font-bold text-on-surface">Food & Dining</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-on-surface">$540.00</span>
                    <span className="block text-[9px] text-on-surface-variant font-bold mt-0.5">35% of spending</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-on-surface">Rent & Utilities</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-on-surface">$1,200.00</span>
                    <span className="block text-[9px] text-on-surface-variant font-bold mt-0.5">50% of spending</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-on-surface">Entertainment</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-on-surface">$225.00</span>
                    <span className="block text-[9px] text-on-surface-variant font-bold mt-0.5">15% of spending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 3 — Manage budgets (Spendee style alert representation) */}
      <section id="budgets" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Story Text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-pf-primary/10 border border-pf-primary/20 px-3.5 py-1.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-pf-primary" />
                <span className="text-[10px] font-bold text-pf-primary tracking-widest uppercase">Budget Guardrail Limits</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
                Manage budgets before you overspend.
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-semibold">
                Set category budgets and check remaining limits. The interface warns you in amber and rose when limits are nearly breached.
              </p>
            </div>

            {/* Interactive budget card list */}
            <div className="lg:col-span-7 bg-card/35 border border-outline-variant rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Active Limit Utilization</span>

              <div className="space-y-4">
                {/* Food budget card (Safe) */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-outline-variant space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-on-surface">Food & Groceries</span>
                    <span className="text-on-surface-variant">60% Utilized</span>
                  </div>
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-pf-primary rounded-full transition-all duration-1000" style={{ width: "60%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                    <span>Spent: $360.00</span>
                    <span>Limit: $600.00</span>
                  </div>
                </div>

                {/* Entertainment budget card (Critical over) */}
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-on-surface">Entertainment & Trips</span>
                    <span className="text-rose-400 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Critical Limit Alert (90%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: "90%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                    <span>Spent: $180.00</span>
                    <span>Limit: $200.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section 4 — Reach your goals (Goal Timeline progress cards) */}
      <section id="goals" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual text */}
            <div className="lg:col-span-7 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-pf-primary/10 border border-pf-primary/20 px-3.5 py-1.5 rounded-full">
                <PiggyBank className="w-3.5 h-3.5 text-pf-primary" />
                <span className="text-[10px] font-bold text-pf-primary tracking-widest uppercase">Target Milestones</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
                Reach your savings goals faster.
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed font-semibold">
                Define milestones with specific target amounts and deadlines. Allocate monthly contributions, and watch visual timeline progress indicators fill up.
              </p>
            </div>

            {/* Interactive goals widgets */}
            <div className="lg:col-span-5 lg:order-1 bg-card/35 border border-outline-variant rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Active Milestones</span>

              <div className="space-y-4">
                {/* Macbook pro */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-outline-variant space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-on-surface">MacBook Pro M4 Fund</span>
                    <span className="text-pf-primary">62% Saved</span>
                  </div>
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-pf-primary rounded-full transition-all duration-1000" style={{ width: "62%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                    <span>Saved: $1,860</span>
                    <span>Target: $3,000</span>
                  </div>
                </div>

                {/* Dream Vacation */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-outline-variant space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-on-surface">Dream Vacation to Japan</span>
                    <span className="text-pf-primary">46% Saved</span>
                  </div>
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-pf-primary rounded-full transition-all duration-1000" style={{ width: "46%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                    <span>Saved: $920</span>
                    <span>Target: $2,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Features Showcase Section (Spendee style storytelling) */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
              Engineered for wealth building.
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-semibold">
              Everything you need to visualize, plan, and automate your personal finance with high-performance layouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature card 1 */}
            <SpotlightCard className="min-h-[300px] flex flex-col justify-between p-6">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-pf-primary/10 flex items-center justify-center mb-6">
                  <Shield className="w-5 h-5 text-pf-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Google Firebase Security</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                  PocketFlow isolation ensures your data is sandboxed under Google Firebase secure database rules, keeping it fully isolated.
                </p>
              </div>
            </SpotlightCard>

            {/* Feature card 2 */}
            <SpotlightCard className="min-h-[300px] flex flex-col justify-between p-6">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-pf-primary/10 flex items-center justify-center mb-6">
                  <RefreshCw className="w-5 h-5 text-pf-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Automatic Limit Warnings</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                  Budgets notify you as soon as category spending approaches its threshold, keeping you inside limits.
                </p>
              </div>
            </SpotlightCard>

            {/* Feature card 3 */}
            <SpotlightCard className="min-h-[300px] flex flex-col justify-between p-6">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-pf-primary/10 flex items-center justify-center mb-6">
                  <Wallet className="w-5 h-5 text-pf-primary" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Smart Card Wallets</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed font-semibold">
                  Create virtual wallets, allocate starting balances, and verify compliance codes with full PCI-DSS encryption rules.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </ScrollReveal>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto mb-8 font-semibold">
              Start tracking for free. Upgrade whenever you need premium analytics or advanced automated reports.
            </p>

            {/* Annual Toggle */}
            <div className="inline-flex items-center gap-3 bg-muted/30 p-1 rounded-full border border-outline-variant z-20 relative">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer", !isAnnual ? "bg-pf-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface")}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer", isAnnual ? "bg-pf-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface")}
              >
                Annually <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="border border-outline-variant bg-card/60 p-8 rounded-3xl flex flex-col justify-between hover:border-outline transition-all">
              <div>
                <h4 className="text-lg font-bold text-on-surface">Basic</h4>
                <p className="text-xs text-on-surface-variant mt-1">Essential tracker for starting out</p>
                <div className="text-4xl font-extrabold text-on-surface mt-6">$0</div>
                <p className="text-xs text-on-surface-variant mt-1">Free forever</p>
                <ul className="mt-8 space-y-4 text-sm text-on-surface-variant font-semibold">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Up to 3 active wallets</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Standard transactions log</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Basic category budgets</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full rounded-xl mt-8 border-outline-variant hover:bg-muted hover:text-on-surface">
                <a href="/signup">Get Started</a>
              </Button>
            </Card>

            {/* Premium Tier */}
            <Card className="border border-pf-primary bg-card/90 p-8 rounded-3xl flex flex-col justify-between relative shadow-xl shadow-pf-primary/5 hover:scale-[1.01] transition-all">
              <div className="absolute -top-3 right-6 bg-pf-primary text-on-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Most Popular
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Premium</h4>
                <p className="text-xs text-pf-primary mt-1">Advanced control for wealth builders</p>
                <div className="text-4xl font-extrabold text-on-surface mt-6">
                  ${isAnnual ? "8" : "10"}
                  <span className="text-xs font-semibold text-on-surface-variant">/mo</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Billed {isAnnual ? "annually" : "monthly"}</p>
                <ul className="mt-8 space-y-4 text-sm text-on-surface font-semibold">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Unlimited active wallets</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Dynamic category budgets</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Interactive charts & trends</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Automated monthly statements</li>
                </ul>
              </div>
              <Button asChild className="w-full rounded-xl mt-8 shadow-lg bg-pf-primary text-on-primary hover:bg-pf-primary-container">
                <a href="/signup">Start Trial</a>
              </Button>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border border-outline-variant bg-card/60 p-8 rounded-3xl flex flex-col justify-between hover:border-outline transition-all">
              <div>
                <h4 className="text-lg font-bold text-on-surface">Elite</h4>
                <p className="text-xs text-on-surface-variant mt-1">Tailored logic for wealth managers</p>
                <div className="text-4xl font-extrabold text-on-surface mt-6">
                  ${isAnnual ? "20" : "25"}
                  <span className="text-xs font-semibold text-on-surface-variant">/mo</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">Billed {isAnnual ? "annually" : "monthly"}</p>
                <ul className="mt-8 space-y-4 text-sm text-on-surface-variant font-semibold">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> All Premium features</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Collaborative family sharing</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-pf-primary shrink-0" /> Dedicated priority support</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full rounded-xl mt-8 border-outline-variant hover:bg-muted hover:text-on-surface">
                <a href="/signup">Contact Sales</a>
              </Button>
            </Card>
          </div>
        </ScrollReveal>
      </section>

      {/* Social Proof (Spendee-Inspired premium testimonial slider) */}
      {/* <section className="py-24 px-6 max-w-4xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4.5 h-4.5 fill-current" />
              ))}
            </div>
            <h3 className="text-2xl font-extrabold text-on-surface">Visual control that helps users save.</h3>
            <p className="text-xs text-on-surface-variant mt-1 font-bold">Recommended by wealth builders globally.</p>
          </div>

          <div className="p-8 rounded-3xl bg-card/60 border border-outline-variant text-center space-y-4">
            <p className="text-base md:text-lg italic text-on-surface leading-relaxed font-semibold">
              &ldquo;PocketFlow completely changed the way I understand my monthly cash flows. Seeing the transactions feed into my budget limits in real time keeps me on track. The goals progress bars are incredibly satisfying to watch fill up!&rdquo;
            </p>
            <div>
              <p className="text-xs font-extrabold text-on-surface">— Sarah Jenkins</p>
              <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">Verified PocketFlow Premium User</p>
            </div>
          </div>
        </ScrollReveal>
      </section> */}

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto relative z-10 border-t border-outline-variant">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-on-surface-variant text-lg font-semibold">
              Got questions? We have compiled the essential facts here.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isActive = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-outline-variant rounded-2xl bg-card/35 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isActive ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-on-surface hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn("h-5 w-5 text-on-surface-variant transition-transform duration-300", isActive && "rotate-180")} />
                  </button>
                  {isActive && (
                    <div className="px-6 pb-6 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant pt-4 font-semibold">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      {/* Final CTA Banner */}
      <section className="py-24 px-6 max-w-5xl mx-auto relative z-10 text-center">
        <ScrollReveal>
          <div className="p-12 rounded-3xl bg-gradient-to-tr from-pf-primary/5 via-card/35 to-transparent border border-outline-variant space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--surface)_100%)] pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-none z-10 relative">
              Your money deserves a clearer picture.
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto leading-relaxed font-semibold z-10 relative">
              Get started with PocketFlow today and visualize your wealth in real time.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 z-10 relative">
              <Button asChild size="lg" className="rounded-full px-8 bg-pf-primary text-on-primary hover:bg-pf-primary-container font-bold shadow-lg shadow-pf-primary/10">
                <a href="/signup">Get Started Free</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-muted border border-outline-variant hover:bg-muted/80 text-on-surface">
                <a href="/login">Access Dashboard</a>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-outline-variant py-12 px-6 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={theme === 'dark' ? '/B_LOGO.jpg' : '/W_LOGO.jpg'}
              alt="PocketFlow Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-sm"
            />
            <span className="text-sm font-bold tracking-tight text-on-surface">PocketFlow</span>
          </div>

          <div className="text-center md:text-right font-semibold">
            <p className="text-xs text-on-surface-variant">&copy; 2026 PocketFlow. All rights reserved.</p>
            <p className="text-[10px] text-on-surface-variant opacity-60 mt-1">
              Developed by <a href="https://github.com/TaahaShahid" className="hover:text-pf-primary transition-colors font-bold">Taaha Shahid</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}