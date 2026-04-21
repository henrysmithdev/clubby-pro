import defaultClubs from "@/data/clubs.json";
import { Club } from "./recommend";

const STORAGE_KEY = "clubby_clubs";

export function getClubs(): Club[] {
  if (typeof window === "undefined") return defaultClubs as Club[];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  return defaultClubs as Club[];
}

export function saveClubs(clubs: Club[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
}

export function addClub(club: Club) {
  const clubs = getClubs();
  clubs.push(club);
  saveClubs(clubs);
  return clubs;
}

export function updateClub(id: string, updates: Partial<Club>) {
  const clubs = getClubs();
  const idx = clubs.findIndex((c) => c.id === id);
  if (idx >= 0) clubs[idx] = { ...clubs[idx], ...updates };
  saveClubs(clubs);
  return clubs;
}

export function deleteClub(id: string) {
  const clubs = getClubs().filter((c) => c.id !== id);
  saveClubs(clubs);
  return clubs;
}

export function resetClubs() {
  localStorage.removeItem(STORAGE_KEY);
  return defaultClubs as Club[];
}

export function generateId(brand: string, model: string): string {
  return (brand + "-" + model).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}
