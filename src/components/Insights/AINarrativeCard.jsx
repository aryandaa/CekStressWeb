import { Sparkles } from "lucide-react";

function AINarrativeCard({ 
  title = "AI Narrative Insight", 
  subtitle = "Berikut insight untuk minggu ini",
  description = ""
}) {
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
