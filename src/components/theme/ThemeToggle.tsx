'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'day' : 'night'} mode`}
      className="glass-chip inline-flex h-11 w-11 items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-strong)] text-[var(--text)] shadow-[0_16px_40px_var(--shadow-deep)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
      type="button"
    >
      {theme === 'dark' ? (
        <svg
          className="h-5 w-5 text-[var(--gold)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 text-[var(--gold)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1Zm0 12a4 4 0 100-8 4 4 0 000 8Zm7-3a1 1 0 100-2h-1a1 1 0 100 2h1ZM5 10a1 1 0 10-2 0 1 1 0 002 0Zm6 6a1 1 0 10-2 0v1a1 1 0 102 0v-1ZM10 3a1 1 0 10-2 0 1 1 0 002 0Zm5.657 2.343a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707Zm-9.9 9.9a1 1 0 10-1.414-1.415l-.707.708a1 1 0 001.414 1.414l.707-.707Zm0-9.9-.707-.707A1 1 0 103.636 5.05l.707.707a1 1 0 101.414-1.414Zm9.9 9.9-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414Z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
