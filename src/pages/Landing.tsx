import { Link, useLocation } from "react-router-dom";
// Import only needed icons to reduce bundle size
import { Shield, BarChart3, Map, ArrowRight, CheckCircle2, Twitter, Github, Linkedin, Phone, MapPin, Bot, Brain, Database, Code2, Sparkles, History, ClipboardCheck, Download, Globe } from "lucide-react";
// Remove unused imports to reduce bundle size
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
// Lazy load non-critical visual effects
const Spotlight = lazy(() => import("@/components/ui/spotlight").then(m => ({ default: m.Spotlight })));
// Lazy load additional components
const TestimonialsSection = lazy(() => import("@/components/ui/testimonials-with-marquee").then(m => ({ default: m.TestimonialsSection })));
import { Typewriter } from "@/components/ui/typewriter";
import { Highlighter } from "@/components/ui/highlighter";
// SplitText is unused, remove it
// import SplitText from "@/components/ui/SplitText";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import GlassSurface from "@/components/ui/GlassSurface";
import CountUp from "@/components/ui/CountUp";
import PerformanceMonitor from "@/components/ui/PerformanceMonitor";
import { Marquee } from "@/components/ui/marquee";

// Lazy load heavy components with higher priority
const SplashCursor = lazy(() => import("@/components/ui/splash-cursor"));
const CurvedLoop = lazy(() => import("@/components/ui/CurvedLoop"));

