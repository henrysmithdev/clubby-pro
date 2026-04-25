import clubsData from "@/data/clubs.json";
import { getClubs as getStoredClubs } from "./clubStore";

export interface Club {
  id: string;
  brand: string;
  model: string;
  setName: string;
  type: string;
  clubs: string[];
  targetAge: [number, number];
  targetHeight: [number, number];
  shaftFlex: string;
  gripSize: string;
  handedness: string[];
  price: number;
  url: string;
  image: string;
  tier: string;
  notes: string;
  gender?: string;
}

export interface FitInput {
  age: number;
  heightInches: number;
  wristToFloor?: number;
  handSize?: "small" | "medium" | "large";
  skillLevel: "beginner" | "intermediate" | "advanced";
  hand: "right" | "left";
  budget?: "budget" | "mid" | "premium" | "any";
  fitType?: "set" | "individual";
  clubType?: string;
  gender?: "male" | "female";
  handicap?: string; // none, high, mid, low-mid, low, single, scratch, unknown
}

export interface Recommendation {
  club: Club;
  score: number;
  reasons: string[];
  fit: "perfect" | "good" | "acceptable";
  sizeNote?: string;
}

// ──────────────────────────────────────────────────
// SWING SPEED ESTIMATION
// Estimated average swing speed (mph) based on age, gender, and skill.
// Used to determine optimal shaft flex and club weight class.
// ──────────────────────────────────────────────────
function estimateSwingSpeed(age: number, gender: string, skill: string): number {
  // Base swing speed by gender (driver mph)
  let base = gender === "female" ? 65 : 90;

  // Age adjustments
  if (age < 8) base = gender === "female" ? 30 : 35;
  else if (age < 11) base = gender === "female" ? 40 : 50;
  else if (age < 14) base = gender === "female" ? 55 : 65;
  else if (age < 18) base = gender === "female" ? 60 : 80;
  else if (age > 70) base *= 0.75;
  else if (age > 60) base *= 0.82;
  else if (age > 50) base *= 0.90;

  // Skill adjustment
  if (skill === "advanced") base *= 1.12;
  else if (skill === "beginner") base *= 0.88;

  return Math.round(base);
}

// ──────────────────────────────────────────────────
// IDEAL SHAFT FLEX
// Maps swing speed to recommended shaft flex.
// ──────────────────────────────────────────────────
function idealShaftFlex(swingSpeed: number, age: number): string {
  if (age < 13) return "Junior";
  if (swingSpeed < 60) return "Ladies";
  if (swingSpeed < 75) return "Senior";
  if (swingSpeed < 90) return "Regular";
  if (swingSpeed < 105) return "Stiff";
  return "Extra Stiff";
}

// ──────────────────────────────────────────────────
// WRIST-TO-FLOOR ESTIMATION
// Gold standard for club length. Height × ratio (varies by age).
// ──────────────────────────────────────────────────
function estimateWristToFloor(heightInches: number, age: number): number {
  // Kids have proportionally longer arms relative to height
  const ratio = age < 8 ? 0.41 : age < 13 ? 0.413 : age < 18 ? 0.415 : 0.418;
  return Math.round(heightInches * ratio * 10) / 10;
}

// ──────────────────────────────────────────────────
// RECOMMENDED CLUB LENGTH (inches) based on wrist-to-floor
// Standard fitting chart for 7-iron length
// ──────────────────────────────────────────────────
function idealClubLength7i(wtf: number): number {
  if (wtf >= 42) return 38.5;
  if (wtf >= 40) return 38;
  if (wtf >= 38.5) return 37.5;
  if (wtf >= 37) return 37;
  if (wtf >= 35.5) return 36.5;
  if (wtf >= 34) return 36;
  if (wtf >= 32) return 35.5;
  if (wtf >= 29) return 35;
  if (wtf >= 27) return 34;
  if (wtf >= 25) return 33;
  return 32;
}

