import { LandingCta } from "@/components/landing/LandingCta";
import { CallPhone, ChatPhone, GalleryPhone, HomePhone, LabPhone } from "@/components/landing/LandingPhones";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const SCENES = [
  {
    title: "Bookshop",
    body: "She closes the shop and texts you from the back room.",
  },
  {
    title: "Roommate",
    body: "You share a place. She asks who you came home with.",
  },
  {
    title: "Rival",
    body: "You compete. She talks trash, then asks for a rematch.",
  },
];

export function LandingStory() {
  return (
    <>
      <section id="she-texts" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Scheduled texts</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">She texts you first</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pick a morning time and a check-in time. LustForge sends those texts from her, in her voice. You do not have to open the app first.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-foreground/90">
              <li>7:02 AM. Morning. Coffee is on your side of the counter.</li>
              <li>6:40 PM. You went quiet. I&apos;m still here.</li>
            </ul>
            <div className="mt-6">
              <LandingCta location="she_texts">Email me about morning texts</LandingCta>
            </div>
          </Reveal>
          <HomePhone />
        </div>
      </section>

      <section id="scenarios" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <LandingHeading
            id="scenarios-heading"
            eyebrow="Roleplay"
            title="Start from a scenario"
            lede="Pick a preset, or write your own. She stays in that role for the chat."
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
            <LandingCta location="scenarios">Save me a spot</LandingCta>
          </p>
        </div>
      </section>

      <section id="pictures" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <ChatPhone />
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Pictures</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Pictures show up in the chat</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ask for a photo of what you are talking about. The couch, the rain, the clothes you just mentioned. It appears in the thread, then saves to your gallery.
            </p>
            <div className="mt-6">
              <LandingCta location="pictures">I want pictures in chat</LandingCta>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="lab" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">The Lab</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Build her in five steps</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              You set her look, voice, personality, art style, and name. Styles include photo, paint, ink, and neon. She has to be a fictional adult, 21 or older.
            </p>
            <div className="mt-6">
              <LandingCta location="lab">Save my Lab spot</LandingCta>
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
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Call her from the app</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Open a voice call and talk. You hear her. At launch, calls cost 25 credits a minute. Hang up whenever you want.
            </p>
            <div className="mt-6">
              <LandingCta location="calls">Email me when calls open</LandingCta>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="toys" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <LandingHeading
            id="toys-heading"
            eyebrow="Lovense"
            title="A toy is optional"
            lede="Connect a Lovense toy if you want the chat to control it. Skip it and the chat still works. Say your safe word and toy control stops. The default word is RED until you change it."
          />
          <div className="mt-8">
            <LandingCta location="toys">Email me about toy sync</LandingCta>
          </div>
        </div>
      </section>

      <section id="gallery" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary">Gallery</p>
            <h2 className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">Pictures stay in your gallery</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Photos she sends are saved to your account. You can open them later. Other people cannot see them.
            </p>
            <div className="mt-6">
              <LandingCta location="gallery">Save my spot</LandingCta>
            </div>
          </Reveal>
          <GalleryPhone />
        </div>
      </section>

      <section id="privacy" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <LandingHeading
            id="privacy-heading"
            eyebrow="Privacy"
            title="The lock screen can stay plain"
            lede="A notification can show her name, or only the word LustForge. Add the site to your home screen and it opens full screen, like an app. We do not sell your data."
          />
          <div className="mt-8 text-center">
            <LandingCta location="privacy">Join the list</LandingCta>
          </div>
        </div>
      </section>
    </>
  );
}
