import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../layouts/Layout";
import ActivityHistoryFilters from "../components/ActivityHistory/ActivityHistoryFilters";
import ActivityHistoryList from "../components/ActivityHistory/ActivityHistoryList";
import ActivityHistoryPagination from "../components/ActivityHistory/ActivityHistoryPagination";
import { getActivityHistory } from "../services/activityService";
import { useUser } from "../contexts/UserContext";
import { useLanguage } from "../contexts/LanguageContext";

const LATE_GRACE_DAYS = 5;

function parseDateOnly(dateValue) {
  if (!dateValue) {
    return null;
  }

  const stringValue = String(dateValue);
  const dateStr = stringValue.includes("T") ? stringValue.split("T")[0] : stringValue;
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function getLocalDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getHistoryDateKey(item) {
  const activityDate =
    item.predictionDate ||
    item.activity?.activity_date ||
    item.prediction?.prediction_date ||
    item.datetime;

  if (activityDate instanceof Date) {
    return getLocalDateKey(activityDate);
  }

  return getLocalDateKey(parseDateOnly(activityDate));
}

function buildLateHistoryItems(history, accountCreatedAt) {
  const startDate = parseDateOnly(accountCreatedAt);

  if (!startDate) {
    return [];
  }

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lateCutoffDate = addDays(todayDate, -LATE_GRACE_DAYS);
  const existingDateKeys = new Set(history.map(getHistoryDateKey).filter(Boolean));
  const lateItems = [];

  for (
    let currentDate = new Date(startDate);
    currentDate < lateCutoffDate;
    currentDate = addDays(currentDate, 1)
  ) {
    const dateKey = getLocalDateKey(currentDate);

    if (!existingDateKeys.has(dateKey)) {
      lateItems.push({
        id: `late-${dateKey}`,
        datetime: new Date(currentDate),
        activityDateTime: new Date(currentDate),
        predictionDate: dateKey,
        stressScore: 0,
        stress_score: 0,
        scoreLabel: "-",
        status: "Terlambat",
        activity: null,
        prediction: null,
        isVirtualLate: true,
      });
    }
  }

  return lateItems;
}

function ActivityHistoryPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatusFilter = searchParams.get("status") || "all";
  const [activityHistoryData, setActivityHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const response = await getActivityHistory();
      
      if (isMounted) {
        if (response.error) {
          setError(response.message);
        } else {
          setActivityHistoryData(response.data || []);
        }
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getTime());

    if (dateFilter === "7-day") {
      startDate.setDate(now.getDate() - 7);
    } else if (dateFilter === "this-month") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === "last-month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setTime(lastMonth.getTime());
    } else if (dateFilter === "3-month") {
      startDate.setDate(now.getDate() - 90);
    }

    const historyWithLateItems = [
      ...activityHistoryData,
      ...buildLateHistoryItems(activityHistoryData, user.createdAt),
    ];

    return historyWithLateItems
      .filter((item) => {
        const matchesStatus =
          statusFilter === "all" || item.status.toLowerCase() === statusFilter;

        if (dateFilter === "all") {
          return matchesStatus;
        }

        if (dateFilter === "last-month") {
          const itemMonth = item.datetime.getMonth();
          const itemYear = item.datetime.getFullYear();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            matchesStatus &&
            itemMonth === lastMonth.getMonth() &&
            itemYear === lastMonth.getFullYear()
          );
        }

        return matchesStatus && item.datetime >= startDate;
      })
      .sort((a, b) => {
        if (sortOption === "newest") {
          const dateA = a.predictionDate || "";
          const dateB = b.predictionDate || "";
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }
          return b.datetime - a.datetime;
        }
        if (sortOption === "oldest") {
          const dateA = a.predictionDate || "";
          const dateB = b.predictionDate || "";
          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }
          return a.datetime - b.datetime;
        }
        if (sortOption === "highest-score") {
          return b.stressScore - a.stressScore;
        }
        if (sortOption === "lowest-score") {
          return a.stressScore - b.stressScore;
        }
        return 0;
      });
  }, [activityHistoryData, statusFilter, dateFilter, sortOption, user.createdAt]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const currentPageData = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const from = filteredHistory.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(filteredHistory.length, currentPage * pageSize);

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      if (value === "all") {
        nextParams.delete("status");
      } else {
        nextParams.set("status", value);
      }

      return nextParams;
    });
    setCurrentPage(1);
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleSortOption = (value) => {
    setSortOption(value);
    setCurrentPage(1);
  };

  return (
    <Layout title={t.ActivityHistoryTitle} name={user.fullname} role={user.role}>
      <div className="space-y-6 text-sm">
        <p className="theme-muted max-w-2xl text-sm">
          {t.ActivityHistoryDescription}
        </p>

        <div className="space-y-6 rounded-3xl p-6">
          <ActivityHistoryFilters
            statusFilter={statusFilter}
            setStatusFilter={handleStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={handleDateFilter}
            sortOption={sortOption}
            setSortOption={handleSortOption}
            t={t}
          />

          {loading ? (
            <div className="py-12 text-center text-gray-500 theme-muted">{t.ActivityHistoryLoading}</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-500 theme-muted">{t.ActivityHistoryEmptyFiltered}</div>
          ) : (
            <>
              <ActivityHistoryList items={currentPageData} t={t} /> 

              <ActivityHistoryPagination
                currentPage={currentPage}
                totalPages={totalPages}
                from={from}
                to={to}
                total={filteredHistory.length}
                onPageChange={setCurrentPage}
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ActivityHistoryPage;
