import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export interface TestimonialAuthor {
  name: string;
  handle: string;
  avatar: string;
}

export interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
  className?: string;
}

export function TestimonialCard({
  author,
  text,
  href,
  className,
}: TestimonialCardProps) {
  const Card: any = href ? "a" : "div";

  return (
    <Card
      {...(href ? { href, target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "flex flex-col text-start",
        // Glass card styling to match landing
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        "p-4 sm:p-6 max-w-[320px] sm:max-w-[320px]",
        "hover:bg-white/10 transition-colors duration-300",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-1 ring-white/10">
          <AvatarImage src={author.avatar} alt={author.name} />
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-md font-semibold leading-none text-white">{author.name}</h3>
          <p className="text-sm text-white/60">{author.handle}</p>
        </div>
      </div>
      <p className="sm:text-md mt-4 text-sm text-white/80">{text}</p>
    </Card>
  );
}
