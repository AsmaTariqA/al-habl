'use client';

import { Suspense } from 'react';
import { getAuthorizationUrl } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleLogin = async () => {
    const authUrl = await getAuthorizationUrl();
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] px-6 transition-colors duration-300">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(0,0,0,0.08)] p-8 space-y-8 backdrop-blur-xl">

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="text-4xl font-semibold tracking-tight text-[var(--gold)]">
              Al-Habl
            </div>

            <p className="text-sm text-[var(--muted)]">
              The Rope of Allah
            </p>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Join a circle of 4–5 real humans studying one ayah daily with reflection and intention.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error === 'auth_failed' && 'Authentication failed. Please try again.'}
              {error === 'missing_code' && 'Invalid authorization response.'}
              {error && !['auth_failed', 'missing_code'].includes(error) && error}
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleLogin}
            className="
              w-full rounded-xl py-3.5 font-medium
              bg-[var(--gold)] text-black
              hover:bg-[var(--gold-hover)]
              active:scale-[0.98]
              transition-all duration-200
              shadow-[0_10px_30px_rgba(201,168,76,0.25)]
            "
          >
            Sign in with Quran Foundation
          </button>

          {/* Footer */}
          <p className="text-xs text-center text-[var(--muted)] leading-relaxed">
            Secure authentication powered by Quran Foundation OAuth2. Your data remains private.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="text-[var(--muted)]">Loading…</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}