import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Heading whose words slide up out of a mask, one after the other.
 * Pure CSS animation, so it also plays on first paint (SSR) with no JS.
 */
export function Words({
  text,
  className,
  startDelay = 0,
  step = 70,
}: {
  text: string;
  className?: string;
  startDelay?: number;
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span className="word-mask">
            <span className="word-in" style={{ animationDelay: `${startDelay + i * step}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

/** Number that counts up the first time it enters the viewport. */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  duration = 1600,
  className,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: "always" as unknown as boolean,
    }).format(n);
  const [text, setText] = useState(fmt(to));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    setText(fmt(0));
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setText(fmt(to * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, decimals, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {text}
      {suffix}
    </span>
  );
}

/** Moves its children slowly against the scroll (depth effect). */
export function Parallax({
  children,
  speed = 0.08,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/** Thin bar at the top of the page showing how far the visitor has scrolled. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div ref={ref} className="h-full origin-left scale-x-0 bg-[image:var(--gradient-accent)]" />
    </div>
  );
}

/** Endless horizontal ticker. Content is duplicated for a seamless loop. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="flex items-center gap-8">
          <span>{t}</span>
          <span className="bg-accent h-1.5 w-1.5 rounded-full" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("marquee", className)}>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Exposes scroll progress to CSS as `--p` (0 → 1) on the element itself, so children can
 * animate with calc(var(--p) * …) without re-rendering React.
 *  - hero:  0 at the top of the page, 1 once the section has scrolled away
 *  - pin:   0 → 1 while a tall section keeps its sticky child on screen
 *  - enter: 0 → 1 while the element rises into the viewport
 */
export function ScrollVars({
  children,
  mode,
  className,
  style,
  as: Tag = "div",
  onProgress,
}: {
  children: ReactNode;
  mode: "hero" | "pin" | "enter";
  className?: string | undefined;
  style?: CSSProperties;
  as?: "div" | "section";
  onProgress?: (p: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p =
        mode === "hero"
          ? -r.top / Math.max(r.height, 1)
          : mode === "pin"
            ? -r.top / Math.max(r.height - vh, 1)
            : (vh * 0.9 - r.top) / (vh * 0.55);
      const v = clamp01(p);
      el.style.setProperty("--p", v.toFixed(4));
      cb.current?.(v);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ["--p" as string]: mode === "enter" ? 1 : 0, ...style }}
    >
      {children}
    </Tag>
  );
}

/** Large statement whose words light up one by one as it scrolls into view. */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  const n = words.length;
  return (
    <ScrollVars mode="enter" as="div" className={className}>
      <p>
        {words.map((w, i) => (
          <span
            key={`${w}-${i}`}
            style={{ opacity: `clamp(0.16, calc(var(--p) * ${n + 2} - ${i}), 1)` }}
            className="transition-opacity duration-150"
          >
            {w}
            {i < n - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </ScrollVars>
  );
}

/**
 * Cards that pass horizontally while the page scrolls vertically (desktop).
 * On phones, tablets and with reduced motion it is a normal swipeable row.
 */
export function HorizontalScroller({ children, label }: { children: ReactNode; label?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const o = outer.current;
    const t = track.current;
    if (!o || !t) return;
    let overflow = 0;
    let raf = 0;
    const measure = () => {
      overflow = Math.max(t.scrollWidth - window.innerWidth, 0);
      o.style.height = `${window.innerHeight + overflow}px`;
      update();
    };
    const update = () => {
      raf = 0;
      const r = o.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(r.height - window.innerHeight, 1));
      t.style.transform = `translate3d(${(-p * overflow).toFixed(1)}px,0,0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(3)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
      o.style.height = "";
      t.style.transform = "";
    };
  }, [pinned]);

  if (!pinned) {
    return (
      <div className="mt-10 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul
          aria-label={label}
          className="flex snap-x snap-mandatory gap-4 [&>li]:w-[82vw] [&>li]:max-w-[360px] [&>li]:shrink-0 [&>li]:snap-start"
        >
          {children}
        </ul>
      </div>
    );
  }

  return (
    <div ref={outer} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        <ul
          ref={track}
          aria-label={label}
          className="flex w-max gap-6 px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] will-change-transform [&>li]:w-[360px] [&>li]:shrink-0"
        >
          {children}
        </ul>
        <div className="bg-border mx-auto mt-10 h-[3px] w-full max-w-6xl overflow-hidden rounded-full">
          <div ref={bar} className="bg-primary h-full origin-left scale-x-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** 3D tilt that follows the pointer, with a soft light spot. Mouse/pen only. */
export function Tilt({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transition = "transform 0.12s ease-out";
    el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * max).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg) scale3d(1.015,1.015,1.015)`;
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn("group/tilt relative h-full", className)}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[var(--radius)] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.4), transparent 60%)",
        }}
      />
    </div>
  );
}

/** Drag-to-compare slider for before/after photos. Also works with the keyboard. */
export function CompareSlider({
  before,
  after,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
  width,
  height,
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  width: number;
  height: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  // little intro sweep so people notice it can be moved
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0]?.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          if (dragging.current) return;
          const p = clamp01((now - t0) / 1800);
          const e = 1 - Math.pow(1 - p, 3);
          setPos(92 - 42 * e - Math.sin(p * Math.PI * 2) * 10 * (1 - p));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        setPos(92);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const setFromEvent = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={box}
      className="surface-card group/cmp relative touch-pan-y overflow-hidden select-none"
      style={{ aspectRatio: `${width} / ${height}`, cursor: "ew-resize" }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setFromEvent(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && setFromEvent(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <img
        src={after}
        alt={afterAlt}
        width={width}
        height={height}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <img
        src={before}
        alt={beforeAlt}
        width={width}
        height={height}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className="bg-background/90 absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold">
        {beforeLabel}
      </span>
      <span className="bg-background/90 absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold">
        {afterLabel}
      </span>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ left: `${pos}%` }}
      >
        <span className="bg-background text-primary absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[var(--shadow-lift)] transition-transform group-hover/cmp:scale-110">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Confronta ${beforeLabel.toLowerCase()} e ${afterLabel.toLowerCase()}`}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--ring)]"
        style={{ appearance: "none", background: "transparent" }}
      />
    </div>
  );
}
