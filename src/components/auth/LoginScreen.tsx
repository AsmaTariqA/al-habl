"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getAuthorizationUrl } from "@/lib/auth";
import styles from "./login-screen.module.css";

const transition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function LoginScreen() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const authUrl = await getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (loginError) {
      console.error("Failed to generate auth URL:", loginError);
      setLoading(false);
    }
  };

  return (
    <main className={styles.pageShell}>
      <div className={styles.backgroundAura} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Al-Habl
        </Link>
        <ThemeToggle />
      </header>

      <section className={styles.centerStage} aria-labelledby="login-title">
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={transition}
        >
          <div className={styles.panelIntro}>
            <p className={styles.kicker}>Circle Access</p>
            <h1 id="login-title" className={styles.title}>
              Welcome to the Circle. Ready to hold fast?
            </h1>
            <p className={styles.copy}>
              Sign in through the Quran Foundation gateway to return to your ayah,
              your circle, and your shared study rhythm.
            </p>
          </div>

          {error ? (
            <div className={styles.errorBox} role="alert">
              {error === "auth_failed"
                ? "Authentication failed. Please try again."
                : "Login error. Please try again."}
            </div>
          ) : null}

          <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
            <motion.button
              type="button"
              className={styles.submit}
              onClick={handleLogin}
              disabled={loading}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.46 }}
            >
              {loading ? "Opening secure sign in..." : "Continue with Quran Foundation"}
            </motion.button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              OAuth-secured access. No distractions, no noise, only the next
              faithful step.
            </p>
            <Link href="/" className={styles.backLink}>
              Return to the landing page
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

