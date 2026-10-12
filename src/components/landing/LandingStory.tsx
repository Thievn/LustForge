import { LandingCta } from "@/components/landing/LandingCta";
import { CallPhone, ChatPhone, GalleryPhone, HomePhone, LabPhone } from "@/components/landing/LandingPhones";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const SCENES = [
  { title: "After close", body: "The bookshop key is still in her pocket. She texts from the back room." },
  { title: "The roommate", body: "Lights off, door not quite shut. She has opinions about your night." },
  { title: "The rival", body: "She loses on purpose, then tells you exactly how she wants the rematch." },
];

export function LandingStory() {
  return (
    <>
      <section id="she-texts" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">She texts first</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">
              Good morning, before you ask for it
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Set a good-morning and a check-in. She writes them in her voice, on the hours you picked. Not a calendar ping. A text that already knows the mood.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-foreground/90">
              <li>7:02 — “I left the light on.”</li>
              <li>6:40 — “You went quiet. I’m still here.”</li>
            </ul>
            <div className="mt-6">
              <LandingCta location="she_texts">I want the morning text</LandingCta>
            </div>
          </Reveal>
          <HomePhone />
        </div>
      </section>

      <section id="scenarios" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <LandingHeading
            id="scenarios-heading"
            eyebrow="Scenarios"
            title={
              <>
                Pick the night, then <span className="gradient-vice-text">stay in it</span>
              </>
            }
            lede="Presets if you want a running start. Your own scene if you already know the trouble you’re in. She keeps the role."
          />
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {SCENES.map((scene, index) => (
              <Reveal key={scene.title} as="li" delay={index * 0.05} className="rounded-[1.4rem] border border-border bg-card/80 p-5">
                <h3 className="font-gothic text-2xl text-foreground">{scene.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scene.body}</p>
              </Reveal>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <LandingCta location="scenarios">Write me into the scene</LandingCta>
          </p>
        </div>
      </section>

      <section id="pictures" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <ChatPhone />
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Pictures</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">A photo that belongs in the sentence</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ask, and the still follows the moment — the couch, the rain, the dress you just mentioned. It shows up in the thread, then stays where you can open it again.
            </p>
            <div className="mt-6">
              <LandingCta location="pictures">Put me on the list</LandingCta>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="lab" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">The Lab</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Make her your way</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Face, voice, attitude, then the art. Photo, paint, ink, or neon. Five steps, and she lands on your home screen already in character. Every companion is a fictional adult, 21 or older.
            </p>
            <div className="mt-6">
              <LandingCta location="lab">Hold my spot in the Lab</LandingCta>
            </div>
          </Reveal>
          <LabPhone />
        </div>
      </section>

      <section id="calls" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <CallPhone />
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Live call</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Her voice, full screen</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Leave the thread and take the call. She stays in the scene. At launch, voice time is 25 credits a minute. You hang up when you want the room quiet again.
            </p>
            <div className="mt-6">
              <LandingCta location="calls">Call me when it’s open</LandingCta>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="toys" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <LandingHeading
            id="toys-heading"
            eyebrow="Lovense"
            title="The toy can follow. It doesn’t have to."
            lede="Connect a Lovense toy if you want the scene to move with the chat. Skip it and nothing is missing. Say your safe word — RED, until you change it — and toy control stops."
          />
          <div className="mt-8">
            <LandingCta location="toys">Keep me posted on sync</LandingCta>
          </div>
        </div>
      </section>

      <section id="gallery" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Gallery</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Yours, after the thread moves on</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pictures she sent live with the companion and with you. Open the gallery later. They are not a public feed.
            </p>
            <div className="mt-6">
              <LandingCta location="gallery">Save my place</LandingCta>
            </div>
          </Reveal>
          <GalleryPhone />
        </div>
      </section>

      <section id="privacy" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <LandingHeading
            id="privacy-heading"
            eyebrow="Discretion"
            title="The lock screen can mind its business"
            lede="Notifications can show her name, or just LustForge. Add the app to your home screen and it opens full screen, like something you meant to keep close. Chats stay on your account. We don’t sell personal data."
          />
          <div className="mt-8 text-center">
            <LandingCta location="privacy">Join quietly</LandingCta>
          </div>
        </div>
      </section>
    </>
  );
}
