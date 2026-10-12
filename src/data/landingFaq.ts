import {
  CHAT_IMAGE_LEWD_FC,
  CHAT_MESSAGE_FC_AFTER_DAILY_FREE,
  DAILY_FREE_CHAT_MESSAGES,
  FORGE_CREATE_COMPANION_FC,
  LIVE_VOICE_FC_PER_MINUTE,
} from "@/lib/forgeEconomy";

export type LandingFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const LANDING_FAQ: readonly LandingFaqItem[] = [
  {
    id: "what",
    question: "What is LustForge?",
    answer:
      "LustForge is an AI companion app for adults. You make a fictional companion, then text them, ask for pictures, and call them.",
  },
  {
    id: "who",
    question: "Who is it for?",
    answer:
      "Adults 18 and older. You confirm your age before you enter. Companions are fictional characters, not real people, and each one is 21 or older.",
  },
  {
    id: "access",
    question: "How do I get in?",
    answer:
      "Join the waitlist with your email. We will email you when you can create an account. Sign in is only for people who already have access.",
  },
  {
    id: "cost",
    question: "What does it cost?",
    answer: `At launch the plans are Ember $14.99, Blaze $24.99, and Inferno $39.99 a month, plus credit packs. The waitlist does not charge you. The app also uses Forge Coins: ${DAILY_FREE_CHAT_MESSAGES} free texts a day, then ${CHAT_MESSAGE_FC_AFTER_DAILY_FREE} FC each. Making a companion costs ${FORGE_CREATE_COMPANION_FC} FC. A picture costs ${CHAT_IMAGE_LEWD_FC} FC. A live call costs ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute.`,
  },
  {
    id: "voice",
    question: "Can I hear them and see pictures?",
    answer: `Yes. You can call them, and you can ask for a picture in the chat. A call costs ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute. A picture costs ${CHAT_IMAGE_LEWD_FC} FC and uses the face you made.`,
  },
  {
    id: "toy",
    question: "Do I need a toy?",
    answer:
      "No. Lovense sync is optional. If you connect a toy, the chat can control it. Your safe word, or the stop button in chat, turns toy control off right away.",
  },
  {
    id: "safe-word",
    question: "What is the safe word?",
    answer:
      "A word you set in Preferences. Say it in chat or on a call, or tap the stop button. The scene stops, and so does any toy control. Until you change it, the word is RED.",
  },
  {
    id: "privacy",
    question: "What happens to my chats and my data?",
    answer:
      "Chats are saved to your account so you can leave and come back. We use your email for the waitlist or your account. We do not sell personal data. LustForge does not store card numbers. The Privacy Policy has the details.",
  },
  {
    id: "discreet",
    question: "Can the notification stay discreet?",
    answer:
      "Yes. A notification can show her name, or only the word LustForge. You can also add LustForge to your phone home screen so it opens full screen.",
  },
];
