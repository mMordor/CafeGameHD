"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import { SITE } from "@/lib/config";
import PCCaseArt from "../PCCaseArt";

type Status = "loading" | "ready" | "fallback";

// Shows the configured .glb (NEXT_PUBLIC_PC_MODEL_URL) when it loads, otherwise the built-in
// illustration. The model script is only downloaded once the viewer is near the viewport. A bad URL,
// a failed script or a slow model all end in the illustration: never an empty box.
// The same model is used for both tiers; only lighting/accent color changes with the tier.
export default function GamingPCViewer({
  stageRef,
  modelRef,
  readyRef,
}: {
  stageRef: RefObject<HTMLDivElement>;
  modelRef: MutableRefObject<any>;
  readyRef: MutableRefObject<boolean>;
}) {
  const hasModel = SITE.pcModelUrl !== "";
  const [status, setStatus] = useState<Status>(hasModel ? "loading" : "fallback");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readyRef.current = status === "ready";
  }, [status, readyRef]);

  // Load the web component lazily.
  useEffect(() => {
    if (!hasModel || !wrapRef.current) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("@google/model-viewer").catch(() => !cancelled && setStatus("fallback"));
      },
      { rootMargin: "200px" }
    );
    io.observe(wrapRef.current);
    const timeout = window.setTimeout(() => !cancelled && setStatus((s) => (s === "loading" ? "fallback" : s)), 20000);
    return () => {
      cancelled = true;
      io.disconnect();
      window.clearTimeout(timeout);
    };
  }, [hasModel]);

  // Listen for the model's load / error events.
  useEffect(() => {
    const el = modelRef.current as HTMLElement | null;
    if (!el) return;
    const onLoad = () => setStatus("ready");
    const onError = () => setStatus("fallback");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [modelRef, status === "fallback"]);

  return (
    <div className="stage" ref={stageRef}>
      <div ref={wrapRef} className="stage-inner">
        <PCCaseArt className={`pc-art${status === "ready" ? " is-hidden" : ""}`} />
        {hasModel && status !== "fallback" &&
          createElement("model-viewer", {
            ref: modelRef,
            src: SITE.pcModelUrl,
            alt: "مدل سه‌بعدی کیس کامپیوتر گیمینگ",
            "environment-image": "neutral",
            exposure: "1.4",
            "shadow-intensity": "0",
            "interaction-prompt": "none",
            "camera-orbit": "0deg 90deg 380%",
            "field-of-view": "30deg",
            loading: "lazy",
            class: `pc-model${status === "ready" ? " is-ready" : ""}`,
          })}
      </div>
    </div>
  );
}
