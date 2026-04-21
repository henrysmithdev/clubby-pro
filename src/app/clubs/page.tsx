"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getClubs } from "@/lib/clubStore";

type SortKey = "price-asc" | "price-desc" | "brand" | "age";

const tierLabel: Record<string, string> = {
  premium: "Premium",
  mid: "Mid-Range",
  budget: "Budget-Friendly",
};

const tierColor: Record<string, string> = {
  premium: "bg-masters-green/10 text-masters-green",
  mid: "bg-gold/20 text-charcoal",
  budget: "bg-gray-100 text-gray-600",
};

export default function ClubsPage() {
  const allClubs = useMemo(() => getClubs(), []);
  const brands = useMemo(() => [...new Set(allClubs.map((c) => c.brand))].sort(), [allClubs]);
  const tiers = ["premium", "mid", "budget"];

  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [handFilter, setHandFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("price-asc");

  const filtered = useMemo(() => {
    let result = allClubs;

    // Text search — match on brand, model, setName, clubs list, notes
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.setName.toLowerCase().includes(q) ||
          c.clubs.some((cl: string) => cl.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    if (brandFilter !== "all") result = result.filter((c) => c.brand === brandFilter);
    if (tierFilter !== "all") result = result.filter((c) => c.tier === tierFilter);
    if (handFilter !== "all") result = result.filter((c) => c.handedness.includes(handFilter));

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "brand") return a.brand.localeCompare(b.brand) || a.price - b.price;
      if (sort === "age") return a.targetAge[0] - b.targetAge[0];
      return 0;
    });

    return result;
  }, [allClubs, query, brandFilter, tierFilter, handFilter, sort]);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-charcoal">
            Browse Clubs
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Search our full catalog of junior golf clubs and sets. Find the perfect equipment by name, brand, or type.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm mb-8">
          {/* Search bar */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search clubs, brands, or types (e.g. &quot;putter&quot;, &quot;US Kids&quot;, &quot;driver&quot;)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-masters-green/50 focus:border-masters-green"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-3">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            >
              <option value="all">All Price Tiers</option>
              {tiers.map((t) => (
                <option key={t} value={t}>{tierLabel[t]}</option>
              ))}
            </select>

            <select
              value={handFilter}
              onChange={(e) => setHandFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            >
              <option value="all">Either Hand</option>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            >
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="brand">Brand A–Z</option>
              <option value="age">Age: Youngest First</option>
            </select>

            {(query || brandFilter !== "all" || tierFilter !== "all" || handFilter !== "all") && (
              <button
                onClick={() => { setQuery(""); setBrandFilter("all"); setTierFilter("all"); setHandFilter("all"); }}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
          {query && <span> for &ldquo;{query}&rdquo;</span>}
        </div>

        {/* Club Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-charcoal leading-tight">
                      {club.brand} {club.setName}
                    </h3>
                    <p className="text-xs text-gray-500">{club.model}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${tierColor[club.tier] || "bg-gray-100 text-gray-600"}`}>
                    {tierLabel[club.tier] || club.tier}
                  </span>
                </div>

                {/* Price + Age/Height */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-2xl font-bold text-masters-green font-mono">${club.price}</span>
                  <div className="text-xs text-gray-500">
                    <div>Ages {club.targetAge[0]}–{club.targetAge[1]}</div>
                    <div>{club.targetHeight[0]}&quot;–{club.targetHeight[1]}&quot; tall</div>
                  </div>
                </div>

                {/* Clubs in set */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {club.clubs.map((c: string) => (
                    <span key={c} className="text-[11px] bg-cream text-charcoal px-2 py-0.5 rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
                  <div className="bg-cream rounded-lg p-1.5 text-center">
                    <div className="text-gray-400">Shaft</div>
                    <div className="font-semibold text-charcoal">{club.shaftFlex}</div>
                  </div>
                  <div className="bg-cream rounded-lg p-1.5 text-center">
                    <div className="text-gray-400">Grip</div>
                    <div className="font-semibold text-charcoal">{club.gripSize}</div>
                  </div>
                  <div className="bg-cream rounded-lg p-1.5 text-center">
                    <div className="text-gray-400">Hand</div>
                    <div className="font-semibold text-charcoal capitalize">{club.handedness.join(" / ")}</div>
                  </div>
                </div>

                {/* Notes */}
                {club.notes && (
                  <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">{club.notes}</p>
                )}

                {/* CTA */}
                <a
                  href={club.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block w-full py-2.5 rounded-full bg-gold text-charcoal font-semibold text-sm text-center hover:bg-soft-gold transition"
                >
                  Shop {club.brand} →
                </a>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-charcoal mb-2">No clubs found</h2>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setQuery(""); setBrandFilter("all"); setTierFilter("all"); setHandFilter("all"); }}
              className="px-6 py-2 rounded-full bg-masters-green text-white font-medium text-sm hover:bg-deep-green transition"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-500 mb-3">Not sure which clubs are right? Let us help.</p>
          <Link
            href="/fit"
            className="inline-block px-8 py-3 rounded-full bg-masters-green text-white font-semibold hover:bg-deep-green transition"
          >
            Take the Fitting Quiz →
          </Link>
        </div>
      </div>
    </div>
  );
}
