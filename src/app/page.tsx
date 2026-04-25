"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const steps = [
  { num: "1", icon: "📏", title: "Measure", desc: "Enter the golfer's height, age, gender, and a few key measurements." },
  { num: "2", icon: "🎯", title: "Match", desc: "Our algorithm matches measurements to the perfect club specs and brands." },
  { num: "3", icon: "🏌️", title: "Play", desc: "Shop confidently knowing every club is sized right for their game." },
];

const testimonials = [
  { name: "Sarah M.", role: "Golf Mom, Atlanta", text: "Clubby saved us from buying the wrong set — again. My son's swing improved almost overnight with properly fitted clubs." },
  { name: "Coach Davis", role: "PGA Instructor", text: "I recommend Clubby to every student. Properly sized clubs are the #1 thing holding golfers back — juniors and adults alike." },
  { name: "Mike R.", role: "Dad & Golfer", text: "Fitted my three kids and myself. Clubby made it easy to get each of us the right fit without spending hours in a pro shop." },
];

const blogPreviews = [
  { title: "Why Every Golfer Needs Fitted Clubs", category: "Fitting Guide", time: "5 min", image: "/images/father-son-golf.jpg" },
  { title: "Top Club Sets for 2026 — Men, Women & Juniors", category: "Equipment Review", time: "7 min", image: "/images/boy-holding-club.jpg" },
  { title: "When to Upgrade Your Clubs", category: "Tips", time: "4 min", image: "/images/boy-swing.jpg" },
];

export default function Home() {
  return (
    <div className="pb-16 md:pb-0">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/images/hero-golden-hour.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-deep-green/90 via-masters-green/85 to-fairway/80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-[var(--font-heading)] text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            The Right Clubs Make
            <br />
            <span className="text-gold">All the Difference</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
          >
            Free, science-backed club fitting recommendations for every golfer — men, women, and juniors.
            Enter a few measurements. Get the perfect fitting club or set.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              href="/fit"
              className="inline-flex items-center mt-8 px-8 py-4 rounded-full bg-gold text-charcoal font-semibold text-lg hover:bg-soft-gold hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Find Your Perfect Fit →
            </Link>
          </motion.div>
        </div>
        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-2xl"
        >
          ↓
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-center text-charcoal">
            How It Works
          </motion.h2>
          <p className="mt-4 text-center text-gray-600 max-w-xl mx-auto">Three simple steps to perfectly fitted clubs.</p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{s.icon}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-masters-green text-white text-sm font-bold mb-3">
                  {s.num}
                </div>
                <h3 className="font-[var(--font-heading)] text-xl font-bold text-charcoal">{s.title}</h3>
                <p className="mt-2 text-gray-600 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo strip */}
      <section className="py-4 bg-white overflow-hidden">
        <div className="flex gap-4 animate-none">
          {["/images/hero-golden-hour.jpg", "/images/boy-putting.jpg", "/images/golf-ball.jpg", "/images/boy-playing.jpg"].map((src, i) => (
            <div key={i} className="flex-shrink-0 w-72 h-48 rounded-xl overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-center text-charcoal">
            Trusted by Golf Families
          </motion.h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-cream rounded-2xl p-6 border border-soft-gold/30"
              >
                <p className="text-gray-700 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-masters-green text-white flex items-center justify-center font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-center text-charcoal">
            From the Blog
          </motion.h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPreviews.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href="/learn" className="block group">
                  <div className="h-40 rounded-t-2xl overflow-hidden">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="bg-white rounded-b-2xl p-5 shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-xs font-semibold text-masters-green uppercase tracking-wide">{b.category}</span>
                    <h3 className="mt-2 font-[var(--font-heading)] font-bold text-charcoal">{b.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{b.time} read</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/course-landscape.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-masters-green/90 to-deep-green/90" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.h2
            {...fadeUp}
            className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold text-white"
          >
            Ready to Find the Perfect Fit?
          </motion.h2>
          <p className="mt-4 text-white/80 text-lg">It&apos;s free, takes 2 minutes, and could change their game.</p>
          <Link
            href="/fit"
            className="inline-flex items-center mt-8 px-8 py-4 rounded-full bg-gold text-charcoal font-semibold text-lg hover:bg-soft-gold hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </div>
  );
}
