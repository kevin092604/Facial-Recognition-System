"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EntryRegistration } from "@/components/entry-registration";

function EntryRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userData = useMemo(() => {
    const sid = searchParams.get("sid");
    if (!sid) return {};

    const data = sessionStorage.getItem(`session_${sid}`);
    if (!data) return {};

    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push("/");
  };

  const handleComplete = () => {
    router.push("/");
  };

  return (
    <EntryRegistration
      userData={userData}
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
}

export default function EntryRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003876]"></div></div>}>
      <main className="min-h-screen">
        <EntryRegistrationContent />
      </main>
    </Suspense>
  );
}
