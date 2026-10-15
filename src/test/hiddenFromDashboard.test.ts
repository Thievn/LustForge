import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isShownOnDashboard } from "@/lib/hiddenFromDashboard";

describe("isShownOnDashboard", () => {
  it("hides only an explicit true flag and keeps the default visible", () => {
    expect(isShownOnDashboard({ hidden_from_dashboard: false })).toBe(true);
    expect(isShownOnDashboard({ hidden_from_dashboard: null })).toBe(true);
    expect(isShownOnDashboard({})).toBe(true);
    expect(isShownOnDashboard({ hidden_from_dashboard: true })).toBe(false);
  });
});

describe("hidden_from_dashboard migration", () => {
  const sql = readFileSync("supabase/migrations/20261015200000_hidden_from_dashboard.sql", "utf8");

  it("adds a non-null false default on both companion tables and does not delete rows", () => {
    expect(sql).toContain("ALTER TABLE public.custom_characters");
    expect(sql).toContain("ALTER TABLE public.companions");
    expect(sql).toContain("hidden_from_dashboard boolean");
    expect(sql).toContain("SET DEFAULT false");
    expect(sql).toContain("SET NOT NULL");
    expect(sql.toLowerCase()).not.toContain("delete from");
  });

  it("keeps public catalog reads filtered and leaves admin policies out of the migration", () => {
    expect(sql).toContain("AND hidden_from_dashboard = false");
    expect(sql).toContain("Users can view approved public characters");
    expect(sql).toContain("Users can view active companions");
    expect(sql).not.toContain('DROP POLICY IF EXISTS "Admins can manage all characters"');
    expect(sql).not.toContain('DROP POLICY IF EXISTS "Admins have full access to companions"');
    expect(sql).toContain("user_has_companion_reference");
  });
});
