import { useEffect, useState, useMemo, useCallback } from "react";
import AcademicCondition from "../components/Insights/AcademicCondition";
import AINarrativeCard from "../components/Insights/AINarrativeCard";
import PriorityCard from "../components/Insights/PriorityCard";
import StatsCard from "../components/Insights/StatsCard";
import StressIntensityChart from "../components/Insights/StressIntensityChart";
import WeeklyActivityChart from "../components/Insights/WeeklyActivityChart";
import Layout from "../../layouts/Layout";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useLanguage } from "../contexts/LanguageContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getNumberField = (data, snakeCaseName, camelCaseName) => {
  const value = data?.[snakeCaseName] ?? data?.[camelCaseName];
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getAverage = (items, selector) => {
  const values = items.map(selector).filter((v) => Number.isFinite(v));
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const getTrendPercentage = (items, selector) => {
  if (items.length < 2) return 0;
  const sorted = [...items].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const mid = Math.ceil(sorted.length / 2);
  const firstAvg = getAverage(sorted.slice(0, mid), selector);
  const lastAvg = getAverage(sorted.slice(mid), selector);
  if (!firstAvg || !lastAvg) return 0;
  return Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
};

const formatDateRange = (startStr, endStr, locale) => {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`;
};

// ─── Data fetchers (all fire in parallel) ────────────────────────────────────

/** Fetch the latest weekly summary — no auto-generation side-effects */
const fetchLatestSummary = async () => {
  try {
    const res = await api.get("/weekly-summaries/latest");
    return res.data?.data?.summary ?? res.data?.summary ?? null;
  } catch {
    return null;
  }
};

/** Fetch the latest AI-generated insight text */
const fetchLatestInsight = async () => {
  try {
    const res = await api.get("/insights/latest");
    const raw = res.data?.data?.insight ?? res.data?.insight ?? null;
    if (!raw) return null;
    const text = raw.insight_text ?? raw.insightText ?? raw.description ?? "";
    return { id: raw.id, insight_text: String(text).trim(), created_at: raw.created_at };
  } catch {
    return null;
  }
};

/** Fetch latest batch of recommendations — no trigger call */
const fetchLatestRecommendations = async () => {
  try {
    const res = await api.get("/recommendations", { params: { limit: 10, offset: 0 } });
    const recs = res.data?.data?.recommendations ?? res.data?.recommendations ?? [];
    if (recs.length === 0) return [];
    const latestSummaryId = recs[0].summary_id;
    if (latestSummaryId) return recs.filter((r) => r.summary_id === latestSummaryId);
    const latestCreatedAt = recs[0].created_at;
    return recs.filter((r) => r.created_at === latestCreatedAt);
  } catch {
    return [];
  }
};

/** Fetch paginated predictions for chart building */
const fetchPredictions = async () => {
  try {
    const res = await api.get("/predictions", { params: { limit: 7, offset: 0 } });
    return res.data?.data?.predictions ?? [];
  } catch {
    return [];
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

function InsightPage() {
  const { user } = useUser();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [insightData, setInsightData] = useState(null);         // { weeklySummary, dataCount }
  const [narrativeInsight, setNarrativeInsight] = useState(null);
  const [todayRecommendations, setTodayRecommendations] = useState([]);
  const [weeklyActivityData, setWeeklyActivityData] = useState([]);
  const [academicConditionData, setAcademicConditionData] = useState([]);
  const [stressIntensityData, setStressIntensityData] = useState([]);

  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 🚀 All requests fire in parallel — no blocking sequential calls
      const [summary, insight, recommendations, predictions] = await Promise.all([
        fetchLatestSummary(),
        fetchLatestInsight(),
        fetchLatestRecommendations(),
        fetchPredictions(),
      ]);

      // ── Date range ────────────────────────────────────────────────────
      if (summary) {
        setDateRange(formatDateRange(summary.period_start, summary.period_end, t.DashboardDateLocale));
      }

      // ── Weekly summary stats ──────────────────────────────────────────
      // Sort predictions oldest → newest for trend calculations
      const sortedPreds = [...predictions].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      const weeklySummary = summary
        ? {
            avgStressScore: Math.round(Number(summary.avg_stress_score) || 0),
            avgSleepHours: Number(summary.avg_sleep_hours) || 0,
            avgAssignmentLoad: Number(summary.avg_assignment_load) || 0,
            avgDeadlinePressure: Number(summary.avg_deadline_pressure) || 0,
            avgPhysicalActivity: Number(summary.avg_physical_activity) || 0,
            avgStudyHours: Number(summary.avg_study_hours) || 0,
            avgSocialMediaHours: Number(summary.avg_social_media_hours) || 0,
            // Trends from prediction history
            stressTrend: getTrendPercentage(sortedPreds, (p) =>
              Number(p.stress_score) <= 1 ? Number(p.stress_score) * 100 : Number(p.stress_score)
            ),
            sleepTrend: 0,
            taskLoadTrend: 0,
            physicalActivityTrend: 0,
          }
        : {
            avgStressScore: 0, avgSleepHours: 0, avgAssignmentLoad: 0,
            avgDeadlinePressure: 0, avgPhysicalActivity: 0, avgStudyHours: 0,
            avgSocialMediaHours: 0, stressTrend: 0, sleepTrend: 0,
            taskLoadTrend: 0, physicalActivityTrend: 0,
          };

      // ── Chart data ────────────────────────────────────────────────────
      const chartData = sortedPreds.map((p) => {
        const rawScore = Number(p.stress_score);
        const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
        const date = new Date(p.created_at || p.prediction_date);
        return {
          day: date.toLocaleDateString(t.DashboardDateLocale, { day: "numeric", month: "short" }),
          value: score,
          hasData: true,
        };
      });

      // ── Stress intensity distribution ─────────────────────────────────
      const intensityCounts = sortedPreds.reduce(
        (acc, p) => {
          const score = Number(p.stress_score) <= 1
            ? Number(p.stress_score) * 100
            : Number(p.stress_score);
          if (score >= 70) acc.high += 1;
          else if (score >= 40) acc.medium += 1;
          else acc.low += 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 }
      );
      const total = sortedPreds.length || 1;

      // ── Academic condition bar data ───────────────────────────────────
      const academicBars = [
        {
          label: t.InsightsStudyTimeLabel,
          value: `${weeklySummary.avgStudyHours.toFixed(1)} ${t.HourText}`,
          width: `${Math.min((weeklySummary.avgStudyHours / 8) * 100, 100)}%`,
          color: "bg-blue-300",
        },
        {
          label: t.InsightsTaskLoadLabel,
          value: `${weeklySummary.avgAssignmentLoad.toFixed(0)}%`,
          width: `${Math.min(weeklySummary.avgAssignmentLoad, 100)}%`,
          color:
            weeklySummary.avgAssignmentLoad >= 70
              ? "bg-red-300"
              : weeklySummary.avgAssignmentLoad >= 40
              ? "bg-yellow-300"
              : "bg-green-400",
        },
        {
          label: t.InsightsDeadlinePressureLabel,
          value: `${weeklySummary.avgDeadlinePressure.toFixed(0)}%`,
          width: `${Math.min(weeklySummary.avgDeadlinePressure, 100)}%`,
          color:
            weeklySummary.avgDeadlinePressure >= 70
              ? "bg-red-300"
              : weeklySummary.avgDeadlinePressure >= 40
              ? "bg-yellow-300"
              : "bg-green-400",
        },
        {
          label: t.InsightsPhysicalActivityLabel,
          value: `${weeklySummary.avgPhysicalActivity.toFixed(0)} ${t.MinuteText}`,
          width: `${Math.min((weeklySummary.avgPhysicalActivity / 60) * 100, 100)}%`,
          color:
            weeklySummary.avgPhysicalActivity >= 30
              ? "bg-green-400"
              : weeklySummary.avgPhysicalActivity >= 15
              ? "bg-yellow-300"
              : "bg-red-300",
        },
        {
          label: t.InsightsAverageSleepLabel,
          value: `${weeklySummary.avgSleepHours.toFixed(1)} ${t.HourText}`,
          width: `${Math.min((weeklySummary.avgSleepHours / 8) * 100, 100)}%`,
          color:
            weeklySummary.avgSleepHours >= 7
              ? "bg-green-400"
              : weeklySummary.avgSleepHours >= 5
              ? "bg-yellow-300"
              : "bg-red-300",
        },
      ];

      // ── Commit state ──────────────────────────────────────────────────
      setInsightData({ weeklySummary, dataCount: sortedPreds.length });
      setNarrativeInsight(insight);
      setWeeklyActivityData(chartData);
      setStressIntensityData([
        { name: t.HighText, value: Math.round((intensityCounts.high / total) * 100) },
        { name: t.MediumText, value: Math.round((intensityCounts.medium / total) * 100) },
        { name: t.LowText, value: Math.round((intensityCounts.low / total) * 100) },
      ]);
      setAcademicConditionData(academicBars);
      setTodayRecommendations(recommendations);
    } catch (err) {
      console.error("Failed to fetch summary data:", err);
      setError(err.response?.data?.message || err.message || t.InsightsFetchError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // ── Score color helpers ───────────────────────────────────────────────────
  const getScoreColor = (score, type = "stress") => {
    if (type === "stress") {
      if (score >= 70) return "text-red-400";
      if (score >= 40) return "text-orange-400";
      return "text-emerald-400";
    }
    if (type === "sleep") {
      if (score >= 7) return "text-emerald-400";
      if (score >= 5) return "text-orange-400";
      return "text-red-400";
    }
    if (type === "activity") {
      if (score >= 45) return "text-emerald-400";
      if (score >= 20) return "text-orange-400";
      return "text-red-400";
    }
    if (type === "load") {
      if (score >= 70) return "text-red-400";
      if (score >= 40) return "text-orange-400";
      return "text-emerald-400";
    }
    return "text-gray-400";
  };

  const getTrendIndicator = useCallback(
    (trendValue) => {
      if (trendValue > 0) return t.InsightsTrendUp;
      if (trendValue < 0) return t.InsightsTrendDown;
      return t.InsightsTrendStable;
    },
    [t]
  );

  // ── Metrics cards data ───────────────────────────────────────────────────
  const metricsData = useMemo(() => {
    if (!insightData) return [];
    const { weeklySummary } = insightData;
    return [
      {
        title: t.StressScoreTitle,
        value: weeklySummary.avgStressScore,
        maxScore: 100,
        color: getScoreColor(weeklySummary.avgStressScore, "stress"),
        subtitle: t.AverageText,
        trend: weeklySummary.stressTrend,
      },
      {
        title: t.LastNightSleepTitle,
        value: Number(weeklySummary.avgSleepHours.toFixed(1)),
        maxScore: 10,
        color: getScoreColor(weeklySummary.avgSleepHours, "sleep"),
        subtitle: `${weeklySummary.avgSleepHours.toFixed(1)} ${t.HourText} ${getTrendIndicator(weeklySummary.sleepTrend)}`,
        trend: weeklySummary.sleepTrend,
      },
      {
        title: t.TaskLoadTitle,
        value: Math.round(weeklySummary.avgAssignmentLoad),
        maxScore: 100,
        color: getScoreColor(weeklySummary.avgAssignmentLoad, "load"),
        subtitle: `${weeklySummary.avgAssignmentLoad.toFixed(0)}% ${getTrendIndicator(weeklySummary.taskLoadTrend)}`,
        trend: weeklySummary.taskLoadTrend,
      },
      {
        title: t.PhysicalActivityTitle,
        value: Math.round(weeklySummary.avgPhysicalActivity),
        maxScore: 60,
        color: getScoreColor(weeklySummary.avgPhysicalActivity, "activity"),
        subtitle: `${weeklySummary.avgPhysicalActivity.toFixed(0)} ${t.MinuteText} ${getTrendIndicator(weeklySummary.physicalActivityTrend)}`,
        trend: weeklySummary.physicalActivityTrend,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insightData, t, getTrendIndicator]);

  // ── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="theme-muted text-sm">Memuat summary...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
        <div className="text-center py-10 text-red-500">Error: {error}</div>
      </Layout>
    );
  }

  const latestInsightDescription = narrativeInsight?.insight_text || "Data summary belum tersedia.";
  const narrativeSubtitle = narrativeInsight?.created_at
    ? `${t.InsightsLatestFromDatabase} – ${new Date(narrativeInsight.created_at).toLocaleDateString(
        t.DashboardDateLocale,
        { day: "numeric", month: "long", year: "numeric" }
      )}`
    : "Belum ada insight AI yang tersimpan.";

  return (
    <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="theme-subtle text-xs uppercase mb-2">{t.InsightsEyebrow}</p>
            <h1 className="theme-text text-3xl md:text-4xl font-bold">{t.InsightsHeroTitle}</h1>
          </div>
          {dateRange && (
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-semibold self-start md:self-auto">
              {dateRange}
            </div>
          )}
        </div>

        {/* Section 1: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => (
            <StatsCard
              key={index}
              title={metric.title}
              value={metric.value}
              maxScore={metric.maxScore}
              color={metric.color}
              subtitle={metric.subtitle}
              trend={metric.trend}
            />
          ))}
        </div>

        {/* Section 2: AI Narrative Insight */}
        <AINarrativeCard
          title={t.AINarrativeInsightTitle}
          subtitle={narrativeSubtitle}
          description={latestInsightDescription}
        />

        {/* Section 3: Academic Condition Metrics */}
        <AcademicCondition items={academicConditionData} title={t.InsightsAcademicAverageTitle} />

        {/* Section 4: Weekly Analytics */}
        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyActivityChart data={weeklyActivityData} title={t.InsightsWeeklyActivityTitle} />
          <StressIntensityChart
            avgScore={insightData?.weeklySummary.avgStressScore || 0}
            data={stressIntensityData}
            title={t.InsightsStressIntensityTitle}
          />
        </div>

        {/* Section 5: Rekomendasi */}
        <div>
          <h2 className="theme-text text-2xl font-bold mb-4">{t.PriorityTodayTitle}</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {todayRecommendations.length > 0 ? (
              todayRecommendations.map((task, index) => (
                <PriorityCard
                  key={index}
                  title={task.title}
                  description={task.recommendation_text}
                  level={task.priority_level}
                  duration=""
                  stressImpact={
                    task.category
                      ? task.category.charAt(0).toUpperCase() + task.category.slice(1)
                      : ""
                  }
                />
              ))
            ) : (
              <div className="col-span-full theme-muted">{t.InsightsNoPriorityToday}</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default InsightPage;
