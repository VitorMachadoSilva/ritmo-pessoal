import { useEffect, useRef, useState } from "react";

export const AMBIENT_SCENES = ["plant", "read", "nap", "stretch", "butterfly"] as const;
export type AmbientSceneId = typeof AMBIENT_SCENES[number];
type Phase = "waiting" | "playing" | "exiting";
type AmbientState = { phase: Phase; scene: AmbientSceneId | null; delay: number; duration: number; opening: boolean };

const FIRST_DELAY = 90_000;
const SCENE_DURATION: Record<AmbientSceneId, number> = { plant: 18_000, read: 15_000, nap: 18_000, stretch: 12_000, butterfly: 16_000 };
const EXIT_DURATION = 1_200;
const CLICK_EXIT_DURATION = 2_400;

function nextScene(previous: AmbientSceneId | null): AmbientSceneId {
  const choices = AMBIENT_SCENES.filter((candidate) => candidate !== previous);
  return choices[Math.floor(Math.random() * choices.length)];
}

function nextDelay() { return 120_000 + Math.floor(Math.random() * 120_001); }

export function useFolhinhaAmbient(enabled: boolean, onOpen: () => void) {
  const [motionAllowed, setMotionAllowed] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visible, setVisible] = useState(() => !document.hidden);
  const active = enabled && motionAllowed;
  const [state, setState] = useState<AmbientState>({ phase: "waiting", scene: null, delay: FIRST_DELAY, duration: 0, opening: false });
  const lastScene = useRef<AmbientSceneId | null>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);


  useEffect(() => {
    if (active) return;
    setState({ phase: "waiting", scene: null, delay: FIRST_DELAY, duration: 0, opening: false });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let remaining = state.phase === "waiting" ? state.delay : state.duration;
    let started = 0;
    let timer: number | undefined;
    const advance = () => {
      if (state.phase === "waiting") {
        const scene = nextScene(lastScene.current);
        lastScene.current = scene;
        setState({ phase: "playing", scene, delay: 0, duration: SCENE_DURATION[scene], opening: false });
      } else if (state.phase === "playing") {
        setState((current) => ({ ...current, phase: "exiting", duration: EXIT_DURATION }));
      } else {
        if (state.opening) onOpenRef.current();
        setState({ phase: "waiting", scene: null, delay: nextDelay(), duration: 0, opening: false });
      }
    };
    const resume = () => {
      if (document.hidden) return;
      started = Date.now();
      timer = window.setTimeout(advance, remaining);
    };
    const visibility = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
        remaining = Math.max(0, remaining - (Date.now() - started));
        timer = undefined;
      }
      resume();
    };
    document.addEventListener("visibilitychange", visibility);
    resume();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [active, state]);

  useEffect(() => {
    if (!active) return;
    const activity = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".help-agent")) return;
      if (state.phase === "playing" && target instanceof Element && target.closest(".nav-link, .mobile-nav, a[href^='#']")) return;
      if (state.phase === "playing") {
        setState((current) => ({ ...current, phase: "exiting", duration: EXIT_DURATION, opening: false }));
      } else if (state.phase === "waiting") {
        setState((current) => ({ ...current, delay: FIRST_DELAY }));
      }
    };
    document.addEventListener("pointerdown", activity);
    document.addEventListener("keydown", activity);
    document.addEventListener("wheel", activity, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", activity);
      document.removeEventListener("keydown", activity);
      document.removeEventListener("wheel", activity);
    };
  }, [active, state.phase]);

  function openAfterExit() {
    if (state.phase === "playing" || state.phase === "exiting") {
      setState((current) => ({ ...current, phase: "exiting", duration: CLICK_EXIT_DURATION, opening: true }));
      return true;
    }
    return false;
  }

  return { scene: active ? state.scene : null, phase: active ? state.phase : "waiting", visible, openAfterExit };
}
