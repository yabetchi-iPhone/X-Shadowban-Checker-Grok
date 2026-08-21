import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "ok" | "warn" | "ban" | "primary";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-border bg-elevated text-muted",
        tone === "ok" && "border-ok/30 bg-ok/10 text-ok",
        tone === "warn" && "border-warn/30 bg-warn/10 text-warn",
        tone === "ban" && "border-ban/30 bg-ban/10 text-ban",
        tone === "primary" && "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
