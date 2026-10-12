import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Flame } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { supabase } from "@/integrations/supabase/client";

export function usePhonePreview() {
  const [params] = useSearchParams();
  return params.get("preview") === "1";
}

export function PhoneStage({ children }: { children: ReactNode }) {
  const preview = usePhonePreview();
  const [ready, setReady] = useState(preview);
  const [authed, setAuthed] = useState(preview);

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

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
        <Flame className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }
  if (!authed) return <Navigate to="/auth" replace />;

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <ParticleBackground />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.16),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-background/90 shadow-[0_30px_90px_hsl(var(--primary)/0.14)] max-lg:bg-background lg:my-4 lg:min-h-[calc(100dvh-2rem)] lg:overflow-hidden lg:rounded-[1.8rem] lg:border lg:border-border lg:backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

export function PhoneEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-[0_0_28px_hsl(var(--primary)/0.25)]">
        <Flame className="h-6 w-6 text-primary" />
      </div>
      <h2 className="font-gothic text-2xl text-foreground">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
