import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ImagePlus, Loader2, Phone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator";
import { PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import "@/components/phone/phone.css";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { minorReason } from "@/lib/phone/adultGuard";
import { looksLikePictureAsk, parseStructuredReply } from "@/lib/phone/bubbles";
import { buildGrokPhoneRequest, replyTextFromGrok } from "@/lib/phone/grokPhoneChat";
import { messageFromFunctionsInvoke } from "@/lib/supabaseFunctionsError";
import { PREVIEW_THREAD } from "@/lib/phone/previewData";
import { readPhoneSkin } from "@/lib/phone/skin";
import { parseStorageRef } from "@/lib/phone/storageUrl";
import { planAllowsClearPictures } from "@/lib/phone/pricing";
import { cn } from "@/lib/utils";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  imageUrl?: string | null;
  pendingImage?: boolean;
  blurred?: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
};

export default function PhoneThread() {
  const { id = "" } = useParams();
  const preview = usePhonePreview();
  const { companions, user, limits } = usePhoneRoster(preview);
  const companion = companions.find((item) => item.id === id) ?? null;
  const [messages, setMessages] = useState<Bubble[]>(preview ? PREVIEW_THREAD : []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(!preview);
  const skin = readPhoneSkin();
  const scroller = useRef<HTMLDivElement>(null);
  const q = preview ? "?preview=1" : "";

  useEffect(() => {
    if (preview || !user || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("chat_messages")
      .select("id, role, content, created_at, image_url")
      .eq("user_id", user.id)
      .eq("companion_id", id)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(async ({ data }) => {
        if (cancelled) return;
        const rows = await Promise.all(
          (data ?? []).map(async (row) => ({
            id: row.id,
            role: row.role === "assistant" ? "assistant" as const : "user" as const,
            content: row.content,
            createdAt: row.created_at,
            imageUrl: await displayUrl(row.image_url),
          })),
        );
        setMessages(rows);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview, user, id]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const clearPictures = limits.catalogOwner || planAllowsClearPictures(limits.plan) || limits.picsLeft > 0 || limits.credits >= 10;

  async function send(text: string) {
    const content = text.trim();
    if (!content || !companion || sending) return;
    const blocked = minorReason(content);
    if (blocked) {
      setNotice(blocked);
      return;
    }
    setNotice(null);
    setDraft("");
    setSending(true);
    const userBubble: Bubble = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userBubble]);
    window.setTimeout(() => {
      setMessages((current) =>
        current.map((item) => (item.id === userBubble.id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
      setTyping(true);
    }, 700);

    if (preview) {
      await wait(900 + Math.min(2400, content.length * 28));
      const bubbles = content.match(/pic|photo|picture|selfie/i)
        ? ["Give me a second.", "Fixing my hair."]
        : ["I like that.", "Tell me more."];
      await revealBubbles(bubbles, companion.name);
      if (looksLikePictureAsk(content)) {
        const pending = pushPending();
        await wait(1200);
        setMessages((current) =>
          current.map((item) =>
            item.id === pending
              ? { ...item, pendingImage: false, blurred: !clearPictures, content: clearPictures ? "Here." : "Unlock this one with a pass." }
              : item,
          ),
        );
      }
      setTyping(false);
      setSending(false);
      return;
    }

    if (!user) {
      setSending(false);
      setTyping(false);
      return;
    }

    await insertMessage({
      user_id: user.id,
      companion_id: companion.id,
      role: "user",
      content,
      origin: "user",
      kind: "text",
      delivered_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
    });

    const history = [...messages, userBubble].map((item) => ({ role: item.role, content: item.content }));
    const { data, error } = await supabase.functions.invoke(
      "grok-chat",
      { body: buildGrokPhoneRequest({
        companionId: companion.id,
        companionName: companion.name,
        systemPrompt: buildSystem(companion),
        messages: history,
      }) },
    );
    const replyText = replyTextFromGrok(data);
    if (error || !replyText) {
      setNotice(await messageFromFunctionsInvoke(error, data));
      setTyping(false);
      setSending(false);
      return;
    }
    const parsed = parseStructuredReply(replyText);
    const wantImage = Boolean(parsed.imageRequest) || looksLikePictureAsk(content);
    await revealBubbles(parsed.bubbles, companion.name);
    for (const bubble of parsed.bubbles) {
      await insertMessage({
        user_id: user.id,
        companion_id: companion.id,
        role: "assistant",
        content: bubble,
        origin: "reply",
        kind: "text",
      });
    }
    if (wantImage) {
      const pendingId = pushPending();
      const request = parsed.imageRequest;
      const image = await supabase.functions.invoke("image-dispatch", {
        body: {
          companionId: companion.id,
          descriptor: companion.characterReference || companion.appearanceReference || companion.appearance,
          seed: hashSeed(companion.id),
          scene: request?.scene || content,
          outfit: request?.outfit || "",
          framing: request?.framing || "half-body",
          expression: request?.expression || "",
          poseHint: request?.poseHint || "",
          userText: content,
        },
      });
      const payload = image.data as {
        imageUrl?: string | null;
        blurred?: boolean;
        error?: string;
        storageBucket?: string;
        storagePath?: string;
      } | null;
      if (image.error || payload?.error) {
        setNotice(await messageFromFunctionsInvoke(image.error, image.data));
      }
      const src = payload?.imageUrl ? await displayUrl(payload.imageUrl, payload.storageBucket, payload.storagePath) : null;
      setMessages((current) =>
        current.map((item) =>
          item.id === pendingId
            ? {
                ...item,
                pendingImage: false,
                blurred: Boolean(payload?.blurred) || !src,
                imageUrl: src,
                content: payload?.error
                  ? "My camera is being weird. I will send it in a bit."
                  : payload?.blurred
                    ? "I took it. Unlock it with a pass."
                    : "Here.",
              }
            : item,
        ),
      );
      if (src && user) {
        await insertMessage({
          user_id: user.id,
          companion_id: companion.id,
          role: "assistant",
          content: payload?.blurred ? "Locked photo" : "Photo",
          image_url: payload?.imageUrl,
          kind: "image",
          origin: "reply",
          storage_bucket: payload?.storageBucket,
          storage_path: payload?.storagePath,
        });
      }
    }
    setTyping(false);
    setSending(false);
  }

  function pushPending() {
    const id = `photo-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id,
        role: "assistant",
        content: `${companion?.name ?? "She"} is sending a photo…`,
        createdAt: new Date().toISOString(),
        pendingImage: true,
      },
    ]);
    return id;
  }

  async function revealBubbles(bubbles: string[], name: string) {
    for (const [index, bubble] of bubbles.entries()) {
      if (index > 0) {
        setTyping(true);
        await wait(650 + Math.min(900, bubble.length * 12));
      }
      setTyping(false);
      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}-${index}`, role: "assistant", content: bubble, createdAt: new Date().toISOString() },
      ]);
    }
    void name;
  }

  const grouped = useMemo(() => messages, [messages]);

  return (
    <PhoneStage>
      <div className={cn("flex min-h-0 flex-1 flex-col", skin !== "lustforge" && `phone-skin-${skin}`)}>
        <header className="flex items-center gap-2 border-b border-border/70 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Link to={`/messages${q}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {companion ? (
            <Link to={preview ? `/messages/${companion.id}${q}` : `/companions/${companion.id}`} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full font-gothic text-white"
                style={{ background: `linear-gradient(135deg, ${companion.gradientFrom}, ${companion.gradientTo})` }}
              >
                {companion.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{companion.name}</p>
                <p className="text-[11px] text-muted-foreground">{typing ? "typing…" : "online"}</p>
              </div>
            </Link>
          ) : (
            <p className="flex-1 text-sm text-muted-foreground">Companion</p>
          )}
          {companion && !preview ? (
            <Link to={`/live-call/${companion.id}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Live call">
              <Phone className="h-4 w-4" />
            </Link>
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center text-muted-foreground">
              <Phone className="h-4 w-4" />
            </span>
          )}
        </header>

        <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="space-y-2">
              <div className="ml-auto h-12 w-40 animate-pulse rounded-2xl bg-primary/20" />
              <div className="h-16 w-52 animate-pulse rounded-2xl bg-card" />
            </div>
          ) : !companion ? (
            <p className="py-16 text-center text-sm text-muted-foreground">This companion is not on your home screen.</p>
          ) : grouped.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No messages yet. Say something only an adult would.</p>
          ) : (
            grouped.map((message, index) => {
              const previous = grouped[index - 1];
              const showTime = !previous || new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > 1000 * 60 * 8;
              return (
                <div key={message.id}>
                  {showTime ? (
                    <p className="py-1 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  ) : null}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[1.25rem] px-4 py-3 text-[15px] leading-relaxed",
                        message.role === "user"
                          ? "lf-bubble-user rounded-br-[0.55rem] bg-gradient-to-br from-primary to-[hsl(320_70%_32%)] text-primary-foreground shadow-[0_4px_28px_rgba(0,0,0,0.28),0_0_32px_hsl(var(--primary)/0.22)]"
                          : "lf-bubble-companion rounded-bl-[0.55rem] border border-white/[0.11] bg-[hsl(280_24%_7%/0.94)] text-foreground shadow-[0_2px_24px_rgba(0,0,0,0.28)]",
                      )}
                    >
                      {message.pendingImage ? <PhotoPlaceholder name={companion.name} /> : null}
                      {message.imageUrl ? (
                        <img
                          src={message.imageUrl}
                          alt=""
                          className={cn("mb-2 max-h-72 w-full rounded-xl object-cover", message.blurred && "scale-105 blur-xl")}
                        />
                      ) : message.blurred ? (
                        <div className="mb-2 flex h-40 items-center justify-center rounded-xl bg-primary/20 text-xs uppercase tracking-[0.18em] text-primary">
                          Locked
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.role === "user" && message.readAt ? (
                        <p className="mt-1 text-right text-[10px] text-primary-foreground/70">Read</p>
                      ) : message.role === "user" && message.deliveredAt ? (
                        <p className="mt-1 text-right text-[10px] text-primary-foreground/70">Delivered</p>
                      ) : null}
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
          <AnimatePresence>
            {typing && companion ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChatTypingIndicator companionName={companion.name} isImageRequest={looksLikePictureAsk(draft)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {notice ? (
          <p className="mx-3 mb-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-center text-xs text-foreground">{notice}</p>
        ) : null}
        {limits.plan === "free" && !limits.catalogOwner ? (
          <p className="px-4 text-center text-[11px] text-muted-foreground">{limits.textsLeft} free texts left today</p>
        ) : null}

        <form
          className="flex items-end gap-2 border-t border-white/10 bg-background/75 px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-18px_40px_hsl(var(--primary)/0.16)] backdrop-blur-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-primary"
            aria-label="Ask for a photo"
            onClick={() => void send("Send me a picture of you")}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            placeholder={companion ? `Message ${companion.name}` : "Message"}
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/15 bg-card/80 px-3 py-2.5 text-sm text-foreground outline-none ring-primary/50 placeholder:text-foreground/45 focus:ring-2"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </PhoneStage>
  );
}

function PhotoPlaceholder({ name }: { name: string }) {
  return (
    <div className="mb-2 flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/10">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <p className="text-xs text-primary">{name} is sending a photo…</p>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function hashSeed(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

function buildSystem(companion: { name: string; personality: string; backstory?: string; role: string; appearance: string }) {
  return [
    `You are ${companion.name}, a fictional consenting adult aged 21 or older.`,
    `Type: ${companion.role}.`,
    companion.personality,
    companion.backstory || "",
    `Look: ${companion.appearance}`,
    "Text like a person: short bubbles, no labels, no markdown.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function insertMessage(row: Record<string, unknown>) {
  const client = supabase as unknown as {
    from: (table: string) => {
      insert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };
  const first = await client.from("chat_messages").insert(row);
  if (first.error && /column/i.test(first.error.message)) {
    const base = {
      user_id: row.user_id,
      companion_id: row.companion_id,
      role: row.role,
      content: row.content,
      image_url: row.image_url,
    };
    await client.from("chat_messages").insert(base);
  }
}

async function displayUrl(url: string | null | undefined, bucket?: string | null, path?: string | null) {
  const ref = path && bucket ? { bucket, path } : parseStorageRef(url);
  if (ref) {
    if (ref.bucket === "companion-images") {
      return supabase.storage.from(ref.bucket).getPublicUrl(ref.path).data.publicUrl;
    }
    const signed = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
    if (signed.data?.signedUrl) return signed.data.signedUrl;
  }
  return url || null;
}
