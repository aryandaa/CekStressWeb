import api from "./api";

export const createActivity = async (payload) => {
  try {
    const response = await api.post("/activities", payload);

    return {
      error: false,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan",
    };
  }
};

export const updateActivity = async (id, payload) => {
  try {
    const response = await api.put(`/activities/${id}`, payload);

    return {
      error: false,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan",
    };
  }
};

export const getActivityById = async (id) => {
  try {
    const response = await api.get(`/activities/${id}`);

    return {
      error: false,
      data: response.data.data.activity,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Gagal memuat aktivitas",
    };
  }
};

function normalizeScore(score) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value <= 1 ? value * 100 : value);
}

function parseDateOnly(dateValue) {
  if (!dateValue) {
    return new Date("");
  }

  const stringValue = String(dateValue);
  const dateStr = stringValue.includes("T") ? stringValue.split("T")[0] : stringValue;
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(dateValue);
  }

  return new Date(year, month - 1, day);
}

function getScoreLabel(level, score) {
  const normalizedLevel = String(level || "").toLowerCase();

  if (normalizedLevel === "high") {
    return "Tinggi";
  }

  if (normalizedLevel === "moderate" || normalizedLevel === "medium") {
    return "Sedang";
  }

  if (normalizedLevel === "low") {
    return "Rendah";
  }

  if (score >= 70) {
    return "Tinggi";
  }

  if (score >= 40) {
    return "Sedang";
  }

  return "Rendah";
}

export const getActivityHistory = async () => {
  try {
    const [activitiesResponse, predictionsResponse] = await Promise.all([
      api.get("/activities", { params: { limit: 1000, offset: 0 } }),
      api.get("/predictions", { params: { limit: 1000, offset: 0 } }),
    ]);

    const activities = activitiesResponse.data.data?.activities || [];
    const predictions = predictionsResponse.data.data?.predictions || [];
    const activitiesById = new Map(
      activities.map((activity) => [String(activity.id), activity]),
    );
    const predictedActivityIds = new Set(
      predictions
        .map((prediction) => prediction.activity_id)
        .filter(Boolean)
        .map(String),
    );

    const completedHistory = predictions.map((prediction) => {
      const activity = activitiesById.get(String(prediction.activity_id));
      const stressScore = normalizeScore(prediction.stress_score);
      const activityDate = activity?.activity_date || prediction.prediction_date;
      const datetime = new Date(prediction.created_at || activity?.created_at || activityDate);

      return {
        id: prediction.activity_id || prediction.id,
        datetime,
        activityDateTime: parseDateOnly(activityDate),
        predictionDate: activityDate,
        stressScore,
        stress_score: stressScore,
        scoreLabel: getScoreLabel(prediction.stress_level, stressScore),
        status: "Selesai",
        activity,
        prediction,
        predictionId: prediction.id,
      };
    });

    const draftHistory = activities
      .filter((activity) => {
        const isDraft = String(activity.activity_status || "").toLowerCase() === "draft";
        return isDraft && !predictedActivityIds.has(String(activity.id));
      })
      .map((activity) => ({
        id: activity.id,
        datetime: new Date(activity.created_at || activity.activity_date),
        activityDateTime: parseDateOnly(activity.activity_date || activity.created_at),
        predictionDate: activity.activity_date,
        stressScore: 0,
        stress_score: 0,
        scoreLabel: "Belum selesai",
        status: "Draft",
        activity,
        prediction: null,
      }));

    const history = [...completedHistory, ...draftHistory].sort((a, b) => {
      const dateA = a.predictionDate || "";
      const dateB = b.predictionDate || "";
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return b.datetime - a.datetime;
    });

    return {
      error: false,
      data: history,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Gagal memuat riwayat aktivitas.",
    };
  }
};
