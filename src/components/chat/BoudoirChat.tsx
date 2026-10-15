import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ImageViewer } from "@/components/ImageViewer";
import { ChatDevicesCollapsible } from "@/components/chat/ChatDevicesCollapsible";
import { ChatGallerySheet } from "@/components/chat/ChatGallerySheet";
import { ChatVoiceSettingsSheet } from "@/components/chat/ChatVoiceSettingsSheet";
import type { ChatMessage } from "@/components/chat/chatTypes";
import { PRIVATE_PHOTO_LABEL } from "@/lib/privateChatPhoto";
import { BOND_TIERS, moodFor, tierForXp } from "@/lib/bond/logic";
import { supabase } from "@/integrations/supabase/client";
import type { UseChatSessionControllerReturn } from "@/pages/chat/useChatSessionController";

const REACTIONS = ["❤️", "🔥", "😏", "😘", "🥵"];

type VaultItem = { id: string; name: string; imageUrl: string };

function clock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function BoudoirChat(props: UseChatSessionControllerReturn) {
  const {
    companion,
    messages,
    loading,
    input,
    setInput,
    sendMessage,
    sendPrivatePhoto,
    goLiveCallFromChat,
    handleMediaBarRequest,
    portraitStillUrl,
    galleryImages,
    setViewingImage,
    viewingImage,
    saveImageToCompanionGallery,
    saveImageToPersonalGallery,
    user,
    navigate,
    location,
    mood,
    handleEmergencyStop,
    galleryOpen,
    setGalleryOpen,
    galleryImagesLoading,
    handlePortraitFromGallery,
    handleDeleteGalleryImage,
    voiceSettingsOpen,
    setVoiceSettingsOpen,
    effectiveVoiceLabel,
    profileTtsGlobal,
    globalVoiceLabelForSheet,
    relationshipVoicePreset,
    saveRelationshipVoice,
    voicePresetSaving,
    ttsAutoplay,
    onTtsAutoplayChange,
    liveVoiceTtsAutoplay,
    onLiveVoiceTtsAutoplayChange,
    connectedToys,
    activeToys,
    hasDevice,
    pairingQrUrl,
    pairingLoading,
    cancelLovensePairing,
    toyUtilityBusy,
    handleTestToy,
    handleDisconnectToy,
    handleStopAll,
    handleConnectToy,
    handleStartBreedingRitual,
    primaryToyUid,
    selectPrimaryToy,
    vibrationPatterns,
    vibrationPatternsLoading,
    sendingVibrationId,
    livePatternId,
    triggerCompanionVibration,
    relationship,
    toyDriveActive,
    stopSustainedToy,
  } = props;

  const route = useLocation();
  const preview = new URLSearchParams(route.search).get("preview") === "1";
  const [sheet, setSheet] = useState(false);
  const [phone, setPhone] = useState(false);
  const [panel, setPanel] = useState(true);
  const [sceneOn, setSceneOn] = useState(false);
  const [sceneTitle, setSceneTitle] = useState("");
  const [reactFor, setReactFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [lb, setLb] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState(false);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [bondLabel, setBondLabel] = useState("Spark");
  const [micLive, setMicLive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const recRef = useRef<{ stop?: () => void } | null>(null);
  const pressRef = useRef<number | null>(null);

  const shown = useMemo(() => {
    if (messages.length || !preview || !companion) return messages;
    const now = new Date();
    return [
      {
        id: "preview-her",
        role: "assistant" as const,
        content: `There you are. I was starting to think the evening had swallowed you whole.`,
        timestamp: new Date(now.getTime() - 60_000),
      },
      {
        id: "preview-me",
        role: "user" as const,
        content: "Long day. I missed you.",
        timestamp: now,
      },
    ] satisfies ChatMessage[];
  }, [companion, messages, preview]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, loading, sheet]);

  useEffect(() => {
    if (!user || !companion) return;
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            eq: (col: string, val: string) => {
              maybeSingle: () => Promise<{ data: { xp?: number | null; streak?: number | null } | null }>;
            };
            limit: (n: number) => Promise<{
              data: Array<{
                item_id: string;
                collectible_items: { name?: string | null; image_url?: string | null; thumb_url?: string | null } | null;
              }> | null;
            }>;
          };
        };
      };
    };
    void db
      .from("companion_bonds")
      .select("xp, streak")
      .eq("user_id", user.id)
      .eq("companion_id", companion.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setStreak(Number(data.streak ?? 0));
        setBondLabel(tierForXp(Number(data.xp ?? 0)).name);
      });
    void db
      .from("user_collectibles")
      .select("item_id, collectible_items(name, image_url, thumb_url)")
      .eq("user_id", user.id)
      .limit(6)
      .then(({ data }) => {
        if (!data) return;
        const items: VaultItem[] = [];
        for (const row of data) {
          const item = row.collectible_items;
          const imageUrl = item?.thumb_url || item?.image_url || "";
          if (!item?.name || !imageUrl) continue;
          items.push({ id: row.item_id, name: item.name, imageUrl });
        }
        setVault(items);
      });
    try {
      const raw = localStorage.getItem(`lf-react:${companion.id}`);
      if (raw) setReactions(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
  }, [companion, user]);

  if (!companion) return null;

  const moodLine = mood || moodFor({ hour: new Date().getHours(), streak });
  const tags = [...new Set([companion.role, ...companion.tags].filter(Boolean))].slice(0, 3);
  const herShots = galleryImages.filter((row) => row.image_url && !row.is_video).slice(0, 6);

  const back = () => {
    void handleEmergencyStop();
    const st = location.state as { from?: string } | undefined;
    navigate(st?.from ?? `/companions/${companion.id}`);
  };

  const sendPhoto = (file: File | undefined) => {
    if (!file) return;
    setSheet(false);
    void sendPrivatePhoto(file);
  };

  const ask = () => {
    setSheet(false);
    setInput("What do you want from me tonight?");
  };

  const toggleScene = () => {
    const next = !sceneOn;
    setSceneOn(next);
    setSheet(false);
    const title = companion.fantasyStarters[0]?.title || `A quiet hour with ${companion.name}`;
    setSceneTitle(title);
    if (next) {
      void sendMessage(companion.fantasyStarters[0]?.description || `Let's begin: ${title}.`);
    } else {
      void sendMessage("Let's step out of the scene and just be us.");
    }
  };

  const sendVault = (item: VaultItem) => {
    setSheet(false);
    void sendMessage(`I set the ${item.name} out for you.`);
  };

  const toggleMic = () => {
    if (micLive) {
      recRef.current?.stop?.();
      setMicLive(false);
      return;
    }
    const w = window as Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      if (text) setInput(input ? `${input} ${text}` : text);
    };
    rec.onend = () => setMicLive(false);
    recRef.current = rec;
    setMicLive(true);
    rec.start();
  };

  const setReaction = (id: string, emoji: string) => {
    setReactions((prev) => {
      const next = { ...prev, [id]: emoji };
      if (companion) localStorage.setItem(`lf-react:${companion.id}`, JSON.stringify(next));
      return next;
    });
    setReactFor(null);
  };

  let lastDay = "";

  return (
    <div className={`lf-boudoir lf-chatpage${phone ? " phone" : ""}`}>
      <div className={`app${panel ? "" : " rc"}`} id="app">
        <aside className="col-l">
          <Link className="wordmark" to="/">Lust<b>Forge</b></Link>
          <div className="mini">
            <div className="ph0">
              {portraitStillUrl ? <img src={portraitStillUrl} alt="" /> : null}
            </div>
            <div>
              <h2>{companion.name}</h2>
              <p className="muted" style={{ fontSize: 14, marginTop: 2 }}>{companion.tagline}</p>
            </div>
            <div className="tags" style={{ margin: 0 }}>
              {tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
            </div>
            <div className="relg">
              <div className="box"><b>{streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "New"}</b><span>Streak</span></div>
              <div className="box"><b style={{ textTransform: "capitalize" }}>{moodLine}</b><span>Mood</span></div>
            </div>
            <Link className="btn ghost" to={`/companions/${companion.id}`}>View full profile</Link>
          </div>
        </aside>

        <section
          className="cm"
          onDragEnter={(e) => { e.preventDefault(); setDropOn(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDropOn(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropOn(false);
            sendPhoto(e.dataTransfer.files?.[0]);
          }}
        >
          <div className={`drop${dropOn ? " on" : ""}`}>Drop a picture for her to react to</div>
          <header className="ch">
            <button type="button" className="ib2 back" aria-label="Back to profile" onClick={back}>
              <svg className="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <Link to={`/companions/${companion.id}`}>
              {portraitStillUrl ? <img className="av" src={portraitStillUrl} alt="" /> : <span className="av" />}
            </Link>
            <div className="who">
              <b>{companion.name}</b>
              <span><i className="glow-dot" /><em style={{ fontStyle: "normal" }}>Online · {moodLine}</em></span>
            </div>
            <div className="tools">
              <button type="button" className={`ib2${sceneOn ? " on" : ""}`} aria-label="Scene" onClick={toggleScene}>
                <svg className="i" viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
              </button>
              <button type="button" className="ib2 hide-ph" aria-label="Call" onClick={() => goLiveCallFromChat()}>
                <svg className="i" viewBox="0 0 24 24"><path d="M6 3h3l2 5-2 1.5a11 11 0 0 0 6 6L16.5 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" /></svg>
              </button>
              <button type="button" className={`ib2${phone ? " on" : ""}`} aria-label="Floating phone window" onClick={() => setPhone((v) => !v)}>
                <svg className="i" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>
              </button>
              <button type="button" className={`ib2 hide-ph${panel ? " on" : ""}`} aria-label="Toggle side panel" onClick={() => setPanel((v) => !v)}>
                <svg className="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M15 5v14" /></svg>
              </button>
            </div>
          </header>
          <div className={`scene-bar${sceneOn ? " on" : ""}`}>
            <span><b>Scene:</b> {sceneTitle}</span>
            <button type="button" onClick={toggleScene}>End</button>
          </div>
          <div className="msgs" ref={scroller} aria-live="polite">
            {shown.map((msg, index) => {
              const label = dayLabel(msg.timestamp);
              const showDay = label !== lastDay;
              lastDay = label;
              const read = msg.role === "user" && shown.slice(index + 1).some((later) => later.role === "assistant");
              return (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  showDay={showDay}
                  day={label}
                  read={read}
                  reaction={reactions[msg.id]}
                  reacting={reactFor === msg.id}
                  onReact={(emoji) => setReaction(msg.id, emoji)}
                  onPress={() => setReactFor(msg.id)}
                  onClearPress={() => {
                    if (pressRef.current) window.clearTimeout(pressRef.current);
                  }}
                  onHoldStart={() => {
                    if (pressRef.current) window.clearTimeout(pressRef.current);
                    pressRef.current = window.setTimeout(() => setReactFor(msg.id), 550);
                  }}
                  onOpenImage={() => {
                    if (msg.imageUrl) setLb(msg.imageUrl);
                    setViewingImage(msg);
                  }}
                />
              );
            })}
            {shown.length > 0 ? <div className="hint">Press and hold a message to react</div> : null}
            <div className={`typing${loading ? " on" : ""}`} aria-label={`${companion.name} is typing`}>
              <i /><i /><i />
            </div>
            {toyDriveActive ? (
              <button type="button" className="link" onClick={() => void stopSustainedToy()}>Stop the pattern</button>
            ) : null}
          </div>
          <div className={`scrim${sheet ? " on" : ""}`} onClick={() => setSheet(false)} />
          <div className={`qsheet${sheet ? " on" : ""}`} role="menu">
            <SheetButton icon="?" label="Ask her a question" hint="Something she’ll love to answer" onClick={ask} />
            <SheetButton icon="img" label="Send a pic for her to react to" hint="Free · private to you" onClick={() => fileRef.current?.click()} />
            <SheetButton icon="scene" label="Start a scene" hint="Set the mood together" onClick={toggleScene} />
            <SheetButton icon="vault" label="Send a Vault item" hint="Drop in something from your Vault" onClick={() => { const first = vault[0]; if (first) sendVault(first); else setSheet(false); }} />
            <SheetButton icon="phone" label="Call her" onClick={() => { setSheet(false); goLiveCallFromChat(); }} />
          </div>
          <form
            className={`comp${input.trim() ? " has" : ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <button type="button" className={`ib2 plus${sheet ? " open" : ""}`} aria-label="More actions" onClick={() => setSheet((v) => !v)}>
              <svg className="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <textarea
              className="inp"
              rows={1}
              value={input}
              placeholder={`Message ${companion.name}…`}
              aria-label="Message"
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button type="button" className="ib2" aria-label="Send a photo" onClick={() => fileRef.current?.click()}>
              <svg className="i" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            </button>
            <button type="button" className="ib2 mic" aria-label="Voice message" onClick={toggleMic}>
              <svg className="i" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>
            <button type="submit" className="ib2 sendb" aria-label="Send">
              <svg className="i" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z" /></svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { sendPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </form>
        </section>

        <aside className="col-r">
          <div>
            <h3>Her mood</h3>
            <div className="moods">
              {["Fierce", "Teasing", "Tender", "Playful"].map((name) => (
                <button
                  type="button"
                  key={name}
                  className={`chip${moodLine.toLowerCase() === name.toLowerCase() ? " on" : ""}`}
                  onClick={() => void sendMessage(`Be ${name.toLowerCase()} with me.`)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3>Send a picture</h3>
            <button type="button" className="dz" onClick={() => fileRef.current?.click()}>
              Drag a picture here<br />or click to choose<br />
              <span style={{ fontSize: 12 }}>Free · private to you</span>
            </button>
            <button type="button" className="btn ghost" style={{ marginTop: 10, width: "100%" }} onClick={() => handleMediaBarRequest("selfie_picture")}>
              Ask her for a picture
            </button>
          </div>
          <div>
            <h3>Vault items to drop in</h3>
            <div className="vgrid">
              {vault.map((item) => (
                <button type="button" key={item.id} onClick={() => sendVault(item)}>
                  <img src={item.imageUrl} alt="" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3>Her pictures</h3>
            <div className="pgrid">
              {herShots.map((shot) => (
                <button type="button" key={shot.id} onClick={() => { setLb(shot.image_url); setViewingImage({ id: shot.id, role: "assistant", content: "", timestamp: new Date(), imageUrl: shot.image_url, generatedImageId: shot.id }); }}>
                  <img src={shot.image_url} alt="" />
                </button>
              ))}
            </div>
          </div>
          <ChatDevicesCollapsible
            companionName={companion.name}
            connectedCount={connectedToys.length}
            activeCount={activeToys.length}
            affectionPct={relationship?.affection_level ?? 0}
            breedingStage={relationship?.breeding_stage ?? 0}
            hasDevice={hasDevice}
            pairingQrUrl={pairingQrUrl}
            toyUtilityBusy={toyUtilityBusy}
            pairingLoading={pairingLoading}
            onCancelPairing={cancelLovensePairing}
            onTestToy={() => void handleTestToy()}
            onDisconnectToy={() => void handleDisconnectToy()}
            onStopAll={() => void handleStopAll()}
            onConnectToy={() => void handleConnectToy()}
            onBreedingRitual={handleStartBreedingRitual}
            toys={connectedToys}
            primaryToyId={primaryToyUid}
            onSelectPrimaryToy={selectPrimaryToy}
            patterns={vibrationPatterns}
            patternsLoading={vibrationPatternsLoading}
            sendingVibrationId={sendingVibrationId}
            activePatternId={livePatternId}
            onTriggerPattern={(row) => void triggerCompanionVibration(row)}
          />
          <p className="muted" style={{ fontSize: 12 }}>Bond · {bondLabel}{BOND_TIERS.length ? "" : ""}</p>
        </aside>
      </div>

      <div className={`lb${lb ? " on" : ""}`} onClick={() => setLb(null)}>
        <button type="button" className="ib2 x" aria-label="Close"><svg className="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        {lb ? <img src={lb} alt="" /> : null}
      </div>

      {viewingImage?.imageUrl && viewingImage.generatedImageId && !viewingImage.privatePhoto ? (
        <ImageViewer
          imageUrl={viewingImage.imageUrl}
          imageId={viewingImage.generatedImageId}
          companionName={companion.name}
          prompt={viewingImage.imagePrompt || "Her picture"}
          companionGalleryAutoSaved={viewingImage.savedToCompanionGallery !== false}
          onSaveToCompanionGallery={saveImageToCompanionGallery}
          onSaveToPersonalGallery={saveImageToPersonalGallery}
          onClose={() => setViewingImage(null)}
        />
      ) : null}
      {user ? (
        <ChatGallerySheet
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          companionName={companion.name}
          images={galleryImages}
          loading={galleryImagesLoading}
          currentPortraitUrl={portraitStillUrl}
          onSetAsPortrait={handlePortraitFromGallery}
          canDelete
          onDelete={handleDeleteGalleryImage}
        />
      ) : null}
      <ChatVoiceSettingsSheet
        open={voiceSettingsOpen}
        onOpenChange={setVoiceSettingsOpen}
        companionName={companion.name}
        effectiveLabel={effectiveVoiceLabel}
        globalVoiceActive={Boolean(profileTtsGlobal?.trim())}
        globalVoiceLabel={globalVoiceLabelForSheet}
        relationshipPreset={relationshipVoicePreset}
        onSaveRelationshipPreset={saveRelationshipVoice}
        saving={voicePresetSaving}
        ttsAutoplay={ttsAutoplay}
        onTtsAutoplayChange={onTtsAutoplayChange}
        liveVoiceTtsAutoplay={liveVoiceTtsAutoplay}
        onLiveVoiceTtsAutoplayChange={onLiveVoiceTtsAutoplayChange}
      />
    </div>
  );
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop?: () => void;
  onresult: (event: { results?: Array<Array<{ transcript?: string }>> }) => void;
  onend: () => void;
};

function SheetButton({ icon, label, hint, onClick }: { icon: string; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      <span className="ico" aria-hidden>{icon === "phone" ? "☎" : icon === "img" ? "▢" : icon === "vault" ? "◆" : icon === "scene" ? "✧" : "?"}</span>
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
    </button>
  );
}

function MessageRow({
  msg,
  showDay,
  day,
  read,
  reaction,
  reacting,
  onReact,
  onPress,
  onHoldStart,
  onClearPress,
  onOpenImage,
}: {
  msg: ChatMessage;
  showDay: boolean;
  day: string;
  read: boolean;
  reaction?: string;
  reacting: boolean;
  onReact: (emoji: string) => void;
  onPress: () => void;
  onHoldStart: () => void;
  onClearPress: () => void;
  onOpenImage: () => void;
}) {
  const mine = msg.role === "user";
  const privatePhoto = Boolean(msg.privatePhoto) || msg.content === PRIVATE_PHOTO_LABEL;
  return (
    <>
      {showDay ? <div className="day">{day}</div> : null}
      <div
        className={`m ${mine ? "me" : "her"}`}
        onMouseDown={onHoldStart}
        onMouseUp={onClearPress}
        onMouseLeave={onClearPress}
        onTouchStart={onHoldStart}
        onTouchEnd={onClearPress}
        onContextMenu={(e) => { e.preventDefault(); onPress(); }}
      >
        {privatePhoto && mine ? (
          <div className="lock-note">
            <svg className="i" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            {PRIVATE_PHOTO_LABEL}
          </div>
        ) : msg.imageUrl && !privatePhoto ? (
          <button type="button" className={`pic${mine ? " sq" : ""}`} onClick={onOpenImage}>
            <img src={msg.imageUrl} alt={mine ? "Your photo" : "Her picture"} />
          </button>
        ) : (
          <div className="bub">{msg.content}</div>
        )}
        <div className="meta">
          {clock(msg.timestamp)}
          {msg.imageUrl && !mine && !privatePhoto ? " · Tap to expand" : ""}
          {mine ? (
            <span className={`tick${read ? " read" : ""}`}>
              <svg className="i" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" /></svg>
              {read ? <svg className="i t2" viewBox="0 0 24 24"><path d="M5 12l4 4 10-10" /></svg> : null}
            </span>
          ) : null}
        </div>
        {reaction ? <span className="rx">{reaction}</span> : null}
        {reacting ? (
          <div className="react on">
            {REACTIONS.map((emoji) => (
              <button type="button" key={emoji} onClick={() => onReact(emoji)}>{emoji}</button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
