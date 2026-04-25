"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export interface FitData {
  fitType: "set" | "individual" | "";
  clubType: string; // e.g. "Driver", "7 Iron", "Putter" — only used when fitType="individual"
  name: string;
  age: string;
  gender: string;
  hand: string;
  heightFeet: string;
  heightInches: string;
  wristToFloor: string;
  armLength: string;
  skill: string;
  handicap: string;
  budgetMin: string;
  budgetMax: string;
  brandPref: string;
}

const defaults: FitData = {
  fitType: "", clubType: "",
  name: "", age: "", gender: "", hand: "right",
  heightFeet: "", heightInches: "", wristToFloor: "", armLength: "",
  skill: "", handicap: "",
  budgetMin: "", budgetMax: "", brandPref: "",
};

const FitContext = createContext<{
  data: FitData;
  update: (partial: Partial<FitData>) => void;
  reset: () => void;
}>({ data: defaults, update: () => {}, reset: () => {} });

export function FitProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FitData>(defaults);
  const update = (partial: Partial<FitData>) => setData((d) => ({ ...d, ...partial }));
  const reset = () => setData(defaults);
  return <FitContext.Provider value={{ data, update, reset }}>{children}</FitContext.Provider>;
}

export const useFit = () => useContext(FitContext);
