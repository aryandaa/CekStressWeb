import { Sparkles } from "lucide-react";

function AINarrativeCard({ 
  title = "AI Narrative Insight", 
  subtitle = "Berikut insight untuk minggu ini",
  description = "",
  isEmpty = false,
  onActionClick
}) {
  if (isEmpty) {
    const isIndonesian = subtitle.includes("Berikut") || subtitle.includes("Belum") || subtitle.includes("terbaru") || subtitle.includes("data") || subtitle.includes("ringkasan");
    return (
      <div className="theme-card border rounded-2xl p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles size={32} className="animate-pulse" />
          </div>
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="theme-text font-bold text-xl">
            {title}
          </h3>
          <p className="theme-muted text-sm leading-relaxed">
            {isIndonesian
              ? "AI membutuhkan catatan aktivitas Anda untuk menganalisis tingkat stres dan memberikan ringkasan naratif mingguan yang personal."
              : "AI needs your activity records to analyze stress levels and provide a personalized weekly narrative summary."}
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onActionClick}
            className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-xs transition hover:bg-blue-600 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {isIndonesian ? "+ Mulai Isi Jurnal Aktivitas" : "+ Start Journaling Activity"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-card border rounded-2xl p-6">
      <div className="flex gap-3 items-start justify-between">
        <div className="flex gap-3 items-start">
          <div className="p-3 rounded-lg bg-blue-500/20">
            <Sparkles size={18} className="text-blue-400" />
          </div>

          <div>
            <h3 className="theme-text font-semibold text-lg">
              {title}
            </h3>

            <p className="theme-subtle text-sm">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="theme-card-muted mt-4 rounded-lg p-5 border">
        <p className="theme-muted leading-8 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

export default AINarrativeCard;
