import { Link } from "react-router-dom";
import { Shield, BarChart3, Map, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/motion/Reveal";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [parallaxScale, setParallaxScale] = useState(1);

  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      // Progress as the hero enters and scrolls
      const progress = Math.min(1, Math.max(0, (viewportH - rect.top) / (viewportH + rect.height)));
      // Gentle parallax values
      const y = -progress * 24; // px upward shift
      const scale = 1 + progress * 0.02; // up to 2% scale
      setParallaxY(y);
      setParallaxScale(scale);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Navbar (simple) */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-semibold tracking-tight text-foreground">Safety Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid-dark text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32" ref={heroRef}>
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 mb-5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              AI-powered Safety Analytics
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Drive safer operations with actionable insights
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed">
              Explore incidents, hazards, audits and inspections in one place. Ask natural-language questions, view live maps, and make faster decisions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow-sm transition hover:shadow-md"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-white hover:bg-white/10">
                Learn More
              </a>
            </div>
          </div>

          {/* Device frame with dashboard image */}
          <div className="mx-auto mt-12 md:mt-16 max-w-6xl" style={{ transform: `translateY(${Math.round(parallaxY)}px) scale(${parallaxScale})`, transition: "transform 0.12s ease-out" }}>
            <div className="rounded-[28px] border border-white/10 bg-black/50 shadow-[0_20px_80px_rgba(0,0,0,0.65)] p-2">
              <div className="rounded-2xl overflow-hidden bg-black">
                <img
                  src="/dashboard.png"
                  alt="Safety Copilot dashboard preview"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
  id="features"
  className="mx-auto max-w-7xl px-6 py-16 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 rounded-3xl"
>
  <Reveal animation="fade-in">
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-center">
      Features
    </h2>
    <p className="mt-2 text-center text-muted-foreground">
      Everything you need to understand and improve safety performance.
    </p>
  </Reveal>

  <div
    className="mt-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-stretch"
  >
    <Reveal>
      <FeatureCard
        title="Unified Safety Data"
        desc="Incidents, hazards, audits and inspections in one place."
        icon={<Shield className="h-5 w-5" />}
        iconClass="bg-emerald-100 text-emerald-600"
        ringClass="hover:ring-emerald-300/60"
        className="h-full"
      />
    </Reveal>
    <Reveal delayMs={70}>
      <FeatureCard
        title="Actionable Analytics"
        desc="Spot trends, prioritize risk, track improvements."
        icon={<BarChart3 className="h-5 w-5" />}
        iconClass="bg-sky-100 text-sky-700"
        ringClass="hover:ring-sky-300/60"
        className="h-full"
      />
    </Reveal>
    <Reveal delayMs={140}>
      <FeatureCard
        title="Interactive Maps"
        desc="Visualize locations and hotspots instantly."
        icon={<Map className="h-5 w-5" />}
        iconClass="bg-violet-100 text-violet-700"
        ringClass="hover:ring-violet-300/60"
        className="h-full"
      />
    </Reveal>
    <Reveal delayMs={210}>
      <FeatureCard
        title="Copilot Q&A"
        desc="Ask natural questions to analyze data."
        icon={<Bot className="h-5 w-5" />}
        iconClass="bg-amber-100 text-amber-700"
        ringClass="hover:ring-amber-300/60"
        className="h-full"
      />
    </Reveal>
    <Reveal delayMs={280}>
      <FeatureCard
        title="Automation"
        desc="Generate actions and follow-ups quickly."
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconClass="bg-rose-100 text-rose-600"
        ringClass="hover:ring-rose-300/60"
        className="h-full"
      />
    </Reveal>
    <Reveal delayMs={350}>
      <FeatureCard
        title="Integrations"
        desc="Connect to your existing systems."
        icon={<ArrowRight className="h-5 w-5" />}
        iconClass="bg-indigo-100 text-indigo-600"
        ringClass="hover:ring-indigo-300/60"
        className="h-full"
      />
    </Reveal>
  </div>
</section>


      {/* Stats strip */}
      <section id="stats" className="bg-gradient-to-r from-primary/5 to-accent/5 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Reveal animation="fade-up"><Stat value="3.1k+" label="Incidents Analyzed" /></Reveal>
          <Reveal animation="fade-up" delayMs={80}><Stat value="1.2k+" label="Hazards Tracked" /></Reveal>
          <Reveal animation="fade-up" delayMs={160}><Stat value="89%" label="Audit Completion" /></Reveal>
          <Reveal animation="fade-up" delayMs={240}><Stat value="24" label="Facility Zones" /></Reveal>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="mx-auto max-w-7xl px-6 py-16">
        <Reveal animation="fade-in">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground text-center">Built for every safety role</h2>
          <p className="mt-2 text-center text-muted-foreground">From leadership to operations, get the right insights at the right time.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Reveal><UseCase title="Leadership" bullet1="KPI overview" bullet2="Trends & hotspots" bullet3="Outcome tracking" /></Reveal>
          <Reveal delayMs={100}><UseCase title="HSE Team" bullet1="Root cause analysis" bullet2="Prioritized actions" bullet3="Compliance tracking" /></Reveal>
          <Reveal delayMs={200}><UseCase title="Operations" bullet1="On-floor visibility" bullet2="Quick audits" bullet3="Issue resolution" /></Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal>
            <Quote content="Within weeks we uncovered patterns that were invisible before." author="HSE Director" />
          </Reveal>
          <Reveal delayMs={120}>
            <Quote content="The copilot lets our team ask questions and act faster." author="Plant Manager" />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Ready to explore your safety data?</h2>
          <p className="mt-2 text-muted-foreground">Jump straight into the dashboard. No sign in required.</p>
          <div className="mt-6">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm hover:shadow-md">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Safety Copilot" className="h-8 w-auto" />
              <span className="font-semibold">Safety Copilot</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">AI-powered safety analysis and visualization.</p>
          </div>
          <div>
            <div className="text-sm font-medium">Product</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#use-cases" className="hover:text-foreground">Use Cases</a></li>
              <li><a href="#testimonials" className="hover:text-foreground">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium">Resources</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/analytics" className="hover:text-foreground">Analytics</Link></li>
              <li><Link to="/agent" className="hover:text-foreground">Copilot</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-medium">Company</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Safety Copilot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, icon, iconClass, ringClass, className }: { title: string; desc: string; icon: React.ReactNode; iconClass?: string; ringClass?: string; className?: string }) {
  return (
    <div className={`group rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ring-1 ring-transparent h-full flex flex-col ${ringClass ?? "hover:ring-primary/40"} ${className ?? ""}`}>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${iconClass ?? "bg-primary/15 text-primary"}`}>
        {icon}
      </div>
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card/80 p-6 text-center shadow-sm">
      <div className="text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function UseCase({ title, bullet1, bullet2, bullet3 }: { title: string; bullet1: string; bullet2: string; bullet3: string }) {
  return (
    <div className="rounded-2xl border bg-card/80 p-6 shadow-sm">
      <div className="text-base font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet1}</li>
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet2}</li>
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet3}</li>
      </ul>
    </div>
  );
}

function Quote({ content, author }: { content: string; author: string }) {
  return (
    <figure className="rounded-2xl border bg-card/80 p-6 shadow-sm">
      <blockquote className="text-sm md:text-base text-foreground leading-relaxed">“{content}”</blockquote>
      <figcaption className="mt-3 text-xs text-muted-foreground">— {author}</figcaption>
    </figure>
  );
}
