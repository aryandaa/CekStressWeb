import { useEffect, useMemo, useState } from "react";
import AINarrativeCard from "../components/Insights/AINarrativeCard";
import PriorityCard from "../components/Insights/PriorityCard";
import StatsCard from "../components/Insights/StatsCard";
import StressIntensityChart from "../components/Insights/StressIntensityChart";
import WeeklyActivityChart from "../components/Insights/WeeklyActivityChart";
import Layout from "../../layouts/Layout";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useLanguage } from "../contexts/LanguageContext";

const COLLECTION_KEYS = {
  summaries: ["summaries", "items", "rows", "summary"],
  insights: ["insights", "items", "rows", "insight"],
  recommendations: ["recommendations", "items", "rows", "recommendation"],
};

const getValue = (item, snakeKey, camelKey) => item?.[snakeKey] ?? item?.[camelKey];

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const unwrapCollection = (responseData, type) => {
  const data = responseData?.data ?? responseData;

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of COLLECTION_KEYS[type]) {
    const value = data?.[key];
    if (Array.isArray(value)) {
      return value;
    }
    if (value) {
      return [value];
    }
  }

  return [];
};

const sortNewest = (items) =>
  [...items].sort((a, b) => {
    const first = toDate(b.created_at ?? b.createdAt ?? b.updated_at ?? b.updatedAt ?? b.period_end ?? b.periodEnd);
    const second = toDate(a.created_at ?? a.createdAt ?? a.updated_at ?? a.updatedAt ?? a.period_end ?? a.periodEnd);

    return (first?.getTime() ?? 0) - (second?.getTime() ?? 0);
  });

const normalizeSummary = (summary) => ({
  id: summary.id,
  userId: getValue(summary, "user_id", "userId"),
  periodEnd: summary.period_end ?? summary.periodEnd ?? summary.week_end ?? summary.weekEnd,
  avgStressScore: toNumber(
    summary.avg_stress_score ?? summary.avgStressScore ?? summary.average_stress_level ?? summary.averageStressLevel,
  ),
  avgSleepHours: toNumber(
    summary.avg_sleep_hours ?? summary.avgSleepHours ?? summary.average_sleep_hours ?? summary.averageSleepHours,
  ),
  avgAssignmentLoad: toNumber(getValue(summary, "avg_assignment_load", "avgAssignmentLoad")),
  avgPhysicalActivity: toNumber(getValue(summary, "avg_physical_activity", "avgPhysicalActivity")),
  daysCount: toNumber(getValue(summary, "days_count", "daysCount")),
  highStressDays: toNumber(getValue(summary, "high_stress_days", "highStressDays")),
  mediumStressDays: toNumber(getValue(summary, "medium_stress_days", "mediumStressDays")),
  lowStressDays: toNumber(getValue(summary, "low_stress_days", "lowStressDays")),
  dominantStressLevel: getValue(summary, "dominant_stress_level", "dominantStressLevel"),
  createdAt: getValue(summary, "created_at", "createdAt"),
  updatedAt: getValue(summary, "updated_at", "updatedAt"),
});

const normalizeInsight = (insight) => ({
  id: insight.id,
  summaryId: insight.summary_id ?? insight.summaryId ?? insight.weekly_summary_id ?? insight.weeklySummaryId,
  text: getValue(insight, "insight_text", "insightText") ?? "",
  createdAt: getValue(insight, "created_at", "createdAt"),
});

const normalizeRecommendation = (recommendation) => ({
  id: recommendation.id,
  summaryId:
    recommendation.summary_id ??
    recommendation.summaryId ??
    recommendation.weekly_summary_id ??
    recommendation.weeklySummaryId,
  title: recommendation.title ?? "",
  text: getValue(recommendation, "recommendation_text", "recommendationText") ?? "",
  level: getValue(recommendation, "priority_level", "priorityLevel") ?? "",
  createdAt: getValue(recommendation, "created_at", "createdAt"),
});