// Preload critical images
const preloadImages = () => {
  const images = ['/logo.png', '/dashboard.png'];
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Only register GSAP plugins when needed to reduce initial bundle size
if (typeof window !== 'undefined') {
gsap.registerPlugin(useGSAP);
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);
  const [parallaxScale, setParallaxScale] = useState(1);
  const [highlighterKey, setHighlighterKey] = useState(0);
  const location = useLocation();

  // Preload critical images on mount
  useEffect(() => {
    preloadImages();
  }, []);

  // Intersection observer for scroll animations with smoother settings - optimized
  useEffect(() => {
    // Use requestIdleCallback for better performance
    const scheduleObserver = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initObserver);
      } else {
        setTimeout(initObserver, 100); // Small delay to not block initial render
      }
    };

    const initObserver = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('opacity-0', 'translate-y-12', 'scale-95');
              // Unobserve after animation to improve performance
              observer.unobserve(entry.target);
          }
        });
      },
        { threshold: 0.05, rootMargin: '0px 0px -100px 0px' } // Lower threshold, trigger earlier
    );

    // Observe all animatable elements
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    };

    const cleanup = scheduleObserver();
    return cleanup;
  }, []);

  // GSAP Navbar animation with wobbly effect - optimized for faster load
  useGSAP(() => {
    if (navRef.current) {
      const tl = gsap.timeline({ paused: true });
      
      tl.fromTo(
        navRef.current,
        { 
          scaleX: 1,
          opacity: 0,
        },
        { 
          scaleX: 1.1,
          opacity: 1,
          duration: 0.25, // Faster duration
          ease: "power2.out",
        }
      )
      .to(navRef.current, {
        scaleX: 0.97,
        duration: 0.12, // Faster duration
        ease: "power2.inOut",
      })
      .to(navRef.current, {
        scaleX: 1,
        duration: 0.08, // Faster duration
        ease: "power2.out",
      });
      
      // Start animation immediately
      tl.play();
    }
  }, []);

  // GSAP Hero animations - optimized for faster load
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" }, delay: 0.1 }); // Further reduced delay

    // Animate badge
    tl.fromTo(
      badgeRef.current,
      { opacity: 0, scale: 0.8, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.3 } // Faster duration
    );

    // Animate heading
    tl.fromTo(
      headingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4 }, // Faster duration
      "-=0.15" // More overlap for faster sequence
    );

    // Animate subheading
    tl.fromTo(
      subheadingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4, onComplete: () => setHighlighterKey(prev => prev + 1) }, // Faster duration
      "-=0.2" // More overlap
    );

    // Animate CTA buttons
    tl.fromTo(
      ctaRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4 }, // Faster duration
      "-=0.2" // More overlap
    );

    // Animate dashboard image
    tl.fromTo(
      imageRef.current,
      { opacity: 0, y: 60, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5 }, // Faster duration
      "-=0.3" // More overlap
    );
  }, { scope: heroRef });

  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    let lastScrollTime = 0;
    const throttleDelay = 16; // ~60fps
    
    const onScroll = () => {
      const now = Date.now();
      if (!ticking && now - lastScrollTime > throttleDelay) {
        lastScrollTime = now;
        requestAnimationFrame(() => {
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
          ticking = false;
        });
        ticking = true;
      }
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
    <div className="relative min-h-screen bg-black text-white bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]">
      {/* PerformanceMonitor disabled for better performance */}
      {/* <PerformanceMonitor /> */}
      
      {/* SplashCursor with reduced settings for better performance */}
      <Suspense fallback={null}>
      <SplashCursor 
        SIM_RESOLUTION={64}
        DYE_RESOLUTION={256}
        CURL={15}
        SPLAT_RADIUS={0.15}
        SPLAT_FORCE={2000}
        DENSITY_DISSIPATION={2}
        VELOCITY_DISSIPATION={0.5}
        PRESSURE={0.5}
        COLOR_UPDATE_SPEED={5}
      />
      </Suspense>
      <Suspense fallback={null}>
        <Spotlight className="absolute -top-50 left-0 z-0 md:left-60 md:-top-60" fill="#84cc16" />
      </Suspense>
      {/* Navbar - Pill Shaped Glassmorphism - Responsive */}
      <header ref={navRef} className="fixed top-2 sm:top-3 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[98%] sm:w-[96%] md:w-[95%] max-w-5xl px-1 sm:px-2 md:px-0 origin-center">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={9999}
          brightness={10}
          opacity={0.2}
          blur={15}
          displace={5}
          className="shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-all duration-500"
        >
          <nav className="relative w-full px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3.5">
            <div className="relative flex items-center justify-between gap-1 sm:gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 sm:gap-1.5 md:gap-2.5 group flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300" />
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="relative h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-lg object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" 
                    loading="eager"
                    width="32"
                    height="32"
                />
              </div>
              <span className="font-bold text-xs sm:text-sm md:text-lg text-white transition-all duration-300 group-hover:text-primary group-hover:tracking-wide hidden xs:inline">
                Safety Copilot
              </span>
              <span className="font-bold text-xs text-white transition-all duration-300 group-hover:text-primary xs:hidden">
                SC
              </span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <a 
                href="#features" 
                className="px-4 py-2 text-sm font-medium text-white/80 rounded-full transition-all duration-300 hover:text-white hover:bg-white/10"
              >
                Features
              </a>
              <a 
                href="#use-cases" 
                className="px-4 py-2 text-sm font-medium text-white/80 rounded-full transition-all duration-300 hover:text-white hover:bg-white/10"
              >
                Use Cases
              </a>
              <Link 
                to="/dashboard" 
                className="group relative ml-2 inline-flex items-center gap-2 rounded-full bg-primary/90 px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-500 hover:bg-primary hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Dashboard</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Nav Links - Mobile */}
            <div className="flex md:hidden items-center gap-0.5 sm:gap-1">
              <a 
                href="#features" 
                className="hidden xs:block px-2 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-medium text-white/80 rounded-full transition-all duration-300 hover:text-white hover:bg-white/10 whitespace-nowrap"
              >
                Features
              </a>
              <Link 
                to="/dashboard" 
                className="group relative inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-primary/90 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-500 hover:bg-primary hover:shadow-xl hover:shadow-primary/30 active:scale-95 overflow-hidden whitespace-nowrap"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative">Dashboard</span>
                <ArrowRight className="relative h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Link>
            </div>
          </div>
        </nav>
        </GlassSurface>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32 relative z-10" ref={heroRef}>
          <div className="mx-auto max-w-3xl text-center">
            <div ref={badgeRef} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 mb-5 relative overflow-hidden before:absolute before:inset-0 before:bg-[image:var(--shimmer)] before:bg-[length:200%_100%] before:animate-[shimmer_4s_ease-in-out_infinite] before:pointer-events-none opacity-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              AI-powered Safety Analytics
            </div>
            <h1 ref={headingRef} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight opacity-0">
              Drive safer operations with actionable{" "}
              <Typewriter
                words={["insights", "analytics", "decisions", "prevention", "intelligence"]}
                className="text-primary"
                typingSpeed={50}
                deletingSpeed={30}
                delayBetweenWords={1800}
              />
            </h1>
            <p ref={subheadingRef} className="mt-4 text-base md:text-lg text-white/80 leading-relaxed opacity-0">
              Explore{" "}
              <Highlighter key={`highlight-1-${highlighterKey}`} action="underline" color="#84cc16" strokeWidth={2} animationDuration={800} isView={false}>
                incidents, hazards, audits
              </Highlighter>{" "}
              and inspections in one place. Ask natural-language questions, view live maps, and make{" "}
              <Highlighter key={`highlight-2-${highlighterKey}`} action="highlight" color="rgba(132, 204, 22, 0.3)" strokeWidth={1.5} animationDuration={1000} isView={false}>
                faster decisions
              </Highlighter>
              .
            </p>
            <div ref={ctaRef} className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-0">
              <div className="relative inline-block">
                {/* Green glow effect */}
                <div className="absolute -inset-4 bg-primary/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="absolute -inset-2 bg-primary/40 rounded-xl blur-xl opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
                
                <Link
                  to="/dashboard"
                  className="group relative inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow-[0_8px_16px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2),0_0_40px_rgba(132,204,22,0.3)] transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.4),0_0_60px_rgba(132,204,22,0.6)] hover:scale-110 hover:-translate-y-2 active:scale-95 active:translate-y-0 border-t border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-black/10 before:rounded-lg overflow-hidden after:absolute after:inset-0 after:rounded-lg after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100 after:bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent_70%)]"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-2 group-hover:scale-110" />
                </Link>
              </div>
              <a href="#features">
                <ShimmerButton 
                  className="shadow-2xl"
                  shimmerColor="#84cc16"
                  shimmerSize="0.1em"
                  background="rgba(0, 0, 0, 0.8)"
                  borderRadius="100px"
                >
                  <span className="inline-flex items-center gap-2 text-center text-sm font-medium tracking-tight whitespace-nowrap text-white">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </ShimmerButton>
              </a>
            </div>
          </div>

          {/* Device frame with dashboard image */}
          <div
            ref={imageRef}
            className="mx-auto mt-12 md:mt-16 max-w-6xl opacity-0"
            style={{
              transform: `translateY(${Math.round(parallaxY)}px) scale(${parallaxScale})`,
              transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="relative group">
              {/* Simplified fog layers - reduced for better performance */}
              <div className="absolute -inset-20 pointer-events-none overflow-visible z-0">
                {/* Fog layer 1 */}
                <div 
                  className="absolute inset-0 rounded-full blur-2xl animate-fog-drift-1 will-change-transform"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)'
                  }}
                />
                {/* Fog layer 2 */}
                <div 
                  className="absolute inset-0 rounded-full blur-2xl animate-fog-drift-2 will-change-transform"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)'
                  }}
                />
              </div>

              {/* Green glow layers */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 via-primary/30 to-primary/40 rounded-[32px] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/50 via-transparent to-primary/50 rounded-[30px] blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700" />
              
              {/* Neon green border */}
              <div className="absolute -inset-[1px] rounded-[30px] bg-gradient-to-r from-primary/40 via-primary/30 to-primary/40 opacity-30 blur-sm group-hover:opacity-60 transition-opacity duration-700" />
              
              <div className="relative rounded-[28px] border border-primary/40 bg-black/50 shadow-[0_20px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(132,204,22,0.2)] hover:shadow-[0_40px_120px_rgba(0,0,0,0.9),0_0_60px_rgba(132,204,22,0.4)] hover:border-primary/60 transition-all duration-700 ease-out p-2">
                <div className="rounded-2xl overflow-hidden bg-black relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
                  <img
                    src="/dashboard.png"
                    alt="Safety Copilot dashboard preview"
                    className="w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    width="1200"
                    height="800"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                  />
                </div>
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

        {/* Bento Grid Image */}
        <div className="mt-10 animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <div className="relative group">
            {/* Glow effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
            
            <div className="relative rounded-2xl border border-white/10 bg-black/30 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <img
                src="/bentoimage.png"
                alt="Safety Copilot Features"
                className="w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
                width="1400"
                height="900"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Agent Capabilities */}
      <section id="agent-features" className="mx-auto max-w-7xl px-6 py-16">

        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">AI Copilot Capabilities</h2>
          <p className="mt-2 text-center text-white/80">What the built-in agent can do for your safety data.</p>
        </div>

        {/* Infinite marquee (single row) */}
        <div className="mt-10 relative">
          {/* Marquee Row */}
          <div className="relative">
            <Marquee pauseOnHover className="[--duration:50s] [--gap:1.5rem]">
              <div className="w-[360px] h-[220px] md:w-[420px] md:h-[260px] lg:w-[520px] lg:h-[320px] flex-shrink-0 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img src="/naturallanguageqa.png" alt="Natural-language Q&A" className="w-full h-full object-cover" loading="lazy" width="1200" height="800" />
              </div>
              <div className="w-[360px] h-[220px] md:w-[420px] md:h-[260px] lg:w-[520px] lg:h-[320px] flex-shrink-0 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img src="/smarttool.png" alt="Smart tool calling" className="w-full h-full object-cover" loading="lazy" width="1200" height="800" />
              </div>
              <div className="w-[360px] h-[220px] md:w-[420px] md:h-[260px] lg:w-[520px] lg:h-[320px] flex-shrink-0 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img src="/chartondemand.png" alt="Charts on demand" className="w-full h-full object-cover" loading="lazy" width="1200" height="800" />
              </div>
            </Marquee>
            {/* Edge fade gradients */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-32 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-32 bg-gradient-to-l from-black via-black/70 to-transparent z-10" />
          </div>
        </div>
      </section>


      {/* Stats strip */}
      <section id="stats" className="border-y border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <Stat value={5.1} suffix="k+" label="Incidents Analyzed" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <Stat value={4.2} suffix="k+" label="Hazards Tracked" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <Stat value={89} suffix="%" label="Audit Completion" />
          </div>
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-400">
            <Stat value={24} suffix="" label="Facility Zones" />
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

      {/* Key Concepts */}
      <section id="key-concepts" className="mx-auto max-w-7xl px-6 py-16">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white text-center">
            The Key <span className="text-primary">Concepts</span> Behind
          </h2>
          <p className="mt-2 text-center text-white/80">Three concepts that guide everything we do.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enhanced Context Engineering */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div 
              className="group relative rounded-2xl border border-white/15 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.05] hover:border-white/30 hover:-translate-y-3 h-full"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:rotate-12">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Enhanced Context Engineering</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Our advanced context engine combines deep codebase analysis with adaptive memory, delivering smarter AI that truly evolves with you.
              </p>
            </div>
          </div>

          {/* Knowledge Visibility */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div 
              className="group relative rounded-2xl border border-white/15 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.05] hover:border-white/30 hover:-translate-y-3 h-full"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:rotate-12">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Knowledge Visibility</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Make your safety data truly understandable - for both humans and AI. Clear visibility reduces hallucinations and improves alignment.
              </p>
            </div>
          </div>

          {/* Spec-Driven Development */}
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <div 
              className="group relative rounded-2xl border border-white/15 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.05] hover:border-white/30 hover:-translate-y-3 h-full"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:rotate-12">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Spec-Driven Development</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Start by defining requirements clearly. Then delegate implementation - stay in control while AI automates execution. Fewer iterations. Faster delivery.
              </p>
            </div>
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

      {/* Curved Loop Marquee */}
      <section className="w-full pb-32 overflow-hidden">
        <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center w-full" />}>
        <CurvedLoop 
          marqueeText="Safety  ✦  Analytics  ✦ Insights  ✦  Prevention  ✦  Compliance ✦  Excellence  ✦"
          speed={2}
          curveAmount={400}
          direction="left"
          interactive={true}
          className="text-primary"
        />
        </Suspense>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
          <div 
            className="relative rounded-3xl border border-white/15 p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-shadow duration-500"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.90)',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Ready to explore your safety data?</h2>
            <p className="mt-2 text-white/80">Jump straight into the dashboard. No sign in required.</p>
            <div className="mt-6 flex justify-center">
              <div className="relative inline-block">
                {/* Green glow effect */}
                <div className="absolute -inset-4 bg-primary/30 rounded-2xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="absolute -inset-2 bg-primary/40 rounded-xl blur-xl opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
                
                <Link 
                  to="/dashboard" 
                  className="group relative inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_8px_16px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2),0_0_40px_rgba(132,204,22,0.3)] transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.4),0_0_60px_rgba(132,204,22,0.6)] hover:scale-110 hover:-translate-y-2 active:scale-95 active:translate-y-0 border-t border-white/20 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-black/10 before:rounded-lg overflow-hidden after:absolute after:inset-0 after:rounded-lg after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100 after:bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent_70%)]"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-2 group-hover:scale-110" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000">
            <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 md:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-shadow duration-500">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Brand */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Safety Copilot" className="h-9 w-auto" loading="lazy" width="36" height="36" />
                  <span className="font-semibold text-white text-lg">Safety Copilot</span>
                </div>
                <p className="mt-3 text-sm text-white/80">AI-powered safety analysis and visualization across incidents, hazards, audits and inspections.</p>
                <div className="mt-4 flex items-center gap-3 text-white/80 text-xs">
                  <MapPin className="h-4 w-4" /> <span>Karachi, PK</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" aria-label="Github"><Github className="h-4 w-4 text-white" /></a>
                  <a className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/15 transition-all duration-300 hover:bg-white/10 hover:scale-110 hover:border-white/25" href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin className="h-4 w-4 text-white" /></a>
                </div>
              </div>

              {/* Links */}
              <div className="md:col-span-5 grid grid-cols-3 gap-6">
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
                <div>
                  <div className="text-sm font-medium text-white">Engro EPCL</div>
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    <li><a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Who We Are</a></li>
                    <li><a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Investor Relations</a></li>
                    <li><a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Social Impact</a></li>
                    <li><a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Life @ EPCL</a></li>
                  </ul>
                </div>
              </div>

              {/* Contact + Newsletter */}
              <div className="md:col-span-3">
                <div className="text-sm font-medium text-white">Contact</div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs leading-relaxed">8th Floor, The Harbour Front Building, Marine Drive, Block 4, Clifton, Karachi</span>
                  </li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +92 21 111 411 411</li>
                </ul>
                <div className="mt-5 text-sm font-medium text-white">Office Hours</div>
                <p className="mt-2 text-xs text-white/80">Mon to Fri: 9 am - 5 pm (PST)</p>
              </div>
            </div>

            {/* Legal Row */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/70">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <span>© {new Date().getFullYear()} Engro Polymer & Chemicals. All rights reserved.</span>
                <span className="hidden md:inline">•</span>
                <span>Powered by Safety Copilot</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Privacy Policy</a>
                <a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Disclaimer</a>
                <a href="https://www.engropolymer.com/contact-us/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Sitemap</a>
              </div>
              </div>

            {/* Built By Qubit Dynamics */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-3 text-sm text-white/60">
              <span>Built by</span>
              <div className="flex items-center gap-2">
                <img 
                  src="/qbitlogo.png" 
                  alt="Qubit Dynamics" 
                  className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300" 
                  loading="lazy"
                  width="32"
                  height="32"
                />
            
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

function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:scale-110 hover:border-white/30 hover:-translate-y-2 cursor-default">
      <div className="text-3xl font-extrabold tracking-tight text-white transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:text-primary">
        <CountUp
          from={0}
          to={value}
          separator=","
          direction="up"
          duration={2}
          className="count-up-text"
        />
        {suffix}
      </div>
      <div className="mt-1 text-xs text-white/80 transition-colors duration-300 group-hover:text-white/90">{label}</div>
    </div>
  );
}

function UseCase({ title, bullet1, bullet2, bullet3 }: { title: string; bullet1: string; bullet2: string; bullet3: string }) {
  return (
    <div 
      className="group relative rounded-2xl border border-white/15 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.08] hover:border-white/30 hover:-translate-y-3"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
      }}
    >
      <div className="text-base font-semibold text-white transition-colors duration-300 group-hover:text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet1}</li>
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet2}</li>
        <li className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:text-white group-hover:translate-x-1"><span className="h-1.5 w-1.5 rounded-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-primary/50" />{bullet3}</li>
      </ul>
    </div>
  );
}

function AgentFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div 
      className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:scale-[1.06] hover:border-white/30 hover:-translate-y-2"
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary/25 group-hover:text-primary/90 transition-colors">
          {icon}
        </div>
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm text-white/80">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function AgentFeatureBento({ icon, title, desc, className = "", imageSrc }: { icon: React.ReactNode; title: string; desc: string; className?: string; imageSrc?: string }) {
  return (
    <div 
      className={`group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:scale-[1.04] hover:border-white/30 hover:-translate-y-2 ${className}`}
      style={{ 
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary/25 group-hover:text-primary/90 transition-colors">
          {icon}
        </div>
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm text-white/80">{desc}</p>
        </div>
      </div>
      {imageSrc && (
        <div className="mt-4 relative rounded-xl overflow-hidden border border-white/10 bg-black/30">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-44 md:h-52 lg:h-56 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            width="800"
            height="500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
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
