"use client"

// src/app/(marketing)/landing-page.tsx  OR  src/components/LandingPage.tsx
// ─────────────────────────────────────────────────────────────────
// FIXES:
//   1. useCountUp called inside .map() → ILLEGAL. Extracted to StatCard component.
//   2. Framer Motion word-reveal runs fine client-side with "use client" at top.
//   3. mounted state prevents any SSR/client mismatch.
//   4. ThemeToggle visible in nav.
//   5. Light/dark theme both work via CSS variables.
// ─────────────────────────────────────────────────────────────────

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import styles from "./landing-page.module.css"

// ── Data ──────────────────────────────────────────────────────────
const heroWords = ["Hold", "firmly", "together", "to", "the", "rope", "of", "Allah"]

const stats = [
  { value: 1, label: "Ayah", sub: "shared each day" },
  { value: 5, label: "Lenses", sub: "to guide reflection" },
  { value: 5, label: "Members", sub: "per intimate circle" },
]

const features = [
  {
    index: "01",
    title: "Daily Ayah Rhythm",
    body: "One ayah anchors every circle session. No decisions, no distractions — just a single revealed focus, shared by everyone.",
  },
  {
    index: "02",
    title: "Five Guided Lenses",
    body: "Vocabulary, structure, context, audience, and relevance. Each lens unlocks a different dimension of the verse without overwhelming beginners.",
  },
  {
    index: "03",
    title: "Human Accountability",
    body: "Your circle of 4–5 real people will notice if you don't show up. No algorithm. No notifications. Just companions.",
  },
]

const miniPanels = [
  { title: "Read Together", body: "Open the ayah together. No debates, just listening and reading with care." },
  { title: "Reflect Slowly", body: "Use the lens prompts to slow down, notice structure, and connect meaning." },
  { title: "Return Tomorrow", body: "One verse a day. Consistency builds depth without burnout." },
]

// ── Stat card — hooks at component level, not inside .map() ───────
// This was the bug: useCountUp was being called inside stats.map()
// inside LandingPage — that violates Rules of Hooks.
// Fix: extract to its own component so the hook call is at the top level.
function StatCard({ value, label, sub }: { value: number; label: string; sub: string }) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const duration = 900
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(value * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>
        {mounted ? count : value} {label}
      </p>
      <p className={styles.statLabel}>{sub}</p>
    </div>
  )
}

// ── Scroll-reveal wrapper ─────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className={styles.pageShell}>
      <div className={styles.backgroundAura} aria-hidden="true" />
      <div className={styles.gridGlow} aria-hidden="true" />

      {/* ── Nav ── */}
      <header className={styles.topBar}>
        <div className={`${styles.navBar} ${scrolled ? styles.navBarScrolled : ""}`}>
          <div>
            <Link href="/" className={styles.brand}>Al-Habl</Link>
            <p className={styles.brandMeta}>Quranic Circle Platform</p>
          </div>
          <nav className={styles.navActions}>
            <ThemeToggle />
            <Link href="/auth/login" className="button-secondary">
              Enter the Circle
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>

          {/* Copy */}
          <motion.div
            className={styles.heroCopy}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={styles.eyebrow}>Your daily rope · Ali ʿImrān 3:103</p>

            <h1 className={styles.heroTitle} aria-label={heroWords.join(" ")}>
              {heroWords.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className={styles.wordMask}
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ delay: i * 0.075, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className={`${styles.word} ${word === "rope" ? styles.highlight : ""}`}>
                    {word}
                  </span>
                  {i < heroWords.length - 1 ? "\u00A0" : ""}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className={styles.heroBody}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              Al-Habl keeps a small circle of believers aligned on the same ayah, the same lenses,
              and the same rhythm. Quiet, daily, and deeply communal.
            </motion.p>

            <motion.div
              className={styles.heroActions}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/auth/login" className="button-primary">Enter the Circle →</Link>
              <Link href="#how" className="button-secondary">See the rhythm</Link>
            </motion.div>

            {/* Stats — each StatCard is its own component, hooks are fine */}
            <motion.div
              className={styles.statRow}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {stats.map((s) => (
                <StatCard key={s.label} value={s.value} label={s.label} sub={s.sub} />
              ))}
            </motion.div>
          </motion.div>

          {/* Panel */}
          <motion.div
            className={styles.heroPanel}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={styles.panelKicker}>Today in the circle</p>
            <div className={styles.panelVerse}>
              <p className={styles.panelVerseRef}>Al-Imran · 3:103</p>
              <p
                className={styles.panelVerseArabic}
                dir="rtl"
                translate="no"
              >
                وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا
              </p>
              <p className={styles.panelVerseBody}>
                &ldquo;Hold firmly to the rope of Allah all together and do not become divided.&rdquo;
              </p>
            </div>
            <div className={styles.pillarList}>
              {[
                { label: "1 Ayah", detail: "One ayah chosen for every circle, shared at the same time." },
                { label: "5 Lenses", detail: "Guided prompts that keep reflection focused and gentle." },
                { label: "5 Companions", detail: "A small trusted group that helps you return each day." },
              ].map((p) => (
                <div key={p.label} className={styles.pillarItem}>
                  <p className={styles.pillarLabel}>{p.label}</p>
                  <p className={styles.pillarDetail}>{p.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.sectionBlock} id="how">
        <Reveal className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>How it works</p>
          <h2 className={styles.sectionTitle}>A gentle structure for daily return</h2>
          <p className={styles.sectionBody}>
            We keep everything small and intentional. No feeds, no endless content —
            just a daily verse and a place to show up for each other.
          </p>
        </Reveal>
        <div className={styles.featureGrid}>
          {features.map((feature, idx) => (
            <Reveal key={feature.index} delay={idx * 0.08}>
              <div className={styles.featureCard}>
                <p className={styles.featureIndex}>{feature.index}</p>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Dual panel ── */}
      <section className={styles.sectionBlock}>
        <div className={styles.dualPanel}>
          <Reveal className={styles.contentPanel}>
            <p className={styles.sectionKicker}>Circle rhythm</p>
            <h3 className={styles.sectionTitle}>What a day inside Al-Habl feels like</h3>
            <p className={styles.sectionBody}>
              Every day is the same simple arc. Read, reflect, respond, and return.
              The design is quiet so the Quran can be loud.
            </p>
            <div className={styles.miniGrid}>
              {miniPanels.map((panel) => (
                <div key={panel.title} className={styles.miniCard}>
                  <p className={styles.miniTitle}>{panel.title}</p>
                  <p className={styles.miniBody}>{panel.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className={styles.quotePanel}>
            <p className={styles.quoteMark}>&ldquo;</p>
            <p className={styles.quoteText}>
              The circle is not a class. It is a covenant: to show up with the ayah,
              again and again, until it rewrites us.
            </p>
            <p className={styles.panelKicker} style={{ marginTop: "1rem" }}>Circle ethos</p>
          </Reveal>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className={styles.sectionBlock}>
        <Reveal>
          <div className={styles.ctaBanner}>
            <h2 className={styles.ctaTitle}>Ready to hold the rope together?</h2>
            <p className={styles.ctaBody}>
              Create a circle in minutes. Invite your companions. The first ayah drops tomorrow.
            </p>
            <Link href="/auth/login" className="button-primary">
              Start Your Circle →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <p className={styles.footerBrand}>Al-Habl</p>
            <p className={styles.footerCopy}>
              A disciplined Quran circle for companions who return daily.
              Built with reverence and simplicity.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/auth/login">Sign in</Link>
            <Link href="/onboarding">Create a circle</Link>
            <Link href="#how">How it works</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