// ──────────────────────────────────────────────────
// SCORING ENGINE
// Multi-factor scoring: height, age, shaft flex, gender,
// skill/complexity, budget, brand quality, grip match
// ──────────────────────────────────────────────────
function scoreClub(
  club: Club,
  input: FitInput
): { score: number; reasons: string[]; sizeNote?: string } {
  let score = 0;
  const reasons: string[] = [];
  let sizeNote: string | undefined;

  const h = input.heightInches;
  const age = input.age;
  const gender = input.gender || "male";
  const skill = input.skillLevel;
  const handicap = input.handicap || 'unknown';
  const swingSpeed = estimateSwingSpeed(age, gender, skill);

  // Derive effective skill from handicap when available (handicap is more accurate)
  const effectiveSkill = handicap === 'scratch' || handicap === 'single' ? 'advanced'
    : handicap === 'low' || handicap === 'low-mid' ? 'advanced'
    : handicap === 'mid' ? 'intermediate'
    : handicap === 'high' || handicap === 'none' ? 'beginner'
    : skill; // unknown or not provided — use self-reported skill
  const wtf = input.wristToFloor ?? estimateWristToFloor(h, age);
  const idealFlex = idealShaftFlex(swingSpeed, age);

  // ── HARD FILTERS (instant disqualify) ──

  // Handedness
  if (!club.handedness.includes(input.hand)) {
    return { score: 0, reasons: [`Not available in ${input.hand}-handed`] };
  }

  // Gender mismatch (strict)
  const clubGender = club.gender || "any";
  if (clubGender !== "any" && clubGender !== gender) {
    return { score: 0, reasons: [`Designed for ${clubGender} golfers`] };
  }

  // Type filter: individual search should only return individual clubs
  if (input.fitType === "individual" && club.type !== "individual") {
    return { score: 0, reasons: ["Looking for individual clubs only"] };
  }
  if (input.fitType === "set" && club.type !== "full_set") {
    return { score: 0, reasons: ["Looking for complete sets only"] };
  }

  // Height way out of range (>8 inches off)
  const [minH, maxH] = club.targetHeight;
  if (h < minH - 8 || h > maxH + 8) {
    return { score: 0, reasons: ["Height too far outside range"] };
  }

  // Age way out of range for junior/senior specific sets
  const [minA, maxA] = club.targetAge;
  if (age < minA - 3 || age > maxA + 10) {
    return { score: 0, reasons: ["Outside target age range"] };
  }

  // ── HEIGHT MATCH (30 points max) ──
  const midH = (minH + maxH) / 2;
  const rangeH = (maxH - minH) / 2 || 1;

  if (h >= minH && h <= maxH) {
    const distFromCenter = Math.abs(h - midH);
    const heightScore = 30 * (1 - distFromCenter / (rangeH + 1));
    score += Math.round(heightScore);
    if (distFromCenter <= rangeH * 0.3) {
      reasons.push("Ideal height match — right in the sweet spot");
    } else {
      reasons.push("Height is within the recommended range");
    }
  } else {
    const dist = h < minH ? minH - h : h - maxH;
    if (dist <= 2) {
      score += 18;
      sizeNote =
        h < minH
          ? "Slightly short — may grow into this"
          : "At the top end — still workable";
      reasons.push(sizeNote);
    } else if (dist <= 4) {
      score += 10;
      sizeNote =
        h < minH
          ? "A bit short for this — consider sizing down"
          : "A bit tall — consider sizing up";
      reasons.push(sizeNote);
    } else {
      score += 3;
      sizeNote =
        h < minH
          ? "Quite short for this set"
          : "Quite tall for this set";
      reasons.push(sizeNote);
    }
  }

  // ── AGE MATCH (15 points max) ──
  const midA = (minA + maxA) / 2;
  if (age >= minA && age <= maxA) {
    // Perfect age range
    score += 15;
    if (maxA <= 18) {
      reasons.push(`Designed for ages ${minA}–${maxA}`);
    }
  } else if (age >= minA - 2 && age <= maxA + 3) {
    score += 8;
    reasons.push(`Close to target age range (${minA}–${maxA})`);
  } else {
    // Mild penalty but don't disqualify (height matters more than age for adults)
    if (age > 18 && maxA > 18) {
      score += 5; // Adults — age is less critical
    }
  }

  // ── SHAFT FLEX MATCH (15 points max) ──
  // This is critical — wrong flex kills distance and accuracy
  const clubFlex = club.shaftFlex.toLowerCase();
  const idealFlexLower = idealFlex.toLowerCase();

  const flexOrder = ["ladies", "junior", "senior", "regular", "stiff", "extra stiff", "wedge", "n/a"];
  const clubFlexIdx = flexOrder.indexOf(clubFlex);
  const idealFlexIdx = flexOrder.indexOf(idealFlexLower);

  if (clubFlex === "n/a" || clubFlex === "wedge") {
    // Putters/wedges — flex doesn't matter
    score += 15;
  } else if (clubFlex === idealFlexLower) {
    score += 15;
    reasons.push(`${club.shaftFlex} flex matches your estimated ${swingSpeed} mph swing speed`);
  } else if (clubFlexIdx >= 0 && idealFlexIdx >= 0) {
    const flexDist = Math.abs(clubFlexIdx - idealFlexIdx);
    if (flexDist === 1) {
      score += 10;
      reasons.push(`${club.shaftFlex} flex is close to your ideal (${idealFlex})`);
    } else if (flexDist === 2) {
      score += 4;
      reasons.push(`${club.shaftFlex} shaft may be ${clubFlexIdx < idealFlexIdx ? "too soft" : "too stiff"} for your swing`);
    } else {
      // Wrong flex — significant penalty
      score -= 5;
      reasons.push(`⚠️ ${club.shaftFlex} flex is likely wrong — you need ${idealFlex}`);
    }
  } else {
    score += 8; // Unknown flex, give partial credit
  }

  // ── GENDER-SPECIFIC BONUS (5 points) ──
  if (clubGender === gender) {
    score += 5;
    reasons.push(`Engineered specifically for ${gender} golfers`);
  } else if (clubGender === "any" && age < 18) {
    score += 4; // Unisex junior sets are fine
  } else if (clubGender === "any") {
    score += 2; // Unisex adult sets get less credit
  }

  // ── SKILL LEVEL / COMPLEXITY MATCH (10 points max) ──
  const clubCount = club.clubs.length;

  if (club.type === "individual") {
    // Individual clubs — skill matters differently
    const tierMatch = 
      (effectiveSkill === "beginner" && (club.tier === "budget" || club.tier === "mid")) ||
      (effectiveSkill === "intermediate" && club.tier === "mid") ||
      (effectiveSkill === "advanced" && (club.tier === "premium" || club.tier === "mid"));

    if (tierMatch) {
      score += 10;
      reasons.push(effectiveSkill === "beginner" 
        ? "Forgiving design — great for developing your game"
        : effectiveSkill === "advanced"
        ? "Players-grade performance for skilled golfers"
        : "Good balance of forgiveness and control");
    } else {
      score += 5;
    }
  } else {
    // Full sets — club count matters
    if (effectiveSkill === "beginner") {
      if (clubCount <= 7) { score += 10; reasons.push("Simpler set — great for beginners"); }
      else if (clubCount <= 9) { score += 7; }
      else { score += 4; reasons.push("More clubs than a beginner typically needs"); }
    } else if (effectiveSkill === "intermediate") {
      if (clubCount >= 7 && clubCount <= 10) { score += 10; reasons.push("Good club variety for intermediate players"); }
      else { score += 6; }
    } else {
      if (clubCount >= 9) { score += 10; reasons.push("Full club selection for competitive play"); }
      else { score += 4; reasons.push("May want more clubs at this level"); }
    }
  }

  // ── BUDGET MATCH (10 points max) ──
  const budget = input.budget ?? "any";
  if (budget === "any") {
    score += 7;
  } else if (budget === club.tier) {
    score += 10;
    reasons.push(
      budget === "budget" ? "Great value — quality clubs without breaking the bank"
        : budget === "mid" ? "Solid mid-range investment"
        : "Premium equipment — top-tier performance"
    );
  } else if (
    (budget === "mid" && club.tier === "premium") ||
    (budget === "premium" && club.tier === "mid")
  ) {
    score += 5; // Adjacent tier
  } else {
    score += 2; // Opposite tier
  }

  // ── BRAND QUALITY (10 points max) ──
  // Weighted by category relevance
  const isJunior = age < 18;
  const premiumBrands = ["Titleist", "Ping", "Mizuno", "Srixon"];
  const topBrands = ["Callaway", "TaylorMade", "Cobra", "Cleveland"];
  const juniorSpecialists = ["US Kids Golf"];
  const valueBrands = ["Wilson", "Top Flite", "Tour Edge", "Precise", "Aspire", "XXIO"];

  if (isJunior && juniorSpecialists.includes(club.brand)) {
    score += 10;
    reasons.push("US Kids Golf — #1 junior fitting brand worldwide");
  } else if (premiumBrands.includes(club.brand)) {
    score += effectiveSkill === "advanced" ? 10 : 8;
    if (effectiveSkill === "advanced") reasons.push(`${club.brand} — tour-proven premium quality`);
  } else if (topBrands.includes(club.brand)) {
    score += 8;
  } else if (valueBrands.includes(club.brand)) {
    score += budget === "budget" ? 9 : 5;
    if (budget === "budget") reasons.push(`${club.brand} — excellent value for money`);
  } else {
    score += 4;
  }

  // ── GRIP SIZE MATCH (5 points max) ──
  const handSize = input.handSize;
  if (handSize) {
    const gripLower = club.gripSize.toLowerCase();
    if (
      (handSize === "small" && (gripLower === "ladies" || gripLower === "undersize" || gripLower === "junior")) ||
      (handSize === "medium" && (gripLower === "standard" || gripLower === "ladies")) ||
      (handSize === "large" && gripLower === "standard")
    ) {
      score += 5;
    } else if (handSize === "large" && (gripLower === "ladies" || gripLower === "junior" || gripLower === "undersize")) {
      score -= 3;
      reasons.push("Grip may be too small — consider regripping to midsize or jumbo");
    } else {
      score += 3;
    }
  } else {
    score += 3; // No hand size data, give partial credit
  }

  // ── SENIOR-SPECIFIC BONUS ──
  if (age >= 55 && club.shaftFlex.toLowerCase() === "senior") {
    score += 5;
    reasons.push("Senior flex shaft — optimized for moderate swing speeds");
  }

  // Cap score at 100
  return {
    score: Math.min(100, Math.max(0, score)),
    reasons: reasons.slice(0, 5), // Keep top 5 reasons for clarity
    sizeNote,
  };
}

