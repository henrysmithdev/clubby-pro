"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clubsData from "@/data/clubs.json";
import { Club } from "@/lib/recommend";

export default function AdminClubsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("clubby_admin")) {
      router.push("/");
    } else {
      setAuthed(true);
      setClubs(clubsData as Club[]);
    }
  }, [router]);

  if (!authed) return null;

  const filtered = clubs.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.setName.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase())
  );

  const tierColor: Record<string, string> = {
    premium: "bg-masters-green/10 text-masters-green",
    mid: "bg-gold/20 text-charcoal",
    budget: "bg-gray-100 text-gray-600",
  };

  return (
    <main className="min-h-screen bg-cream pt-24 px-4 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-sm text-masters-green hover:underline mb-1 inline-block">← Back to Admin</Link>
            <h1 className="font-[var(--font-heading)] text-3xl font-bold text-charcoal">Club Database</h1>
            <p className="text-gray-500 text-sm">{clubs.length} sets in database</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by brand, model, or set name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-charcoal mb-6 focus:outline-none focus:ring-2 focus:ring-masters-green"
        />

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Brand / Set</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Height</th>
                  <th className="px-4 py-3">Clubs</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Hand</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-cream/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-charcoal">{c.brand}</div>
                      <div className="text-xs text-gray-500">{c.setName} — {c.model}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal">{c.targetAge[0]}–{c.targetAge[1]}</td>
                    <td className="px-4 py-3 text-charcoal">{c.targetHeight[0]}″–{c.targetHeight[1]}″</td>
                    <td className="px-4 py-3 text-charcoal">{c.clubs.length}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-charcoal">${c.price}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${tierColor[c.tier] || ""}`}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-charcoal capitalize text-xs">{c.handedness.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">No clubs match your search.</div>
          )}
        </div>
      </div>
    </main>
  );
}
