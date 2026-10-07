/** Web Share with a clipboard fallback. `url` defaults to the current page. */
export async function shareProduct(title: string, text: string, shareUrl?: string): Promise<"shared" | "copied" | "failed"> {
  const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
