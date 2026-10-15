import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [showModal, setShowModal] = useState(true);

  const confirm = useCallback(() => {
    localStorage.setItem("ageConfirmed", "true");
    setShowModal(false);
    trackEvent("age_gate_confirm");
    onConfirm();
  }, [onConfirm]);

  useEffect(() => {
    const hasConfirmedAge = localStorage.getItem("ageConfirmed");
    if (hasConfirmedAge === "true") {
      setShowModal(false);
      onConfirm();
    }
  }, [onConfirm]);

  const handleDeny = () => {
    window.location.href = "https://www.wikipedia.org/";
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 font-sans">
      <div className="absolute inset-0 bg-[rgba(15,10,18,0.55)] backdrop-blur-[14px]" aria-hidden />
      <div
        className="relative w-full max-w-md rounded-[20px] border border-[rgba(42,32,48,0.1)] bg-[#EADFD6] p-8 text-center text-[#2A2030] shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:p-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
      >
        <p className="font-wordmark text-[21px] text-[#2A2030]">
          Lust<b className="text-[#D6336C]">Forge</b>
        </p>
        <p className="mb-3 mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#665670]">Restricted entry</p>
        <h1 id="age-gate-title" className="mb-3 text-5xl font-semibold tabular-nums text-[#2A2030]">
          18+
        </h1>
        <p id="age-gate-desc" className="mx-auto mb-8 max-w-sm text-pretty text-[15px] leading-relaxed text-[#665670]">
          This experience contains mature themes, AI companions, and optional intimate hardware integration. You must be{" "}
          <span className="font-semibold text-[#2A2030]">18 or older</span> to continue. Every companion is a fictional consenting adult, 21 or older.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={confirm}
            className="min-h-12 flex-1 rounded-[14px] bg-[#D6336C] px-6 text-[15px] font-semibold text-white hover:bg-[#E0457B] sm:flex-none sm:min-w-[168px]"
          >
            Enter — I am 18+
          </button>
          <button
            type="button"
            onClick={handleDeny}
            className="min-h-12 flex-1 rounded-[14px] border border-[rgba(42,32,48,0.28)] bg-transparent px-6 text-[15px] font-medium text-[#2A2030] hover:bg-[rgba(42,32,48,0.06)] sm:flex-none sm:min-w-[168px]"
          >
            Leave — under 18
          </button>
        </div>
        <p className="mt-8 text-[12px] leading-relaxed text-[#665670]">
          By entering you acknowledge our{" "}
          <Link to="/terms-of-service" className="font-semibold text-[#2A2030] underline-offset-2 hover:underline">
            Terms
          </Link>
          ,{" "}
          <Link to="/privacy-policy" className="font-semibold text-[#2A2030] underline-offset-2 hover:underline">
            Privacy
          </Link>
          , and{" "}
          <Link to="/18-plus-disclaimer" className="font-semibold text-[#2A2030] underline-offset-2 hover:underline">
            18+ disclaimer
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
