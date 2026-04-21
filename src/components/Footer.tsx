import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <img src="/images/clubby-bear.png" alt="" className="h-10" />
              <span className="font-[var(--font-heading)] text-2xl font-bold tracking-wider" style={{ fontVariant: "small-caps" }}>Clubby</span>
            </div>
            <p className="text-sm text-gray-400">
              Science-backed club fitting for junior golfers. Because the right clubs make all the difference.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/fit" className="hover:text-white transition">Get Fitted</Link></li>
              <li><Link href="/results" className="hover:text-white transition">Sample Results</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold">Learn</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/learn" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold">Connect</h4>
            <div className="flex gap-4 text-gray-400">
              <a href="#" aria-label="Instagram" className="hover:text-white transition text-xl">📷</a>
              <a href="#" aria-label="Twitter" className="hover:text-white transition text-xl">🐦</a>
              <a href="#" aria-label="YouTube" className="hover:text-white transition text-xl">▶️</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Clubby. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
