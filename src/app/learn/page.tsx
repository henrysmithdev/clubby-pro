"use client";
import { motion } from "framer-motion";

const articles = [
  { title: "Why Junior Golfers Need Fitted Clubs", category: "Fitting Guide", time: "5 min", image: "/images/father-son-golf.jpg",
    excerpt: "Ill-fitting clubs are the #1 reason junior golfers develop bad habits. Here's the science behind proper fitting." },
  { title: "Top 5 Junior Club Sets for 2026", category: "Equipment Review", time: "7 min", image: "/images/boy-holding-club.jpg",
    excerpt: "We tested the most popular junior sets head-to-head. See which ones deliver the best value and performance." },
  { title: "When to Upgrade Your Kid's Clubs", category: "Parent Tips", time: "4 min", image: "/images/boy-swing.jpg",
    excerpt: "Growing kids need new clubs more often than you'd think. Here are the 5 signs it's time for an upgrade." },
  { title: "Understanding Club Length & Lie Angle", category: "Fitting Guide", time: "6 min", image: "/images/boy-putting.jpg",
    excerpt: "Two measurements make or break a junior fitting. Learn what they mean and why they matter." },
  { title: "US Kids Golf vs Callaway XJ: Full Comparison", category: "Equipment Review", time: "8 min", image: "/images/boy-playing.jpg",
    excerpt: "The two most popular junior brands go head-to-head. We compare build quality, forgiveness, and value." },
  { title: "How to Practice with Your Junior Golfer", category: "Parent Tips", time: "5 min", image: "/images/boy-course.jpg",
    excerpt: "Make practice fun, not a chore. Tips from PGA junior coaches on keeping kids engaged and improving." },
];

const categories = ["All", "Fitting Guide", "Equipment Review", "Parent Tips"];

export default function LearnPage() {
  return (
    <div className="pt-24 pb-16">
      <section className="bg-gradient-to-br from-deep-green to-masters-green py-16 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="font-[var(--font-heading)] text-4xl md:text-6xl font-bold text-white">
          Learn
        </motion.h1>
        <p className="mt-3 text-white/80 text-lg">Guides, reviews, and tips for junior golf families.</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((c, i) => (
            <button key={c}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${i === 0 ? "bg-masters-green text-white" : "bg-cream text-gray-600 hover:bg-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((a, i) => (
            <motion.article key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group cursor-pointer">
              <div className="h-44 rounded-t-2xl relative overflow-hidden">
                <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-masters-green">
                  {a.category}
                </span>
              </div>
              <div className="bg-white rounded-b-2xl p-5 shadow-sm group-hover:shadow-md transition-shadow border border-t-0 border-gray-100">
                <h3 className="font-[var(--font-heading)] text-lg font-bold text-charcoal group-hover:text-masters-green transition">{a.title}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{a.excerpt}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{a.time} read</span>
                  <span className="text-sm text-masters-green font-medium opacity-0 group-hover:opacity-100 transition">Read →</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
