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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#C9A84C]">Al-Habl</h1>
          <p className="text-[#8A8278]">The Rope of Allah</p>
          <p className="text-sm text-[#8A8278] mt-4">
            Join a circle of 4–5 real humans studying one ayah daily.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-sm">
            {error === 'auth_failed' && 'Authentication failed. Please try again.'}
            {error === 'missing_code' && 'Invalid authorization response.'}
            {error && !['auth_failed', 'missing_code'].includes(error) && error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-[#C9A84C] hover:bg-[#D4B260] text-[#0F0E0C] font-semibold rounded transition"
        >
          Sign in with Quran Foundation
        </button>

        {/* Footer */}
        <p className="text-xs text-center text-[#8A8278]">
          We use Quran Foundation OAuth for secure, private authentication.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-[#C9A84C]">Al-Habl</h1>
            <p className="text-[#8A8278]">The Rope of Allah</p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
