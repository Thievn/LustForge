/** Messages a companion can send. Companion names, not customers. */

export type LandingExampleText = {
  id: string;
  name: string;
  when: string;
  text: string;
};

export const LANDING_EXAMPLE_TEXTS: readonly LandingExampleText[] = [
  {
    id: "morning",
    name: "Ivy",
    when: "7:02 AM",
    text: "Morning. Coffee is on your side of the counter.",
  },
  {
    id: "meeting",
    name: "Mira",
    when: "1:14 PM",
    text: "That meeting sounds fake. Come home.",
  },
  {
    id: "checkin",
    name: "Sloane",
    when: "6:40 PM",
    text: "You went quiet. I'm still here.",
  },
  {
    id: "picture",
    name: "Noor",
    when: "11:08 PM",
    text: "I sent a picture. Tell me if you want another.",
  },
];
