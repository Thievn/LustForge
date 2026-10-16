import { ChatPhone, CreatorPhone, EditorPhone, VaultPhone } from "@/components/landing/LandingPhones";
import { LandingHeading } from "@/components/landing/Reveal";

const PHONES = [
  { key: "chat", node: <ChatPhone />, caption: "Mira in chat" },
  { key: "editor", node: <EditorPhone />, caption: "Sloane in the editor" },
  { key: "create", node: <CreatorPhone />, caption: "Creating Noor" },
  { key: "vault", node: <VaultPhone />, caption: "Cole in the Velvet Vault" },
];

export function LandingStory() {
  return (
    <section id="on-your-phone" className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="phones-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="phones-heading"
          eyebrow="On your phone"
          title="Four ways to spend time with her"
          lede="A conversation, a picture you can edit, a companion you create, and a treasure from the Velvet Vault. The background is the color you picked above."
        />
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {PHONES.map((phone) => (
            <li key={phone.key} className="w-[240px] shrink-0 snap-center sm:w-[260px] lg:w-auto">
              {phone.node}
              <p className="mt-3 text-center text-xs tracking-wide text-[#B8A9BC]">{phone.caption}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
