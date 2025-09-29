import { cn } from "@/lib/utils";
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card";

interface TestimonialsSectionProps {
  title: string;
  description: string;
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
  durationSec?: number; // speed control for marquee
}

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className,
  durationSec = 60,
}: TestimonialsSectionProps) {
  return (
    <section
      className={cn(
        "bg-transparent text-white",
        "py-12 sm:py-24 md:py-32 px-0",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight text-white">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-white/70 sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-2">
          <div
            className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row"
            style={{ ["--duration" as any]: `${durationSec}s` }}
          >
            {/* Track A */}
            <div className="flex shrink-0 [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, dupIdx) =>
                testimonials.map((testimonial, i) => (
                  <TestimonialCard key={`A-${dupIdx}-${i}`} {...testimonial} />
                )),
              )}
            </div>
            {/* Track B (offset start) */}
            <div
              className="flex shrink-0 [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]"
              aria-hidden
              style={{ animationDelay: `calc(${durationSec}s / 2)` }}
            >
              {[...Array(2)].map((_, dupIdx) =>
                testimonials.map((testimonial, i) => (
                  <TestimonialCard key={`B-${dupIdx}-${i}`} {...testimonial} />
                )),
              )}
            </div>
          </div>

          {/* edge fades (dark, subtle) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-black/40 via-black/10 to-transparent mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-black/40 via-black/10 to-transparent mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent mix-blend-multiply" />
        </div>
      </div>
    </section>
  );
}
