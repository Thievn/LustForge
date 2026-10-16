/** Extra picture when `pics_left` is empty. Matches phone pricing. */
export const EXTRA_PICTURE_CREDITS = 10;

export const LOCKED_PHOTO_LABEL = "Locked photo";
export const LOCKED_PHOTO_PROMPT = "Unlock this one with a pass.";

/** Shown to the model only. The member sees the locked photo bubble, not this note. */
export const LOCKED_PICTURE_REPLY_HINT =
  "The user asked for a picture and has no pictures or credits left. Reply in character with one short enticing line. Do not say a photo was sent. Do not mention prices, checkout, or coins.";

export function looksLikePictureAsk(text: string): boolean {
  return /\b(pic|picture|photo|selfie|image|send me)\b/i.test(text);
}

export type ImageCharge =
  | { action: "allow"; charge: "none" | "pic" | "credits" }
  | { action: "locked" };

/**
 * Pics balance, then credits. Plan name does not block a picture the member still has.
 * Catalog owners and admins are not charged.
 */
export function decideImageCharge(input: {
  admin?: boolean;
  catalogOwner?: boolean;
  picsLeft: number;
  credits: number;
}): ImageCharge {
  if (input.admin || input.catalogOwner) return { action: "allow", charge: "none" };
  if (input.picsLeft > 0) return { action: "allow", charge: "pic" };
  if (input.credits >= EXTRA_PICTURE_CREDITS) return { action: "allow", charge: "credits" };
  return { action: "locked" };
}

export type PictureSignal = "none" | "open" | "locked";

export function pictureSignal(input: {
  asked: boolean;
  admin?: boolean;
  catalogOwner?: boolean;
  picsLeft: number;
  credits: number;
}): PictureSignal {
  if (!input.asked) return "none";
  return decideImageCharge(input).action === "locked" ? "locked" : "open";
}

/**
 * Picture balance never decides whether chat runs.
 * A false result must be shown in the thread; it must not drop the message.
 */
export function phoneSendGate(input: { text: string; signedIn: boolean; minor: string | null }):
  | { callGrok: true }
  | { callGrok: false; message: string } {
  const minor = input.minor?.trim() ?? "";
  if (minor) return { callGrok: false, message: minor };
  if (!input.text.trim()) return { callGrok: false, message: "" };
  if (!input.signedIn) return { callGrok: false, message: "Sign in to send this." };
  return { callGrok: true };
}
