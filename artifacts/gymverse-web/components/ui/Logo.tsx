import { cx } from "@/lib/ui";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("font-display uppercase leading-none tracking-[0.02em]", className)}>
      <span className="text-warm">GYM</span>
      <span className="text-gradient">X</span>
    </span>
  );
}
