"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FitData } from "@/context/FitContext";
import { getRecommendations, Recommendation, FitInput } from "@/lib/recommend";
import { trackEvent } from "@/lib/analytics";

function fitDataToInput(data: FitData): FitInput {
  const heightInches =
    (parseInt(data.heightFeet) || 0) * 12 + (parseInt(data.heightInches) || 0);
  const wtf = data.wristToFloor ? parseFloat(data.wristToFloor) : undefined;

  let budget: FitInput["budget"] = "any";
  const maxB = parseInt(data.budgetMax) || 9999;
  if (maxB <= 150) budget = "budget";
  else if (maxB <= 350) budget = "mid";
  else if (maxB <= 600) budget = "premium";

  return {
    age: parseInt(data.age) || 8,
    heightInches,
    wristToFloor: wtf,
    skillLevel: (data.skill as FitInput["skillLevel"]) || "beginner",
    hand: (data.hand as "right" | "left") || "right",
    budget,
    fitType: (data.fitType as "set" | "individual") || "set",
    clubType: data.clubType || undefined,
  };
}

const sampleData: FitData = {
  fitType: "set", clubType: "",
  age: "10", gender: "male", hand: "right",
  heightFeet: "4", heightInches: "6", wristToFloor: "24", armLength: "22",
  skill: "beginner", budgetMin: "150", budgetMax: "300", brandPref: "No Preference",
};

const fitBadge = { perfect: "🏆 Best Fit", good: "👍 Great Fit", acceptable: "✅ Solid Option" };
const fitColor = { perfect: "bg-masters-green text-white", good: "bg-gold/20 text-charcoal", acceptable: "bg-gray-100 text-gray-600" };

