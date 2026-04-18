'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // After successful login
const username = data.name || data.userId
localStorage.setItem("qf_username", username)

        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        localStorage.setItem('qf_token', data.access_token);
        localStorage.setItem('qf_user_id', data.userId);

        router.push('/circle');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#C9A84C]">Signing you in...</h1>
          <p className="text-[#8A8278]">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Authentication Failed</h1>
          <p className="text-[#8A8278]">{error}</p>
          <a href="/auth/login" className="text-[#C9A84C] hover:underline">
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#C9A84C]">Signing you in...</h1>
        <p className="text-[#8A8278]">Please wait</p>
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
