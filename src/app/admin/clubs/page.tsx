"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Club } from "@/lib/recommend";
import { getClubs, saveClubs, deleteClub, resetClubs, generateId } from "@/lib/clubStore";

const emptyClub: Club = {
  id: "", brand: "", model: "", setName: "", type: "full_set",
  clubs: [], targetAge: [5, 10], targetHeight: [40, 55],
  shaftFlex: "Junior Regular", gripSize: "Junior",
  handedness: ["right"], price: 0, url: "", image: "", tier: "mid", notes: "",
};

function ClubForm({ club, onSave, onCancel }: { club: Club; onSave: (c: Club) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Club>(club);
  const [clubsText, setClubsText] = useState(club.clubs.join(", "));
  const isNew = !club.id;

  const set = (k: keyof Club, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const final = {
      ...form,
      id: form.id || generateId(form.brand, form.setName),
      clubs: clubsText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    onSave(final);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-masters-green/20 mb-6">
      <h2 className="font-[var(--font-heading)] text-xl font-bold text-charcoal mb-4">
        {isNew ? "Add New Club Set" : `Edit: ${club.brand} ${club.setName}`}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-gray-500 text-xs mb-1">Brand *</label>
          <input value={form.brand} onChange={(e) => set("brand", e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Model *</label>
          <input value={form.model} onChange={(e) => set("model", e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Set Name *</label>
          <input value={form.setName} onChange={(e) => set("setName", e.target.value)} required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Price ($) *</label>
          <input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Age</label>
          <input type="number" value={form.targetAge[0]} onChange={(e) => set("targetAge", [Number(e.target.value), form.targetAge[1]])}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Age</label>
          <input type="number" value={form.targetAge[1]} onChange={(e) => set("targetAge", [form.targetAge[0], Number(e.target.value)])}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Min Height (inches)</label>
          <input type="number" value={form.targetHeight[0]} onChange={(e) => set("targetHeight", [Number(e.target.value), form.targetHeight[1]])}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Max Height (inches)</label>
          <input type="number" value={form.targetHeight[1]} onChange={(e) => set("targetHeight", [form.targetHeight[0], Number(e.target.value)])}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-500 text-xs mb-1">Clubs in Set (comma-separated)</label>
          <input value={clubsText} onChange={(e) => setClubsText(e.target.value)}
            placeholder="Driver, 3 Wood, 7 Iron, PW, Putter"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Shaft Flex</label>
          <select value={form.shaftFlex} onChange={(e) => set("shaftFlex", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green">
            <option>Ultralight</option><option>Junior Light</option><option>Junior Regular</option><option>Regular</option><option>Stiff</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Grip Size</label>
          <select value={form.gripSize} onChange={(e) => set("gripSize", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green">
            <option>Undersize</option><option>Junior</option><option>Junior/Standard</option><option>Standard</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Tier</label>
          <select value={form.tier} onChange={(e) => set("tier", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green">
            <option value="budget">Budget</option><option value="mid">Mid</option><option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-500 text-xs mb-1">Handedness</label>
          <select value={form.handedness.join(",")} onChange={(e) => set("handedness", e.target.value.split(","))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green">
            <option value="right">Right only</option><option value="left">Left only</option><option value="right,left">Both</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-500 text-xs mb-1">URL</label>
          <input value={form.url} onChange={(e) => set("url", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-500 text-xs mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal focus:outline-none focus:ring-2 focus:ring-masters-green" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" className="px-6 py-2 rounded-full bg-masters-green text-white font-semibold text-sm hover:bg-opacity-90 transition">
          {isNew ? "Add Club Set" : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-semibold text-sm hover:border-gray-400 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminClubsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Club | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("clubby_admin")) {
      router.push("/");
    } else {
      setAuthed(true);
      setClubs(getClubs());
    }
  }, [router]);

  if (!authed) return null;

  const filtered = clubs.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.setName.toLowerCase().includes(search.toLowerCase()) ||
      c.model.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (club: Club) => {
    let updated: Club[];
    if (adding) {
      updated = [...clubs, club];
    } else {
      updated = clubs.map((c) => (c.id === club.id ? club : c));
    }
    saveClubs(updated);
    setClubs(updated);
    setEditing(null);
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this club set?")) return;
    const updated = deleteClub(id);
    setClubs(updated);
  };

  const handleReset = () => {
    if (!confirm("Reset to default club database? This will undo all edits.")) return;
    const updated = resetClubs();
    setClubs(updated);
  };

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
          <div className="flex gap-2">
            <button onClick={() => { setAdding(true); setEditing({ ...emptyClub }); }}
              className="px-5 py-2 rounded-full bg-masters-green text-white text-sm font-semibold hover:bg-opacity-90 transition">
              + Add Club Set
            </button>
            <button onClick={handleReset}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-500 text-xs hover:border-gray-400 transition">
              Reset
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {editing && (
          <ClubForm
            club={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setAdding(false); }}
          />
        )}

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
                  <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setAdding(false); setEditing(c); }}
                          className="text-xs text-masters-green hover:underline">Edit</button>
                        <button onClick={() => handleDelete(c.id)}
                          className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </td>
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
