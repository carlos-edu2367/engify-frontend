export type MediaKind = "image" | "video" | "audio" | "file";

const MEDIA_KIND_BY_EXTENSION: Record<string, MediaKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  gif: "image",
  bmp: "image",
  svg: "image",
  mp4: "video",
  mov: "video",
  webm: "video",
  ogv: "video",
  m4v: "video",
  wav: "audio",
  mp3: "audio",
  m4a: "audio",
  aac: "audio",
  ogg: "audio",
  oga: "audio",
  weba: "audio",
  flac: "audio",
};

export const MEDIA_UPLOAD_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
  "audio/ogg",
] as const;

export function getMediaKind({
  fileName,
  contentType,
}: {
  fileName?: string;
  contentType?: string;
}): MediaKind {
  if (contentType?.startsWith("image/")) return "image";
  if (contentType?.startsWith("video/")) return "video";
  if (contentType?.startsWith("audio/")) return "audio";

  const extension = fileName?.split(".").pop()?.toLowerCase();
  return extension ? MEDIA_KIND_BY_EXTENSION[extension] ?? "file" : "file";
}

export function isAcceptedMediaType(file: File): boolean {
  if (MEDIA_UPLOAD_ACCEPTED_TYPES.includes(file.type as (typeof MEDIA_UPLOAD_ACCEPTED_TYPES)[number])) {
    return true;
  }

  const kind = getMediaKind({ fileName: file.name, contentType: file.type });
  return kind === "image" || kind === "video" || kind === "audio";
}
