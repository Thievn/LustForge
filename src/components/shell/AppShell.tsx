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
  { to: "/treasures", label: "Vault", icon: Gem },
  { to: "/plans", label: "Credits", icon: CreditCard },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

function Item({ to, label, icon: Icon, end = false }: { to: string; label: string; icon: typeof Gem; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-[50px] items-center gap-3.5 rounded-[14px] px-4 text-[15px] font-medium transition-colors",
          isActive
            ? "border border-white/10 bg-card text-foreground shadow-[inset_3px_0_0_#D6336C] [&_svg]:text-[#F57AA3]"
            : "text-[#B8A9BC] hover:bg-card hover:text-foreground",
        )
      }
    >
      <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.75} />
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

  if (!ready) return <div className="grid min-h-[100dvh] place-items-center text-sm text-[#B8A9BC]">Opening LustForge…</div>;
  if (!authed && location.pathname !== "/account") return <Navigate to="/auth" replace />;

  if (immersive) {
    return <div className="min-h-[100dvh] bg-[#1B1620] text-foreground">{children ?? <Outlet />}</div>;
  }

  const q = preview ? "?preview=1" : "";
  const tabs = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/messages", label: "Chat", icon: MessageCircle },
    { to: "/treasures", label: "Vault", icon: Gem },
    { to: "/plans", label: "Credits", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-[#1B1620] text-foreground">
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col gap-1.5 border-r border-white/[0.08] bg-[#1B1620] px-4 py-6 lg:flex">
        <NavLink to={`/dashboard${q}`} className="font-wordmark mb-6 px-4 text-[21px] leading-none text-[#F4EEF2]">
          Lust<b className="text-[#F57AA3]">Forge</b>
        </NavLink>
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {LINKS.map((link) => (
            <Item key={link.to} to={`${link.to}${q}`} label={link.label} icon={link.icon} end={link.to === "/messages" || link.to === "/lab"} />
          ))}
          <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3">
            <NavLink to={`/lab${q}`} end className="min-h-10 text-sm text-[#B8A9BC] hover:text-foreground">Create</NavLink>
            <NavLink to={`/lab?tab=edit${preview ? "&preview=1" : ""}`} className="min-h-10 text-sm text-[#B8A9BC] hover:text-foreground">Edit</NavLink>
          </div>
          {limits.catalogOwner ? <Item to="/admin" label="Admin" icon={Shield} /> : null}
          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-card p-[18px]">
            <p className="text-[13px] text-[#B8A9BC]">{limits.catalogOwner ? "Unlimited" : `${limits.plan} plan`}</p>
            <p className="mb-3 mt-0.5 font-semibold">{limits.catalogOwner ? "Stay as long as you like" : `${limits.credits} credits`}</p>
            <NavLink to={`/plans${q}`} className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-primary text-sm font-semibold text-white">
              Upgrade
            </NavLink>
          </div>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-white/[0.08] bg-[rgba(27,22,32,0.62)] px-[18px] backdrop-blur-[18px] lg:h-[68px] lg:px-7">
          <NavLink to={`/dashboard${q}`} className="font-wordmark text-[21px] text-[#F4EEF2] lg:hidden">
            Lust<b className="text-[#F57AA3]">Forge</b>
          </NavLink>
          <p className="hidden text-sm text-[#B8A9BC] lg:block">{limits.displayName}</p>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-card px-4 text-sm font-semibold">
            <Gem className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.75} />
            {limits.catalogOwner ? "Unlimited" : `${limits.credits} credits`}
          </span>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="min-h-[calc(100dvh-60px)]"
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </div>
      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[22px] border border-white/[0.08] bg-[rgba(38,32,48,0.72)] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-[18px] lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        {tabs.map((link) => (
          <NavLink
            key={link.label}
            to={`${link.to}${q}`}
            className={({ isActive }) =>
              cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold",
                isActive ? "bg-[rgba(214,51,108,0.22)] text-foreground [&_svg]:text-[#F57AA3]" : "text-[#B8A9BC]",
              )
            }
          >
            <link.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
            {link.label}
          </NavLink>
        ))}
        <button type="button" className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold text-[#B8A9BC]" onClick={() => setMore(true)}>
          <Users className="h-[22px] w-[22px]" strokeWidth={1.75} />
          More
        </button>
      </nav>
      {more ? (
        <div className="fixed inset-0 z-50 bg-[rgba(15,10,18,0.55)] backdrop-blur-[14px] lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-x-3 bottom-3 rounded-[20px] border border-[rgba(42,32,48,0.1)] bg-[#EADFD6] p-4 text-[#2A2030] shadow-[0_30px_80px_rgba(0,0,0,0.5)]" style={{ marginBottom: "env(safe-area-inset-bottom)" }} onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-1">
              {[
                { to: `/companions${q}`, label: "Companions", icon: Users },
                { to: `/lab${q}`, label: "Studio", icon: Sparkles },
                { to: `/gallery${q}`, label: "Gallery", icon: Images },
                { to: `/account${q}`, label: "Account", icon: UserRound },
              ].map((link) => (
                <NavLink key={link.label} to={link.to} onClick={() => setMore(false)} className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-sm font-medium text-[#2A2030] hover:bg-black/5">
                  <link.icon className="h-5 w-5" strokeWidth={1.75} />
                  {link.label}
                </NavLink>
              ))}
              {limits.catalogOwner ? (
                <NavLink to="/admin" onClick={() => setMore(false)} className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-sm font-medium">
                  <Shield className="h-5 w-5" /> Admin
                </NavLink>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
