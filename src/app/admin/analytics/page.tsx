"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSummary, clearEvents, AnalyticsSummary, AnalyticsEvent } from "@/lib/analytics";

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-charcoal font-mono">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function BarChart({ items, color }: { items: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-24 truncate text-right">{item.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color} transition-all duration-500`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: AnalyticsSummary["dailyFittings"] }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 italic">No data yet</p>;
  const maxVal = Math.max(...data.map((d) => Math.max(d.started, d.completed)), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div className="w-full flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-masters-green/30 rounded-t"
              style={{ height: `${(d.started / maxVal) * 100}px` }}
              title={`${d.date}: ${d.started} started`}
            />
            <div
              className="w-full bg-masters-green rounded-t"
              style={{ height: `${(d.completed / maxVal) * 100}px` }}
              title={`${d.date}: ${d.completed} completed`}
            />
          </div>
          <span className="text-[9px] text-gray-400 rotate-[-45deg] origin-top-left mt-2 hidden md:block">
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EventTypeBadge({ type }: { type: AnalyticsEvent["type"] }) {
  const styles: Record<string, string> = {
    fitting_started: "bg-blue-100 text-blue-700",
    fitting_completed: "bg-green-100 text-green-700",
    result_view: "bg-purple-100 text-purple-700",
    shop_click: "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    fitting_started: "Started",
    fitting_completed: "Completed",
    result_view: "Results",
    shop_click: "Shop Click",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[type] || "bg-gray-100 text-gray-600"}`}>
      {labels[type] || type}
    </span>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("clubby_admin")) {
      router.push("/");
      return;
    }
    setAuthed(true);
    setSummary(getSummary());
  }, [router]);

  const handleClear = () => {
    if (confirm("Clear all analytics data? This cannot be undone.")) {
      clearEvents();
      setSummary(getSummary());
    }
  };

  if (!authed || !summary) return null;

  return (
    <main className="min-h-screen bg-cream pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/admin" className="text-sm text-masters-green hover:underline mb-1 block">← Back to Admin</a>
            <h1 className="font-[var(--font-heading)] text-3xl font-bold text-charcoal">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Fitting completions, popular sizes, and shop clicks.</p>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            Clear Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🏌️" label="Fittings Started" value={summary.totalFittingsStarted} />
          <StatCard icon="✅" label="Completed" value={summary.totalFittingsCompleted} />
          <StatCard
            icon="📈"
            label="Completion Rate"
            value={`${summary.completionRate}%`}
            sub={summary.totalFittingsStarted > 0 ? `${summary.totalFittingsCompleted}/${summary.totalFittingsStarted}` : undefined}
          />
          <StatCard icon="🛒" label="Shop Clicks" value={summary.totalShopClicks} />
        </div>

        {/* Daily Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-semibold text-charcoal mb-1">Daily Fittings (Last 30 Days)</h2>
          <div className="flex gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-masters-green/30 rounded" /> Started</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-masters-green rounded" /> Completed</span>
          </div>
          <DailyChart data={summary.dailyFittings} />
        </div>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Brands */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-charcoal mb-4">Top Brands</h2>
            {summary.topBrands.length > 0 ? (
              <BarChart items={summary.topBrands.map((b) => ({ label: b.brand, count: b.count }))} color="bg-masters-green" />
            ) : (
              <p className="text-sm text-gray-400 italic">No data yet</p>
            )}
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-charcoal mb-4">Age Distribution</h2>
            {summary.topAges.length > 0 ? (
              <BarChart items={summary.topAges.map((a) => ({ label: `${a.age} yrs`, count: a.count }))} color="bg-gold" />
            ) : (
              <p className="text-sm text-gray-400 italic">No data yet</p>
            )}
          </div>

          {/* Skill Levels */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-charcoal mb-4">Skill Levels</h2>
            {summary.topSkillLevels.length > 0 ? (
              <BarChart items={summary.topSkillLevels.map((s) => ({ label: s.skill, count: s.count }))} color="bg-blue-500" />
            ) : (
              <p className="text-sm text-gray-400 italic">No data yet</p>
            )}
          </div>

          {/* Budget Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-charcoal mb-4">Budget Range</h2>
            {summary.topBudgets.length > 0 ? (
              <BarChart items={summary.topBudgets.map((b) => ({ label: `$${b.budget}`, count: b.count }))} color="bg-amber-500" />
            ) : (
              <p className="text-sm text-gray-400 italic">No data yet</p>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-charcoal mb-4">Recent Activity</h2>
          {summary.recentEvents.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {summary.recentEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <EventTypeBadge type={ev.type} />
                  {ev.data?.golfer && (
                    <span className="px-2 py-0.5 bg-masters-green/10 text-masters-green text-xs font-semibold rounded-full shrink-0">
                      {ev.data.golfer}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-mono shrink-0">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                  {ev.data && (
                    <span className="text-xs text-gray-400 truncate">
                      {Object.entries(ev.data)
                        .filter(([k, v]) => v !== undefined && k !== "golfer")
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No events recorded yet. Complete a fitting to see data here.</p>
          )}
        </div>
      </div>
    </main>
  );
}
