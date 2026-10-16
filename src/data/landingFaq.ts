export type LandingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const LANDING_FAQ: readonly LandingFaqItem[] = [
  {
    id: "what",
    question: "What is LustForge?",
    answer: "LustForge is an AI companion app for adults. Create someone, talk with them, and ask for pictures.",
  },
  {
    id: "who",
    question: "Who is it for?",
    answer: "Adults only, 18 and over.",
  },
  {
    id: "access",
    question: "How do I get in?",
    answer:
      "Join the waitlist to get your beta access.",
  },
  {
    id: "voice",
    question: "Can I hear them and see pictures?",
    answer: "Ask for a picture in the chat. Voice calls are on the way.",
  },
  {
    id: "toy",
    question: "Do I need a toy?",
    answer: "No. A toy is optional. If you connect one, the chat can follow along. Your safe word, or the stop button, ends it.",
  },
  {
    id: "safe-word",
    question: "What is the safe word?",
    answer: "A word you choose. Say it, or tap stop, and the scene ends. Until you change it, the word is RED.",
  },
  {
    id: "privacy",
    question: "What happens to my chats and my data?",
    answer: "Chats stay on your account so you can come back. We use your email to reach you. We do not sell personal data.",
  },
  {
    id: "discreet",
    question: "Can the notification stay discreet?",
    answer: "Yes. It can show her name, or only LustForge.",
  },
];
