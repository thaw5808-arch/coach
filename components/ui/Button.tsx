import Link from "@/components/ui/SiteLink";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowIcon, CheckIcon } from "./Icons";

type Variant = "primary" | "secondary" | "text";
type Status = "idle" | "loading" | "success";

type CommonProps = {
  variant?: Variant;
  status?: Status;
  showArrow?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & { href: string };
type ButtonAsButton = CommonProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>;

/* Figma "Button" (13:103) — 53px pill; hover/focus/disabled/loading/success states. */
const base =
  "type-button inline-flex items-center justify-center gap-3 whitespace-nowrap transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "h-[53px] rounded-pill px-8 bg-ink text-surface hover:bg-accent-deep focus-visible:border-2 focus-visible:border-accent-deep disabled:opacity-35 disabled:hover:bg-ink",
  secondary:
    "h-[53px] rounded-pill px-8 bg-surface text-ink hover:bg-blob focus-visible:border-2 focus-visible:border-accent-deep disabled:opacity-45 disabled:hover:bg-surface",
  text: "py-2 text-ink hover:text-accent-deep focus-visible:underline underline-offset-4",
};

function Content({ variant, status, showArrow, children }: Required<Pick<CommonProps, "variant" | "status" | "showArrow">> & { children: ReactNode }) {
  if (status === "loading") {
    return (
      <>
        <span>{children}</span>
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1 rounded-full bg-current animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
        <span className="sr-only">Loading</span>
      </>
    );
  }
  if (status === "success") {
    return (
      <>
        <CheckIcon />
        <span>{children}</span>
      </>
    );
  }
  return (
    <>
      <span>{children}</span>
      {showArrow && variant !== undefined && <ArrowIcon />}
    </>
  );
}

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", status = "idle", showArrow = true, className = "", children } = props;
  const success = status === "success" && variant === "primary" ? "!bg-accent-deep" : "";
  const classes = `${base} ${variants[variant]} ${success} ${className}`;
  const content = (
    <Content variant={variant} status={status} showArrow={showArrow}>
      {children}
    </Content>
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const { variant: _v, status: _s, showArrow: _a, className: _c, children: _ch, href: _h, ...rest } = props;
  return (
    <button {...rest} className={classes} aria-busy={status === "loading" || undefined} disabled={rest.disabled || status === "loading"}>
      {content}
    </button>
  );
}
