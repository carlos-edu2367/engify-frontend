/**
 * Screenshot capture for Arky visual help mode.
 *
 * Only captures when the user explicitly requests visual help.
 * Applies basic redaction to sensitive areas before sending.
 * Blocked on financeiro and rh modules at the context level.
 *
 * Uses html2canvas if available, falls back to null (screenshot skipped).
 * To enable: add html2canvas to package.json dependencies.
 */

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.7;
const MAX_BASE64_BYTES = 480_000; // ~360KB raw image

/** Sensitive CSS classes/data-attrs that should be blurred before capture */
const REDACT_SELECTORS = [
  "[data-arky-redact]",
  "[data-sensitive]",
  ".money-value",
  ".cpf-field",
  ".pix-field",
  ".salary-value",
];

export interface CaptureResult {
  base64: string;
  width: number;
  height: number;
  redactions_applied: string[];
}

export async function captureViewport(): Promise<CaptureResult | null> {
  const html2canvas = await tryLoadHtml2canvas();
  if (!html2canvas) {
    console.warn("[Arky] html2canvas not available — screenshot skipped");
    return null;
  }

  const redactionsApplied: string[] = [];

  // Apply temporary redactions
  const redacted = applyRedactions(redactionsApplied);

  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.75,
      useCORS: true,
      allowTaint: false,
      width: Math.min(window.innerWidth, MAX_WIDTH),
      height: Math.min(window.innerHeight, MAX_HEIGHT),
      x: window.scrollX,
      y: window.scrollY,
      logging: false,
    });

    // Resize if needed
    const finalCanvas = resizeCanvas(canvas, MAX_WIDTH, MAX_HEIGHT);
    const base64 = finalCanvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1];

    if (base64.length > MAX_BASE64_BYTES) {
      console.warn("[Arky] Screenshot too large — skipped");
      return null;
    }

    return {
      base64,
      width: finalCanvas.width,
      height: finalCanvas.height,
      redactions_applied: redactionsApplied,
    };
  } catch (err) {
    console.error("[Arky] Screenshot capture failed:", err);
    return null;
  } finally {
    removeRedactions(redacted);
  }
}

function applyRedactions(applied: string[]): Array<{ el: HTMLElement; original: string }> {
  const restored: Array<{ el: HTMLElement; original: string }> = [];

  for (const selector of REDACT_SELECTORS) {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    for (const el of elements) {
      restored.push({ el, original: el.style.filter });
      el.style.filter = "blur(8px)";
      applied.push(selector);
    }
  }

  return restored;
}

function removeRedactions(
  restored: Array<{ el: HTMLElement; original: string }>
): void {
  for (const { el, original } of restored) {
    el.style.filter = original;
  }
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  maxW: number,
  maxH: number
): HTMLCanvasElement {
  if (canvas.width <= maxW && canvas.height <= maxH) return canvas;

  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const resized = document.createElement("canvas");
  resized.width = Math.round(canvas.width * ratio);
  resized.height = Math.round(canvas.height * ratio);

  const ctx = resized.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
  return resized;
}

async function tryLoadHtml2canvas(): Promise<typeof import("html2canvas")["default"] | null> {
  try {
    const mod = await import("html2canvas");
    return mod.default;
  } catch {
    return null;
  }
}
