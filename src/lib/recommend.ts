import clubsData from "@/data/clubs.json";

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
}

export interface FitInput {
  age: number;
  heightInches: number;
  wristToFloor?: number; // inches — most accurate sizing metric
  handSize?: "small" | "medium" | "large";
  skillLevel: "beginner" | "intermediate" | "advanced";
  hand: "right" | "left";
  budget?: "budget" | "mid" | "premium" | "any";
}

export interface Recommendation {
  club: Club;
  score: number; // 0-100
  reasons: string[];
  fit: "perfect" | "good" | "acceptable";
  sizeNote?: string;
}

/**
 * Wrist-to-floor is the gold standard for club length fitting.
 * If not provided, we estimate from height using standard proportions.
 * Formula: wrist-to-floor ≈ height × 0.415 (kids tend toward 0.40-0.43)
 */
function estimateWristToFloor(heightInches: number): number {
  return Math.round(heightInches * 0.415 * 10) / 10;
}

/**
 * Score how well a club set matches the golfer's measurements.
 * Returns 0-100 where 100 is a perfect fit.
 */
function scoreClub(club: Club, input: FitInput): { score: number; reasons: string[]; sizeNote?: string } {
  let score = 0;
  const reasons: string[] = [];
  let sizeNote: string | undefined;

  const wtf = input.wristToFloor ?? estimateWristToFloor(input.heightInches);
  const h = input.heightInches;
  const age = input.age;

  // --- Height match (40 points max) ---
  const [minH, maxH] = club.targetHeight;
  const midH = (minH + maxH) / 2;
  const rangeH = (maxH - minH) / 2;

  if (h >= minH && h <= maxH) {
    // Within range — score based on proximity to center
    const distFromCenter = Math.abs(h - midH);
    const heightScore = 40 * (1 - distFromCenter / (rangeH + 1));
    score += Math.round(heightScore);
    reasons.push("Height is in the ideal range for this set");
  } else {
    // Outside range — penalize by distance
    const dist = h < minH ? minH - h : h - maxH;
    if (dist <= 2) {
      score += 20;
      sizeNote = h < minH ? "Slightly short — may grow into this set" : "At the top end — may outgrow soon";
      reasons.push(sizeNote);
    } else if (dist <= 4) {
      score += 5;
      sizeNote = h < minH ? "A bit small for this set" : "Likely too tall for this set";
    } else {
      return { score: 0, reasons: ["Height too far outside range"] };
    }
  }

  // --- Age match (25 points max) ---
  const [minA, maxA] = club.targetAge;
  if (age >= minA && age <= maxA) {
    score += 25;
    reasons.push(`Designed for ages ${minA}-${maxA}`);
  } else if (age >= minA - 1 && age <= maxA + 1) {
    score += 15;
    reasons.push(`Close to target age range (${minA}-${maxA})`);
  } else if (Math.abs(age - midH) > 3) {
    score -= 10;
  }

  // --- Handedness (pass/fail — 0 points, but eliminates if no match) ---
  if (!club.handedness.includes(input.hand)) {
    return { score: 0, reasons: [`Not available in ${input.hand}-handed`] };
  }

  // --- Skill level / club count (15 points max) ---
  const clubCount = club.clubs.length;
  if (input.skillLevel === "beginner") {
    if (clubCount <= 6) {
      score += 15;
      reasons.push("Simpler set — great for beginners");
    } else if (clubCount <= 8) {
      score += 10;
    } else {
      score += 5;
      reasons.push("More clubs than a beginner typically needs");
    }
  } else if (input.skillLevel === "intermediate") {
    if (clubCount >= 6 && clubCount <= 9) {
      score += 15;
      reasons.push("Good club variety for intermediate players");
    } else {
      score += 8;
    }
  } else {
    // advanced
    if (clubCount >= 8) {
      score += 15;
      reasons.push("Full club selection for competitive play");
    } else {
      score += 5;
      reasons.push("May want more clubs at this level");
    }
  }

  // --- Budget tier (10 points max) ---
  const budget = input.budget ?? "any";
  if (budget === "any") {
    score += 10;
  } else if (budget === club.tier) {
    score += 10;
    reasons.push(`Matches your ${budget} budget preference`);
  } else if (
    (budget === "mid" && club.tier === "premium") ||
    (budget === "premium" && club.tier === "mid")
  ) {
    score += 5;
  } else {
    score += 2;
  }

  // --- Brand quality bonus (10 points max) ---
  if (["US Kids Golf", "Ping"].includes(club.brand)) {
    score += 10;
    if (club.brand === "US Kids Golf") {
      reasons.push("US Kids Golf — #1 junior fitting brand worldwide");
    } else {
      reasons.push("Ping — premium engineering with custom junior fitting");
    }
  } else if (["Callaway", "TaylorMade", "Cobra"].includes(club.brand)) {
    score += 7;
  } else {
    score += 3;
  }

  return { score: Math.min(100, Math.max(0, score)), reasons, sizeNote };
}

/**
 * Main recommendation engine.
 * Returns top 3 recommendations sorted by score.
 */
export function getRecommendations(input: FitInput): Recommendation[] {
  const clubs = clubsData as Club[];

  const scored = clubs
    .map((club) => {
      const { score, reasons, sizeNote } = scoreClub(club, input);
      const fit: Recommendation["fit"] =
        score >= 75 ? "perfect" : score >= 50 ? "good" : "acceptable";
      return { club, score, reasons, fit, sizeNote } as Recommendation;
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return top 3, but ensure variety (different brands if possible)
  const results: Recommendation[] = [];
  const usedBrands = new Set<string>();

  for (const r of scored) {
    if (results.length >= 3) break;
    // First pick is always best score; after that prefer different brands
    if (results.length === 0 || !usedBrands.has(r.club.brand)) {
      results.push(r);
      usedBrands.add(r.club.brand);
    }
  }

  // If we didn't get 3 due to brand diversity, fill with next best
  if (results.length < 3) {
    for (const r of scored) {
      if (results.length >= 3) break;
      if (!results.find((x) => x.club.id === r.club.id)) {
        results.push(r);
      }
    }
  }

  return results;
}
