"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebGL animated background shader
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

    vec3 baseColor = vec3(0.008, 0.024, 0.09);
    vec3 accentColor = vec3(0.231, 0.51, 0.965);
    vec3 deepBlue = vec3(0.059, 0.09, 0.165);

    vec3 color = baseColor;
    color = mix(color, deepBlue, d2 * 0.5);
    color = mix(color, accentColor, d1 * 0.2);
    color = mix(color, accentColor, d3 * 0.15);

    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.015;

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
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    function handleMouseMove(event: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas!.width;
        mouse.y = ny * canvas!.height;
      }
    }
    window.addEventListener("mousemove", handleMouseMove);

    let rafId: number;
    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver?.disconnect();
    };
  }, []);

  // Smooth scroll + fade-up scroll observer
  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handleClick = function (this: HTMLAnchorElement, e: Event) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        document.querySelector(targetId)?.scrollIntoView({ behavior: "smooth" });
      }
    };
    anchors.forEach((anchor) =>
      anchor.addEventListener("click", handleClick as EventListener)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".animate-fade-up-scroll").forEach((el) => observer.observe(el));

    return () => {
      anchors.forEach((anchor) =>
        anchor.removeEventListener("click", handleClick as EventListener)
      );
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-surface text-on-surface selection:bg-pf-primary selection:text-on-pf-primary-container font-body-md overflow-x-hidden">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <nav className="flex items-center justify-between px-gutter py-xs max-w-[1280px] mx-auto">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 bg-pf-primary-container rounded-[2rem] flex items-center justify-center">
              {/* <span
                className="material-symbols-outlined text-on-pf-primary-container text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span> */}
            </div>
            <span className="font-display-md text-display-md font-bold tracking-tight text-on-surface">
              PocketFlow
            </span>
          </div>
          <div className="hidden md:flex items-center gap-lg">
            <a
              className="font-body-md text-body-md text-pf-primary font-bold border-b-2 border-pf-primary pb-1 transition-colors duration-300"
              href="#"
            >
              Features
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-pf-primary transition-colors duration-300"
              href="#"
            >
              Solutions
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-pf-primary transition-colors duration-300"
              href="#"
            >
              Pricing
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant font-medium hover:text-pf-primary transition-colors duration-300"
              href="#"
            >
              About
            </a>
          </div>
          <div className="flex items-center gap-sm">
            <a className="hidden sm:block font-body-md text-body-md text-on-surface-variant font-medium hover:text-pf-primary transition-colors duration-300 px-sm py-xs" href="/login">
              Log In
            </a>
            <a className="bg-pf-primary-container text-on-pf-primary-container font-body-md text-body-md font-semibold px-md py-xs rounded-full hover:shadow-[0_0_20px_rgba(77,142,255,0.4)] transition-all" href="/signup">
              Get Started
            </a>
          </div>
        </nav>
      </header>

      <main className="relative">
        {/* Hero Section with Animation */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-gutter pt-xl">
          <div className="absolute inset-0 w-full h-full opacity-40" style={{ display: "block" }}>
            <canvas
              ref={canvasRef}
              id="shader-canvas-ANIMATION_2"
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-xs bg-white/5 border border-white/10 px-sm py-1 rounded-full mb-md backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-pf-primary animate-pulse"></span>
              <span className="font-label-md text-label-md text-on-surface-variant">V2.0 Now Live</span>
            </div>
            <h1 className="font-display-lg text-display-lg md:text-[64px] mb-sm leading-tight">
              Take Control of Your <br />
              <span className="blue-gradient-text">Financial Future</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
              AI-powered insights to master your wealth, automate savings, and predict your financial horizon with
              precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-sm mb-xl">
              <a className="w-full sm:w-auto bg-pf-primary text-on-pf-primary px-xl py-md rounded-full font-title-lg text-title-lg hover:scale-105 transition-transform" href="/signup">
                Start Free Trial
              </a>
              <a className="w-full sm:w-auto glass-card px-xl py-md rounded-full font-title-lg text-title-lg flex items-center justify-center gap-xs" href="/demo">
                <span className="material-symbols-outlined"></span> View Demo
              </a>
            </div>

            {/* Featured Visual */}
            <div className="tilt-container max-w-5xl mx-auto mt-lg">
              <div className="tilt-inner rounded-[3rem] overflow-hidden glass-card p-xs">
                <div className="relative rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="PocketFlow Dashboard Preview"
                    className="w-full h-auto object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrXzqx9h5qFIJ5Rc27YDRu31GCwqB4ePOSsAz6fBxjV3fbylYz-AzQ3_HlwwvcyFnOlQkdHNP_jepNLiP8Y4SeYFAkEUz29K2kK_-coxyHaxn9hbJ2N0S8_3jiRqJi6TLqX-vi21FkujEwvA6fE0R70Ixc0BOCFitE-4GhoZYGdlYqEi_V3vfi1F7IVTcTsey_njW_O1-CcgEqi0VDXj-yCAZal5KRiS8W9j8FbW0A4yyekSbWopdnwA"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-xl px-gutter max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <div className="glass-card p-md rounded-[3rem] animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Total Balance</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">$1,248,500.00</div>
              <div className="font-label-sm text-label-sm text-tertiary-container mt-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]"></span> +12.5% this month
              </div>
            </div>
            <div className="glass-card p-md rounded-[3rem] animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Transactions</span>

              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">482</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Average $2.4k per txn</div>
            </div>
            <div className="glass-card p-md rounded-[3rem] animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-between mb-sm">
                <span className="font-label-md text-label-md text-on-surface-variant">Savings Rate</span>

              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">24.8%</div>
              <div className="font-label-sm text-label-sm text-tertiary-container mt-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]"></span> Target: 30%
              </div>
            </div>
            <div
              className="glass-card p-md rounded-[3rem] border-pf-primary/20 bg-pf-primary-container/5 animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-center justify-between mb-sm">
                <span className="font-label-md text-label-md text-pf-primary">AI Insights</span>

              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface">12 New</div>
              <div className="font-label-sm text-label-sm text-pf-primary mt-xs">Optimize portfolio risk</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-xl px-gutter max-w-[1280px] mx-auto bg-surface-container-lowest/50 rounded-[3rem] my-xl border border-white/5">
          <div className="text-center mb-xl">
            <h2 className="font-display-md text-display-md mb-xs">Designed for Modern Finance</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Everything you need to scale your wealth in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            <div className="glass-card p-lg rounded-[3rem] group">
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Smart Wallet</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Multi-currency support with real-time exchange rates and instant settlements.
              </p>
            </div>
            <div className="glass-card p-lg rounded-[3rem] group">
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Advanced Analytics</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Deep dive into spending habits with interactive bento-style visualizations.
              </p>
            </div>
            <div className="glass-card p-lg rounded-[3rem] group">
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Enterprise Security</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Bank-grade 256-bit encryption with multi-factor biometric authentication.
              </p>
            </div>
            <div className="glass-card p-lg rounded-[3rem] group">
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Instant Automation</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Set complex triggers to move funds, pay bills, or invest automatically.
              </p>
            </div>
            <div className="glass-card p-lg rounded-[3rem] group">
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Predictive Forecasting</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Project your future net worth based on historical data and market trends.
              </p>
            </div>
            <div className="glass-card p-lg rounded-[3rem] group relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-tertiary text-on-tertiary text-[10px] px-xs py-0.5 rounded-full font-bold uppercase tracking-wider">
                Coming Soon
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-[2rem] flex items-center justify-center mb-md group-hover:bg-pf-primary/20 transition-colors">

              </div>
              <h3 className="font-title-lg text-title-lg mb-xs">Cognitive Advisory</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                An AI advisor that understands your goals and suggests custom strategies.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-xl text-center px-gutter">
          <h4 className="font-label-md text-label-md text-on-surface-variant mb-md uppercase tracking-[0.2em]">
            The Power Behind the Flow
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-sm">
            <span className="glass-card px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-white"></span> Next.js
            </span>
            <span className="glass-card px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-pf-primary"></span> FastAPI
            </span>
            <span className="glass-card px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span> PostgreSQL
            </span>
            <span className="glass-card px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-pf-secondary"></span> AWS
            </span>
          </div>
        </section>

        {/* AI Section */}
        <section className="py-xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-pf-primary/5 via-surface to-surface pointer-events-none"></div>
          <div className="max-w-[1280px] mx-auto px-gutter relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
              <div className="animate-fade-up">
                <h2 className="font-display-lg text-display-lg mb-md leading-tight">
                  Financial Intelligence <br />
                  <span className="blue-gradient-text">Conversational Interface</span>
                </h2>
                <div className="space-y-md">
                  <div className="glass-card p-md rounded-[3rem]">
                    <div className="flex gap-sm">
                      <div className="w-10 h-10 rounded-full bg-pf-primary/20 flex items-center justify-center shrink-0">

                      </div>
                      <div>
                        <p className="font-body-md text-body-md italic text-on-surface-variant">
                          &quot;Can I afford a $2k trip next month while maintaining my savings target?&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-md rounded-[3rem] border-pf-primary/40 bg-pf-primary-container/10">
                    <div className="flex gap-sm">
                      <div className="w-10 h-10 rounded-full bg-pf-primary flex items-center justify-center shrink-0">

                      </div>
                      <div>
                        <p className="font-body-md text-body-md text-on-surface">
                          &quot;Based on your current trajectory, yes. You have a $450 surplus projected. If you
                          reduce dining out by 15%, you&apos;ll actually exceed your goal.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative glass-card aspect-video rounded-[3rem] overflow-hidden flex items-center justify-center border-pf-primary/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pf-primary/10 via-transparent to-transparent"></div>
                <div className="text-center p-xl">
                  {/* <div className="material-symbols-outlined text-[64px] text-pf-primary mb-md animate-pulse">
                    monitoring
                  </div> */}
                  <h4 className="font-title-lg text-title-lg mb-xs">Probabilistic Forecasting</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Monte Carlo simulations run in real-time on every transaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-xl px-gutter text-center max-w-4xl mx-auto">
          <div className="glass-card p-xl rounded-[3rem] border-pf-primary/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pf-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pf-primary/10 rounded-full blur-3xl"></div>
            <h2 className="font-display-lg text-display-lg mb-sm">Ready to Flow?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl">
              Join 50,000+ users taking control of their financial destiny today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
              <button className="w-full sm:w-auto bg-pf-primary text-on-pf-primary px-xl py-md rounded-full font-title-lg text-title-lg hover:scale-105 transition-transform">
                Get Started Now
              </button>
              <button className="w-full sm:w-auto glass-card px-xl py-md rounded-full font-title-lg text-title-lg hover:bg-white/5 transition-colors">
                Talk to Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full py-xl mt-xl border-t border-outline-variant">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md px-gutter max-w-[1280px] mx-auto">
          <div className="col-span-2">
            <div className="flex items-center gap-sm mb-md">
              <div className="w-8 h-8 bg-pf-primary-container rounded-[2rem] flex items-center justify-center">

              </div>
              <span className="font-headline-lg text-headline-lg font-black text-on-surface">PocketFlow</span>
            </div>
            <p className="text-base text-gray-400 max-w-2xl leading-relaxed mb-6">
              The next-generation wealth management platform for the modern individual.
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant">© 2024 PocketFlow AI. All rights reserved.</p>
          </div>
          <div>
            <h5 className="font-label-md text-label-md text-on-surface font-semibold mb-sm">Product</h5>
            <ul className="space-y-xs">
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Features
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Solutions
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-md text-label-md text-on-surface font-semibold mb-sm">Company</h5>
            <ul className="space-y-xs">
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  About
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Contact Support
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Status
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-md text-label-md text-on-surface font-semibold mb-sm">Legal</h5>
            <ul className="space-y-xs">
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-md text-label-md text-on-surface font-semibold mb-sm">Developers</h5>
            <ul className="space-y-xs">
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  API Docs
                </a>
              </li>
              <li>
                <a className="font-label-md text-label-md text-on-surface-variant hover:text-pf-primary transition-colors" href="#">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}