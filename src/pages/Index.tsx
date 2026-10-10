import { Link } from "react-router-dom";
import { ImageIcon, MessageCircle, PenLine } from "lucide-react";
import Navbar from "@/components/Navbar";
import { LandingPortraitReel } from "@/components/landing/LandingPortraitReel";

const BEATS = [
  {
    icon: PenLine,
    title: "Describe them",
    body: "Say who you want. A name, a portrait, and a presence come back as their card.",
  },
  {
    icon: MessageCircle,
    title: "Text them",
    body: "The conversation stays with that person. Short messages, a real thread, saved on your account.",
  },
  {
    icon: ImageIcon,
    title: "Get a picture back",
    body: "They can send a photo that is clothed or nude, in the same thread as the texts.",
  },
] as const;

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070709] text-foreground">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 42% at 50% -10%, rgba(199, 59, 106, 0.16), transparent 55%),
            linear-gradient(to bottom, #0c0c10 0%, #070709 42%, #050506 100%)
          `,
        }}
      />

      <div className="relative z-10">
        <Navbar variant="landing" />

        <header className="px-4 pb-14 pt-[max(7.5rem,calc(5.5rem+env(safe-area-inset-top,0px)))] text-center sm:pb-16 sm:pt-[max(8.5rem,calc(6rem+env(safe-area-inset-top,0px)))]">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#E7B7C6]/80">Adults 18+</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-gothic text-4xl leading-[1.05] text-white sm:text-6xl">
            Describe them. Then talk.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Describe a person, text them, and they can send a picture that is clothed or nude.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#C73B6A] px-8 text-base font-semibold text-white shadow-[0_10px_30px_rgba(199,59,106,0.28)] transition-colors hover:bg-[#d4527e]"
          >
            Create yours
          </Link>
        </header>

        <LandingPortraitReel />

        <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="landing-how-heading">
          <div className="mx-auto max-w-5xl">
            <h2 id="landing-how-heading" className="text-center font-gothic text-2xl text-white sm:text-3xl">
              How it goes
            </h2>
            <ol className="mt-10 grid gap-4 sm:grid-cols-3">
              {BEATS.map((beat, index) => (
                <li
                  key={beat.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-gothic text-xs tracking-[0.18em] text-[#E7B7C6]">0{index + 1}</span>
                    <beat.icon className="h-4 w-4 text-[#E7B7C6]" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-gothic text-xl text-white">{beat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{beat.body}</p>
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-white/55">
              When you want to hear them, voice is already there.
            </p>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] px-4 py-12">
          <div className="mx-auto max-w-3xl space-y-3 text-center text-xs leading-relaxed text-white/50">
            <p>
              <strong className="font-medium text-white/75">18+ only.</strong> LustForge is for adults. The people here
              are fictional. You confirm you are at least 18 before you enter.
            </p>
            <p>Your conversations are saved for you, on your account.</p>
            <p>
              © {new Date().getFullYear()} LustForge ·{" "}
              <Link to="/terms-of-service" className="text-white/70 underline-offset-2 hover:underline">
                Terms
              </Link>
              {" · "}
              <Link to="/privacy-policy" className="text-white/70 underline-offset-2 hover:underline">
                Privacy
              </Link>
              {" · "}
              <a href="mailto:support@lustforge.app" className="text-white/70 underline-offset-2 hover:underline">
                support@lustforge.app
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
