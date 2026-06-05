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
import { getActivityHistory } from "../services/activityService";

const getNumberField = (data, snakeCaseName, camelCaseName) => {
  const value = data?.[snakeCaseName] ?? data?.[camelCaseName];
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getAverage = (items, selector) => {
  const values = items.map(selector).filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getTrendPercentage = (items, selector) => {
  if (items.length < 2) {
    return 0;
  }

  const sortedItems = [...items].sort((a, b) => a.datetime - b.datetime);
  const midpoint = Math.ceil(sortedItems.length / 2);
  const firstAverage = getAverage(sortedItems.slice(0, midpoint), selector);
  const lastAverage = getAverage(sortedItems.slice(midpoint), selector);

  if (!firstAverage || !lastAverage) {
    return 0;
  }

  return Math.round(((lastAverage - firstAverage) / firstAverage) * 100);
};

const formatTemplate = (template, values) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );

const getPriorityLevel = (condition) => (condition ? "URGENT" : "PENTING");

const normalizeRecommendation = (recommendation, locale) => ({
  id: recommendation.id,
  title: recommendation.title || recommendation.category || "Rekomendasi",
  recommendation_text:
    recommendation.recommendation_text ||
    recommendation.description ||
    "Belum ada detail rekomendasi.",
  priority_level: recommendation.priority_level || "medium",
  category: recommendation.category || "Umum",
  duration: recommendation.created_at
    ? new Date(recommendation.created_at).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Dari database",
  stressImpact: recommendation.category || "Rekomendasi AI",
});

const normalizeInsight = (insight) => {
  if (!insight) {
    return null;
  }

  return {
    id: insight.id,
    insight_text: insight.insight_text || insight.description || "",
    created_at: insight.created_at,
  };
};

const buildRecommendations = (latestActivity, weeklySummary) => {
  const recommendations = [];
  const latestStress = getNumberField(latestActivity, "stress_score", "stressScore");
  const latestSleep = getNumberField(latestActivity, "sleep_hours", "sleepHours");
  const latestDeadline = getNumberField(latestActivity, "deadline_pressure", "deadlinePressure");
  const latestTaskLoad = getNumberField(latestActivity, "assignment_load", "assignmentLoad");
  const latestPhysicalActivity = getNumberField(
    latestActivity,
    "physical_activity_minutes",
    "physicalActivityMinutes",
  );

  if (latestStress >= 70) {
    recommendations.push({
      title: "Turunkan intensitas stres hari ini",
      recommendation_text:
        "Ambil satu jeda pemulihan sebelum mengerjakan tugas berikutnya, lalu pilih satu tugas paling penting untuk diselesaikan lebih dulu.",
      priority_level: "URGENT",
      category: "today",
      duration: "Hari ini",
      stressImpact: "Prioritas tinggi",
    });
  }

  if (latestSleep > 0 && latestSleep < 6) {
    recommendations.push({
      title: "Pulihkan jam tidur",
      recommendation_text:
        "Majukan waktu tidur malam ini dan hindari pekerjaan berat mendekati jam istirahat agar energi besok lebih stabil.",
      priority_level: getPriorityLevel(latestStress >= 70),
      category: "today",
      duration: "Malam ini",
      stressImpact: `${latestSleep.toFixed(1)} jam tidur`,
    });
  }

  if (latestDeadline >= 70 || latestTaskLoad >= 70) {
    recommendations.push({
      title: "Pecah beban tugas menjadi langkah kecil",
      recommendation_text:
        "Buat daftar 3 langkah paling dekat dari tugas dengan deadline tertinggi, lalu kerjakan satu per satu dengan blok waktu pendek.",
      priority_level: getPriorityLevel(latestDeadline >= 80),
      category: "today",
      duration: "60-90 menit",
      stressImpact: `${Math.max(latestDeadline, latestTaskLoad).toFixed(0)}% tekanan`,
    });
  }

  if (latestPhysicalActivity < 20) {
    recommendations.push({
      title: "Tambahkan aktivitas fisik ringan",
      recommendation_text:
        "Sisihkan jalan kaki atau peregangan singkat agar tubuh tidak terus berada dalam mode tegang setelah belajar.",
      priority_level: "SEDANG",
      category: "long-term",
      duration: "15-20 menit",
      stressImpact: `${latestPhysicalActivity.toFixed(0)} menit`,
    });
  }

  if (weeklySummary.avgSocialMediaHours >= 4) {
    recommendations.push({
      title: "Batasi distraksi media sosial",
      recommendation_text:
        "Kurangi sesi media sosial panjang pada jam belajar dan pindahkan ke waktu istirahat yang sudah ditentukan.",
      priority_level: "SEDANG",
      category: "long-term",
      duration: "Minggu ini",
      stressImpact: `${weeklySummary.avgSocialMediaHours.toFixed(1)} jam/hari`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Pertahankan ritme yang sudah baik",
      recommendation_text:
        "Data terakhir terlihat cukup stabil. Tetap isi jurnal harian agar pola stres, tidur, dan beban tugas bisa dipantau lebih akurat.",
      priority_level: "SEDANG",
      category: "long-term",
      duration: "Minggu ini",
      stressImpact: "Stabil",
    });
  }

  return recommendations;
};

function InsightPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insightData, setInsightData] = useState(null);
  const [todayRecommendations, setTodayRecommendations] = useState([]);
  const [longTermRecommendations, setLongTermRecommendations] = useState([]);
  const [narrativeInsight, setNarrativeInsight] = useState(null);
  const [weeklyActivityData, setWeeklyActivityData] = useState([]);
  const [academicConditionData, setAcademicConditionData] = useState([]);
  const [stressIntensityData, setStressIntensityData] = useState([]);

  useEffect(() => {
    const fetchInsightsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const historyResponse = await getActivityHistory();

        if (historyResponse.error) {
          throw new Error(historyResponse.message);
        }

        const history = historyResponse.data || [];
        const completedHistory = history
          .filter((item) => item.status !== "Draft")
          .sort((a, b) => b.datetime - a.datetime);
        const latestSevenItems = completedHistory.slice(0, 7);
        const latestItem = completedHistory[0];
        const latestActivity = latestItem
          ? {
              ...latestItem.activity,
              ...latestItem.prediction,
              stress_score: latestItem.stressScore,
              stressScore: latestItem.stressScore,
            }
          : null;

        const weeklySummary = {
          avgStressScore: Math.round(getAverage(latestSevenItems, (item) => item.stressScore)),
          avgSleepHours: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "sleep_hours", "sleepHours"),
          ),
          avgAssignmentLoad: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "assignment_load", "assignmentLoad"),
          ),
          avgDeadlinePressure: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "deadline_pressure", "deadlinePressure"),
          ),
          avgPhysicalActivity: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "physical_activity_minutes", "physicalActivityMinutes"),
          ),
          avgStudyHours: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "study_hours", "studyHours"),
          ),
          avgSocialMediaHours: getAverage(latestSevenItems, (item) =>
            getNumberField(item.activity, "social_media_hours", "socialMediaHours"),
          ),
          stressTrend: getTrendPercentage(latestSevenItems, (item) => item.stressScore),
          sleepTrend: getTrendPercentage(latestSevenItems, (item) =>
            getNumberField(item.activity, "sleep_hours", "sleepHours"),
          ),
          taskLoadTrend: getTrendPercentage(latestSevenItems, (item) =>
            getNumberField(item.activity, "assignment_load", "assignmentLoad"),
          ),
          physicalActivityTrend: getTrendPercentage(latestSevenItems, (item) =>
            getNumberField(item.activity, "physical_activity_minutes", "physicalActivityMinutes"),
          ),
        };

        const chartData = [...latestSevenItems].reverse().map((item) => {
          const itemDate = item.prediction?.prediction_date || item.datetime;
          const date = new Date(itemDate);

          return {
            day: date.toLocaleDateString(t.DashboardDateLocale, {
              day: "numeric",
              month: "short",
            }),
            value: item.stressScore,
            hasData: true,
          };
        });

        const intensityCounts = latestSevenItems.reduce(
          (counts, item) => {
            if (item.stressScore >= 70) {
              counts.high += 1;
            } else if (item.stressScore >= 40) {
              counts.medium += 1;
            } else {
              counts.low += 1;
            }

            return counts;
          },
          { high: 0, medium: 0, low: 0 },
        );
        const totalIntensity = latestSevenItems.length || 1;

        const generatedRecommendations = buildRecommendations(latestActivity, weeklySummary);
        let latestDatabaseInsight = null;
        let databaseRecommendations = [];

        try {
          const insightResponse = await api.get("/insights/latest");
          latestDatabaseInsight = normalizeInsight(insightResponse.data.data?.insight);
        } catch (insightError) {
          console.warn("Failed to fetch latest insight:", insightError);
        }

        try {
          const recommendationsResponse = await api.get("/recommendations", {
            params: { limit: 10, offset: 0 },
          });
          databaseRecommendations =
            recommendationsResponse.data.data?.recommendations?.map((recommendation) =>
              normalizeRecommendation(recommendation, t.DashboardDateLocale)
            ) || [];
        } catch (recommendationError) {
          console.warn("Failed to fetch recommendations:", recommendationError);
        }

        setInsightData({ latestActivity, weeklySummary, dataCount: latestSevenItems.length });
        setNarrativeInsight(latestDatabaseInsight);
        setWeeklyActivityData(chartData);
        setStressIntensityData([
          { name: t.HighText, value: Math.round((intensityCounts.high / totalIntensity) * 100) },
          { name: t.MediumText, value: Math.round((intensityCounts.medium / totalIntensity) * 100) },
          { name: t.LowText, value: Math.round((intensityCounts.low / totalIntensity) * 100) },
        ]);
        setAcademicConditionData([
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
            color: weeklySummary.avgAssignmentLoad >= 70 ? "bg-red-300" : weeklySummary.avgAssignmentLoad >= 40 ? "bg-yellow-300" : "bg-green-400",
          },
          {
            label: t.InsightsDeadlinePressureLabel,
            value: `${weeklySummary.avgDeadlinePressure.toFixed(0)}%`,
            width: `${Math.min(weeklySummary.avgDeadlinePressure, 100)}%`,
            color: weeklySummary.avgDeadlinePressure >= 70 ? "bg-red-300" : weeklySummary.avgDeadlinePressure >= 40 ? "bg-yellow-300" : "bg-green-400",
          },
          {
            label: t.InsightsPhysicalActivityLabel,
            value: `${weeklySummary.avgPhysicalActivity.toFixed(0)} ${t.MinuteText}`,
            width: `${Math.min((weeklySummary.avgPhysicalActivity / 60) * 100, 100)}%`,
            color: weeklySummary.avgPhysicalActivity >= 30 ? "bg-green-400" : weeklySummary.avgPhysicalActivity >= 15 ? "bg-yellow-300" : "bg-red-300",
          },
          {
            label: t.InsightsAverageSleepLabel,
            value: `${weeklySummary.avgSleepHours.toFixed(1)} ${t.HourText}`,
            width: `${Math.min((weeklySummary.avgSleepHours / 8) * 100, 100)}%`,
            color: weeklySummary.avgSleepHours >= 7 ? "bg-green-400" : weeklySummary.avgSleepHours >= 5 ? "bg-yellow-300" : "bg-red-300",
          },
        ]);
        setTodayRecommendations(generatedRecommendations.filter((rec) => rec.category === "today"));
        setLongTermRecommendations(databaseRecommendations);

      } catch (err) {
        console.error("Failed to fetch insights data:", err);
        setError(err.response?.data?.message || err.message || t.InsightsFetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsData();
  }, [user.fullname, t]);

  // Helper to determine color based on score/level
  const getScoreColor = (score, type = 'stress') => {
    if (type === 'stress') {
      if (score >= 70) return "text-red-400";
      if (score >= 40) return "text-orange-400";
      return "text-emerald-400";
    }
    if (type === 'sleep') {
      if (score >= 7) return "text-emerald-400"; // Good sleep
      if (score >= 5) return "text-orange-400"; // Moderate sleep
      return "text-red-400"; // Low sleep
    }
    if (type === 'activity') {
      if (score >= 45) return "text-emerald-400"; // Good activity (e.g., 45 mins)
      if (score >= 20) return "text-orange-400";
      return "text-red-400";
    }
    if (type === 'load') { // For assignment load, higher is worse
      if (score >= 70) return "text-red-400";
      if (score >= 40) return "text-orange-400";
      return "text-emerald-400";
    }
    return "text-gray-400";
  };

  // Helper to determine trend indicator
  const getTrendIndicator = useCallback((trendValue) => {
    if (trendValue > 0) return t.InsightsTrendUp;
    if (trendValue < 0) return t.InsightsTrendDown;
    return t.InsightsTrendStable;
  }, [t]);

  // Map dashboardData to metricsData for StatsCard
  const metricsData = useMemo(() => {
    if (!insightData) return [];

    const latestActivity = insightData.latestActivity;
    const weeklySummary = insightData.weeklySummary;
    const latestStressScore = getNumberField(latestActivity, "stress_score", "stressScore");

    return [
      {
        title: t.StressScoreTitle,
        value: Math.round(latestStressScore),
        maxScore: 100,
        color: getScoreColor(latestStressScore, 'stress'),
        subtitle: latestActivity ? t.InsightsLatestData : t.InsightsNoData,
        trend: weeklySummary.stressTrend,
      },
      {
        title: t.LastNightSleepTitle,
        value: Number(weeklySummary.avgSleepHours.toFixed(1)),
        maxScore: 10,
        color: getScoreColor(weeklySummary.avgSleepHours, 'sleep'),
        subtitle: `${weeklySummary.avgSleepHours.toFixed(1)} ${t.HourText} ${getTrendIndicator(weeklySummary.sleepTrend)}`,
        trend: weeklySummary.sleepTrend,
      },
      {
        title: t.TaskLoadTitle,
        value: Math.round(weeklySummary.avgAssignmentLoad),
        maxScore: 100,
        color: getScoreColor(weeklySummary.avgAssignmentLoad, 'load'),
        subtitle: `${weeklySummary.avgAssignmentLoad.toFixed(0)}% ${getTrendIndicator(weeklySummary.taskLoadTrend)}`,
        trend: weeklySummary.taskLoadTrend,
      },
      {
        title: t.PhysicalActivityTitle,
        value: Math.round(weeklySummary.avgPhysicalActivity),
        maxScore: 60,
        color: getScoreColor(weeklySummary.avgPhysicalActivity, 'activity'),
        subtitle: `${weeklySummary.avgPhysicalActivity.toFixed(0)} ${t.MinuteText} ${getTrendIndicator(weeklySummary.physicalActivityTrend)}`,
        trend: weeklySummary.physicalActivityTrend,
      },
    ];
  }, [getTrendIndicator, insightData, t]);

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

  const fallbackInsightDescription = insightData?.latestActivity
    ? formatTemplate(t.InsightsFallbackWithData, {
        count: insightData.dataCount,
        stressScore: insightData.weeklySummary.avgStressScore,
        sleepHours: insightData.weeklySummary.avgSleepHours.toFixed(1),
        taskLoad: insightData.weeklySummary.avgAssignmentLoad.toFixed(0),
        physicalActivity: insightData.weeklySummary.avgPhysicalActivity.toFixed(0),
      })
    : t.InsightsFallbackNoData;
  const latestInsightDescription =
    narrativeInsight?.insight_text || fallbackInsightDescription;
  const narrativeSubtitle = narrativeInsight?.created_at
    ? `${t.InsightsLatestFromDatabase} - ${new Date(narrativeInsight.created_at).toLocaleDateString(t.DashboardDateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`
    : t.AINarrativeInsightSubtitle;

  return (
    <Layout title={t.InsightsPageTitle} name={user.fullname} role={user.role}>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <p className="theme-subtle text-xs uppercase mb-2">
            {t.InsightsEyebrow}
          </p>
          <h1 className="theme-text text-3xl md:text-4xl font-bold">
            {t.InsightsHeroTitle}
          </h1>
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

        {/* Section 5: Prioritas Hari Ini */}
        <div>
          <h2 className="theme-text text-2xl font-bold mb-4">
            {t.PriorityTodayTitle}
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {todayRecommendations.length > 0 ? (
              todayRecommendations.map((task, index) => (
                <PriorityCard
                  key={index}
                  title={task.title}
                  description={task.recommendation_text}
                  level={task.priority_level}
                  duration={task.duration}
                  stressImpact={task.stressImpact}
                />
              ))
            ) : (
              <div className="col-span-full theme-muted">{t.InsightsNoPriorityToday}</div>
            )}
          </div>
        </div>

        {/* Section 6: Long-term Suggestions */}
        <div>
          <h2 className="theme-text text-2xl font-bold mb-4 mt-8">
            {t.LongTermTitle}
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {longTermRecommendations.length > 0 ? (
              longTermRecommendations.map((suggestion, index) => (
                <PriorityCard
                  key={index}
                  title={suggestion.title}
                  description={suggestion.recommendation_text}
                  level={suggestion.priority_level}
                  duration={suggestion.duration}
                  stressImpact={suggestion.stressImpact}
                />
              ))
            ) : (
              <div className="col-span-full theme-muted">{t.InsightsNoLongTermSuggestions}</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default InsightPage;

