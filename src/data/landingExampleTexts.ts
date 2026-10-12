/** Sample messages a companion might send. Not customer reviews. */

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
    name: "Ivy",
    when: "1:14 PM",
    text: "That meeting sounds fake. Come home.",
  },
  {
    id: "checkin",
    name: "Ivy",
    when: "6:40 PM",
    text: "You went quiet. I'm still here.",
  },
  {
    id: "picture",
    name: "Ivy",
    when: "11:08 PM",
    text: "Send a picture of the couch. I want to see where you are sitting.",
  },
];
