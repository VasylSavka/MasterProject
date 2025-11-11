export const getStatusColors = (status?: string) => {
  switch (status) {
    case "active":
      return { backgroundColor: "#16a34a", textColor: "#fff" };
    case "on_hold":
    case "on hold":
      return { backgroundColor: "#ca8a04", textColor: "#fff" };
    case "completed":
    case "archived":
    case "done":
      return { backgroundColor: "#4b5563", textColor: "#fff" };
    default:
      return { backgroundColor: "#e5e7eb", textColor: "#111827" };
  }
};
