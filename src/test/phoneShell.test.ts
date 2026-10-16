import { describe, expect, it } from "vitest";
import { ageIsAdult, minorReason } from "@/lib/phone/adultGuard";
import {
  annotateReceipts,
  chatFailureNote,
  isLockedPhotoMessage,
  looksLikePictureAsk,
  parseStructuredReply,
  phoneSendGate,
  planChatPicture,
  splitBubbles,
  visibleTicks,
} from "@/lib/phone/bubbles";
import { pictureSignalFromGrok } from "@/lib/phone/grokPhoneChat";
import { decideImageCharge } from "../../supabase/functions/_shared/pictureAllowance";
import { matchPoseId } from "@/lib/phone/poses";
import { CREDIT_COSTS, FREE_TIER, PLANS } from "@/lib/phone/pricing";
import { displayableMediaUrl, isSupabaseStorageUrl, isTemporaryProviderUrl, needsStorageArchive } from "@/lib/phone/storageUrl";
import { buildGrokPhoneRequest, replyTextFromGrok } from "@/lib/phone/grokPhoneChat";

describe("adult guard", () => {
  it("blocks underage wording and ages under 21", () => {
    expect(minorReason("she is 17 years old")).toBeTruthy();
    expect(minorReason("a teenager")).toBeTruthy();
    expect(minorReason("loli")).toBeTruthy();
    expect(minorReason("20 year old")).toBeTruthy();
    expect(ageIsAdult(18)).toBe(false);
    expect(ageIsAdult(21)).toBe(true);
  });

  it("allows fictional adults", () => {
    expect(minorReason("24 year old woman on the couch")).toBeNull();
  });
});

describe("bubbles", () => {
  it("splits sentences and parses structured json", () => {
    expect(splitBubbles("Hey. Come here. I missed you.")).toHaveLength(3);
    const parsed = parseStructuredReply('{"bubbles":["Hi","You up?"],"image_request":{"scene":"on the couch"}}');
    expect(parsed.bubbles).toEqual(["Hi", "You up?"]);
    expect(parsed.imageRequest?.scene).toBe("on the couch");
  });
});

describe("poses", () => {
  it("matches hidden keywords", () => {
    expect(matchPoseId("send a pic of you lying on the couch")).toBe("couch_lying_03");
  });
});

describe("storage urls", () => {
  it("keeps supabase storage and skips temporary xAI links when public_url exists", () => {
    const stored = "https://tyaplrrlirlbqrfjqryo.supabase.co/storage/v1/object/public/companion-images/profile-loops/a.mp4";
    const temp = "https://api.x.ai/v1/videos/tmp/abc";
    expect(isSupabaseStorageUrl(stored)).toBe(true);
    expect(needsStorageArchive(stored)).toBe(false);
    expect(isTemporaryProviderUrl(temp)).toBe(true);
    expect(displayableMediaUrl(temp, stored)).toBe(stored);
    expect(needsStorageArchive(temp)).toBe(true);
  });
});

describe("grok phone chat", () => {
  it("calls the live classic_chat function shape", () => {
    const body = buildGrokPhoneRequest({
      companionId: "c1",
      companionName: "Mara",
      systemPrompt: "Stay in character.",
      messages: [{ role: "user", content: "hey" }],
    });
    expect(body.intent).toBe("classic_chat");
    expect(body.companionId).toBe("c1");
    expect(body.messages).toHaveLength(1);
    expect(replyTextFromGrok({ response: "Come over." })).toBe("Come over.");
    expect(replyTextFromGrok({ error: "nope" })).toBe("");
    expect(pictureSignalFromGrok({ response: "Hi", picture: "locked" })).toBe("locked");
    expect(pictureSignalFromGrok({ response: "Hi" })).toBeNull();
  });
});

describe("phone send does not drop a picture ask", () => {
  it("still calls grok when pics and credits are empty", () => {
    expect(looksLikePictureAsk("Send me a picture of you")).toBe(true);
    expect(phoneSendGate({ text: "Send me a picture of you", signedIn: true, minor: null })).toEqual({ callGrok: true });
    expect(phoneSendGate({ text: "Send me a picture of you", signedIn: false, minor: null })).toEqual({
      callGrok: false,
      message: "Sign in to send this.",
    });
    expect(
      planChatPicture({
        userAsked: true,
        modelAsked: false,
        previousFailed: false,
        serverPicture: "locked",
        picsLeft: 0,
        credits: 0,
        catalogOwner: false,
      }).image,
    ).toBe("locked");
  });

  it("dispatches when a picture is open even if the client balance is stale", () => {
    expect(
      planChatPicture({
        userAsked: true,
        modelAsked: false,
        previousFailed: false,
        serverPicture: "open",
        picsLeft: 0,
        credits: 0,
        catalogOwner: false,
      }).image,
    ).toBe("dispatch");
    expect(decideImageCharge({ picsLeft: 2, credits: 0 })).toEqual({ action: "allow", charge: "pic" });
    expect(decideImageCharge({ picsLeft: 0, credits: 0 })).toEqual({ action: "locked" });
    expect(decideImageCharge({ picsLeft: 0, credits: 10 })).toEqual({ action: "allow", charge: "credits" });
    expect(decideImageCharge({ admin: true, picsLeft: 0, credits: 0 })).toEqual({ action: "allow", charge: "none" });
  });

  it("marks an unanswered saved line as failed and uses single or double ticks", () => {
    const rows = annotateReceipts([
      { id: "u1", role: "user" as const },
      { id: "a1", role: "assistant" as const },
      { id: "u2", role: "user" as const },
    ]);
    expect(rows.map((row) => row.receipt)).toEqual(["delivered", "delivered", "failed"]);
    expect(visibleTicks("sent", true)).toBe(1);
    expect(visibleTicks("delivered", true)).toBe(2);
    expect(visibleTicks("failed", true)).toBe(1);
    expect(visibleTicks("failed", false)).toBe(0);
    expect(visibleTicks("pending", false)).toBe(0);
    expect(isLockedPhotoMessage("Locked photo", null)).toBe(true);
    expect(isLockedPhotoMessage("Locked photo", "https://example.test/a.png")).toBe(false);
    expect(chatFailureNote("xAI HTTP 500: boom")).toBe("She didn't get that.");
    expect(chatFailureNote("Sign in to send this.")).toBe("Sign in to send this.");
  });
});

describe("plans", () => {
  it("matches the launch prices", () => {
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(FREE_TIER.textsPerDay).toBe(10);
    expect(CREDIT_COSTS.voicePerMinute).toBe(25);
  });
});
