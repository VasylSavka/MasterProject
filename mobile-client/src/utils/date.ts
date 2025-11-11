export const formatDateDisplay = (
  value?: string | Date | null,
  fallback: string = "—"
) => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : fallback;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

export const formatDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

export const parseDateInputToISO = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split(".").map((part) => parseInt(part, 10));
    const date = new Date(yyyy, mm - 1, dd);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();
  return null;
};

export const parseFlexibleDate = (value?: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split(".").map((part) => parseInt(part, 10));
    const date = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
};
