import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Gem, Images, LayoutDashboard, MessageCircle, Shield, Sparkles, UserRound, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/companions", label: "Companions", icon: Users },
  { to: "/lab", label: "Studio", icon: Sparkles },
  { to: "/gallery", label: "Gallery", icon: Images },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/treasures", label: "The Velvet Vault", icon: Gem },
  { to: "/plans", label: "Credits & Plans", icon: CreditCard },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

function Item({ to, label, icon: Icon, end = false }: { to: string; label: string; icon: typeof Gem; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
          isActive ? "bg-primary/15 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.18)]" : "text-foreground/80 hover:bg-white/5",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell({ children }: { children?: ReactNode }) {
  const preview = usePhonePreview();
  const location = useLocation();
  const { limits } = usePhoneRoster(preview);
  const [ready, setReady] = useState(preview);
  const [authed, setAuthed] = useState(preview);
  const [more, setMore] = useState(false);
  const immersive = /^\/messages\/(?!group(?:\/|$)).+/.test(location.pathname) || /^\/chat(\/|$)/.test(location.pathname) || /^\/live-call\//.test(location.pathname);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setAuthed(Boolean(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
      setReady(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [preview]);

  if (!ready) return <div className="grid min-h-[100dvh] place-items-center text-sm text-muted-foreground">Opening LustForge…</div>;
  if (!authed && location.pathname !== "/account") return <Navigate to="/auth" replace />;

  if (immersive) {
    return <div className="min-h-[100dvh] bg-[#07040c] text-foreground">{children ?? <Outlet />}</div>;
  }

  const q = preview ? "?preview=1" : "";

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-white/10 bg-black/40 px-3 py-5 backdrop-blur-xl lg:flex">
        <div className="px-3 pb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary">LustForge</p>
          <p className="font-gothic text-2xl leading-none">{limits.displayName}</p>
          <p className="mt-2 text-xs text-muted-foreground">{limits.catalogOwner ? "Unlimited" : `${limits.credits} credits`}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {LINKS.map((link) => (
            <Item key={link.to} to={`${link.to}${q}`} label={link.label} icon={link.icon} end={link.to === "/messages" || link.to === "/lab"} />
          ))}
          <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3">
            <NavLink to={`/lab${q}`} end className="text-xs text-muted-foreground hover:text-primary">Create</NavLink>
            <NavLink to={`/lab?tab=edit${preview ? "&preview=1" : ""}`} className="text-xs text-muted-foreground hover:text-primary">Edit</NavLink>
          </div>
          {limits.catalogOwner ? <Item to="/admin" label="Admin" icon={Shield} /> : null}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="min-h-[100dvh]"
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-black/80 px-1 pt-1 backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}>
        {[
          { to: "/dashboard", label: "Home", icon: LayoutDashboard },
          { to: "/companions", label: "Hers", icon: Users },
          { to: "/lab", label: "Studio", icon: Sparkles },
          { to: "/messages", label: "Texts", icon: MessageCircle },
        ].map((link) => (
          <NavLink key={link.label} to={`${link.to}${q}`} className={({ isActive }) => cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", isActive ? "text-primary" : "text-muted-foreground")}>
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
        <button type="button" className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground" onClick={() => setMore(true)}>
          <Gem className="h-5 w-5" />
          More
        </button>
      </nav>
      {more ? (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-white/10 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-2">
              <Item to={`/gallery${q}`} label="Gallery" icon={Images} />
              <Item to={`/treasures${q}`} label="The Velvet Vault" icon={Gem} />
              <Item to={`/plans${q}`} label="Credits & Plans" icon={CreditCard} />
              <Item to={`/account${q}`} label="Account" icon={UserRound} />
              {limits.catalogOwner ? <Item to="/admin" label="Admin" icon={Shield} /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
