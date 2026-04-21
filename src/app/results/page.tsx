"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FitData } from "@/context/FitContext";
import { getRecommendation } from "@/lib/recommend";

const sampleData: FitData = {
  age: "10", gender: "male", hand: "right",
  heightFeet: "4", heightInches: "6", wristToFloor: "24", armLength: "22",
  skill: "beginner", budgetMin: "150", budgetMax: "300", brandPref: "No Preference",
};

export default function ResultsPage() {
  const [data, setData] = useState<FitData | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("clubby-fit");
    setData(stored ? JSON.parse(stored) : sampleData);
  }, []);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        setRevealed(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#006747", "#C8A951", "#E8D48B", "#1A8A64"] });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  const rec = getRecommendation(data);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-charcoal">Your Perfect Set is Ready!</h1>
          <p className="mt-3 text-gray-600">Based on your measurements, here&apos;s what we recommend.</p>
        </motion.div>

        {/* Fit Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={revealed ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-[var(--font-heading)] text-xl font-bold text-masters-green mb-3">Fit Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Height</div>
              <div className="font-[var(--font-mono)] font-semibold text-charcoal">{data.heightFeet}&apos;{data.heightInches}&quot;</div>
            </div>
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Age</div>
              <div className="font-[var(--font-mono)] font-semibold text-charcoal">{data.age} yrs</div>
            </div>
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Skill</div>
              <div className="font-semibold text-charcoal capitalize">{data.skill}</div>
            </div>
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Hand</div>
              <div className="font-semibold text-charcoal capitalize">{data.hand}</div>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {rec.fitNotes.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-masters-green mt-0.5">✓</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Set */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={revealed ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-masters-green">{rec.setName}</h2>
            <span className="text-2xl font-bold text-gold font-[var(--font-mono)]">{rec.totalPrice}</span>
          </div>
          <div className="space-y-3">
            {rec.clubs.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={revealed ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-cream/60 hover:bg-cream transition">
                <div className="w-10 h-10 rounded-full bg-masters-green/10 flex items-center justify-center text-masters-green font-bold text-xs shrink-0">
                  {c.type.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.brand} · {c.detail}</div>
                </div>
                <div className="font-[var(--font-mono)] text-sm text-masters-green font-medium shrink-0">{c.length}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0 }} animate={revealed ? { opacity: 1 } : {}} transition={{ delay: 0.8 }} className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 py-3 rounded-full bg-gold text-charcoal font-semibold text-center hover:bg-soft-gold transition">
            Shop This Set →
          </button>
          <button className="flex-1 py-3 rounded-full border-2 border-masters-green text-masters-green font-semibold text-center hover:bg-masters-green/5 transition">
            Save Results
          </button>
          <Link href="/fit" className="flex-1 py-3 rounded-full border-2 border-gray-300 text-gray-600 font-semibold text-center hover:border-gray-400 transition">
            Start Over
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
