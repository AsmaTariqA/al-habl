import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}>
      <LoginScreen />
    </Suspense>
  );
}
