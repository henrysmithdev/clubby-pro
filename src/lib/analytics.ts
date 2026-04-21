// Lightweight localStorage analytics for Clubby
// Events are stored as an array of objects in localStorage

export interface AnalyticsEvent {
  type: "fitting_started" | "fitting_completed" | "result_view" | "shop_click";
  timestamp: number; // epoch ms
  data?: Record<string, string | number | undefined>;
}

const STORAGE_KEY = "clubby_analytics";

export function trackEvent(
  type: AnalyticsEvent["type"],
  data?: AnalyticsEvent["data"]
) {
  try {
    const events = getEvents();
    events.push({ type, timestamp: Date.now(), data });
    // Keep max 5000 events (trim oldest)
    if (events.length > 5000) events.splice(0, events.length - 5000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearEvents() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Derived stats ──

export interface AnalyticsSummary {
  totalFittingsStarted: number;
  totalFittingsCompleted: number;
  completionRate: number; // 0-100
  totalShopClicks: number;
  topBrands: { brand: string; count: number }[];
  topAges: { age: string; count: number }[];
  topHeights: { height: string; count: number }[];
  topSkillLevels: { skill: string; count: number }[];
  topBudgets: { budget: string; count: number }[];
  dailyFittings: { date: string; started: number; completed: number }[];
  recentEvents: AnalyticsEvent[];
}

function countBy(items: (string | undefined)[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item) continue;
    map.set(item, (map.get(item) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function getSummary(): AnalyticsSummary {
  const events = getEvents();

  const started = events.filter((e) => e.type === "fitting_started");
  const completed = events.filter((e) => e.type === "fitting_completed");
  const shopClicks = events.filter((e) => e.type === "shop_click");

  // Top brands from shop clicks + completions
  const brandCounts = countBy(
    [...completed, ...shopClicks].map((e) => e.data?.brand as string)
  );

  const ageCounts = countBy(completed.map((e) => e.data?.age as string));
  const heightCounts = countBy(completed.map((e) => e.data?.height as string));
  const skillCounts = countBy(completed.map((e) => e.data?.skill as string));
  const budgetCounts = countBy(completed.map((e) => e.data?.budget as string));

  // Daily breakdown (last 30 days)
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const dailyMap = new Map<string, { started: number; completed: number }>();

  for (const e of events) {
    if (e.timestamp < thirtyDaysAgo) continue;
    const date = new Date(e.timestamp).toISOString().split("T")[0];
    if (!dailyMap.has(date)) dailyMap.set(date, { started: 0, completed: 0 });
    const d = dailyMap.get(date)!;
    if (e.type === "fitting_started") d.started++;
    if (e.type === "fitting_completed") d.completed++;
  }

  const dailyFittings = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalFittingsStarted: started.length,
    totalFittingsCompleted: completed.length,
    completionRate:
      started.length > 0
        ? Math.round((completed.length / started.length) * 100)
        : 0,
    totalShopClicks: shopClicks.length,
    topBrands: brandCounts.map((b) => ({ brand: b.label, count: b.count })),
    topAges: ageCounts.map((a) => ({ age: a.label, count: a.count })),
    topHeights: heightCounts.map((h) => ({ height: h.label, count: h.count })),
    topSkillLevels: skillCounts.map((s) => ({ skill: s.label, count: s.count })),
    topBudgets: budgetCounts.map((b) => ({ budget: b.label, count: b.count })),
    dailyFittings,
    recentEvents: events.slice(-20).reverse(),
  };
}
