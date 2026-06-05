import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../../layouts/Layout";
import ActivityAnalysisPanel from "../components/ActivityInput/ActivityAnalysisPanel";
import ActivityFormPanel from "../components/ActivityInput/ActivityFormPanel";
import { getPastActivityDateOptions } from "../components/ActivityInput/activityFormConstants";
import useActivityForm from "../components/ActivityInput/useActivityForm";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getActivityHistory } from "../services/activityService";

function formatJournalDate(dateValue, locale) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = String(dateValue).split("-").map(Number);
  const date = year && month && day
    ? new Date(year, month - 1, day)
    : new Date(dateValue);

  return date.toLocaleDateString(locale || "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateOption(date, locale) {
  return date.toLocaleDateString(locale || "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getLocalDateKey(date) {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateKeyFromValue(dateValue) {
  if (!dateValue) {
    return "";
  }

  const stringValue = String(dateValue);

  if (stringValue.includes("T")) {
    return getLocalDateKey(new Date(stringValue));
  }

  return stringValue.slice(0, 10);
}

function getHistoryDateKey(item) {
  const dateValue = item.activity?.activity_date || item.predictionDate;

  return getDateKeyFromValue(dateValue);
}

function LogActivitiesPage() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const activityId = id || null;
  const [usedDateKeys, setUsedDateKeys] = useState(new Set());
  const handleSubmitted = useCallback((activityDate) => {
    if (!activityDate) {
      return;
    }

    setUsedDateKeys((currentDates) => {
      const nextDates = new Set(currentDates);
      nextDates.add(getDateKeyFromValue(activityDate));
      return nextDates;
    });
  }, []);
  const {
    analysisPrediction,
    handleCancelSubmit,
    handleConfirmSubmit,
    error,
    form,
    handleChange,
    handleSubmit,
    handleSaveDraft,
    handleCloseAnalysis,
    isAnalysisLoading,
    isSubmitting,
    message,
    showAnalysis,
    showSubmitConfirmation,
  } = useActivityForm(t, null, activityId, { onSubmitted: handleSubmitted });
  const journalDate = formatJournalDate(form.activityDate, t.DashboardDateLocale);
  const allActivityDateOptions = useMemo(() => getPastActivityDateOptions(), []);
  const activityDateOptions = useMemo(
    () => allActivityDateOptions.filter((option) => {
      if (activityId && option.value === form.activityDate) {
        return true;
      }

      return !usedDateKeys.has(option.value);
    }),
    [activityId, allActivityDateOptions, form.activityDate, usedDateKeys],
  );
  const showNoDatePopup =
    !activityId &&
    usedDateKeys.size > 0 &&
    activityDateOptions.length === 0 &&
    !showAnalysis;

  useEffect(() => {
    let isMounted = true;

    const fetchUsedDates = async () => {
      const response = await getActivityHistory();

      if (!isMounted || response.error) {
        return;
      }

      const dateKeys = new Set(
        (response.data || [])
          .map(getHistoryDateKey)
          .filter(Boolean),
      );

      setUsedDateKeys(dateKeys);
    };

    fetchUsedDates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activityId || usedDateKeys.size === 0) {
      return;
    }

    if (
      activityDateOptions.length > 0 &&
      !activityDateOptions.some((option) => option.value === form.activityDate)
    ) {
      handleChange({
        target: {
          name: "activityDate",
          value: activityDateOptions[0].value,
        },
      });
    }
  }, [activityDateOptions, activityId, form.activityDate, handleChange, showAnalysis, usedDateKeys.size]);

  return (
    <Layout title={t.LogActivityTitle} name={user.fullname} role={user.role}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <section className="theme-card rounded-2xl p-5 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
            <div>
              <h1 className="theme-text text-3xl font-extrabold md:text-4xl">
                {t.ActivityPageTitle}
              </h1>
              <p className="theme-muted mt-3 text-sm leading-relaxed md:text-base">
                {t.ActivityPageDescription}
              </p>
            </div>
          </div>
        </section>

      <div className="theme-card rounded-2xl border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          
          {/* Icon */}
          <div className="theme-card-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="theme-muted h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="min-w-0">
            <h3 className="theme-text text-xl font-semibold">
              {t.ActivityJournalHeader}
              <span className="ml-2 text-blue-300">
                {journalDate}
              </span>
            </h3>

            <p className="theme-muted mt-1 text-sm">
              {t.ActivityJournalDescription}
            </p>
          </div>
        </div>

        <label className="grid gap-2 md:min-w-[280px]">
          <span className="theme-muted text-[11px] font-bold uppercase tracking-widest">
            {t.ActivitySelectDateLabel}
          </span>
          <select
            name="activityDate"
            value={form.activityDate}
            onChange={handleChange}
            disabled={activityDateOptions.length === 0}
            className="theme-input h-12 rounded-xl border px-4 text-sm font-semibold outline-none transition focus:border-blue-300"
          >
            {activityDateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatDateOption(option.date, t.DashboardDateLocale)}
              </option>
            ))}
          </select>
        </label>
      </div>
      </div>

        <form
          onSubmit={handleSubmit}
          className="gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]"
        >
          <ActivityFormPanel
            error={error}
            form={form}
            isSubmitting={isSubmitting}
            message={message}
            onChange={handleChange}
            onSaveDraft={handleSaveDraft}
            t={t}
          />
        </form>

        <ActivityAnalysisPanel
          isLoading={isAnalysisLoading}
          prediction={analysisPrediction}
          t={t}
          visible={showAnalysis}
          onClose={handleCloseAnalysis}
        />

        {showSubmitConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="theme-card w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl">
              <h3 className="theme-text text-2xl font-bold">
                {t.ActivitySubmitConfirmationTitle}
              </h3>
              <p className="theme-muted mt-3 text-sm leading-relaxed">
                {t.ActivitySubmitConfirmationDescription}{" "}
                <span className="theme-text font-semibold">{journalDate}</span>?
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="theme-card-muted h-12 flex-1 rounded-xl border px-4 text-sm font-semibold transition theme-hover"
                >
                  {t.ActivityReviewAgainButton}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="h-12 flex-1 rounded-xl bg-blue-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-blue-300"
                >
                  {t.ActivityConfirmSubmitButton}
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoDatePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="theme-card w-full max-w-md rounded-2xl border p-6 text-center shadow-2xl">
              <h3 className="theme-text text-2xl font-bold">
                {t.ActivityAllDatesFilledTitle}
              </h3>
              <p className="theme-muted mt-3 text-sm leading-relaxed">
                {t.ActivityAllDatesFilledDescription}
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mt-6 h-12 w-full rounded-xl bg-blue-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-blue-300"
              >
                {t.ActivityGoToDashboardButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default LogActivitiesPage;
