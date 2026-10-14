"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import "./landing.css";

function Topo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mk-topo ${className}`}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <path d="M-80 140C180 40 340 280 620 180s460-160 760 20 360 80 420-40" />
      <path d="M-80 230C200 110 380 360 680 250s430-150 720 30 340 90 400-20" />
      <path d="M-40 420C240 300 420 560 740 430s400-120 680 40" />
      <path d="M80 620C320 500 520 760 860 640s380-80 640 60" />
      <path d="M200 820C460 700 700 940 1040 800s340-40 520 80" />
      <path d="M980 40C1100 180 1040 340 1220 420s220 40 280 180-20 260 80 340" />
      <path d="M1080 80C1220 220 1140 400 1320 470s180 20 240 160" />
      <path d="M120 60C260 180 180 320 80 460" />
    </svg>
  );
}

function Arrow({ dir = "right" }: { dir?: "right" | "down" }) {
  const d = dir === "down" ? "M12 5v12M6 13l6 6 6-6" : "M5 12h12M13 6l6 6-6 6";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Landing() {
  const { t, locale, setLocale } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const hallRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLElement>(null);
  const splitRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLElement>(null);
  const menuRef = useRef(false);
  const scrollToRef = useRef<((y: number) => void) | null>(null);
  const [leave, setLeave] = useState(false);
  const [gone, setGone] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    menuRef.current = menu;
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGone(true);
      return;
    }
    const t1 = window.setTimeout(() => setLeave(true), 980);
    const t2 = window.setTimeout(() => setGone(true), 1980);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevScheme = document.documentElement.style.colorScheme;
    document.body.style.background = "#f4f4ed";
    document.documentElement.style.colorScheme = "light";
    return () => {
      document.body.style.background = prevBg;
      document.documentElement.style.colorScheme = prevScheme;
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = heroRef.current;
    const sticky = hero?.querySelector<HTMLElement>(".mk-hero-sticky");
    const hall = hallRef.current;
    const track = trackRef.current;
    const chrome = chromeRef.current;
    let live = true;
    let raf = 0;

    const measure = () => {
      if (!hall || !track || reduce) return;
      const view = hall.querySelector<HTMLElement>(".mk-hall-sticky")?.clientWidth || window.innerWidth;
      const max = Math.max(0, track.scrollWidth - view);
      hall.style.height = `${window.innerHeight + max}px`;
      hall.dataset.max = String(max);
    };

    const tick = () => {
      if (hero && sticky && !reduce) {
        const total = hero.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / total)) : 0;
        hero.style.setProperty("--p", p.toFixed(4));
        sticky.dataset.tone = p > 0.52 ? "dark" : "light";
        sticky.dataset.phase = p > 0.16 ? "line" : "title";
      }
      const quote = quoteRef.current;
      if (quote && !reduce) {
        const rect = quote.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const shift = Math.max(-64, Math.min(64, center * 0.07));
        quote.style.setProperty("--shift", shift.toFixed(2));
      }
      if (hall && track && !reduce) {
        const total = hall.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -hall.getBoundingClientRect().top / total)) : 0;
        const max = Number(hall.dataset.max || 0);
        track.style.transform = `translate3d(${(-p * max).toFixed(2)}px,0,0)`;
      }
      if (chrome) {
        if (menuRef.current) {
          chrome.dataset.tone = "dark";
        } else {
          const hit = document.elementsFromPoint(window.innerWidth / 2, 96).find((el) => {
            return !el.closest(".mk-chrome, .mk-menu, .mk-loader");
          });
          const zone = hit?.closest<HTMLElement>("[data-tone]");
          chrome.dataset.tone = zone?.dataset.tone || "light";
        }
      }
    };

    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (live) tick();
        });
      }
    };

    measure();
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("resize", onScroll);
    document.fonts?.ready.then(() => {
      if (!live) return;
      measure();
      tick();
    });

    const watch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.28 },
    );
    [quoteRef.current, splitRef.current, closeRef.current].forEach((el) => {
      if (el) watch.observe(el);
    });

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("resize", onScroll);
      watch.disconnect();
    };
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let fromUs = false;
    let last = performance.now();

    const limit = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const step = (now: number) => {
      const dt = Math.min(34, now - last);
      last = now;
      const dest = Math.min(limit(), Math.max(0, target));
      target = dest;
      const gain = 1 - Math.pow(0.78, dt / 16.67);
      current += (dest - current) * gain;
      if (Math.abs(dest - current) < 0.35) current = dest;
      fromUs = true;
      window.scrollTo(0, current);
      fromUs = false;
      if (current !== dest) frame = requestAnimationFrame(step);
      else frame = 0;
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    scrollToRef.current = (y: number) => {
      target = y;
      kick();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      if (menuRef.current) return;
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      if (event.deltaMode === 2) dy *= window.innerHeight;
      target = Math.min(limit(), Math.max(0, target + dy));
      kick();
    };

    const onKey = (event: KeyboardEvent) => {
      if (menuRef.current) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        (active.tagName === "BUTTON" ||
          active.tagName === "A" ||
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA")
      ) {
        return;
      }
      const page = window.innerHeight * 0.86;
      const amount =
        event.key === "ArrowDown" ? 72
        : event.key === "ArrowUp" ? -72
        : event.key === "PageDown" ? page
        : event.key === "PageUp" ? -page
        : event.key === " " ? (event.shiftKey ? -page : page)
        : null;
      if (event.key === "Home") {
        event.preventDefault();
        target = 0;
        kick();
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        target = limit();
        kick();
        return;
      }
      if (amount == null) return;
      event.preventDefault();
      target = Math.min(limit(), Math.max(0, target + amount));
      kick();
    };

    const onNativeScroll = () => {
      if (fromUs) return;
      current = target = window.scrollY;
    };

    const onClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      event.preventDefault();
      target = el.getBoundingClientRect().top + window.scrollY;
      kick();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      scrollToRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onNativeScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dismiss = () => {
    setLeave(true);
    window.setTimeout(() => setGone(true), 900);
  };

  const closeMenu = () => setMenu(false);

  const frames = [
    { name: t("landing.ch1"), kind: t("landing.ch1k"), tone: "cream" },
    { name: t("landing.ch2"), kind: t("landing.ch2k"), tone: "lime" },
    { name: t("landing.ch3"), kind: t("landing.ch3k"), tone: "olive" },
    { name: t("landing.ch4"), kind: t("landing.ch4k"), tone: "ink" },
  ] as const;

  const steps = [1, 2, 3, 4, 5].map((n) => ({
    n: String(n).padStart(2, "0"),
    title: t(`landing.step${n}`),
    desc: t(`landing.step${n}Desc`),
  }));

  const marquee = `${t("landing.marquee")}${t("landing.marquee")}`;

  return (
    <div className="mk-home">
      {gone ? null : (
        <button
          type="button"
          className={`mk-loader${leave ? " is-leave" : ""}`}
          onClick={dismiss}
          aria-label={t("landing.skip")}
        >
          <span>Load Markestra</span>
        </button>
      )}

      <header className="mk-chrome" ref={chromeRef} data-tone="light">
        <Link href="/login" className="mk-pill">
          <Arrow />
          {t("landing.enter")}
        </Link>
        <button
          type="button"
          className="mk-menu-btn"
          aria-expanded={menu}
          aria-label={menu ? t("landing.close") : t("landing.menu")}
          onClick={() => setMenu((open) => !open)}
        >
          <i className="mk-burger" />
        </button>
      </header>

      <div className={`mk-menu${menu ? " is-open" : ""}`} data-tone="dark">
        <nav>
          <a className="mk-menu-link" href="#split" onClick={closeMenu}>{t("landing.splitShop")}</a>
          <a className="mk-menu-link" href="#hall" onClick={closeMenu}>{t("landing.splitPromote")}</a>
          <a className="mk-menu-link" href="#flow" onClick={closeMenu}>{t("landing.navFlow")}</a>
          <Link className="mk-menu-link" href="/shop" onClick={closeMenu}>{t("landing.secondaryCta")}</Link>
          <Link className="mk-menu-link" href="/login" onClick={closeMenu}>{t("landing.signin")}</Link>
        </nav>
        <div className="mk-menu-foot">
          <button
            type="button"
            className="mk-lang"
            aria-pressed={locale === "zh"}
            onClick={() => setLocale("zh")}
          >
            中文
          </button>
          <button
            type="button"
            className="mk-lang"
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            English
          </button>
        </div>
      </div>

      <section className="mk-hero" ref={heroRef} data-tone="light">
        <div className="mk-hero-sticky" data-tone="light">
          <div className="mk-hero-wash" />
          <Topo />
          <Topo className="mk-topo-on-dark" />
          <div className="mk-hero-copy">
            <p className="mk-kicker">{t("landing.heroKicker")}</p>
            <h1 className="mk-brand">
              <img
                className="mk-lockup"
                src="/brand/logo-light.png"
                alt={t("landing.heroGiant")}
                width={888}
                height={183}
                draggable={false}
              />
            </h1>
            <p className="mk-hero-line">{t("landing.heroLine")}</p>
          </div>
          <div className="mk-manifest">
            <p>{t("landing.m1")}</p>
            <p className="is-lime">{t("landing.m2")}</p>
            <p>{t("landing.m3")}</p>
            <p className="is-lime">{t("landing.m4")}</p>
          </div>
          <Link href="/shop" className="mk-next">
            <span className="mk-next-k">{t("landing.nextLabel")}</span>
            <strong>{t("landing.nextName")}</strong>
            <span className="mk-next-meta">{t("landing.nextMeta")}</span>
          </Link>
          <button
            type="button"
            className="mk-continue"
            onClick={() => {
              const el = quoteRef.current;
              if (!el) return;
              const y = el.getBoundingClientRect().top + window.scrollY;
              if (scrollToRef.current) scrollToRef.current(y);
              else window.scrollTo({ top: y, behavior: "smooth" });
            }}
          >
            <span>{t("landing.continue")}</span>
            <i className="mk-lime-btn">
              <Arrow dir="down" />
            </i>
          </button>
        </div>
      </section>

      <section className="mk-quote" id="story" ref={quoteRef} data-tone="light">
        <Topo />
        <div className="mk-rise">
          <p className="mk-poster-cap">{t("landing.posterCap")}</p>
          <article className="mk-print">
            <p className="mk-print-tag">{t("landing.posterTag")}</p>
            <h3>{t("landing.posterName")}</h3>
            <strong>{t("landing.posterPrice")}</strong>
            <em>{t("landing.posterNote")}</em>
          </article>
        </div>
        <div className="mk-rise">
          <blockquote>{t("landing.quote")}</blockquote>
          <p className="mk-quote-by">{t("landing.quoteBy")}</p>
        </div>
      </section>

      <div className="mk-marquee" data-tone="light" aria-hidden>
        <div className="mk-marquee-track">
          <span>{marquee}</span>
          <span>{marquee}</span>
        </div>
      </div>

      <section className="mk-split" id="split" ref={splitRef} data-tone="light">
        <Topo />
        <article className="mk-rise">
          <p className="mk-split-k">{t("landing.splitShopK")}</p>
          <h2>{t("landing.splitShop")}</h2>
          <p>{t("landing.whyMarketDesc")}</p>
          <Link href="/shop" className="mk-lime-btn" aria-label={t("landing.secondaryCta")}>
            <Arrow />
          </Link>
        </article>
        <article className="mk-rise">
          <p className="mk-split-k">{t("landing.splitPromoteK")}</p>
          <h2>{t("landing.splitPromote")}</h2>
          <p>{t("landing.whyOrchestraDesc")}</p>
          <a href="#hall" className="mk-lime-btn" aria-label={t("landing.splitPromote")}>
            <Arrow />
          </a>
        </article>
      </section>

      <section className="mk-hall-intro" id="hall" data-tone="dark">
        <Topo />
        <p className="mk-hall-k">{t("landing.hallK")}</p>
        <h2>{t("landing.hall")}</h2>
        <p>{t("landing.hallSub")}</p>
      </section>

      <section className="mk-hall" ref={hallRef} data-tone="dark" aria-label={t("landing.hall")}>
        <div className="mk-hall-sticky">
          <div className="mk-hall-track" ref={trackRef}>
            {frames.map((frame, index) => (
              <article key={frame.name} className={`mk-frame mk-frame-${frame.tone}`}>
                <div className="mk-tab">
                  <span>{frame.name}</span>
                  <span className="is-lime">{frame.kind}</span>
                </div>
                <div className="mk-poster">
                  <small>{t("landing.posterTag")}</small>
                  <h3>{t("landing.posterName")}</h3>
                  {index === 3 ? (
                    <b className="mk-poster-index">04</b>
                  ) : (
                    <strong>{t("landing.posterPrice")}</strong>
                  )}
                </div>
                <div className="mk-tab mk-tab-bottom">
                  <span>{t("landing.posterNote")}</span>
                  <span className="is-lime">2026</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-flow-sec" id="flow" data-tone="light">
        <h2>{t("landing.flowTitle")}</h2>
        <ol className="mk-flow">
          {steps.map((step) => (
            <li key={step.n}>
              <span className="mk-flow-n">{step.n}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mk-close" ref={closeRef} data-tone="dark">
        <Topo />
        <h2 className="mk-rise">
          {t("landing.closeK")}
          <br />
          <em>{t("landing.closeH")}</em>
        </h2>
        <div className="mk-close-row mk-rise">
          <Link href="/login" className="mk-pill">
            <Arrow />
            {t("landing.primaryCta")}
          </Link>
          <p>{t("landing.finalSub")}</p>
        </div>
        <footer className="mk-foot">
          <Logo variant="dark" className="mk-foot-logo" />
          <nav>
            <Link href="/shop">{t("landing.secondaryCta")}</Link>
            <Link href="/login">{t("landing.signin")}</Link>
            <a href="#flow">{t("landing.navFlow")}</a>
          </nav>
          <span>© {new Date().getFullYear()} Markestra</span>
        </footer>
      </section>
    </div>
  );
}
