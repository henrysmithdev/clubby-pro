"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFit } from "@/context/FitContext";
import { trackEvent } from "@/lib/analytics";

const CLUB_TYPES = [
  { val: "Driver", icon: "🏌️" },
  { val: "3 Wood", icon: "🪵" },
  { val: "Fairway Wood", icon: "🪵" },
  { val: "5 Hybrid", icon: "🔀" },
  { val: "Hybrid", icon: "🔀" },
  { val: "Rescue", icon: "🔀" },
  { val: "4 Iron", icon: "🏗️" },
  { val: "5 Iron", icon: "🏗️" },
  { val: "6 Iron", icon: "🏗️" },
  { val: "7 Iron", icon: "⛳" },
  { val: "8 Iron", icon: "⛳" },
  { val: "9 Iron", icon: "⛳" },
  { val: "PW", icon: "🎯" },
  { val: "SW", icon: "🏖️" },
  { val: "Putter", icon: "🕳️" },
];

const stepTitles = ["Type", "Basic Info", "Measurements", "Skill Level", "Preferences"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex justify-between mb-2">
        {stepTitles.map((t, i) => (
          <span key={i} className={`text-xs font-medium ${i <= step ? "text-masters-green" : "text-gray-400"}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-masters-green to-fairway rounded-full"
          animate={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

function StepType() {
  const { data, update } = useFit();
  return (
    <div className="space-y-6">
      <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold text-charcoal">What are you looking for?</h2>
      <p className="text-gray-600 text-sm">Choose whether you need a complete set or a specific individual club.</p>
      <div className="grid gap-4">
        <button
          onClick={() => update({ fitType: "set", clubType: "" })}
          className={`text-left p-5 rounded-2xl border-2 transition ${data.fitType === "set" ? "border-masters-green bg-masters-green/5" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎒</span>
            <div>
              <div className={`font-semibold text-lg ${data.fitType === "set" ? "text-masters-green" : "text-charcoal"}`}>Complete Set</div>
              <div className="text-sm text-gray-500">Everything you need — driver, irons, putter, and bag</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => update({ fitType: "individual" })}
          className={`text-left p-5 rounded-2xl border-2 transition ${data.fitType === "individual" ? "border-masters-green bg-masters-green/5" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏌️</span>
            <div>
              <div className={`font-semibold text-lg ${data.fitType === "individual" ? "text-masters-green" : "text-charcoal"}`}>Individual Club</div>
              <div className="text-sm text-gray-500">Looking for a specific club — driver, iron, wedge, or putter</div>
            </div>
          </div>
        </button>
      </div>

      {/* Club type selector — shown when individual is selected */}
      {data.fitType === "individual" && (
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Which club?</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CLUB_TYPES.map((c) => (
              <button
                key={c.val}
                onClick={() => update({ clubType: c.val })}
                className={`py-3 px-2 rounded-xl border-2 text-center transition ${
                  data.clubType === c.val
                    ? "border-masters-green bg-masters-green/10 text-masters-green"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="text-lg">{c.icon}</div>
                <div className="text-xs font-medium mt-0.5">{c.val}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBasic() {
  const { data, update } = useFit();
  return (
    <div className="space-y-6">
      <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold text-charcoal">Tell us about the golfer</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-masters-green">*</span></label>
        <input
          type="text" placeholder="e.g. Jake"
          value={data.name || ""} onChange={(e) => update({ name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green focus:border-transparent outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-masters-green">*</span></label>
        <input
          type="number" min="4" max="18" placeholder="e.g. 10"
          value={data.age} onChange={(e) => update({ age: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green focus:border-transparent outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gender <span className="text-masters-green">*</span></label>
        <div className="flex gap-3">
          {["Male", "Female"].map((g) => (
            <button key={g} onClick={() => update({ gender: g.toLowerCase() })}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${data.gender === g.toLowerCase() ? "border-masters-green bg-masters-green/10 text-masters-green" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
            >{g}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Handedness <span className="text-masters-green">*</span></label>
        <div className="flex gap-3">
          {["Right", "Left"].map((h) => (
            <button key={h} onClick={() => update({ hand: h.toLowerCase() })}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${data.hand === h.toLowerCase() ? "border-masters-green bg-masters-green/10 text-masters-green" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}
            >{h}-Handed</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeightSvg() {
  return (
    <svg viewBox="0 0 120 180" className="w-full max-w-[120px] mx-auto" aria-label="Height measurement illustration">
      {/* Floor line */}
      <line x1="20" y1="170" x2="100" y2="170" stroke="#C8A951" strokeWidth="2" />
      {/* Person */}
      <circle cx="60" cy="30" r="12" fill="none" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="42" x2="60" y2="110" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="60" x2="40" y2="85" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="60" x2="80" y2="85" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="110" x2="42" y2="168" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="110" x2="78" y2="168" stroke="#006747" strokeWidth="2.5" />
      {/* Measurement line */}
      <line x1="100" y1="18" x2="100" y2="170" stroke="#C8A951" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="95" y1="18" x2="105" y2="18" stroke="#C8A951" strokeWidth="2" />
      <line x1="95" y1="170" x2="105" y2="170" stroke="#C8A951" strokeWidth="2" />
      {/* Arrow heads */}
      <polygon points="100,22 97,30 103,30" fill="#C8A951" />
      <polygon points="100,166 97,158 103,158" fill="#C8A951" />
    </svg>
  );
}

function WristToFloorSvg() {
  return (
    <svg viewBox="0 0 120 180" className="w-full max-w-[120px] mx-auto" aria-label="Wrist-to-floor measurement illustration">
      {/* Floor line */}
      <line x1="20" y1="170" x2="100" y2="170" stroke="#C8A951" strokeWidth="2" />
      {/* Person */}
      <circle cx="60" cy="30" r="12" fill="none" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="42" x2="60" y2="110" stroke="#006747" strokeWidth="2.5" />
      {/* Arms hanging straight down */}
      <line x1="60" y1="60" x2="38" y2="105" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="60" x2="82" y2="105" stroke="#006747" strokeWidth="2.5" />
      {/* Wrist dots */}
      <circle cx="38" cy="105" r="3" fill="#C8A951" />
      <circle cx="82" cy="105" r="3" fill="#C8A951" />
      {/* Legs */}
      <line x1="60" y1="110" x2="42" y2="168" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="110" x2="78" y2="168" stroke="#006747" strokeWidth="2.5" />
      {/* Measurement line - wrist to floor */}
      <line x1="18" y1="105" x2="18" y2="170" stroke="#C8A951" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="13" y1="105" x2="23" y2="105" stroke="#C8A951" strokeWidth="2" />
      <line x1="13" y1="170" x2="23" y2="170" stroke="#C8A951" strokeWidth="2" />
      <polygon points="18,109 15,117 21,117" fill="#C8A951" />
      <polygon points="18,166 15,158 21,158" fill="#C8A951" />
    </svg>
  );
}

function ArmLengthSvg() {
  return (
    <svg viewBox="0 0 140 180" className="w-full max-w-[140px] mx-auto" aria-label="Arm length measurement illustration">
      {/* Floor line */}
      <line x1="20" y1="170" x2="120" y2="170" stroke="#C8A951" strokeWidth="2" />
      {/* Person */}
      <circle cx="60" cy="30" r="12" fill="none" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="42" x2="60" y2="110" stroke="#006747" strokeWidth="2.5" />
      {/* Left arm down */}
      <line x1="60" y1="60" x2="38" y2="100" stroke="#006747" strokeWidth="2.5" />
      {/* Right arm extended out */}
      <line x1="60" y1="60" x2="125" y2="60" stroke="#006747" strokeWidth="2.5" />
      {/* Shoulder dot */}
      <circle cx="60" cy="60" r="3" fill="#C8A951" />
      {/* Fingertip dot */}
      <circle cx="125" cy="60" r="3" fill="#C8A951" />
      {/* Legs */}
      <line x1="60" y1="110" x2="42" y2="168" stroke="#006747" strokeWidth="2.5" />
      <line x1="60" y1="110" x2="78" y2="168" stroke="#006747" strokeWidth="2.5" />
      {/* Measurement line */}
      <line x1="60" y1="48" x2="125" y2="48" stroke="#C8A951" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="60" y1="43" x2="60" y2="53" stroke="#C8A951" strokeWidth="2" />
      <line x1="125" y1="43" x2="125" y2="53" stroke="#C8A951" strokeWidth="2" />
      <polygon points="64,48 72,45 72,51" fill="#C8A951" />
      <polygon points="121,48 113,45 113,51" fill="#C8A951" />
    </svg>
  );
}

function MeasureCard({ svg, label, instruction, children }: { svg: React.ReactNode; label: string; instruction: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream/50 rounded-2xl p-4 border border-gray-100">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="shrink-0 w-28 md:w-32">
          {svg}
          <p className="text-[10px] text-center text-gray-500 mt-1">{instruction}</p>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          {children}
        </div>
      </div>
    </div>
  );
}

function StepMeasure() {
  const { data, update } = useFit();
  return (
    <div className="space-y-5">
      <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold text-charcoal">Key Measurements</h2>
      <p className="text-gray-600 text-sm">These help us recommend the right club length and lie angle. Follow the illustrations for accurate results.</p>

      <MeasureCard svg={<HeightSvg />} label="Height" instruction="Stand straight, shoes off, measure from floor to top of head.">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input type="number" min="2" max="6" placeholder="Feet" value={data.heightFeet}
              onChange={(e) => update({ heightFeet: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green outline-none font-[var(--font-mono)]" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ft</span>
          </div>
          <div className="flex-1 relative">
            <input type="number" min="0" max="11" placeholder="Inches" value={data.heightInches}
              onChange={(e) => update({ heightInches: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green outline-none font-[var(--font-mono)]" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">in</span>
          </div>
        </div>
      </MeasureCard>

      <MeasureCard svg={<WristToFloorSvg />} label="Wrist-to-Floor Distance" instruction="Arms relaxed at sides, measure from wrist crease to floor.">
        <div className="relative">
          <input type="number" min="15" max="40" placeholder="e.g. 24" value={data.wristToFloor}
            onChange={(e) => update({ wristToFloor: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green outline-none font-[var(--font-mono)]" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">inches</span>
        </div>
      </MeasureCard>

      <MeasureCard svg={<ArmLengthSvg />} label="Arm Length" instruction="Shoulder to wrist with arm extended straight out.">
        <div className="relative">
          <input type="number" min="15" max="35" placeholder="e.g. 22" value={data.armLength}
            onChange={(e) => update({ armLength: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-masters-green outline-none font-[var(--font-mono)]" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">inches</span>
        </div>
      </MeasureCard>
    </div>
  );
}

function StepSkill() {
  const { data, update } = useFit();
  return (
    <div className="space-y-6">
      <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold text-charcoal">Skill Level</h2>
      <p className="text-gray-600 text-sm">This helps us pick the right club head design and shaft flex.</p>
      <div className="grid gap-4">
        {[
          { val: "beginner", icon: "🌱", label: "Beginner", desc: "Just starting out or played less than a year" },
          { val: "intermediate", icon: "⭐", label: "Intermediate", desc: "1-3 years experience, can make consistent contact" },
          { val: "advanced", icon: "🏆", label: "Advanced", desc: "3+ years, plays competitively or shoots under 90" },
        ].map((s) => (
          <button key={s.val} onClick={() => update({ skill: s.val })}
            className={`text-left p-5 rounded-2xl border-2 transition ${data.skill === s.val ? "border-masters-green bg-masters-green/5" : "border-gray-200 hover:border-gray-300"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className={`font-semibold ${data.skill === s.val ? "text-masters-green" : "text-charcoal"}`}>{s.label}</div>
                <div className="text-sm text-gray-500">{s.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPrefs() {
  const { data, update } = useFit();
  const budgets = [
    { label: "Under $150", min: "0", max: "150" },
    { label: "$150–$300", min: "150", max: "300" },
    { label: "$300–$500", min: "300", max: "500" },
    { label: "$500+", min: "500", max: "1000" },
  ];
  const brands = ["No Preference", "Callaway", "US Kids Golf", "Ping", "TaylorMade", "Cleveland"];
  return (
    <div className="space-y-6">
      <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold text-charcoal">Preferences</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
        <div className="grid grid-cols-2 gap-3">
          {budgets.map((b) => (
            <button key={b.label} onClick={() => update({ budgetMin: b.min, budgetMax: b.max })}
              className={`py-3 rounded-xl border-2 font-medium text-sm transition ${data.budgetMin === b.min && data.budgetMax === b.max ? "border-masters-green bg-masters-green/10 text-masters-green" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Brand Preference</label>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <button key={b} onClick={() => update({ brandPref: b })}
              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${data.brandPref === b ? "border-masters-green bg-masters-green/10 text-masters-green" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FitPage() {
  const [step, setStep] = useState(0);
  const { data } = useFit();
  const router = useRouter();

  useEffect(() => {
    trackEvent("fitting_started");
  }, []);

  const totalSteps = 5;

  const canNext = () => {
    if (step === 0) {
      if (!data.fitType) return false;
      if (data.fitType === "individual" && !data.clubType) return false;
      return true;
    }
    if (step === 1) return data.name && data.age && data.gender && data.hand;
    if (step === 2) return data.heightFeet && data.heightInches;
    if (step === 3) return data.skill;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else {
      // Store in sessionStorage for results page
      sessionStorage.setItem("clubby-fit", JSON.stringify(data));
      const heightIn = (parseInt(data.heightFeet) || 0) * 12 + (parseInt(data.heightInches) || 0);
      trackEvent("fitting_completed", {
        age: data.age,
        height: `${data.heightFeet}'${data.heightInches}"`,
        heightInches: heightIn,
        skill: data.skill,
        budget: data.budgetMax || "any",
        gender: data.gender,
        hand: data.hand,
        fitType: data.fitType,
        clubType: data.clubType || undefined,
      });
      router.push("/results");
    }
  };

  const components = [<StepType key={0} />, <StepBasic key={1} />, <StepMeasure key={2} />, <StepSkill key={3} />, <StepPrefs key={4} />];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-cream">
      <div className="max-w-xl mx-auto px-4">
        <ProgressBar step={step} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-sm"
          >
            {components[step]}
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-full border-2 border-gray-300 text-gray-600 font-medium hover:border-gray-400 transition">
              Back
            </button>
          )}
          <button onClick={handleNext} disabled={!canNext()}
            className={`flex-1 py-3 rounded-full font-semibold text-white transition ${canNext() ? "bg-masters-green hover:bg-deep-green" : "bg-gray-300 cursor-not-allowed"}`}>
            {step === totalSteps - 1 ? "See My Results →" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
