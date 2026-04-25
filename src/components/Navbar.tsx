"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("clubby_admin"));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (email === "henry@aspenpartnergroup.com" && password === "Highlands4118!") {
      localStorage.setItem("clubby_admin", "true");
      setIsLoggedIn(true);
      setShowLogin(false);
      setEmail("");
      setPassword("");
      router.push("/admin");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("clubby_admin");
    setIsLoggedIn(false);
    if (pathname.startsWith("/admin")) router.push("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const navBg = scrolled || !isHome
    ? "bg-white shadow-md text-charcoal"
    : "bg-transparent text-white";

  const links = [
    { href: "/", label: "Home" },
    { href: "/fit", label: "Get Fitted" },
    { href: "/swing", label: "Swing Analyzer" },
    // { href: "/clubs", label: "Browse Clubs" },  // Hidden per Bryce — re-enable later
    { href: "/learn", label: "Learn" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <img src="/images/clubby-bear.png" alt="" className="h-10" />
            <span className="font-[var(--font-heading)] text-2xl font-bold tracking-wider" style={{ fontVariant: "small-caps" }}>
              Clubby
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium hover:opacity-80 transition ${
                  pathname === l.href ? "underline underline-offset-4" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/admin"
                  className="text-sm font-medium hover:opacity-80 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-full border text-sm font-medium hover:opacity-80 transition"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowLogin(!showLogin)}
                  className="px-4 py-1.5 rounded-full border text-sm font-medium hover:opacity-80 transition"
                >
                  Login
                </button>
                <AnimatePresence>
                  {showLogin && (
                    <motion.form
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleLogin}
                      className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl p-4 w-72 z-50"
                    >
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-masters-green"
                        autoFocus
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-charcoal text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-masters-green"
                      />
                      {loginError && (
                        <p className="text-red-500 text-xs mb-2">{loginError}</p>
                      )}
                      <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-masters-green text-white text-sm font-semibold hover:bg-opacity-90 transition"
                      >
                        Sign In
                      </button>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Forgot password?{" "}
                        <a href="mailto:henry@aspenpartnergroup.com?subject=ClubbyPro%20Admin%20Password%20Reset" className="text-masters-green hover:underline">
                          Contact admin
                        </a>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}
            <Link
              href="/fit"
              className="px-5 py-2 rounded-full bg-gold text-charcoal text-sm font-semibold hover:bg-soft-gold transition"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 w-7"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-full transition-all duration-300 ${scrolled || !isHome ? "bg-charcoal" : "bg-white"} ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-full transition-all duration-300 ${scrolled || !isHome ? "bg-charcoal" : "bg-white"} ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-full transition-all duration-300 ${scrolled || !isHome ? "bg-charcoal" : "bg-white"} ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-masters-green flex flex-col items-center justify-center gap-8"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white text-3xl font-[var(--font-heading)] font-bold hover:text-soft-gold transition"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/fit"
              className="mt-4 px-8 py-3 rounded-full bg-gold text-charcoal font-semibold text-lg"
            >
              Start Free →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
