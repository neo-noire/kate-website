/** How long a purchase gives access to its course. Mirrors the Terms of Service. */
export const ACCESS_MONTHS = 3;

/** When access bought (or granted) at `from` ends. */
export function accessExpiry(from = new Date()) {
  const end = new Date(from);
  end.setMonth(end.getMonth() + ACCESS_MONTHS);
  return end;
}
