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
      "LustForge is an AI companion app for adults. You create a fictional companion — or start from someone in Discover — then talk by text, pictures (Moments), and voice.",
  },
  {
    id: "who",
    question: "Who is it for?",
    answer:
      "Adults 18 and older only. You confirm your age before you enter. If that's not you, please leave. The companions are fictional characters, not real people.",
  },
  {
    id: "access",
    question: "How do I get in?",
    answer:
      "Join the waitlist with your email. We'll write when you can create an account and make your companion. Signing in is for people who already have access.",
  },
  {
    id: "cost",
    question: "What does it cost?",
    answer: `You get ${DAILY_FREE_CHAT_MESSAGES} free text messages a day. The pool resets at 3:00 a.m. Eastern. After that, each text is ${CHAT_MESSAGE_FC_AFTER_DAILY_FREE} Forge Coins. Packs start at $5. Creating a companion is ${FORGE_CREATE_COMPANION_FC} FC, a Moment is ${CHAT_IMAGE_LEWD_FC} FC, and Live Voice or Live Call is ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute. Pay by card or crypto. It is not a subscription.`,
  },
  {
    id: "voice",
    question: "Can I hear them and see pictures?",
    answer: `Yes. Live Voice sits inside chat, and Live Call is a full-screen call with their voice. Both are ${LIVE_VOICE_FC_PER_MINUTE} FC per started minute. Moments sends a still into the thread for ${CHAT_IMAGE_LEWD_FC} FC, using the face you created.`,
  },
  {
    id: "toy",
    question: "Do I need a toy?",
    answer:
      "No. Lovense sync is optional. If you connect one, Toy Control can follow the chat. Your safe word, or the emergency stop in chat, ends toy control immediately.",
  },
  {
    id: "safe-word",
    question: "What is the safe word?",
    answer:
      "A word you set in Preferences. Say it in chat or on a call, or tap the emergency stop, and the scene and any toy control stop. The default until you change it is RED.",
  },
  {
    id: "privacy",
    question: "What happens to my chats and my data?",
    answer:
      "Conversations are saved to your account so you can leave and pick them up, including from Chat History. We use your email for the waitlist or your account, and we don't sell personal data. Card numbers are handled by checkout — LustForge doesn't store them. The Privacy Policy has the full picture.",
  },
];
