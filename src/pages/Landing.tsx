import { Link, useLocation } from "react-router-dom";
import { Shield, BarChart3, Map, Bot, ArrowRight, CheckCircle2, Twitter, Github, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
// Reveal removed from bottom sections (no animations)
import { Spotlight } from "@/components/ui/spotlight";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [parallaxScale, setParallaxScale] = useState(1);
  const location = useLocation();

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

  // Prevent reload from restoring scroll to bottom; keep hero/top on first load when no hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supports = ("scrollRestoration" in window.history);
    let prev: any;
    if (supports) {
      prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
    }
    if (!location.hash) {
      // Only force top when not navigating to an anchor
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    return () => {
      if (supports) window.history.scrollRestoration = prev || "auto";
    };
  // run on initial mount and when pathname changes
  }, [location.pathname]);
  return (
    <div className="relative min-h-screen bg-grid-dark text-white">
      <Spotlight className="absolute -top-40 left-0 z-0 md:left-60 md:-top-20" fill="lime" />
      {/* Navbar (simple) */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white/5 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-semibold tracking-tight text-white">Safety Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 relative z-10" ref={heroRef}>
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
          <div
            className="mx-auto mt-12 md:mt-16 max-w-6xl"
            style={{
              transform: `translateY(${Math.round(parallaxY)}px) scale(${parallaxScale})`,
              transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
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

      {/* Features (Glass Bento, no animations) */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">Features</h2>
        <p className="mt-2 text-center text-white/80">Everything you need to understand and improve safety performance.</p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
          <FeatureCard
            title="Unified Safety Data"
            desc="Incidents, hazards, audits and inspections in one place."
            icon={<Shield className="h-5 w-5" />}
            iconClass="bg-emerald-100 text-emerald-600"
            className="md:col-span-3 lg:col-span-4 min-h-[180px]"
          />
          <FeatureCard
            title="Actionable Analytics"
            desc="Spot trends, prioritize risk, track improvements."
            icon={<BarChart3 className="h-5 w-5" />}
            iconClass="bg-sky-100 text-sky-700"
            className="md:col-span-3 lg:col-span-4 min-h-[180px]"
          />
          <FeatureCard
            title="Interactive Maps"
            desc="Visualize locations and hotspots instantly."
            icon={<Map className="h-5 w-5" />}
            iconClass="bg-violet-100 text-violet-700"
            className="md:col-span-6 lg:col-span-4 row-span-2 min-h-[180px]"
          />
          <FeatureCard
            title="Copilot Q&A"
            desc="Ask natural questions to analyze data."
            icon={<Bot className="h-5 w-5" />}
            iconClass="bg-amber-100 text-amber-700"
            className="md:col-span-3 lg:col-span-4 min-h-[180px] lg:row-span-2"
          />
          <FeatureCard
            title="Automation"
            desc="Generate actions and follow-ups quickly."
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-rose-100 text-rose-600"
            className="md:col-span-3 lg:col-span-4 min-h-[180px]"
          />
          <FeatureCard
            title="Integrations"
            desc="Connect to your existing systems."
            icon={<ArrowRight className="h-5 w-5" />}
            iconClass="bg-indigo-100 text-indigo-600"
            className="md:col-span-6 lg:col-span-8 min-h-[180px]"
          />
        </div>
      </section>


      {/* Stats strip (Glass, no animations) */}
      <section id="stats" className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat value="3.1k+" label="Incidents Analyzed" />
          <Stat value="1.2k+" label="Hazards Tracked" />
          <Stat value="89%" label="Audit Completion" />
          <Stat value="24" label="Facility Zones" />
        </div>
      </section>

      {/* Use cases (Glass, no animations) */}
      <section id="use-cases" className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">Built for every safety role</h2>
        <p className="mt-2 text-center text-white/80">From leadership to operations, get the right insights at the right time.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <UseCase title="Leadership" bullet1="KPI overview" bullet2="Trends & hotspots" bullet3="Outcome tracking" />
          <UseCase title="HSE Team" bullet1="Root cause analysis" bullet2="Prioritized actions" bullet3="Compliance tracking" />
          <UseCase title="Operations" bullet1="On-floor visibility" bullet2="Quick audits" bullet3="Issue resolution" />
        </div>
      </section>

      {/* Testimonials (Glass, no animations) */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Quote content="Within weeks we uncovered patterns that were invisible before." author="HSE Director" />
          <Quote content="The copilot lets our team ask questions and act faster." author="Plant Manager" />
        </div>
      </section>

      {/* CTA (Glass, no animations) */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Ready to explore your safety data?</h2>
          <p className="mt-2 text-white/80">Jump straight into the dashboard. No sign in required.</p>
          <div className="mt-6">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer (Glass, premium) */}
      <footer className="border-t border-white/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Brand */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Safety Copilot" className="h-9 w-auto" />
                  <span className="font-semibold text-white text-lg">Safety Copilot</span>
                </div>
                <p className="mt-3 text-sm text-white/80">AI-powered safety analysis and visualization across incidents, hazards, audits and inspections.</p>
                <div className="mt-4 flex items-center gap-3 text-white/80 text-xs">
                  <MapPin className="h-4 w-4" /> <span>Karachi, PK</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 hover:bg-white/10" href="#" aria-label="Twitter"><Twitter className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 hover:bg-white/10" href="#" aria-label="Github"><Github className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 hover:bg-white/10" href="#" aria-label="LinkedIn"><Linkedin className="h-4 w-4 text-white" /></a>
                </div>
              </div>

              {/* Links */}
              <div className="md:col-span-5 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm font-medium text-white">Product</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    <li><a href="#features" className="hover:text-white">Features</a></li>
                    <li><a href="#use-cases" className="hover:text-white">Use Cases</a></li>
                    <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Resources</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                    <li><Link to="/analytics" className="hover:text-white">Analytics</Link></li>
                    <li><Link to="/agent" className="hover:text-white">Copilot</Link></li>
                  </ul>
                </div>
              </div>

              {/* Contact + Newsletter */}
              <div className="md:col-span-3">
                <div className="text-sm font-medium text-white">Contact</div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@safetycopilot.app</li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 300 0000000</li>
                </ul>
                <div className="mt-5 text-sm font-medium text-white">Newsletter</div>
                <form className="mt-2 flex items-center gap-2">
                  <Input placeholder="Enter your email" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                  <Button className="bg-primary text-primary-foreground">Subscribe</Button>
                </form>
                <p className="mt-1 text-[11px] text-white/60">No spam. Unsubscribe anytime.</p>
              </div>
            </div>

            {/* Legal Row */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/70">
              <div>© {new Date().getFullYear()} Safety Copilot. All rights reserved.</div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-white">Privacy</a>
                <a href="#" className="hover:text-white">Terms</a>
                <a href="#" className="hover:text-white">Security</a>
                <a href="#" className="hover:text-white">Status</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, icon, iconClass, className }: { title: string; desc: string; icon: React.ReactNode; iconClass?: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] h-full flex flex-col p-6 ${className ?? ""}`}>
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${iconClass ?? "bg-white/20 text-white"}`}>
        {icon}
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/80">{desc}</div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="text-3xl font-extrabold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-white/80">{label}</div>
    </div>
  );
}

function UseCase({ title, bullet1, bullet2, bullet3 }: { title: string; bullet1: string; bullet2: string; bullet3: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="text-base font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet1}</li>
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet2}</li>
        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{bullet3}</li>
      </ul>
    </div>
  );
}

function Quote({ content, author }: { content: string; author: string }) {
  return (
    <figure className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <blockquote className="text-sm md:text-base text-white leading-relaxed">“{content}”</blockquote>
      <figcaption className="mt-3 text-xs text-white/80">— {author}</figcaption>
    </figure>
  );
}
