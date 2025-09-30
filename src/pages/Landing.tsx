import { Link, useLocation } from "react-router-dom";
import { Shield, BarChart3, Map, Bot, ArrowRight, CheckCircle2, Twitter, Github, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
// Reveal removed from bottom sections (no animations)
import { Spotlight } from "@/components/ui/spotlight";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";
import { Typewriter } from "@/components/ui/typewriter";
import SplashCursor from "@/components/ui/splash-cursor";

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [parallaxScale, setParallaxScale] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Intersection observer for scroll animations with smoother settings
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('opacity-0', 'translate-y-12', 'scale-95');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all animatable elements
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Hero visibility trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Testimonials used by the marquee section
  const testimonials = [
    {
      author: {
        name: "HSE Director",
        handle: "@northplant-hse",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
      },
      text:
        "Within weeks we uncovered patterns across departments that were invisible before. Safety Co‑pilot shortened our investigations from days to hours.",
    },
    {
      author: {
        name: "Plant Manager",
        handle: "@unit-a-manager",
        avatar:
          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=faces",
      },
      text:
        "The department spider and timeline helped us prioritize actions and communicate risk clearly in daily stand‑ups.",
    },
    {
      author: {
        name: "Safety Engineer",
        handle: "@field-safety",
        avatar:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=faces",
      },
      text:
        "Wordclouds by department quickly summarize hundreds of notes. I can brief leadership with evidence in minutes.",
    },
    {
      author: {
        name: "Data Analyst",
        handle: "@hse-analytics",
        avatar:
          "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=faces",
      },
      text:
        "APIs are clean and the app structure is solid (shadcn + Tailwind). We wired new KPIs without touching the UI.",
      href: "https://safetycopilot.app",
    },
    {
      author: {
        name: "Compliance Lead",
        handle: "@audit-qms",
        avatar:
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=faces",
      },
      text:
        "Pareto and root cause flows align directly with our audit actions. Less spreadsheet work, more prevention.",
    },
  ];
  return (
    <div className="relative min-h-screen bg-grid-dark text-white">
      <SplashCursor 
        CURL={30}
        SPLAT_RADIUS={0.25}
        DENSITY_DISSIPATION={2}
        VELOCITY_DISSIPATION={0.5}
      />
      <Spotlight className="absolute -top-40 left-0 z-0 md:left-60 md:-top-20" fill="lime" />
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-white/5 backdrop-blur transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-md object-contain transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-primary">Safety Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="group inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-105">
              Go to Dashboard <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 relative z-10" ref={heroRef}>
          <div className={`mx-auto max-w-3xl text-center transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}>
            <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 mb-5 relative overflow-hidden before:absolute before:inset-0 before:bg-[image:var(--shimmer)] before:bg-[length:200%_100%] before:animate-[shimmer_4s_ease-in-out_infinite] before:pointer-events-none transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              AI-powered Safety Analytics
            </div>
            <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight leading-tight transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Drive safer operations with actionable{" "}
              <Typewriter
                words={["insights", "analytics", "decisions", "prevention", "intelligence"]}
                className="text-primary"
                typingSpeed={70}
                deletingSpeed={40}
                delayBetweenWords={2200}
              />
            </h1>
            <p className={`mt-4 text-base md:text-lg text-white/80 leading-relaxed transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Explore incidents, hazards, audits and inspections in one place. Ask natural-language questions, view live maps, and make faster decisions.
            </p>
            <div className={`mt-8 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow-[0_8px_16px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2)] transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.4)] hover:scale-110 hover:-translate-y-2 active:scale-95 active:translate-y-0 relative border-t border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-black/10 before:rounded-lg overflow-hidden after:absolute after:inset-0 after:rounded-lg after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100 after:bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent_70%)]"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-2 group-hover:scale-110" />
              </Link>
              <a href="#features" className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-white transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:scale-105">
                Learn More
                <ArrowRight className="h-4 w-4 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Device frame with dashboard image */}
          <div
            className={`mx-auto mt-12 md:mt-16 max-w-6xl transition-all duration-1200 delay-900 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{
              transform: `translateY(${Math.round(parallaxY)}px) scale(${parallaxScale})`,
              transition: "transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            <div className="rounded-[28px] border border-white/10 bg-black/50 shadow-[0_20px_80px_rgba(0,0,0,0.65)] p-2 hover:shadow-[0_30px_100px_rgba(0,0,0,0.8)] transition-shadow duration-700">
              <div className="rounded-2xl overflow-hidden bg-black">
                <img
                  src="/dashboard.png"
                  alt="Safety Copilot dashboard preview"
                  className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">Features</h2>
          <p className="mt-2 text-center text-white/80">Everything you need to understand and improve safety performance.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
          <FeatureCard
            title="Unified Safety Data"
            desc="Incidents, hazards, audits and inspections in one place."
            icon={<Shield className="h-5 w-5" />}
            iconClass="bg-emerald-100 text-emerald-600"
            className="md:col-span-3 lg:col-span-4 min-h-[180px] animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100"
            gradientClass="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent"
          />
          <FeatureCard
            title="Actionable Analytics"
            desc="Spot trends, prioritize risk, track improvements."
            icon={<BarChart3 className="h-5 w-5" />}
            iconClass="bg-sky-100 text-sky-700"
            className="md:col-span-3 lg:col-span-4 min-h-[180px] animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200"
            gradientClass="bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent"
          />
          <FeatureCard
            title="Interactive Maps"
            desc="Visualize locations and hotspots instantly."
            icon={<Map className="h-5 w-5" />}
            iconClass="bg-violet-100 text-violet-700"
            className="md:col-span-6 lg:col-span-4 row-span-2 min-h-[180px] animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300"
            gradientClass="bg-gradient-to-br from-violet-500/20 via-violet-600/10 to-transparent"
          />
          <FeatureCard
            title="Copilot Q&A"
            desc="Ask natural questions to analyze data."
            icon={<Bot className="h-5 w-5" />}
            iconClass="bg-amber-100 text-amber-700"
            className="md:col-span-3 lg:col-span-4 min-h-[180px] lg:row-span-2 animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400"
            gradientClass="bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent"
          />
          <FeatureCard
            title="Automation"
            desc="Generate actions and follow-ups quickly."
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-rose-100 text-rose-600"
            className="md:col-span-3 lg:col-span-4 min-h-[180px] animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-500"
            gradientClass="bg-gradient-to-br from-rose-500/20 via-rose-600/10 to-transparent"
          />
          <FeatureCard
            title="Integrations"
            desc="Connect to your existing systems."
            icon={<ArrowRight className="h-5 w-5" />}
            iconClass="bg-indigo-100 text-indigo-600"
            className="md:col-span-6 lg:col-span-8 min-h-[180px] animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-600"
            gradientClass="bg-gradient-to-br from-indigo-500/20 via-indigo-600/10 to-transparent"
          />
        </div>
      </section>


      {/* Stats strip */}
      <section id="stats" className="border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <Stat value="3.1k+" label="Incidents Analyzed" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <Stat value="1.2k+" label="Hazards Tracked" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <Stat value="89%" label="Audit Completion" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400">
            <Stat value="24" label="Facility Zones" />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="mx-auto max-w-7xl px-6 py-16">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">Built for every safety role</h2>
          <p className="mt-2 text-center text-white/80">From leadership to operations, get the right insights at the right time.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <UseCase title="Leadership" bullet1="KPI overview" bullet2="Trends & hotspots" bullet3="Outcome tracking" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <UseCase title="HSE Team" bullet1="Root cause analysis" bullet2="Prioritized actions" bullet3="Compliance tracking" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <UseCase title="Operations" bullet1="On-floor visibility" bullet2="Quick audits" bullet3="Issue resolution" />
          </div>
        </div>
      </section>
{/* 
      Testimonials
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <TestimonialsSection
            title="Trusted across HSE teams"
            description="Leaders and engineers use Safety Co‑pilot to investigate faster, communicate clearer, and prevent more incidents."
            testimonials={testimonials}
            className="bg-transparent py-0"
            durationSec={90}
          />
        </div>
      </section> */}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-shadow duration-500">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Ready to explore your safety data?</h2>
            <p className="mt-2 text-white/80">Jump straight into the dashboard. No sign in required.</p>
            <div className="mt-6">
              <Link to="/dashboard" className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Go to Dashboard <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-shadow duration-500">
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
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="#" aria-label="Twitter"><Twitter className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="#" aria-label="Github"><Github className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="#" aria-label="LinkedIn"><Linkedin className="h-4 w-4 text-white" /></a>
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
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, icon, iconClass, className, gradientClass }: { 
  title: string; 
  desc: string; 
  icon: React.ReactNode; 
  iconClass?: string; 
  className?: string;
  gradientClass?: string;
}) {
  return (
    <div 
      className={`group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] h-full flex flex-col p-6 relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.08] hover:border-white/30 hover:-translate-y-3 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.05] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700 ${gradientClass ?? ""} ${className ?? ""}`}
    >
      <div className="relative z-10">
        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:rotate-12 ${iconClass ?? "bg-white/20 text-white"}`}>
          {icon}
        </div>
        <div className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-white">{title}</div>
        <div className="mt-1 text-sm text-white/80 transition-colors duration-300 group-hover:text-white/90">{desc}</div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:scale-110 hover:border-white/30 hover:-translate-y-2 cursor-default">
      <div className="text-3xl font-extrabold tracking-tight text-white transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:text-primary">{value}</div>
      <div className="mt-1 text-xs text-white/80 transition-colors duration-300 group-hover:text-white/90">{label}</div>
    </div>
  );
}

function UseCase({ title, bullet1, bullet2, bullet3 }: { title: string; bullet1: string; bullet2: string; bullet3: string }) {
  return (
    <div className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.08] hover:border-white/30 hover:-translate-y-3">
      <div className="text-base font-semibold text-white transition-colors duration-300 group-hover:text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet1}</li>
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet2}</li>
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet3}</li>
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
