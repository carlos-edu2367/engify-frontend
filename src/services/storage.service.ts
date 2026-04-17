import { api } from "@/lib/axios";

type ResourceType = "obra" | "item" | "financeiro" | "mural";

type UploadUrlEntry = { upload_url: string; path: string; expires_in: number };

function normalizeUploadUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (!urlObj.pathname.startsWith("/storage/v1/")) {
      urlObj.pathname = "/storage/v1" + urlObj.pathname;
      return urlObj.toString();
    }
  } catch {}
  return url;
}

async function putToStorage(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(normalizeUploadUrl(uploadUrl), {
    method: "PUT",
    headers: { "Content-Type": file.type },
    mode: "cors",
    credentials: "omit",
    body: file,
  });
  if (!res.ok) throw new Error(`Falha no upload: HTTP ${res.status} ${res.statusText}`);
}

export const storageService = {
  getUploadUrl: (params: {
    resource_type: ResourceType;
    resource_id: string;
    file_name: string;
    content_type: string;
  }) =>
    api
      .post<UploadUrlEntry>("/storage/upload-url", params)
      .then((r) => r.data),

  getUploadUrls: (params: {
    resource_type: ResourceType;
    resource_id: string;
    files: Array<{ file_name: string; content_type: string }>;
  }) =>
    api
      .post<{ uploads: UploadUrlEntry[] }>("/storage/upload-urls", params)
      .then((r) => r.data),

  getDownloadUrl: (path: string) =>
    api
      .post<{ download_url: string; expires_in: number }>("/storage/download-url", { path })
      .then((r) => r.data),

  upload: async (resourceType: ResourceType, resourceId: string, file: File): Promise<string> => {
    const { upload_url, path } = await storageService.getUploadUrl({
      resource_type: resourceType,
      resource_id: resourceId,
      file_name: file.name,
      content_type: file.type,
    });
    await putToStorage(upload_url, file);
    return path;
  },

  uploadBatch: async (
    resourceType: ResourceType,
    resourceId: string,
    files: File[]
  ): Promise<Array<{ path: string; file_name: string; content_type: string }>> => {
    const { uploads } = await storageService.getUploadUrls({
      resource_type: resourceType,
      resource_id: resourceId,
      files: files.map((f) => ({ file_name: f.name, content_type: f.type })),
    });

    await Promise.all(uploads.map((u, i) => putToStorage(u.upload_url, files[i])));

    return uploads.map((u, i) => ({
      path: u.path,
      file_name: files[i].name,
      content_type: files[i].type,
    }));
  },
};
