"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("clubby_admin")) {
      router.push("/");
    } else {
      setAuthed(true);
    }
  }, [router]);

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-cream pt-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-[var(--font-heading)] text-3xl font-bold text-charcoal mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mb-8">Manage clubs, fitting rules, and site content.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Club Database */}
          <a href="/admin/clubs" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition block">
            <div className="text-3xl mb-3">🏌️</div>
            <h2 className="font-semibold text-lg text-charcoal mb-1">Club Database</h2>
            <p className="text-sm text-gray-500 mb-4">View, add, edit, and remove golf clubs and sets.</p>
            <span className="text-sm text-masters-green font-medium">Manage →</span>
          </a>

          {/* Fitting Algorithm */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="text-3xl mb-3">📐</div>
            <h2 className="font-semibold text-lg text-charcoal mb-1">Fitting Rules</h2>
            <p className="text-sm text-gray-500 mb-4">Adjust size thresholds, age brackets, and recommendations.</p>
            <span className="text-xs text-gray-400 italic">Coming soon</span>
          </div>

          {/* Analytics */}
          <a href="/admin/analytics" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition block">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="font-semibold text-lg text-charcoal mb-1">Analytics</h2>
            <p className="text-sm text-gray-500 mb-4">View fitting completions, popular sizes, and traffic.</p>
            <span className="text-sm text-masters-green font-medium">View →</span>
          </a>
        </div>
      </div>
    </main>
  );
}
