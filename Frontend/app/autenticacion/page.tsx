"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PasswordAuthentication } from "@/components/password-authentication";

function AuthenticationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sid = searchParams.get("sid");
    if (!sid) {
      router.replace("/");
      return;
    }

    const data = sessionStorage.getItem(`session_${sid}`);
    if (!data) {
      router.replace("/");
      return;
    }

    setUserData(JSON.parse(data));
    setLoading(false);
  }, [searchParams, router]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876] mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando sesión...</p>
        </div>
      </div>
    );
  }

  const handleAuthenticated = () => {
    const newSessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem(`session_${newSessionId}`, JSON.stringify(userData));
    router.push(`/dashboard?sid=${newSessionId}`);
  };

  const handleBack = () => {
    const sid = searchParams.get("sid");
    if (sid) sessionStorage.removeItem(`session_${sid}`);
    router.push("/");
  };

  return (
    <PasswordAuthentication
      userData={userData}
      onBack={handleBack}
      onAuthenticated={handleAuthenticated}
    />
  );
}

export default function AuthenticationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876] mx-auto"></div><p className="mt-4 text-gray-600">Validando sesión...</p></div></div>}>
      <main className="min-h-screen">
        <AuthenticationContent />
      </main>
    </Suspense>
  );
}
