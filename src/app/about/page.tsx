"use client";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const team = [
  { name: "Alex Chen", role: "Founder & CEO", bio: "Former PGA teaching pro with 15 years coaching junior golfers.", emoji: "🏌️" },
  { name: "Jordan Rivera", role: "Head of Product", bio: "Data scientist and golf equipment nerd. Built fitting models for 3 major brands.", emoji: "📊" },
  { name: "Sam Okafor", role: "Lead Engineer", bio: "Full-stack developer, scratch golfer, and parent of two junior players.", emoji: "💻" },
  { name: "Taylor Park", role: "Content & Community", bio: "Sports journalist covering junior golf. Passionate about making the game accessible.", emoji: "✍️" },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-golden-hour.jpg" alt="Junior golfer at golden hour" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-deep-green/85 to-masters-green/85" />
        </div>
        <div className="relative z-10">
          <motion.h1 {...fadeUp} className="font-[var(--font-heading)] text-4xl md:text-6xl font-bold text-white">Our Story</motion.h1>
          <motion.p {...fadeUp} className="mt-4 text-white/80 max-w-2xl mx-auto px-4 text-lg">
            We believe every junior golfer deserves clubs that fit. Not hand-me-downs. Not guesswork. The right fit.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-4xl mx-auto px-4">
        <motion.div {...fadeUp} className="prose prose-lg max-w-none">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="font-[var(--font-heading)] text-2xl font-bold text-charcoal mb-4">The Problem</h2>
              <p className="text-gray-600">
                90% of junior golfers play with clubs that are the wrong length, weight, or flex. Parents spend hundreds on
                equipment their kids can&apos;t swing properly. Pro fittings cost $100+ and aren&apos;t designed for growing kids.
              </p>
            </div>
            <div>
              <h2 className="font-[var(--font-heading)] text-2xl font-bold text-charcoal mb-4">Our Solution</h2>
              <p className="text-gray-600">
                Clubby uses data from thousands of junior fittings to match measurements to the right clubs — instantly and for free.
                Our algorithm considers height, wrist-to-floor distance, age, and skill level to recommend clubs that grow with your player.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* The Science */}
      <section className="py-20 bg-cream">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="font-[var(--font-heading)] text-3xl md:text-4xl font-bold text-center text-charcoal mb-12">The Science</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "📐", title: "Anthropometric Mapping", desc: "We map body measurements to optimal club dimensions using data from 10,000+ junior fittings." },
              { icon: "📈", title: "Growth Prediction", desc: "Our models account for growth trajectories so clubs stay relevant for 12-18 months." },
              { icon: "🔬", title: "Continuously Improving", desc: "Every fitting improves our model. We validate against PGA-certified fitter recommendations." },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{card.icon}</div>
                <h3 className="font-[var(--font-heading)] text-lg font-bold text-charcoal">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="font-[var(--font-heading)] text-3xl md:text-4xl font-bold text-center text-charcoal mb-12">The Team</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-cream rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full bg-masters-green/10 flex items-center justify-center text-3xl mx-auto mb-3">
                  {t.emoji}
                </div>
                <h3 className="font-semibold text-charcoal">{t.name}</h3>
                <p className="text-sm text-masters-green font-medium">{t.role}</p>
                <p className="mt-2 text-xs text-gray-500">{t.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
