const REPORT_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/;
export function formatReportDay(value: string) {
  const match = REPORT_DATE.exec(value);
  return match ? `${match[2]}.${match[3]}` : "—";
}