export default function ResultsPage() {
  const [data, setData] = useState<FitData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("clubby-fit");
    const d = stored ? JSON.parse(stored) : sampleData;
    setData(d);
    const results = getRecommendations(fitDataToInput(d));
    setRecs(results);
    trackEvent("result_view", {
      topBrand: results[0]?.club.brand,
      topModel: results[0]?.club.setName,
      topScore: results[0]?.score,
    });
  }, []);

  useEffect(() => {
    if (recs.length > 0) {
      const timer = setTimeout(() => {
        setRevealed(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#006747", "#C8A951", "#E8D48B", "#1A8A64"] });
      }, 600);
      return () => clearTimeout(timer);
    } else if (data) {
      // Still reveal the profile section even with no results
      setRevealed(true);
    }
  }, [recs, data]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-charcoal">
            {data.fitType === "individual" && data.clubType
              ? `Best ${data.clubType} Options`
              : "Your Perfect Clubs!"}
          </h1>
          <p className="mt-3 text-gray-600">
            {data.fitType === "individual" && data.clubType
              ? `Sets that include a ${data.clubType} matched to your measurements.`
              : `Based on your measurements, here are our top ${recs.length} recommendations.`}
          </p>
        </motion.div>

        {/* Fit Profile Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={revealed ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="font-[var(--font-heading)] text-lg font-bold text-masters-green mb-3">Fit Profile</h2>
          <div className={`grid grid-cols-2 ${data.fitType === "individual" ? "md:grid-cols-5" : "md:grid-cols-4"} gap-4 text-sm`}>
            {data.fitType === "individual" && data.clubType && (
              <div className="bg-masters-green/10 rounded-xl p-3 text-center">
                <div className="text-gray-500 text-xs">Looking For</div>
                <div className="font-semibold text-masters-green">{data.clubType}</div>
              </div>
            )}
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Height</div>
              <div className="font-semibold text-charcoal">{data.heightFeet}&apos;{data.heightInches}&quot;</div>
            </div>
            <div className="bg-cream rounded-xl p-3 text-center">
              <div className="text-gray-500 text-xs">Age</div>
              <div className="font-semibold text-charcoal">{data.age} yrs</div>
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
        </motion.div>

        {/* No results state */}
        {recs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-8 shadow-sm text-center mb-8">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-charcoal mb-2">No exact matches found</h2>
            <p className="text-gray-500 mb-6">
              {data.fitType === "individual" && data.clubType
                ? `We couldn't find a ${data.clubType} that matches your measurements. Try browsing our full catalog or adjusting your preferences.`
                : "We couldn't find sets that match your measurements. Try adjusting your height, age, or preferences."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/fit" className="px-6 py-3 rounded-full bg-masters-green text-white font-semibold hover:bg-deep-green transition">
                Try Again
              </a>
              <a href="/clubs" className="px-6 py-3 rounded-full border-2 border-masters-green text-masters-green font-semibold hover:bg-masters-green/5 transition">
                Browse All Clubs
              </a>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <div className="space-y-6 mb-10">
          {recs.map((rec, i) => (
            <motion.div
              key={rec.club.id}
              initial={{ opacity: 0, y: 30 }}
              animate={revealed ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${i === 0 ? "border-masters-green" : "border-transparent"}`}
            >
              {/* Product Image */}
              {rec.club.image && (
                <div className="relative w-full h-52 mb-4 rounded-xl overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={rec.club.image}
                    alt={`${rec.club.brand} ${rec.club.setName}`}
                    className="max-h-full max-w-full object-contain p-3"
                    loading="lazy"
                  />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 bg-masters-green text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      🏆 Best Match
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${fitColor[rec.fit]}`}>
                      {fitBadge[rec.fit]}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Score: {rec.score}/100</span>
                  </div>
                  <h3 className="font-[var(--font-heading)] text-xl font-bold text-charcoal">
                    {rec.club.brand} {rec.club.setName}
                  </h3>
                  <p className="text-sm text-gray-500">{rec.club.model}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-masters-green font-mono">${rec.club.price}</div>
                  <div className="text-xs text-gray-400">{rec.club.tier}</div>
                </div>
              </div>

              {/* Clubs in set */}
              <div className="flex flex-wrap gap-2 mb-4">
                {rec.club.clubs.map((c) => {
                  const isTarget = data.fitType === "individual" && data.clubType && c.toLowerCase() === data.clubType.toLowerCase();
                  return (
                    <span key={c} className={`text-xs px-2.5 py-1 rounded-full font-medium ${isTarget ? "bg-masters-green text-white ring-2 ring-masters-green/30" : "bg-cream text-charcoal"}`}>
                      {isTarget ? `★ ${c}` : c}
                    </span>
                  );
                })}
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div className="bg-cream rounded-lg p-2 text-center">
                  <div className="text-gray-500">Shaft</div>
                  <div className="font-semibold text-charcoal">{rec.club.shaftFlex}</div>
                </div>
                <div className="bg-cream rounded-lg p-2 text-center">
                  <div className="text-gray-500">Grip</div>
                  <div className="font-semibold text-charcoal">{rec.club.gripSize}</div>
                </div>
                <div className="bg-cream rounded-lg p-2 text-center">
                  <div className="text-gray-500">For Heights</div>
                  <div className="font-semibold text-charcoal">{rec.club.targetHeight[0]}&quot;–{rec.club.targetHeight[1]}&quot;</div>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-1">
                {rec.reasons.map((r, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-masters-green mt-0.5 shrink-0">✓</span>
                    <span>{r}</span>
                  </div>
                ))}
                {rec.sizeNote && (
                  <div className="flex items-start gap-2 text-sm text-amber-600">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{rec.sizeNote}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {rec.club.notes && (
                <p className="mt-3 text-xs text-gray-400 italic">{rec.club.notes}</p>
              )}

              {/* CTA */}
              <a
                href={rec.club.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("shop_click", { brand: rec.club.brand, model: rec.club.setName, price: rec.club.price })}
                className="mt-4 block w-full py-2.5 rounded-full bg-gold text-charcoal font-semibold text-sm text-center hover:bg-soft-gold transition"
              >
                Shop {rec.club.brand} →
              </a>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTAs */}
        <motion.div initial={{ opacity: 0 }} animate={revealed ? { opacity: 1 } : {}} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-3">
          <Link href="/fit" className="flex-1 py-3 rounded-full border-2 border-masters-green text-masters-green font-semibold text-center hover:bg-masters-green/5 transition">
            Start Over
          </Link>
          <Link href="/learn" className="flex-1 py-3 rounded-full border-2 border-gray-300 text-gray-600 font-semibold text-center hover:border-gray-400 transition">
            Learn About Junior Fitting
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