// ──────────────────────────────────────────────────
// MAIN RECOMMENDATION ENGINE
// Returns top 3 recommendations with brand diversity.
// Separates sets vs individual clubs based on fitType.
// ──────────────────────────────────────────────────
export function getRecommendations(input: FitInput): Recommendation[] {
  let clubs =
    typeof window !== "undefined"
      ? getStoredClubs()
      : (clubsData as Club[]);

  // For individual club search, filter to matching club type
  if (input.fitType === "individual" && input.clubType) {
    const target = input.clubType.toLowerCase();
    clubs = clubs.filter((c) =>
      c.clubs.some((cl: string) => cl.toLowerCase() === target)
    );
  }

  const scored = clubs
    .map((club) => {
      const { score, reasons, sizeNote } = scoreClub(club, input);
      const fit: Recommendation["fit"] =
        score >= 75 ? "perfect" : score >= 55 ? "good" : "acceptable";
      return { club, score, reasons, fit, sizeNote } as Recommendation;
    })
    .filter((r) => r.score > 15) // Filter out very poor matches
    .sort((a, b) => b.score - a.score);

  // Return top 5 with brand diversity:
  // - First 3 slots: best score, prefer different brands
  // - Slots 4-5: next best regardless of brand
  const results: Recommendation[] = [];
  const usedBrands = new Set<string>();

  // Phase 1: Top 3 with brand diversity
  for (const r of scored) {
    if (results.length >= 3) break;
    if (results.length === 0 || !usedBrands.has(r.club.brand)) {
      results.push(r);
      usedBrands.add(r.club.brand);
    }
  }

  // Phase 2: Fill to 5 with next best scores (allow brand repeats)
  for (const r of scored) {
    if (results.length >= 5) break;
    if (!results.find((x) => x.club.id === r.club.id)) {
      results.push(r);
    }
  }

  return results;
}
