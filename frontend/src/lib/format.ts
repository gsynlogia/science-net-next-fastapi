const DATE_FORMAT = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeZone: "UTC" });

export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}
