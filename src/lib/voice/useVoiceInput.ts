import { useCallback, useEffect, useRef, useState } from "react";

type SpeechResult = { 0: { transcript: string }; isFinal: boolean };

export function useVoiceInput(onText: (text: string) => void) {
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const recRef = useRef<{ stop?: () => void; abort?: () => void } | null>(null);
  const prefix = useRef("");
  const committed = useRef("");
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const stop = useCallback(() => {
    try {
      recRef.current?.stop?.();
      recRef.current?.abort?.();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const toggle = useCallback(async (current: string) => {
    if (live) {
      stop();
      return;
    }
    setNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setNotice("The microphone needs permission. Allow it in the browser, then try again.");
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setNotice("This browser can hear you, but it cannot turn speech into text. Use Chrome, or type it.");
      return;
    }
    prefix.current = current;
    committed.current = "";
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = "";
      const results = event.results;
      for (let i = event.resultIndex ?? 0; i < results.length; i++) {
        const piece = String(results[i]?.[0]?.transcript ?? "");
        if (results[i]?.isFinal) committed.current += piece;
        else interim += piece;
      }
      const base = prefix.current.trimEnd();
      const tail = (committed.current + interim).trim();
      onTextRef.current([base, tail].filter(Boolean).join(base && tail ? " " : ""));
    };
    rec.onerror = () => {
      setLive(false);
      setNotice("The microphone stopped. Check permission and try again.");
    };
    rec.onend = () => {
      setLive(false);
      recRef.current = null;
    };
    recRef.current = rec;
    setLive(true);
    try {
      rec.start();
    } catch {
      setLive(false);
      setNotice("Could not start listening.");
    }
  }, [live, stop]);

  return { live, notice, toggle, stop };
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { resultIndex?: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
