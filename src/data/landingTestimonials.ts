/**
 * SAMPLE COPY — replace every quote and name with real, consented beta-tester
 * feedback before treating this as customer evidence. Names are placeholders
 * (first name + last initial). Do not add user counts, star averages, or press
 * logos next to this list.
 */
export const LANDING_TESTIMONIAL_LABEL = "Early beta impressions (sample)";

export type LandingTestimonial = {
  id: string;
  name: string;
  quote: string;
};

export const LANDING_TESTIMONIALS: readonly LandingTestimonial[] = [
  {
    id: "maya",
    name: "Maya R.",
    quote:
      "I made someone who texts like they already know the mood I'm in. Coming back to the same thread is the part I didn't expect to want.",
  },
  {
    id: "jordan",
    name: "Jordan P.",
    quote:
      "The forge is the difference. I set the attitude, not just a face, and the chat actually stays in that voice.",
  },
  {
    id: "elena",
    name: "Elena V.",
    quote:
      "Live call feels close in a way typing doesn't. I keep my safe word set, and that makes the whole thing feel like mine.",
  },
  {
    id: "chris",
    name: "Chris A.",
    quote:
      "They sent a picture in the middle of a conversation, and it still looked like the person I had made. That was when it clicked.",
  },
  {
    id: "priya",
    name: "Priya S.",
    quote:
      "I was ready to bounce off another companion app. This one lets the conversation linger, and it doesn't rush me.",
  },
  {
    id: "nathan",
    name: "Nathan K.",
    quote:
      "Connecting a toy is optional. When I tried it, it followed the scene instead of feeling bolted on.",
  },
];
