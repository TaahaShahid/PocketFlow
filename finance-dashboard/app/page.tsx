"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { CountUp } from "@/components/ui/count-up";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

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

    vec3 baseColor = vec3(0.004, 0.008, 0.03); // Deep space backdrop
    vec3 accentColor = vec3(0.18, 0.28, 0.75); // Polished deep blue
    vec3 deepBlue = vec3(0.02, 0.035, 0.07);

    vec3 color = baseColor;
    color = mix(color, deepBlue, d2 * 0.5);
    color = mix(color, accentColor, d1 * 0.18);
    color = mix(color, accentColor, d3 * 0.12);

    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.012;

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
    <div className="relative min-h-screen bg-[#050814] text-slate-100 font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden antialiased">
      
      {/* Background WebGL Shader (preserves styling, capped in container with premium masks) */}
      <div className="absolute inset-0 z-0 h-[90vh] w-full pointer-events-none overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050814]/70 to-[#050814]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#050814_85%)]" />
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050814]/65 backdrop-blur-2xl">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105">
              <span>P</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">PocketFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Performance</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2">
              Log In
            </a>
            <Button asChild size="sm" className="rounded-full shadow-lg shadow-primary/25">
              <a href="/signup">Get Started</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Version Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide uppercase">Introducing PocketFlow 2.0</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400"
        >
          Take Control of Your <br />
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Financial Horizon</span>
        </motion.h1>

        {/* Hero Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          An editorial SaaS dashboard designed for personal wealth management. 
          Manage wallets, track savings goals, and automate budgets with absolute security.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto"
        >
          <Button asChild size="lg" className="w-full sm:w-auto rounded-full font-bold px-8 shadow-xl shadow-primary/25">
            <a href="/signup">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 bg-white/5 border-white/10 hover:bg-white/10">
            <a href="/login">View Dashboard</a>
          </Button>
        </motion.div>

        {/* Hero Dashboard Preview with 3D-effect shadow container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative w-full max-w-5xl mx-auto rounded-[32px] border border-white/10 bg-white/5 p-2 backdrop-blur-md shadow-2xl overflow-hidden group hover:border-white/20 transition-all duration-500"
        >
          <div className="rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="PocketFlow Dashboard Preview"
              className="w-full h-auto object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.01]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrXzqx9h5qFIJ5Rc27YDRu31GCwqB4ePOSsAz6fBxjV3fbylYz-AzQ3_HlwwvcyFnOlQkdHNP_jepNLiP8Y4SeYFAkEUz29K2kK_-coxyHaxn9hbJ2N0S8_3jiRqJi6TLqX-vi21FkujEwvA6fE0R70Ixc0BOCFitE-4GhoZYGdlYqEi_V3vfi1F7IVTcTsey_njW_O1-CcgEqi0VDXj-yCAZal5KRiS8W9j8FbW0A4yyekSbWopdnwA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-transparent to-transparent opacity-30" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-white/5 bg-card/20 p-6 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Balance Tracked</span>
            <h3 className="text-3xl font-extrabold text-white mt-4">
              <CountUp end={1248500} prefix="$" decimals={2} />
            </h3>
            <span className="text-[11px] text-green-400 mt-2 font-medium">+12.5% increase this month</span>
          </Card>

          <Card className="border border-white/5 bg-card/20 p-6 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Wallets Connected</span>
            <h3 className="text-3xl font-extrabold text-white mt-4">
              <CountUp end={482} />
            </h3>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Average $2.4k per wallet</span>
          </Card>

          <Card className="border border-white/5 bg-card/20 p-6 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Accuracy</span>
            <h3 className="text-3xl font-extrabold text-white mt-4">
              <CountUp end={98.4} suffix="%" decimals={1} />
            </h3>
            <span className="text-[11px] text-indigo-400 mt-2 font-medium">Automatic system calculation</span>
          </Card>

          <Card className="border border-white/5 bg-card/20 p-6 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud Availability</span>
            <h3 className="text-3xl font-extrabold text-white mt-4">
              <CountUp end={99.99} suffix="%" decimals={2} />
            </h3>
            <span className="text-[11px] text-cyan-400 mt-2 font-medium">Managed dynamically via ASG</span>
          </Card>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Engineered for Modern Wealth
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to visualize, plan, and automate your personal finance with high-performance layouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Large Spotlight Card (Analytics) */}
          <SpotlightCard className="md:col-span-2 min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI-Driven Financial Analytics</h3>
              <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                Gain instant clarity over your transactions. The Analytics page dynamically aggregates wallet entries,
                visualizes expense percentages, and tracks trends over time.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Charts Powered by Recharts</span>
              <a href="/login" className="text-primary font-semibold flex items-center gap-1 hover:underline">
                Explore Analytics <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </SpotlightCard>

          {/* Secure Vault Card */}
          <SpotlightCard className="min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Firebase Secure Vault</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your data security is our absolute priority. PocketFlow relies on bank-grade Firestore security layers
                and encrypted session management to block unauthorized access.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-4 h-4 text-indigo-400" /> AES-256 Cloud Isolation
            </div>
          </SpotlightCard>

          {/* Budgeting Card */}
          <SpotlightCard className="min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Dynamic Budget Tracker</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Plan categories and configure alerts. PocketFlow parses transactions dynamically, notifying you as soon
                as a category spending approaches its threshold.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-cyan-400" /> Automatic Limits
            </div>
          </SpotlightCard>

          {/* Wallet and Goals Card */}
          <SpotlightCard className="md:col-span-2 min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Wallets & Savings Goals</h3>
              <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                Create virtual wallets, assign goal objectives, and watch your progress update automatically. 
                Visual indicators keep you motivated without overwhelming the view.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Savings progress tracking</span>
              <a href="/login" className="text-emerald-400 font-semibold flex items-center gap-1 hover:underline">
                Setup Goal <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Start tracking for free. Upgrade whenever you need premium analytics or advanced automated reports.
          </p>

          {/* Annual Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setIsAnnual(false)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", !isAnnual ? "bg-primary text-white" : "text-slate-400 hover:text-white")}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5", isAnnual ? "bg-primary text-white" : "text-slate-400 hover:text-white")}
            >
              Annually <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="border border-white/5 bg-card/10 p-8 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <div>
              <h4 className="text-lg font-bold text-slate-300">Basic</h4>
              <p className="text-xs text-slate-500 mt-1">Essential tracker for starting out</p>
              <div className="text-4xl font-extrabold text-white mt-6">$0</div>
              <p className="text-xs text-slate-400 mt-1">Free forever</p>
              <ul className="mt-8 space-y-4 text-sm text-slate-400">
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Up to 3 active wallets</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Standard transactions log</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Basic category budgets</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full rounded-xl mt-8 border-white/10 hover:bg-white/5">
              <a href="/signup">Get Started</a>
            </Button>
          </Card>

          {/* Premium Tier */}
          <Card className="border border-primary bg-card/25 p-8 rounded-2xl flex flex-col justify-between relative shadow-xl shadow-primary/5 hover:scale-[1.01] transition-all">
            <div className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Premium</h4>
              <p className="text-xs text-indigo-400 mt-1">Advanced control for wealth builders</p>
              <div className="text-4xl font-extrabold text-white mt-6">
                ${isAnnual ? "8" : "10"}
                <span className="text-xs font-semibold text-slate-400">/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Billed {isAnnual ? "annually" : "monthly"}</p>
              <ul className="mt-8 space-y-4 text-sm text-slate-300">
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Unlimited active wallets</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Dynamic category budgets</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Interactive charts & trends</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Automated monthly PDF reports</li>
              </ul>
            </div>
            <Button asChild className="w-full rounded-xl mt-8 shadow-lg shadow-primary/20">
              <a href="/signup">Start Trial</a>
            </Button>
          </Card>

          {/* Enterprise Tier */}
          <Card className="border border-white/5 bg-card/10 p-8 rounded-2xl flex flex-col justify-between hover:border-white/15 transition-all">
            <div>
              <h4 className="text-lg font-bold text-slate-300">Elite</h4>
              <p className="text-xs text-slate-500 mt-1">Tailored logic for family offices</p>
              <div className="text-4xl font-extrabold text-white mt-6">
                ${isAnnual ? "20" : "25"}
                <span className="text-xs font-semibold text-slate-400">/mo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Billed {isAnnual ? "annually" : "monthly"}</p>
              <ul className="mt-8 space-y-4 text-sm text-slate-400">
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> All Premium features</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Collaborative family sharing</li>
                <li className="flex items-center gap-2.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /> Dedicated priority support</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full rounded-xl mt-8 border-white/10 hover:bg-white/5">
              <a href="/signup">Contact Sales</a>
            </Button>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-lg">
            Got questions? We have compiled the essential facts here.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isActive = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-white/5 rounded-2xl bg-card/10 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isActive ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-white hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300", isActive && "rotate-180")} />
                </button>
                {isActive && (
                  <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 bg-[#050814]/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              <span>P</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">PocketFlow</span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-slate-500">&copy; 2026 PocketFlow. All rights reserved.</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Developed by <a href="https://github.com/TaahaShahid" className="hover:text-primary transition-colors font-bold">Taaha Shahid</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}