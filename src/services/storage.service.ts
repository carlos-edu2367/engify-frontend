import { api } from "@/lib/axios";

type ResourceType = "obra" | "item" | "financeiro" | "mural";

export const storageService = {
  getUploadUrl: (params: {
    resource_type: ResourceType;
    resource_id: string;
    file_name: string;
    content_type: string;
  }) =>
    api
      .post<{ upload_url: string; path: string; expires_in: number }>("/storage/upload-url", params)
      .then((r) => r.data),

  getDownloadUrl: (path: string) =>
    api
      .post<{ download_url: string; expires_in: number }>("/storage/download-url", { path })
      .then((r) => r.data),

  upload: async (
    resourceType: ResourceType,
    resourceId: string,
    file: File
  ): Promise<string> => {
    const { upload_url, path } = await storageService.getUploadUrl({
      resource_type: resourceType,
      resource_id: resourceId,
      file_name: file.name,
      content_type: file.type,
    });

    await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    return path;
  },
};
