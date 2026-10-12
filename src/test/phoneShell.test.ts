import { describe, expect, it } from "vitest";
import { ageIsAdult, minorReason } from "@/lib/phone/adultGuard";
import { parseStructuredReply, splitBubbles } from "@/lib/phone/bubbles";
import { matchPoseId } from "@/lib/phone/poses";
import { CREDIT_COSTS, FREE_TIER, PLANS } from "@/lib/phone/pricing";
import { displayableMediaUrl, isSupabaseStorageUrl, isTemporaryProviderUrl, needsStorageArchive } from "@/lib/phone/storageUrl";

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

describe("plans", () => {
  it("matches the launch prices", () => {
    expect(PLANS.map((plan) => plan.price)).toEqual(["$14.99", "$24.99", "$39.99"]);
    expect(FREE_TIER.textsPerDay).toBe(10);
    expect(CREDIT_COSTS.voicePerMinute).toBe(25);
  });
});
