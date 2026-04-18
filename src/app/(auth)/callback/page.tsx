'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { session } from '@/lib/session';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }

    hasHandledCallback.current = true;

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          return;
        }

        if (!code || !state) {
          setError('Missing authorization code or state');
          return;
        }

        // Verify state matches (security check)
        const storedState = typeof window !== 'undefined'
          ? sessionStorage.getItem('oauth_state')
          : null;

        if (state !== storedState) {
          setError('State mismatch - possible CSRF attack');
          return;
        }

        const codeVerifier = typeof window !== 'undefined'
          ? sessionStorage.getItem('pkce_code_verifier')
          : null;

        if (!codeVerifier) {
          setError('Missing PKCE code verifier');
          return;
        }

        // Exchange code for tokens via our API with the PKCE verifier
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Authentication failed');
          return;
        }

        const data = await response.json();
        if (!data.success) {
          setError(data.error || 'Authentication failed');
          return;
        }

        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        localStorage.setItem('qf_user_id', data.userId);
        if (data.grantedScope) {
          sessionStorage.setItem('qf_last_granted_scope', data.grantedScope);
        } else {
          sessionStorage.removeItem('qf_last_granted_scope');
        }

        const roomResponse = await fetch('/api/circle');
        const roomData = await roomResponse.json();

        if (roomData.room?.id) {
          session.setRoomId(roomData.room.id);
          router.push('/circle');
          return;
        }

        if (roomData.scopeLimited) {
          router.push('/onboarding?scope_limited=1');
          return;
        }

        router.push('/onboarding');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-[440px] space-y-4 p-6 text-center">
          <p className="muted-kicker">Secure Sign In</p>
          <h1 className="text-3xl font-semibold text-[var(--gold)]">Signing you in...</h1>
          <p className="section-subcopy">Please wait while we reconnect your session and study space.</p>
          <div className="mx-auto flex w-fit gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card w-full max-w-[440px] space-y-5 p-6 text-center">
          <p className="muted-kicker">Sign In Issue</p>
          <h1 className="text-3xl font-semibold text-[#f0a7a0]">Authentication Failed</h1>
          <p className="section-subcopy">{error}</p>
          <a href="/auth/login" className="button-primary w-full">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return null;
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-[440px] space-y-4 p-6 text-center">
        <p className="muted-kicker">Secure Sign In</p>
        <h1 className="text-3xl font-semibold text-[var(--gold)]">Signing you in...</h1>
        <p className="section-subcopy">Please wait while we reconnect your session and study space.</p>
        <div className="mx-auto flex w-fit gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:120ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CallbackContent />
    </Suspense>
  );
}
