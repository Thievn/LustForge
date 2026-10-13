import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { CreateTab } from "@/components/studio/CreateTab";
import { EditTab } from "@/components/studio/EditTab";

export default function Studio() {
  const preview = usePhonePreview();
  const { limits } = usePhoneRoster(preview);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "edit" ? "edit" : "create";
  const q = preview ? "preview=1" : "";

  function setTab(next: "create" | "edit") {
    const following = new URLSearchParams(params);
    if (next === "edit") following.set("tab", "edit");
    else following.delete("tab");
    setParams(following, { replace: true });
  }

  return (
    <PhoneStage>
      <header className="flex items-center gap-2 px-3 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={`/dashboard${q ? `?${q}` : ""}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">LustForge</p>
          <h1 className="font-gothic text-2xl leading-none text-foreground">Studio</h1>
        </div>
        <p className="text-xs text-muted-foreground">{limits.catalogOwner ? "Unlimited" : `${limits.credits} cr`}</p>
      </header>
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        {(["create", "edit"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`h-12 rounded-2xl text-sm font-semibold capitalize ${
              tab === item
                ? "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                : "border border-border bg-card/80 text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "create" ? <CreateTab /> : <EditTab />}
    </PhoneStage>
  );
}