const fetchRows = async (endpoint, type, params) => {
  const response = await api.get(endpoint, { params });
  return unwrapCollection(response.data, type);
};

const fetchFirstAvailableRows = async (endpoints, type, params) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      return await fetchRows(endpoint, type, params);
    } catch (error) {
      lastError = error;

      if (error.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

const fetchOptionalRows = async (endpoint, type, params) => {
  try {
    return await fetchRows(endpoint, type, params);
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw error;
  }
};

const sameId = (left, right) => String(left) === String(right);

const getStressLevelItem = (level, t) => {
  switch (String(level || "").toLowerCase()) {
    case "high":
    case "tinggi":
      return { name: t.HighText, color: "#f8b4b4" };
    case "moderate":
    case "medium":
    case "sedang":
      return { name: t.MediumText, color: "#c7d2fe" };
    case "low":
    case "rendah":
      return { name: t.LowText, color: "#4ade80" };
    default:
      return null;
  }
};

const getScoreColor = (score, type = "stress") => {
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

  if (score >= 70) return "text-red-400";
  if (score >= 40) return "text-orange-400";
  return "text-emerald-400";
};

function InsightPage() {
  const { user, loading: userLoading } = useUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [narrativeInsight, setNarrativeInsight] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchInsightsPageData = async () => {
      if (userLoading) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!user.id) {
          throw new Error("User ID tidak ditemukan. Silakan login ulang.");
        }

        const summaryRows = await fetchFirstAvailableRows(["/weekly-summaries", "/summaries"], "summaries", {
          user_id: user.id,
          limit: 1000,
          offset: 0,
        });
        const userSummaries = sortNewest(summaryRows.map(normalizeSummary))
          .filter((summary) => sameId(summary.userId, user.id));
        const latestSummary = userSummaries[0] ?? null;

        if (!latestSummary?.id) {
          setSummaries([]);
          setNarrativeInsight(null);
          setRecommendations([]);
          return;
        }

        const scopedParams = {
          user_id: user.id,
          summary_id: latestSummary.id,
          weekly_summary_id: latestSummary.id,
        };
        const [insightRows, recommendationRows] = await Promise.all([
          fetchOptionalRows("/insights", "insights", scopedParams),
          fetchOptionalRows("/recommendations", "recommendations", scopedParams),
        ]);

        setSummaries(userSummaries);
        setNarrativeInsight(
          sortNewest(insightRows.map(normalizeInsight))
            .filter((insight) => sameId(insight.summaryId, latestSummary.id) && insight.text.trim())[0] ?? null,
        );
        setRecommendations(
          sortNewest(recommendationRows.map(normalizeRecommendation))
            .filter((recommendation) => sameId(recommendation.summaryId, latestSummary.id)),
        );
      } catch (err) {
        console.error("Failed to fetch insights data:", err);
        setError(err.response?.data?.message || err.message || t.InsightsFetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsPageData();
  }, [user.id, userLoading, t.InsightsFetchError]);

  const latestSummary = summaries[0] ?? null;
  const metricCards = useMemo(() => {
    if (!latestSummary) {
      return [];
    }

    return [
      {
        title: t.StressScoreTitle,
        value: Math.round(latestSummary.avgStressScore),
        maxScore: 100,
        color: getScoreColor(latestSummary.avgStressScore),
        subtitle: t.InsightsLatestData,
      },
      {
        title: t.LastNightSleepTitle,
        value: Number(latestSummary.avgSleepHours.toFixed(1)),
        maxScore: 10,
        color: getScoreColor(latestSummary.avgSleepHours, "sleep"),
        subtitle: `${latestSummary.avgSleepHours.toFixed(1)} ${t.HourText}`,
      },
      {
        title: t.TaskLoadTitle,
        value: Math.round(latestSummary.avgAssignmentLoad),
        maxScore: 100,
        color: getScoreColor(latestSummary.avgAssignmentLoad),
        subtitle: `${latestSummary.avgAssignmentLoad.toFixed(0)}%`,
      },
      {
        title: t.PhysicalActivityTitle,
        value: Math.round(latestSummary.avgPhysicalActivity),
        maxScore: 60,
        color: getScoreColor(latestSummary.avgPhysicalActivity, "activity"),
        subtitle: `${latestSummary.avgPhysicalActivity.toFixed(0)} ${t.MinuteText}`,
      },
    ];
  }, [latestSummary, t]);

  const weeklyActivityData = useMemo(
    () =>
      summaries.slice(0, 7).reverse().map((summary) => ({
        day: (toDate(summary.periodEnd) ?? toDate(summary.createdAt))?.toLocaleDateString(t.DashboardDateLocale, {
          day: "numeric",
          month: "short",
        }) ?? "-",
        value: Math.round(summary.avgStressScore),
        hasData: true,
      })),
    [summaries, t.DashboardDateLocale],
  );

  const stressIntensityChart = useMemo(() => {
    if (!latestSummary) {
      return { data: [], valueSuffix: ` ${t.DayText ?? "hari"}` };
    }

    const stressDays = [
      { name: t.HighText, value: latestSummary.highStressDays, color: "#f8b4b4" },
      { name: t.MediumText, value: latestSummary.mediumStressDays, color: "#c7d2fe" },
      { name: t.LowText, value: latestSummary.lowStressDays, color: "#4ade80" },
    ];
    const hasStressDayData = stressDays.some((item) => item.value > 0);

    if (hasStressDayData) {
      return { data: stressDays, valueSuffix: ` ${t.DayText ?? "hari"}` };
    }

    const dominantStress = getStressLevelItem(latestSummary.dominantStressLevel, t);
    if (dominantStress) {
      return {
        data: [{ ...dominantStress, value: latestSummary.daysCount || 1 }],
        valueSuffix: ` ${t.DayText ?? "hari"}`,
      };
    }

    if (latestSummary.avgStressScore > 0) {
      return {
        data: [{
          name: t.StressScoreTitle,
          value: Math.round(latestSummary.avgStressScore),
          color: "#c7d2fe",
        }],
        valueSuffix: "/100",
      };
    }

    return { data: [], valueSuffix: ` ${t.DayText ?? "hari"}` };
  }, [latestSummary, t]);

  if (loading) {
    return (
      <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
        <div className="text-center py-10 theme-muted">{t.InsightsLoading}</div>
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

  const narrativeSubtitle = narrativeInsight?.createdAt
    ? `${t.InsightsLatestFromDatabase} - ${new Date(narrativeInsight.createdAt).toLocaleDateString(t.DashboardDateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`
    : t.InsightsNoData;

  return (
    <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
      <div className="space-y-6">
        <div>
          <p className="theme-subtle text-xs uppercase mb-2">{t.InsightsEyebrow}</p>
          <h1 className="theme-text text-3xl md:text-4xl font-bold">
            {t.InsightsHeroTitle}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.length > 0 ? (
            metricCards.map((metric) => (
              <StatsCard key={metric.title} {...metric} />
            ))
          ) : (
            <div className="col-span-full theme-muted">{t.InsightsNoData}</div>
          )}
        </div>

        <AINarrativeCard
          title={t.AINarrativeInsightTitle}
          subtitle={narrativeSubtitle}
          description={narrativeInsight?.text || t.InsightsNoData}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyActivityChart data={weeklyActivityData} title={t.InsightsWeeklyActivityTitle} />
          <StressIntensityChart
            avgScore={Math.round(latestSummary?.avgStressScore ?? 0)}
            data={stressIntensityChart.data}
            title={t.InsightsStressIntensityTitle}
            valueSuffix={stressIntensityChart.valueSuffix}
          />
        </div>

        <div>
          <h2 className="theme-text text-2xl font-bold mb-4">
            {t.PriorityTodayTitle}
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <PriorityCard
                  key={recommendation.id}
                  title={recommendation.title}
                  description={recommendation.text}
                  level={recommendation.level}
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
