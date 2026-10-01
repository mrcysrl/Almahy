const MIN_YEAR = 1900;

export function isCommittableDate(value: string): boolean {
  return value === "" || Number(value.slice(0, 4)) >= MIN_YEAR;
}