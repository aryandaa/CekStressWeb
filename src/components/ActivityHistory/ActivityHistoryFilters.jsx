import PropTypes from "prop-types";
import calender from "../../assets/icons/calendar.svg"

const getStatusOptions = (t) => [
  { value: "all", label: t.ActivityHistoryStatusAll },
  { value: "selesai", label: t.ActivityHistoryStatusCompleted },
  { value: "draft", label: t.ActivityHistoryStatusDraft },
  { value: "terlambat", label: t.ActivityHistoryStatusLate },
];

const getDateOptions = (t) => [
  { value: "all", label: t.ActivityHistoryDateAll },
  { value: "7-day", label: t.ActivityHistoryDateLast7Days },
  { value: "this-month", label: t.ActivityHistoryDateThisMonth },
  { value: "last-month", label: t.ActivityHistoryDateLastMonth },
  { value: "3-month", label: t.ActivityHistoryDateLast3Months },
];

const getSortOptions = (t) => [
  { value: "newest", label: t.ActivityHistorySortNewest },
  { value: "oldest", label: t.ActivityHistorySortOldest },
  { value: "highest-score", label: t.ActivityHistorySortHighestScore },
  { value: "lowest-score", label: t.ActivityHistorySortLowestScore },
];

function ActivityHistoryFilters({
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortOption,
  setSortOption,
  t,
}) {
  const statusOptions = getStatusOptions(t);
  const dateOptions = getDateOptions(t);
  const sortOptions = getSortOptions(t);

  return (
    <div className="space-y-4 text-sm">
      <div className="theme-card inline-flex w-full max-w-[620px] items-center gap-1 rounded-2xl border p-1">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            className={`flex-1 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              statusFilter === option.value
                ? "bg-blue-400 text-slate-900 shadow-sm"
                : "bg-transparent theme-muted hover:text-[var(--text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 md:ml-auto">
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="theme-input h-11 min-w-(140px) rounded-xl border px-4 text-sm outline-none transition focus:border-blue-400"
          >
            <img src={calender} alt="" />
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        
          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value)}
            className="theme-input mt-2 w-30 rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-blue-400"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
      </div>
    </div>
  );
}

ActivityHistoryFilters.propTypes = {
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  dateFilter: PropTypes.string.isRequired,
  setDateFilter: PropTypes.func.isRequired,
  sortOption: PropTypes.string.isRequired,
  setSortOption: PropTypes.func.isRequired,
  t: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default ActivityHistoryFilters;
