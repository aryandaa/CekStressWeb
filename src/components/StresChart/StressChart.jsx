import PropTypes from "prop-types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";

function StressChart({ data = [] }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const rootStyle = typeof window !== "undefined"
    ? getComputedStyle(document.documentElement)
    : null;
  const themeColors = {
    grid: rootStyle?.getPropertyValue("--chart-grid").trim() || "#27272a",
    textMuted: rootStyle?.getPropertyValue("--text-muted").trim() || "#a1a1aa",
    tooltipBg: rootStyle?.getPropertyValue("--chart-tooltip-bg").trim() || "#18181b",
    tooltipBorder: rootStyle?.getPropertyValue("--chart-tooltip-border").trim() || "#27272a",
    text: rootStyle?.getPropertyValue("--text").trim() || "#ffffff",
  };
  void theme;

  const filledData = data.filter((item) => item.hasStressData);
  const average = Math.round(
    filledData.length > 0
      ? filledData.reduce((sum, item) => sum + (item.stress_score || 0), 0) / filledData.length
      : 0
  );

  return (
    <div className="theme-card rounded-2xl p-4 border w-full h-full">

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
          {t.StressTrendTitle}
        </p>

        <p className="text-blue-400 font-medium">
          {t.AverageText} {average}
        </p>
      </div>

      <div className="h-[260px] md:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={themeColors.grid}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: themeColors.textMuted, fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: themeColors.textMuted, fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: themeColors.tooltipBg,
                border: `1px solid ${themeColors.tooltipBorder}`,
                borderRadius: "12px",
                color: themeColors.text,
              }}
            />

            <Line
              type="monotone"
              dataKey="stress_score"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{
                fill: "#3b82f6",
                strokeWidth: 0,
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

StressChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    stress_score: PropTypes.number,
    hasStressData: PropTypes.bool,
    prediction_date: PropTypes.string,
  })),
};

export default StressChart;
