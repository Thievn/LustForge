/**
 * Browse lists (dashboard, discover, pickers) keep only rows that are not hidden.
 * Lookups by primary key must not use this — existing threads still resolve name and avatar.
 */
export function isShownOnDashboard(row: { hidden_from_dashboard?: boolean | null }): boolean {
  return row.hidden_from_dashboard !== true;
}
