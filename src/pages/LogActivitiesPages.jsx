import { useEffect, useState } from "react";
import Layout from "../../layouts/Layout";
import ActivityAnalysisPanel from "../components/ActivityInput/ActivityAnalysisPanel";
import ActivityFormPanel from "../components/ActivityInput/ActivityFormPanel";
import useActivityForm from "../components/ActivityInput/useActivityForm";
import { useLanguage } from "../contexts/LanguageContext";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getActivityHistory } from "../services/activityService";
import { getLocalDateString } from "../components/ActivityInput/activityFormConstants";

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

function LogActivitiesPage() {
  const { t } = useLanguage();
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const activityId = id || null;

  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);

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
  } = useActivityForm(t, null, activityId);

  const journalDate = formatJournalDate(form.activityDate, t.DashboardDateLocale);

  useEffect(() => {
    let isMounted = true;
    const checkTodayActivity = async () => {
      try {
        const response = await getActivityHistory();
        if (!isMounted) return;
        if (response.error) {
          setCheckingToday(false);
          return;
        }

        const todayStr = getLocalDateString();
        const hasTodayCompleted = (response.data || []).some(item => {
          const itemDateStr = item.predictionDate ? String(item.predictionDate).slice(0, 10) : "";
          return itemDateStr === todayStr && item.status === "Selesai";
        });

        if (hasTodayCompleted) {
          setAlreadyFilled(true);
        }
      } catch (err) {
        console.error("Gagal memeriksa catatan hari ini:", err);
      } finally {
        if (isMounted) {
          setCheckingToday(false);
        }
      }
    };

    if (!activityId) {
      checkTodayActivity();
    } else {
      setCheckingToday(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activityId]);

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
          </div>
        </div>

        {checkingToday ? (
          <div className="text-center py-10 theme-muted">Memeriksa catatan hari ini...</div>
        ) : alreadyFilled ? (
          <div className="theme-card rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 text-center max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="theme-text text-2xl font-bold">
                Jurnal Hari Ini Sudah Terisi
              </h3>
              <p className="theme-muted text-sm leading-relaxed">
                Anda sudah mengirimkan catatan aktivitas untuk hari ini ({journalDate}). Anda dapat melihat hasil analisis stres di dashboard atau melihat riwayat jurnal Anda.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
              >
                Ke Dashboard
              </button>
              <button
                onClick={() => navigate("/activity-history")}
                className="px-6 py-3 rounded-xl border border-white/10 theme-text font-semibold hover:bg-white/5 transition"
              >
                Lihat Riwayat
              </button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Layout>
  );
}

export default LogActivitiesPage;
