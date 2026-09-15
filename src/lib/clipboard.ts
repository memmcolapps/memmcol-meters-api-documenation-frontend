/**
 * Copies text to the clipboard, falling back to a hidden textarea for browsers
 * that expose the async Clipboard API but deny access to it (Safari outside a
 * user gesture, older WebViews). Throws when the value is empty or every
 * strategy is refused, so callers can surface the failure.
 */
export async function writeToClipboard(value: string, emptyMessage?: string) {
  if (!value) throw new Error(emptyMessage ?? "There is nothing to copy.");

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall back for browsers that expose the API but deny clipboard access.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.readOnly = true;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("The browser did not allow clipboard access.");
    }
  } finally {
    textArea.remove();
  }
}
