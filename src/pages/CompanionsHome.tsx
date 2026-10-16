import { Link } from "react-router-dom";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";

export default function CompanionsHome() {
  const preview = usePhonePreview();
  const { companions, loading } = usePhoneRoster(preview);
  const q = preview ? "?preview=1" : "";
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 lg:px-8 lg:pb-10">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Yours</p>
          <h1 className="font-gothic text-4xl">Companions</h1>
        </div>
        <Link to={`/create-companion${q}`} className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold leading-[2.75rem] text-primary-foreground">New</Link>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Gathering them…</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {companions.map((companion) => (
          <article key={companion.id} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-card/80">
            {companion.portraitUrl ? <img src={companion.portraitUrl} alt="" className="aspect-[3/4] w-full object-cover" /> : <div className="grid aspect-[3/4] place-items-center font-gothic text-5xl" style={{ background: companion.gradientFrom }}>{companion.name.slice(0, 1)}</div>}
            <div className="space-y-3 p-4">
              <h2 className="font-gothic text-2xl">{companion.name}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{companion.tagline || companion.personality}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Link to={`/companions/${companion.id}${q}`} className="h-10 rounded-xl border border-border leading-10">Her</Link>
                <Link to={`/messages/${companion.id}${q}`} className="h-10 rounded-xl bg-primary leading-10 text-primary-foreground">Text</Link>
                <Link to={`/live-call/${companion.id}`} className="h-10 rounded-xl border border-border leading-10">Call</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
