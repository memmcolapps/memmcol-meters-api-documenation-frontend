import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "./apis";
import { writeToClipboard } from "../lib/clipboard";

/**
 * The API base URL, shown as a copyable line. Rendered on the docs home page
 * so it is the first thing a developer sees, and on every API reference page
 * so the bare route shown there has a host to sit behind.
 */
export function BaseUrlCallout({
  /** Off where the surrounding markup already labels the value, e.g. a <dt>. */
  showLabel = true,
}: {
  showLabel?: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  // A copy landing after unmount must not set state on a dead component.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await writeToClipboard(API_BASE_URL);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1500);
  };

  return (
    <div className="base-url">
      {showLabel ? <span className="base-url-label">Base URL</span> : null}
      <code className="base-url-value">{API_BASE_URL}</code>
      <button
        type="button"
        className="base-url-copy"
        aria-label="Copy base URL"
        onClick={() => void copy()}
      >
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Press ⌘C"
            : "Copy"}
      </button>
      {/* Announce the outcome without moving focus off the button. */}
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied"
          ? "Base URL copied to clipboard"
          : state === "failed"
            ? "Copying failed — select the URL and copy it manually"
            : ""}
      </span>
    </div>
  );
}
