"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileFitBar() {
  const pathname = usePathname();
  if (pathname === "/fit" || pathname === "/results") return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-masters-green p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
      <Link
        href="/fit"
        className="block w-full text-center py-3 rounded-full bg-gold text-charcoal font-semibold text-base"
      >
        Get Fitted — It&apos;s Free →
      </Link>
    </div>
  );
}
