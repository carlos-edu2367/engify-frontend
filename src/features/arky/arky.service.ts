import { api } from "@/lib/axios";
import { refreshAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import type {
  ArkyChatRequest,
  ArkyChatResponse,
  ArkyConfirmResponse,
  ArkyStreamEvent,
  ArkyStreamEventType,
} from "./arky.types";

type StreamHandler = (event: ArkyStreamEvent) => void;

export const arkyService = {
  chat: (data: ArkyChatRequest) =>
    api
      .post<ArkyChatResponse>("/arky/chat", data)
      .then((r) => r.data),

  chatStream: async (data: ArkyChatRequest, onEvent: StreamHandler) => {
    let response = await openStream(data);

    if (response.status === 401) {
      await refreshAccessToken();
      response = await openStream(data);
    }

    if (!response.ok || !response.body) {
      throw new Error(`Arky stream failed: ${response.status}`);
    }

    return readSseStream(response, onEvent);
  },

  confirm: (previewId: string) =>
    api
      .post<ArkyConfirmResponse>(`/arky/confirm/${previewId}`)
      .then((r) => r.data),

  reject: (previewId: string) =>
    api
      .post<ArkyConfirmResponse>(`/arky/reject/${previewId}`)
      .then((r) => r.data),
};

function openStream(data: ArkyChatRequest) {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${api.defaults.baseURL}/arky/chat/stream`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(data),
  });
}

async function readSseStream(
  response: Response,
  onEvent: StreamHandler
): Promise<ArkyChatResponse | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: ArkyChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const event = parseSseEvent(rawEvent);
      if (!event) continue;
      onEvent(event);
      if (event.type === "final" && event.data) {
        finalPayload = event.data;
      }
    }
  }

  return finalPayload;
}

function parseSseEvent(rawEvent: string): ArkyStreamEvent | null {
  const lines = rawEvent.split(/\r?\n/);
  const typeLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));
  if (!typeLine || !dataLine) return null;

  const type = typeLine.slice("event:".length).trim() as ArkyStreamEventType;
  try {
    return {
      type,
      ...JSON.parse(dataLine.slice("data:".length).trim()),
    };
  } catch {
    return null;
  }
}
