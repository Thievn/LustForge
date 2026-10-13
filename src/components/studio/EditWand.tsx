import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { stashStudioEdit, type StashedEdit } from "@/lib/studio/api";
import { usePhonePreview } from "@/components/phone/PhoneStage";

export function StudioEditWand({ imageUrl, companionId, assetId, tag, source }: StashedEdit) {
  const navigate = useNavigate();
  const preview = usePhonePreview();
  if (!imageUrl) return null;
  return (
    <button
      type="button"
      aria-label="Edit in Studio"
      className="absolute bottom-2 right-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-[0_0_18px_hsl(var(--primary)/0.45)] backdrop-blur-md"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        stashStudioEdit({ imageUrl, companionId, assetId, tag, source });
        navigate(preview ? "/lab?tab=edit&preview=1" : "/lab?tab=edit");
      }}
    >
      <Wand2 className="h-5 w-5" />
    </button>
  );
}
