import { Link, useNavigate } from "react-router-dom";
import { Flame, Shield, LogOut, UserRound, Menu, LayoutDashboard, LogIn, Mail, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isPlatformAdmin } from "@/config/auth";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShopSyncableToysButton } from "@/components/ShopSyncableToysButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const ghostNavPill =
  "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 min-h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.07] hover:border-white/15 transition-all";

const accountNavPill =
  "inline-flex items-center gap-1.5 rounded-xl border border-[#FF2D7B]/35 bg-[#FF2D7B]/[0.08] px-3 py-2 min-h-10 text-sm font-medium text-[#FF2D7B] hover:bg-[#FF2D7B]/15 hover:border-[#FF2D7B]/55 transition-all shadow-[0_0_16px_rgba(255,45,123,0.12)]";

const sheetLinkClass =
  "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-base font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80 touch-manipulation";

const sheetPanelClass =
  "z-[80] flex h-dvh w-[min(100vw,22rem)] max-w-none flex-col gap-0 border-l border-border bg-background p-0 text-foreground shadow-[-28px_0_70px_rgba(0,0,0,0.45)] sm:max-w-none";

function scrollToWaitlist(): boolean {
  const target = document.getElementById("waitlist");
  if (!target) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  return true;
}

const Navbar = ({ variant = "default" }: { variant?: "default" | "landing" }) => {
  const landing = variant === "landing";
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const applySession = async (session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setIsAdmin(isPlatformAdmin(session.user, { profileDisplayName: prof?.display_name ?? null }));
    };

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await applySession(session);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setMobileOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  const joinList = () => {
    setMobileOpen(false);
    if (scrollToWaitlist()) return;
    navigate("/#waitlist");
  };

  const close = () => setMobileOpen(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/90 shadow-[0_8px_32px_rgba(80,30,50,0.06)] backdrop-blur-xl dark:bg-background/94 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2 min-h-[2.75rem]">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0 touch-manipulation py-1">
          <Flame className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]" />
          <span className="font-gothic text-xl sm:text-2xl font-bold leading-none tracking-tight truncate">
            <span className="gradient-vice-text">LustForge</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm shrink-0">
          <ThemeToggle />
          {!user && !landing ? <ShopSyncableToysButton /> : null}
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <Link to="/dashboard" className={ghostNavPill}>
                  <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" />
                  Dashboard
                </Link>
                <Link to="/account" className={accountNavPill}>
                  <UserRound className="h-4 w-4 shrink-0" />
                  Account
                </Link>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[hsl(280_50%_35%)] to-[#FF2D7B] text-white font-medium hover:scale-[1.02] transition-transform shadow-md shadow-[#FF2D7B]/20 border border-white/10 text-sm min-h-10"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    Admin
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:inline-flex text-sm text-muted-foreground hover:text-[hsl(170_100%_45%)] transition-colors py-2 px-2 min-h-10 items-center"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              {landing ? (
                <>
                  <Link
                    to="/auth"
                    className="inline-flex min-h-10 items-center py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <button
                    type="button"
                    onClick={joinList}
                    className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Join the list
                  </button>
                </>
              ) : (
                <>
                  <Link to="/" className="text-muted-foreground hover:text-[#FF2D7B] transition-colors py-2 min-h-10 inline-flex items-center">
                    Home
                  </Link>
                  <Link
                    to="/auth"
                    className="px-4 py-2 sm:px-5 sm:py-2 rounded-xl font-semibold text-white text-xs sm:text-sm transition-transform hover:scale-[1.02] border border-white/10 min-h-10 inline-flex items-center"
                    style={{
                      background: "linear-gradient(135deg, #FF2D7B, hsl(280 48% 40%))",
                      boxShadow: "0 0 20px rgba(255,45,123,0.28)",
                    }}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted touch-manipulation"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-primary" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" overlayClassName="z-[70] bg-black/60" className={sheetPanelClass}>
              <SheetTitle className="sr-only">Main menu</SheetTitle>
              <div
                className="shrink-0 border-b border-border bg-background px-5 pb-4 pr-16"
                style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
              >
                <p className="font-gothic text-xl leading-none text-foreground">
                  <span className="gradient-vice-text">LustForge</span>
                </p>
                {user?.email ? <p className="mt-2 truncate text-xs text-muted-foreground">{user.email}</p> : null}
              </div>
              <div
                className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto bg-background p-3"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={close} className={sheetLinkClass}>
                      <LayoutDashboard className="h-5 w-5 shrink-0 text-primary" />
                      Dashboard
                    </Link>
                    <Link to="/account" onClick={close} className={sheetLinkClass}>
                      <UserRound className="h-5 w-5 shrink-0 text-primary" />
                      Account
                    </Link>
                    <Link to="/settings" onClick={close} className={sheetLinkClass}>
                      <Settings className="h-5 w-5 shrink-0 text-primary" />
                      Preferences
                    </Link>
                    {isAdmin ? (
                      <Link to="/admin" onClick={close} className={sheetLinkClass}>
                        <Shield className="h-5 w-5 shrink-0 text-primary" />
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className={cn(sheetLinkClass, "mt-auto text-muted-foreground")}
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={close} className={sheetLinkClass}>
                      <LogIn className="h-5 w-5 shrink-0 text-primary" />
                      Sign in
                    </Link>
                    <button type="button" onClick={joinList} className={sheetLinkClass}>
                      <Mail className="h-5 w-5 shrink-0 text-primary" />
                      Join the list
                    </button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
