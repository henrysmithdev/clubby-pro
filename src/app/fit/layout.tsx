"use client";
import { FitProvider } from "@/context/FitContext";

export default function FitLayout({ children }: { children: React.ReactNode }) {
  return <FitProvider>{children}</FitProvider>;
}
