import { useEffect, useRef, useState } from "react";
import type { Session } from "./types";

export function useShopAudio(session: Session | null) {
  const [enabled, setEnabled] = useState(false);
  const [voice, setVoice] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const last = useRef<string | undefined>(undefined);
  function sound(frequency: number) {
    const ac = context.current;
    if (!ac) return;
    const oscillator = ac.createOscillator(),
      gain = ac.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(0.065, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(ac.destination);
    oscillator.start();
    oscillator.stop(ac.currentTime + 0.7);
  }
  async function toggle() {
    if (enabled) {
      setEnabled(false);
      window.speechSynthesis?.cancel();
      return;
    }
    context.current ??= new AudioContext();
    await context.current.resume();
    setEnabled(true);
    sound(660);
  }
  useEffect(() => {
    const entries = session?.feed ?? [],
      previous = last.current;
    last.current = entries.at(-1)?.id;
    if (!enabled || !previous || previous === last.current) return;
    const index = entries.findIndex((entry) => entry.id === previous);
    for (const entry of entries.slice(index < 0 ? -1 : index + 1)) {
      if (entry.kind === "served") sound(784);
      if (entry.kind === "gift") {
        sound(523);
        if (voice && "speechSynthesis" in window && !speechSynthesis.speaking) {
          const vi = speechSynthesis
            .getVoices()
            .find((v) => /^vi[-_]/i.test(v.lang));
          if (vi) {
            const text = new SpeechSynthesisUtterance(entry.text);
            text.voice = vi;
            text.lang = vi.lang;
            speechSynthesis.speak(text);
          }
        }
      }
    }
  }, [session, enabled, voice]);
  useEffect(
    () => () => {
      void context.current?.close();
      window.speechSynthesis?.cancel();
    },
    [],
  );
  return { enabled, toggle, voice, setVoice };
}
