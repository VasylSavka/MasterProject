import { useMemo, useState } from "react";
import { computeFilteredSortedTasks } from "../utils/taskHelpers";

export default function useTaskFilters(tasks) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [searchText, setSearchText] = useState("");

  const filteredTasks = useMemo(
    () =>
      computeFilteredSortedTasks(tasks, {
        status: filterStatus,
        priority: filterPriority,
        sortBy,
        search: searchText,
      }),
    [tasks, filterStatus, filterPriority, sortBy, searchText]
  );

  return {
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    sortBy,
    setSortBy,
    searchText,
    setSearchText,
    filteredTasks,
  };
}
