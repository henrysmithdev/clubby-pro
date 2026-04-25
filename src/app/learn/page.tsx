"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { articles } from "@/data/articles";

const categories = ["All", "Fitting Guide", "Equipment Review", "Parent Tips"];

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  return (
    <div className="pt-24 pb-16">
      <section className="bg-gradient-to-br from-deep-green to-masters-green py-16 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="font-[var(--font-heading)] text-4xl md:text-6xl font-bold text-white">
          Learn
        </motion.h1>
        <p className="mt-3 text-white/80 text-lg">Guides, reviews, and tips for golfers of all ages.</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === c
                  ? "bg-masters-green text-white"
                  : "bg-cream text-gray-600 hover:bg-gray-200"
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((a, i) => (
            <motion.article
              key={a.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link href={`/learn/${a.slug}`} className="group block h-full">
                <div className="h-44 rounded-t-2xl relative overflow-hidden">
                  <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-masters-green">
                    {a.category}
                  </span>
                </div>
                <div className="bg-white rounded-b-2xl p-5 shadow-sm group-hover:shadow-md transition-shadow border border-t-0 border-gray-100 h-[calc(100%-11rem)]">
                  <h3 className="font-[var(--font-heading)] text-lg font-bold text-charcoal group-hover:text-masters-green transition">{a.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{a.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{a.time} read</span>
                    <span className="text-sm text-masters-green font-medium opacity-0 group-hover:opacity-100 transition">Read →</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
