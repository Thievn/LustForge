import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { buildGrokPhoneRequest, replyTextFromGrok } from "@/lib/phone/grokPhoneChat";
import { nextGroupSpeaker } from "@/lib/bond/logic";

type Line = { id: string; speaker: string; content: string };

export default function GroupChat() {
  const preview = usePhonePreview();
  const { companions, user } = usePhoneRoster(preview);
  const [picked, setPicked] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function send() {
    const text = draft.trim();
    if (!text || picked.length < 2 || !user) {
      setNotice("Choose at least two of them.");
      return;
    }
    setBusy(true);
    setNotice(null);
    setDraft("");
    const mine: Line = { id: crypto.randomUUID(), speaker: "you", content: text };
    const history = [...lines, mine];
    setLines(history);
    let last: string | null = null;
    const nextLines = [...history];
    for (let turn = 0; turn < Math.min(picked.length, 3); turn += 1) {
      const speakerId = nextGroupSpeaker(picked, last);
      last = speakerId;
      const speaker = companions.find((item) => item.id === speakerId);
      if (!speaker) continue;
      const others = companions.filter((item) => picked.includes(item.id) && item.id !== speakerId).map((item) => item.name);
      const { data, error } = await supabase.functions.invoke("grok-chat", {
        body: buildGrokPhoneRequest({
          companionId: speaker.id,
          companionName: speaker.name,
          systemPrompt: `You are ${speaker.name}. ${speaker.personality}. You are in a group text with ${others.join(" and ")}. Stay yourself. One or two short texts. Do not speak for anyone else. Fictional adults, 21+.`,
          messages: nextLines.map((line) => ({
            role: line.speaker === "you" ? "user" : "assistant",
            content: line.speaker === "you" ? line.content : `${line.speaker}: ${line.content}`,
          })),
        }),
      });
      if (error) {
        setNotice("One of them went quiet.");
        break;
      }
      const reply = replyTextFromGrok(data).replace(/^\{[\s\S]*\}$/, "").trim() || replyTextFromGrok(data);
      const line = { id: crypto.randomUUID(), speaker: speaker.name, content: reply || "…" };
      nextLines.push(line);
      setLines([...nextLines]);
    }
    const client = supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => { select: (c: string) => { single: () => Promise<{ data: { id?: string } | null }> } } } };
    const group = await client.from("group_chats").insert({
      user_id: user.id,
      title: companions.filter((item) => picked.includes(item.id)).map((item) => item.name).join(" & "),
      companion_ids: picked,
    }).select("id").single();
    if (group.data?.id) {
      for (const line of nextLines) {
        await (supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> } })
          .from("group_messages")
          .insert({ group_id: group.data.id, user_id: user.id, speaker: line.speaker, content: line.content });
      }
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 py-6 pb-28 lg:pb-8">
      <h1 className="font-gothic text-4xl">Group text</h1>
      <p className="mt-1 text-sm text-muted-foreground">Two or more of them. They take turns, and they do not share a voice.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {companions.map((companion) => (
          <button key={companion.id} type="button" onClick={() => toggle(companion.id)} className={`h-11 shrink-0 rounded-full px-4 text-sm ${picked.includes(companion.id) ? "bg-primary text-primary-foreground" : "border border-border"}`}>
            {companion.name}
          </button>
        ))}
      </div>
      <div className="mt-4 flex-1 space-y-3">
        {lines.map((line) => (
          <p key={line.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${line.speaker === "you" ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}>
            {line.speaker !== "you" ? <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-primary">{line.speaker}</span> : null}
            {line.content}
          </p>
        ))}
      </div>
      {notice ? <p className="text-sm" role="alert">{notice}</p> : null}
      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Say it once. They both hear it." className="h-12 flex-1 rounded-2xl border border-border bg-card px-3 text-sm" />
        <button type="submit" disabled={busy} className="h-12 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "…" : "Send"}</button>
      </form>
    </div>
  );
}
