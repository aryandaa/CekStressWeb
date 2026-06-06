import PropTypes from "prop-types";

function getStressCategory(score, t) {
  if (score <= 39) {
    return { 
      label: t.LowText,
      color: "text-emerald-400",
      bgcolor: "to-emerald-950/60",
      tag: "text-emerald-300",
      bgcolorTag: "bg-emerald-500/25" 
    };
  }

  if (score <= 69) {
    return { 
      label: t.MediumText,
      color: "text-yellow-400",
      bgcolor: "to-yellow-950/60",
      tag: "text-yellow-300",
      bgcolorTag: "bg-yellow-500/25" 
    };
  }

  return { 
    label: t.HighText,
    color: "text-red-400" ,
    bgcolor: "to-red-950/60",
    tag: "text-red-300",
    bgcolorTag: "bg-red-500/25" 
  };
}

function normalizeStressScore(score) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value <= 1 ? value * 100 : value);
}

function getPredictionValue(prediction, snakeKey, camelKey) {
  return prediction?.[snakeKey] ?? prediction?.[camelKey];
}

function ActivityAnalysisPanel({ isLoading = false, prediction = null, t, visible = true, onClose }) {
  if (!visible) {
    return null;
  }

  const stressScore = normalizeStressScore(getPredictionValue(prediction, "stress_score", "stressScore"));
  const confidenceScore = normalizeStressScore(getPredictionValue(prediction, "confidence_score", "confidenceScore"));
  const stressCategory = getStressCategory(stressScore ?? 0, t);
  const hasPrediction = stressScore !== null;
  const predictionSummary =
    prediction?.summary ||
    prediction?.insight_text ||
    prediction?.recommendation_text ||
    prediction?.description ||
    "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-theme-card p-6 shadow-2xl transition duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="theme-card-muted theme-text absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] shadow-sm transition hover:border-blue-400 hover:text-blue-400"
          aria-label={t.CloseButton || "Tutup"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <section className={`theme-card rounded-3xl border-0 bg-linear-to-br ${stressCategory.bgcolor} p-6 md:p-7`}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="theme-muted text-[11px] font-bold uppercase tracking-widest">
                {t.ActivityReviewLabel}
              </p>
              <h2 className="theme-text mt-2 text-2xl font-bold">
                {t.ActivityTodayStatusTitle}
              </h2>
            </div>
            <span className={`rounded-full ${stressCategory.bgcolorTag} px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${stressCategory.tag}`}>
              {t.ActivityAnalysisTag}
            </span>
          </div>

          <div className="text-center">
            {isLoading || !hasPrediction ? (
              <div className="py-8">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-300/20 border-t-blue-300" />
                <p className="theme-text mt-5 text-lg font-bold">
                  {t.ActivityAnalysisLoadingTitle}
                </p>
                <p className="theme-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed">
                  {t.ActivityAnalysisLoadingDescription}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-center gap-2">
                  <span className={`text-7xl font-extrabold ${stressCategory.color}`}>
                    {stressScore}
                  </span>
                  <span className="theme-muted mt-4 text-xl font-bold">%</span>
                </div>
                <p className={`mt-2 text-xl font-bold ${stressCategory.color}`}>
                  {stressCategory.label}
                </p>
                {predictionSummary && (
                  <p className="theme-muted mx-auto mt-4 max-w-xs text-sm leading-relaxed">
                    {predictionSummary}
                  </p>
                )}
                {confidenceScore !== null && (
                  <p className="theme-subtle mt-4 text-xs font-semibold uppercase tracking-wide">
                    Confidence {confidenceScore}%
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

ActivityAnalysisPanel.propTypes = {
  isLoading: PropTypes.bool,
  prediction: PropTypes.shape({
    stress_level: PropTypes.string,
    stressLevel: PropTypes.string,
    stress_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stressScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    confidence_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    confidenceScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    summary: PropTypes.string,
    insight_text: PropTypes.string,
    recommendation_text: PropTypes.string,
    description: PropTypes.string,
  }),
  t: PropTypes.objectOf(PropTypes.string).isRequired,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
};

export default ActivityAnalysisPanel;
