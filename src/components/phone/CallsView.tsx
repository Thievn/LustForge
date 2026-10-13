import { Link } from "react-router-dom";
import { ChevronLeft, Phone } from "lucide-react";
import { PhoneEmpty, PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";

export default function CallsView() {
  const preview = usePhonePreview();
  const { companions, loading } = usePhoneRoster(preview);
  const q = preview ? "?preview=1" : "";

  return (
    <PhoneStage layout="app">
      <header className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={`/dashboard${q}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-gothic text-2xl text-foreground">Calls</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-3 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-card" />
        ) : companions.length === 0 ? (
          <PhoneEmpty title="No one to call" body="Companions on your home screen can take a live call from here." />
        ) : (
          <ul className="space-y-2">
            {companions.map((companion) => (
              <li key={companion.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-3 py-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full font-gothic text-white"
                  style={{ background: `linear-gradient(135deg, ${companion.gradientFrom}, ${companion.gradientTo})` }}
                >
                  {companion.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{companion.name}</p>
                  <p className="text-xs text-muted-foreground">25 credits a minute</p>
                </div>
                {preview ? (
                  <span className="text-xs text-muted-foreground">Preview</span>
                ) : (
                  <Link to={`/live-call/${companion.id}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label={`Call ${companion.name}`}>
                    <Phone className="h-4 w-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PhoneStage>
  );
}
