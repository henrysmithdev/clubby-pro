// Analytics stored in Supabase — persistent, accessible from any device
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface AnalyticsEvent {
  id?: string;
  type: string;
  data: Record<string, any>;
  created_at?: string;
  timestamp?: number; // backwards compat
}

export interface DailyFitting {
  date: string;
  started: number;
  completed: number;
}

export interface TopBrand {
  brand: string;
  count: number;
}

export interface CountItem {
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalFittings: number;
  totalFittingsStarted: number;
  totalFittingsCompleted: number;
  totalResultViews: number;
  totalShopClicks: number;
  recentEvents: AnalyticsEvent[];
  dailyFittings: DailyFitting[];
  topBrands: TopBrand[];
  topAges: CountItem[];
  topBudgets: CountItem[];
  topSkillLevels: CountItem[];
  uniqueGolfers: number;
}

export async function trackEvent(type: string, data: Record<string, any> = {}) {
  if (!supabase) {
    // Fallback to localStorage if Supabase not configured
    try {
      const events = JSON.parse(localStorage.getItem("clubby_analytics") || "[]");
      events.unshift({ type, data, timestamp: Date.now() });
      if (events.length > 200) events.length = 200;
      localStorage.setItem("clubby_analytics", JSON.stringify(events));
    } catch {}
    return;
  }

  try {
    await supabase.from("analytics_events").insert({ type, data });
  } catch (e) {
    console.error("Analytics error:", e);
  }
}

export async function getSummary(): Promise<AnalyticsSummary> {
  if (!supabase) {
    // Fallback to localStorage
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem("clubby_analytics") || "[]");
    return {
      totalFittings: events.filter(e => e.type === "fitting_completed" || e.type === "fitting_started").length,
      totalFittingsStarted: events.filter(e => e.type === "fitting_started").length,
      totalFittingsCompleted: events.filter(e => e.type === "fitting_completed").length,
      totalResultViews: events.filter(e => e.type === "result_view").length,
      totalShopClicks: events.filter(e => e.type === "shop_click").length,
      recentEvents: events.slice(0, 50),
      dailyFittings: [],
      topBrands: [],
      uniqueGolfers: 0,
      topAges: [],
      topBudgets: [],
      topSkillLevels: [],
    };
  }

  try {
    // Get counts
    const { count: fittingsStarted } = await supabase
      .from("analytics_events").select("*", { count: "exact", head: true })
      .eq("type", "fitting_started");

    const { count: fittings } = await supabase
      .from("analytics_events").select("*", { count: "exact", head: true })
      .eq("type", "fitting_completed");

    const { count: views } = await supabase
      .from("analytics_events").select("*", { count: "exact", head: true })
      .eq("type", "result_view");

    const { count: clicks } = await supabase
      .from("analytics_events").select("*", { count: "exact", head: true })
      .eq("type", "shop_click");

    // Get recent events
    const { data: recent } = await supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Compute daily fittings (last 7 days)
    const dailyFittings: DailyFitting[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayStart = dateStr + 'T00:00:00';
      const dayEnd = dateStr + 'T23:59:59';

      const { count: started } = await supabase
        .from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('type', 'fitting_started').gte('created_at', dayStart).lte('created_at', dayEnd);

      const { count: completed } = await supabase
        .from('analytics_events').select('*', { count: 'exact', head: true })
        .eq('type', 'fitting_completed').gte('created_at', dayStart).lte('created_at', dayEnd);

      dailyFittings.push({ date: dateStr, started: started || 0, completed: completed || 0 });
    }

    // Top brands from shop clicks
    const { data: shopEvents } = await supabase
      .from('analytics_events').select('data')
      .eq('type', 'shop_click');

    const brandCounts: Record<string, number> = {};
    (shopEvents || []).forEach(e => {
      const brand = e.data?.brand;
      if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Unique golfers
    const { data: golferEvents } = await supabase
      .from('analytics_events').select('data')
      .eq('type', 'fitting_completed');
    const uniqueNames = new Set((golferEvents || []).map(e => e.data?.golfer).filter(Boolean));

    // Top ages from fittings
    const ageCounts: Record<string, number> = {};
    const budgetCounts: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    (golferEvents || []).forEach(e => {
      const age = e.data?.age;
      const budget = e.data?.budget;
      const skill = e.data?.skill;
      if (age) ageCounts[age] = (ageCounts[age] || 0) + 1;
      if (budget) budgetCounts[budget] = (budgetCounts[budget] || 0) + 1;
      if (skill) skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const topAges = Object.entries(ageCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topBudgets = Object.entries(budgetCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topSkillLevels = Object.entries(skillCounts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    const recentMapped = (recent || []).map(e => ({
      ...e,
      timestamp: new Date(e.created_at).getTime(),
    }));

    return {
      totalFittings: (fittingsStarted || 0) + (fittings || 0),
      totalFittingsStarted: fittingsStarted || 0,
      totalFittingsCompleted: fittings || 0,
      totalResultViews: views || 0,
      totalShopClicks: clicks || 0,
      recentEvents: recentMapped,
      dailyFittings,
      topBrands,
      uniqueGolfers: uniqueNames.size,
      topAges,
      topBudgets,
      topSkillLevels,
    };
  } catch (e) {
    console.error("Analytics fetch error:", e);
    return { totalFittings: 0, totalFittingsStarted: 0, totalFittingsCompleted: 0, totalResultViews: 0, totalShopClicks: 0, recentEvents: [], dailyFittings: [], topBrands: [], topAges: [], topBudgets: [], topSkillLevels: [], uniqueGolfers: 0 };
  }
}

export async function clearEvents() {
  if (!supabase) {
    localStorage.removeItem("clubby_analytics");
    return;
  }

  try {
    // Delete all events
    await supabase.from("analytics_events").delete().gte("id", "00000000-0000-0000-0000-000000000000");
  } catch (e) {
    console.error("Clear analytics error:", e);
  }
}
