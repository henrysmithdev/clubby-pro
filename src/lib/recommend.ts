import { FitData } from "@/context/FitContext";

interface Club {
  type: string;
  name: string;
  brand: string;
  length: string;
  detail: string;
}

interface Recommendation {
  setName: string;
  clubs: Club[];
  totalPrice: string;
  fitNotes: string[];
}

export function getRecommendation(data: FitData): Recommendation {
  const age = parseInt(data.age) || 10;
  const heightIn = (parseInt(data.heightFeet) || 4) * 12 + (parseInt(data.heightInches) || 6);
  const skill = data.skill || "beginner";
  const budget = parseInt(data.budgetMax) || 300;

  // Size category
  let size: "xs" | "sm" | "md" | "lg";
  if (heightIn < 48) size = "xs";
  else if (heightIn < 54) size = "sm";
  else if (heightIn < 60) size = "md";
  else size = "lg";

  const sets: Record<string, { setName: string; clubs: Club[]; price: string }> = {
    xs: {
      setName: "US Kids Golf UL39",
      clubs: [
        { type: "Driver", name: "UL39 Driver", brand: "US Kids Golf", length: '29"', detail: "10.5° loft, graphite shaft" },
        { type: "Hybrid", name: "UL39 Hybrid", brand: "US Kids Golf", length: '26"', detail: "Replaces hard-to-hit irons" },
        { type: "7 Iron", name: "UL39 7-Iron", brand: "US Kids Golf", length: '24"', detail: "Wide sole, perimeter weighted" },
        { type: "Putter", name: "UL39 Putter", brand: "US Kids Golf", length: '22"', detail: "Alignment aid, mallet style" },
      ],
      price: "$199",
    },
    sm: {
      setName: "Callaway XJ-1",
      clubs: [
        { type: "Driver", name: "XJ-1 Driver", brand: "Callaway", length: '33"', detail: "Lightweight titanium, 12° loft" },
        { type: "Fairway Wood", name: "XJ-1 5W", brand: "Callaway", length: '30"', detail: "Easy launch, low center of gravity" },
        { type: "7 Iron", name: "XJ-1 7-Iron", brand: "Callaway", length: '27"', detail: "Oversized head, graphite shaft" },
        { type: "PW", name: "XJ-1 PW", brand: "Callaway", length: '25.5"', detail: "Cavity back for forgiveness" },
        { type: "Putter", name: "XJ-1 Putter", brand: "Callaway", length: '25"', detail: "Face-balanced mallet" },
      ],
      price: "$249",
    },
    md: {
      setName: "Ping Prodi G",
      clubs: [
        { type: "Driver", name: "Prodi G Driver", brand: "Ping", length: '37"', detail: "Forged Ti face, adjustable loft" },
        { type: "Hybrid", name: "Prodi G Hybrid", brand: "Ping", length: '33"', detail: "Maraging steel face" },
        { type: "7 Iron", name: "Prodi G 7-Iron", brand: "Ping", length: '31"', detail: "CTP weighted, graphite shaft" },
        { type: "9 Iron", name: "Prodi G 9-Iron", brand: "Ping", length: '29.5"', detail: "Perimeter weighted" },
        { type: "SW", name: "Prodi G SW", brand: "Ping", length: '28.5"', detail: "56° wedge, wide sole" },
        { type: "Putter", name: "Prodi G Putter", brand: "Ping", length: '29"', detail: "Slight arc, blade style" },
      ],
      price: "$399",
    },
    lg: {
      setName: "TaylorMade Rory Junior",
      clubs: [
        { type: "Driver", name: "Rory Driver", brand: "TaylorMade", length: '40"', detail: "Speed pocket, 10.5° loft" },
        { type: "3 Wood", name: "Rory 3W", brand: "TaylorMade", length: '37"', detail: "Low-profile design" },
        { type: "5 Hybrid", name: "Rory Rescue", brand: "TaylorMade", length: '34"', detail: "Versatile from any lie" },
        { type: "7 Iron", name: "Rory 7-Iron", brand: "TaylorMade", length: '32"', detail: "Speed bridge technology" },
        { type: "PW", name: "Rory PW", brand: "TaylorMade", length: '30"', detail: "Precision short game" },
        { type: "SW", name: "Rory SW", brand: "TaylorMade", length: '29"', detail: "56° bounce, C-grind" },
        { type: "Putter", name: "Rory Putter", brand: "TaylorMade", length: '31"', detail: "Spider-style mallet" },
      ],
      price: "$449",
    },
  };

  const rec = sets[size];

  const fitNotes = [
    `Height ${data.heightFeet}'${data.heightInches}" maps to ${size.toUpperCase()} size category`,
    `Age ${age} — ${age < 8 ? "lighter shafts and oversized heads recommended" : "standard junior flex appropriate"}`,
    skill === "beginner"
      ? "Beginner: Extra-forgiving club heads with wider sweet spots"
      : skill === "intermediate"
      ? "Intermediate: Balanced forgiveness and control"
      : "Advanced: More workable heads for shot shaping",
    data.wristToFloor ? `Wrist-to-floor (${data.wristToFloor}") confirms ${rec.clubs[0].length.replace('"', '')}" driver length` : "Add wrist-to-floor measurement for more precise length fitting",
  ];

  return { ...rec, totalPrice: rec.price, fitNotes };
}
