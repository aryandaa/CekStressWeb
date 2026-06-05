import PropTypes from "prop-types";
import { useLanguage } from "../../contexts/LanguageContext";

function Datas({ title, value, metric }) {
    const { t } = useLanguage();

    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const normalizePercent = (score) => Math.min(score <= 10 ? score * 10 : score, 100);

    const getStatus = (score) => {
      switch (metric) {
        case "StudyTime":
          return {
            label: t.HourText,
            color:
              score >= 4
                ? "text-green-500"
                : score >= 2
                ? "text-yellow-500"
                : "text-red-500",
            bgcolor:
              score >= 4
                ? "bg-green-500"
                : score >= 2
                ? "bg-yellow-500"
                : "bg-red-500",
          };

        case "DeadlinePressure":
        case "TaskLoad": {
          const percent = normalizePercent(score);

          if (percent < 40) {
            return {
              label: "%",
              color: "text-green-500",
              bgcolor: "bg-green-500",
            };
          }

          if (percent < 70) {
            return {
              label: "%",
              color: "text-yellow-500",
              bgcolor: "bg-yellow-500",
            };
          }

          return {
            label: "%",
            color: "text-red-500",
            bgcolor: "bg-red-500",
          };
        }

        case "Mood":
          if (score <= 25) {
            return {
              label: t.PositiveText,
              color: "text-green-500",
              bgcolor: "bg-green-500",
            };
          }

          if (score <= 65) {
            return {
              label: t.MediumText,
              color: "text-yellow-500",
              bgcolor: "bg-yellow-500",
            };
          }

          return {
            label: t.HighText,
            color: "text-red-500",
            bgcolor: "bg-red-500",
          };

        case "Fatigue":
          if (score < 40) {
            return {
              label: t.PositiveText,
              color: "text-green-500, ",
              bgcolor: "bg-green-500",
            };
          }

          if (score < 70) {
            return {
              label: t.MediumText,
              color: "text-yellow-500",
              bgcolor: "bg-yellow-500",
            };
          }

          return {
            label: t.HighText,
            color: "text-red-500",
            bgcolor: "bg-red-500",
          };

        case "SocialMedia":
          if (score < 2) {
            return {
              label: t.HourText,
              color: "text-green-500",
              bgcolor: "bg-green-500",
            };
          }

          if (score < 4) {
            return {
              label: t.HourText,
              color: "text-yellow-500",
              bgcolor: "bg-yellow-500",
            };
          }

          return {
            label: t.HourText,
            color: "text-red-500",
            bgcolor: "bg-red-500",
          };

        case "Stress":
          if (score < 40) {
            return {
              label: t.LowText,
              color: "text-green-500",
              bgcolor: "bg-green-500",
            };
          }

          if (score < 65) {
            return {
              label: t.MediumText,
              color: "text-yellow-500",
              bgcolor: "bg-yellow-500",
            };
          }

          return {
            label: t.HighText,
            color: "text-red-500",
            bgcolor: "bg-red-500",
          };

        default:
          return {
            label: "-",
            color: "text-gray-500",
            bgcolor: "bg-gray-500",
          };
      }
    };

    const getProgressWidth = () => {
      switch (metric) {
        case "SocialMedia":
          return Math.min((safeValue / 24) * 100, 100);
        case "StudyTime":
          return Math.min((safeValue / 8) * 100, 100);
        case "DeadlinePressure":
        case "TaskLoad":
          return normalizePercent(safeValue);
        default:
          return Math.min(safeValue, 100);
      }
    };

    const stress = getStatus(safeValue);

  return (
    <div
      className="
        theme-card rounded-2xl p-5
        flex flex-col gap-3
        min-h-(150px)
      "
    >
      <span className="theme-muted text-xs md:text-sm uppercase tracking-wide">
        {title}
      </span>

      <div className="flex items-end gap-2">
        <span className={`text-3xl md:text-5xl font-bold ${stress.color}`}>
          {value}
        </span>

        <span className={`text-sm md:text-base mb-1 ${stress.color}`}>
          {stress.label}
        </span>
      </div>

      <div className="theme-card-muted w-full h-1 rounded-full overflow-hidden mt-auto">
        <div
          className={`h-full ${stress.bgcolor}`}
          style={{
            width: `${getProgressWidth()}%`,
          }}
        />
      </div>
    </div>
  );
}

Datas.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  metric: PropTypes.string.isRequired,
};

export default Datas;
